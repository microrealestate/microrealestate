#!/usr/bin/env bash
#
# MicroRealEstate operations - start, stop, back up and restore an installation
# https://github.com/microrealestate/microrealestate
#
# Licensed under the Sustainable Use License v2.0 - see LICENSE.md
#
# Run from the directory an installation lives in, or point it there with
# --dir. './mre.sh --help' lists every command. Installing and updating belong
# to ./install.sh.

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-$PWD}"
SPONSOR_URL="https://ko-fi.com/camelaissani/tip"
# No '-' in the stamp: it is read back as everything before the first one.
RUN_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SUBCOMMAND=""
QUIET=0
MONGO_URI=""
STARTED_MONGO=0
declare -a WRITTEN_FILES=()
declare -a PASSTHRU_ARGS=()

DB_ONLY=0
WITH_ENV=1

LOGS_FOLLOW=1

SOURCE_ARG=""
ASSUME_YES=0
UPLOADS_ONLY=0
RESTORE_ENV=0
REPLACE_UPLOADS=0
SAFETY_BACKUP=1
ENV_REPLACED=0
SET_STAMP=""
SRC_DUMP=""
SRC_UPLOADS=""
SRC_ENV=""
declare -a SERVICES_TO_RESTART=()

# ─── Mirrored from install.sh ─────────────────────────────────────────────
# The block below is copied from install.sh so this script stays standalone and
# can be downloaded on its own. Keep the two copies identical.

CONTAINER_ENGINE=""       # docker | podman
CONTAINER_CLI="docker"    # binary used for raw ps/run/inspect/info calls
declare -a COMPOSE_CMD=(docker compose)
declare -a COMPOSE_ARGS=()
declare -A ENV_CURRENT=()

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
  C_BLUE=$'\033[34m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_DIM=""; C_BOLD=""; C_OFF=""
fi

MSG_INDENT="    "

# --quiet keeps the progress chatter out of cron mail; warnings and errors,
# which are the reason to read that mail, still go to stderr.
info()   { [ "$QUIET" = "1" ] && return 0; printf '%s  >%s %s\n' "$C_BLUE"   "$C_OFF" "$*"; }
ok()     { [ "$QUIET" = "1" ] && return 0; printf '%s OK%s %s\n' "$C_GREEN"  "$C_OFF" "$*"; }
warn()   { printf '%s !!%s %s\n' "$C_YELLOW" "$C_OFF" "$*" >&2; }
err()    { printf '%sERR%s %s\n' "$C_RED"    "$C_OFF" "$*" >&2; }
die()    { err "$@"; exit 1; }
detail() { [ "$QUIET" = "1" ] && return 0; printf '%s%s%s\n' "$C_DIM" "${MSG_INDENT}$*" "$C_OFF"; }
step()   { [ "$QUIET" = "1" ] && return 0; printf '\n%s%s%s\n' "$C_BOLD" "$*" "$C_OFF"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 && return 0
  die "Required command not found: $1. Install it and re-run."
}

docker_is_podman_shim() {
  command -v docker >/dev/null 2>&1 \
    && docker --version 2>/dev/null | grep -qi podman
}

# Point DOCKER_HOST at podman's Docker-API socket, so the real Compose v2 binary
# and every raw CLI call keep working unchanged.
setup_podman() {
  CONTAINER_ENGINE=podman
  if [ -z "${DOCKER_HOST:-}" ]; then
    export DOCKER_HOST="unix:///run/podman/podman.sock"
  fi
  [ -S "${DOCKER_HOST#unix://}" ] \
    || die "podman's API socket is not available at ${DOCKER_HOST#unix://}.
    Enable it with:  sudo systemctl enable --now podman.socket"
}

# Unlike install.sh this never offers to install an engine: an installation is
# already here, so a missing engine is a broken machine, not a first run.
ensure_docker() {
  if command -v podman >/dev/null 2>&1 && ! command -v docker >/dev/null 2>&1; then
    CONTAINER_CLI=podman
    setup_podman
    return
  fi
  if docker_is_podman_shim; then
    CONTAINER_CLI=docker   # the shim forwards to podman
    setup_podman
    return
  fi
  command -v docker >/dev/null 2>&1 \
    || die "No container engine found. Install Docker or podman and re-run."
  CONTAINER_ENGINE=docker
}

# 'podman compose' is deliberately avoided: it dispatches to podman-compose,
# which does not implement the 'service_healthy' and
# 'service_completed_successfully' conditions this stack depends on.
ensure_compose() {
  local -a candidates=()
  if [ "$CONTAINER_ENGINE" = podman ] && docker_is_podman_shim; then
    candidates=("docker-compose")
  else
    candidates=("docker compose" "docker-compose")
  fi

  local cand ver
  for cand in "${candidates[@]}"; do
    # shellcheck disable=SC2086
    ver="$($cand version --short 2>/dev/null)" || continue
    case "$ver" in
      2.*|v2.*|[3-9].*|v[3-9].*)
        # shellcheck disable=SC2206
        COMPOSE_CMD=($cand)
        return
        ;;
    esac
  done
  die "Docker Compose v2 is required and was not found."
}

ensure_docker_running() {
  "$CONTAINER_CLI" info >/dev/null 2>&1 \
    || die "Container engine not reachable. Start it (e.g. 'sudo systemctl start docker',
    or 'sudo systemctl start podman.socket') and re-run."
}

load_env_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    case "$val" in
      \"*)
        val="${val#\"}"
        val="${val%%\"*}"
        ;;
      \'*)
        val="${val#\'}"
        val="${val%%\'*}"
        ;;
      *)
        val="${val#"${val%%[![:space:]]*}"}"
        val="${val%%[[:space:]]#*}"
        val="${val%"${val##*[![:space:]]}"}"
        ;;
    esac
    ENV_CURRENT["$key"]="$val"
  done < "$f"
}

compose() {
  (cd "$INSTALL_DIR" && "${COMPOSE_CMD[@]}" --env-file .env "${COMPOSE_ARGS[@]}" "$@")
}

# Compose talks on stderr, and so does mongodump. Under --quiet the output is
# held back and only printed when the command fails - which is exactly what a
# cron job should mail.
compose_capture() {
  local rc=0 log=""
  if [ "$QUIET" = "1" ]; then
    log="$(mktemp)"
    compose "$@" >"$log" 2>&1 || rc=$?
    [ "$rc" -eq 0 ] || cat "$log" >&2
    rm -f "$log"
  else
    compose "$@" || rc=$?
  fi
  return "$rc"
}

# Adds --quiet to a mongo tool invocation when this script is itself quiet.
mongo_tool_args() {
  local -a args=("$@")
  [ "$QUIET" = "1" ] && args+=(--quiet)
  printf '%s\n' "${args[@]}"
}

# The compose file lives in docker/ while .env lives in the install dir, so a
# bare 'docker compose' finds neither: every command we print carries both flags.
compose_hint() {
  local prefix=""
  [ "$CONTAINER_ENGINE" = podman ] && prefix="DOCKER_HOST=$DOCKER_HOST "
  printf '%s%s --env-file .env %s' "$prefix" "${COMPOSE_CMD[*]}" "${COMPOSE_ARGS[*]}"
}

data_exists() {
  local db_dir="${INSTALL_DIR}/data/mongodb"
  [ -d "$db_dir" ] && [ -n "$(ls -A "$db_dir" 2>/dev/null)" ]
}

mongo_service_running() {
  compose ps --status running --services 2>/dev/null | grep -qx mongo
}

wait_for_mongo() {
  info "Waiting for mongo to accept connections..."
  local i
  for i in $(seq 1 30); do
    if compose exec -T mongo mongosh --quiet --eval 'db.adminCommand("ping").ok' >/dev/null 2>&1; then
      ok "Mongo is ready"
      return 0
    fi
    sleep 1
  done
  die "Mongo did not become ready within 30s."
}

# Under sudo the files must end up owned by the invoking user, or their own
# 'docker compose' can no longer read them afterwards.
owner_uid() { echo "${SUDO_UID:-$(id -u)}"; }
owner_gid() { echo "${SUDO_GID:-$(id -g)}"; }

claim_for_owner() {
  [ -n "${SUDO_UID:-}" ] || return 0
  chown "$(owner_uid):$(owner_gid)" "$@" 2>/dev/null || true
}

ensure_backup_dir() {
  mkdir -p "${INSTALL_DIR}/backup" 2>/dev/null || true
  # The dump is written from inside the mongo container as $(owner_uid), so the
  # directory must belong to that user, not merely be writable by whoever runs
  # this script - under sudo the mkdir above ran as root.
  if [ "$(id -u)" -eq 0 ]; then
    chown "$(owner_uid):$(owner_gid)" "${INSTALL_DIR}/backup" \
      || die "Cannot hand ${INSTALL_DIR}/backup to uid $(owner_uid): the database
    dump runs as that user and could not write there."
    return 0
  fi
  if [ ! -w "${INSTALL_DIR}/backup" ]; then
    info "Backup dir not writable (Docker may have created it as root); repairing ownership..."
    "$CONTAINER_CLI" run --rm -v "${INSTALL_DIR}/backup":/b:z alpine:3 \
      chown "$(owner_uid):$(owner_gid)" /b \
      || die "Cannot make ${INSTALL_DIR}/backup writable. Run: sudo chown -R $(owner_uid):$(owner_gid) ${INSTALL_DIR}/backup"
    [ -w "${INSTALL_DIR}/backup" ] \
      || die "Backup dir still not writable: ${INSTALL_DIR}/backup"
    ok "Backup dir ownership repaired"
  fi
}

# Locates the compose file of an existing installation. Unlike install.sh this
# never downloads one: no compose file means no installation here.
resolve_compose_files() {
  cd "$INSTALL_DIR"
  if [ -f "docker/docker-compose.yml" ]; then
    COMPOSE_ARGS=(-f "docker/docker-compose.yml")
    return
  fi
  if [ -f "docker-compose.yml" ]; then
    COMPOSE_ARGS=(-f "docker-compose.yml")
    return
  fi
  die "No docker-compose.yml found in ${INSTALL_DIR} (nor in ${INSTALL_DIR}/docker).
    Run this from the directory MicroRealEstate is installed in, or pass --dir."
}

require_installation() {
  cd "$INSTALL_DIR"
  [ -f ".env" ] \
    || die "No .env found in ${INSTALL_DIR}, so nothing is installed here.
    Run this from the install directory, or pass --dir /path/to/microrealestate."
  [ -r ".env" ] \
    || die ".env is not readable by user '$(id -un)'. Re-run with sudo."
}

# The database name only feeds the messages; the URI is what mongodump uses.
db_name_from_uri() {
  local u="${1%%\?*}"
  u="${u##*/}"
  printf '%s' "${u:-mredb}"
}

# Environment first, then .env, then the compose default - the same order
# compose itself resolves it in.
resolve_mongo_uri() {
  MONGO_URI="${MONGO_URL:-${ENV_CURRENT[MONGO_URL]:-mongodb://mongo/mredb}}"
}

# ─── End of the block mirrored from install.sh ────────────────────────────

print_donation() {
  [ "$QUIET" = "1" ] && return 0
  echo
  printf '%s' "$C_YELLOW$C_BOLD"
  cat <<EOF
 ------------------------------------------
  Enjoying MicroRealEstate?
  Buy me a coffee -> $SPONSOR_URL
 ------------------------------------------
EOF
  printf '%s' "$C_OFF"
}

is_stamp() {
  [[ "$1" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]
}

env_value_of() {
  local f="$1" key="$2" line val
  [ -f "$f" ] || return 0
  line="$(grep -m1 -E "^[[:space:]]*${key}[[:space:]]*=" "$f" 2>/dev/null)" || return 0
  val="${line#*=}"
  case "$val" in
    \"*) val="${val#\"}"; val="${val%%\"*}" ;;
    \'*) val="${val#\'}"; val="${val%%\'*}" ;;
    *)
      val="${val#"${val%%[![:space:]]*}"}"
      val="${val%%[[:space:]]#*}"
      val="${val%"${val##*[![:space:]]}"}"
      ;;
  esac
  printf '%s' "$val"
}

list_stamps() {
  local f base stamp
  for f in "${INSTALL_DIR}"/backup/*; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    case "$base" in
      *-mredb.dump.gz) stamp="${base%-mredb.dump.gz}" ;;
      *-uploads.tar.gz) stamp="${base%-uploads.tar.gz}" ;;
      *-env)            stamp="${base%-env}" ;;
      *)                continue ;;
    esac
    is_stamp "$stamp" && printf '%s\n' "$stamp"
  done | sort -ur
}

members_of() {
  local stamp="$1" members=""
  [ -f "${INSTALL_DIR}/backup/${stamp}-mredb.dump.gz" ] && members="database"
  [ -f "${INSTALL_DIR}/backup/${stamp}-uploads.tar.gz" ] && members="${members:+$members, }uploads"
  [ -f "${INSTALL_DIR}/backup/${stamp}-env" ] && members="${members:+$members, }secrets"
  printf '%s' "$members"
}

set_size_of() {
  local stamp="$1"
  du -ch "${INSTALL_DIR}/backup/${stamp}-"* 2>/dev/null | tail -n1 | cut -f1
}

stamp_to_human() {
  local s="$1"
  printf '%s-%s-%s %s:%s:%s UTC' \
    "${s:0:4}" "${s:4:2}" "${s:6:2}" "${s:9:2}" "${s:11:2}" "${s:13:2}"
}

dump_database_to() {
  local dump="$1"
  local -a dump_args=()
  mapfile -t dump_args < <(mongo_tool_args mongodump --uri="$MONGO_URI" --gzip --archive="/${dump}")
  if compose_capture run --rm --user "$(owner_uid):$(owner_gid)" mongo "${dump_args[@]}"; then
    claim_for_owner "${INSTALL_DIR}/${dump}"
    WRITTEN_FILES+=("$dump")
    return 0
  fi
  if [ -s "${INSTALL_DIR}/${dump}" ]; then
    warn "An incomplete archive was left at ${dump} - do not restore from it."
  else
    rm -f "${INSTALL_DIR}/${dump}"
  fi
  return 1
}

archive_uploads_to() {
  local uploads="$1"
  tar czf "${INSTALL_DIR}/${uploads}" -C "${INSTALL_DIR}" data/uploads || return 1
  claim_for_owner "${INSTALL_DIR}/${uploads}"
  WRITTEN_FILES+=("$uploads")
}

copy_env_to() {
  local env_copy="$1"
  cp -p "${INSTALL_DIR}/.env" "${INSTALL_DIR}/${env_copy}" || return 1
  chmod 600 "${INSTALL_DIR}/${env_copy}"
  claim_for_owner "${INSTALL_DIR}/${env_copy}"
  WRITTEN_FILES+=("$env_copy")
}

ensure_mongo_up() {
  if mongo_service_running; then
    return 0
  fi
  info "Mongo is not running; starting it..."
  compose_capture up -d mongo || die "Could not start the mongo service. For details run, from ${INSTALL_DIR}:
    $(compose_hint) logs mongo"
  STARTED_MONGO=1
  wait_for_mongo
}

stop_mongo_if_started() {
  [ "$STARTED_MONGO" = "1" ] || return 0
  info "Stopping mongo again (it was not running before)..."
  compose stop mongo >/dev/null 2>&1 || warn "Could not stop the mongo service again."
  STARTED_MONGO=0
}

cmd_backup() {
  step "MicroRealEstate backup"
  prepare_installation
  require_cmd tar
  ensure_backup_dir

  data_exists \
    || die "No database found in ${INSTALL_DIR}/data/mongodb: there is nothing to back up."

  ensure_mongo_up

  info "Backing up to backup/${RUN_STAMP}-*"

  local dump="backup/${RUN_STAMP}-mredb.dump.gz"
  detail "database ($(db_name_from_uri "$MONGO_URI")) -> ${dump}"
  if ! dump_database_to "$dump"; then
    stop_mongo_if_started
    die "Database backup failed.
    A 'permission denied' here means ${INSTALL_DIR}/backup does not belong to
    uid $(owner_uid), the user the dump runs as."
  fi

  if [ "$DB_ONLY" != "1" ]; then
    if [ -d "${INSTALL_DIR}/data/uploads" ]; then
      local uploads="backup/${RUN_STAMP}-uploads.tar.gz"
      detail "uploads -> ${uploads}"
      archive_uploads_to "$uploads" \
        || { stop_mongo_if_started; die "Uploads backup failed."; }
    else
      detail "uploads -> none yet, nothing to archive"
    fi
  fi

  if [ "$WITH_ENV" = "1" ]; then
    local env_copy="backup/${RUN_STAMP}-env"
    detail "secrets -> ${env_copy}"
    copy_env_to "$env_copy" \
      || { stop_mongo_if_started; die "Could not copy .env into ${env_copy}."; }
  fi

  stop_mongo_if_started
  ok "Backup complete"
  backup_summary
}

backup_summary() {
  [ "$QUIET" = "1" ] && return 0
  local f
  echo
  echo "Backup ${C_BOLD}${RUN_STAMP}${C_OFF} written to ${INSTALL_DIR}/backup:"
  for f in "${WRITTEN_FILES[@]}"; do
    printf '  %s  %s\n' "$(du -h "${INSTALL_DIR}/${f}" | cut -f1)" "$f"
  done
  echo
  echo "Restore it with:  ./mre.sh restore ${RUN_STAMP}"
  echo
}

choose_stamp() {
  local -a stamps=()
  mapfile -t stamps < <(list_stamps)
  [ "${#stamps[@]}" -gt 0 ] \
    || die "No backup set found in ${INSTALL_DIR}/backup.
    Take one with ./mre.sh backup, or pass the path of an archive to restore."

  [ -r /dev/tty ] && [ -t 0 ] \
    || die "No backup set was given and there is no terminal to ask on.
    Re-run naming the set, e.g. ./mre.sh restore ${stamps[0]} --yes"

  echo "Backup sets in ${INSTALL_DIR}/backup, newest first:" >&2
  local i
  for i in "${!stamps[@]}"; do
    printf '  %2d) %s  %s  [%s]  %s\n' \
      "$((i + 1))" "${stamps[$i]}" "$(stamp_to_human "${stamps[$i]}")" \
      "$(members_of "${stamps[$i]}")" "$(set_size_of "${stamps[$i]}")" >&2
  done
  echo >&2

  local reply=""
  read -r -p "Restore which one? [1-${#stamps[@]}, or empty to abort] " reply < /dev/tty || true
  [ -n "$reply" ] || die "Aborted at your request. Nothing has been changed."
  [[ "$reply" =~ ^[0-9]+$ ]] && [ "$reply" -ge 1 ] && [ "$reply" -le "${#stamps[@]}" ] \
    || die "'$reply' is not one of the listed numbers. Nothing has been changed."
  SET_STAMP="${stamps[$((reply - 1))]}"
}

resolve_source() {
  if [ -n "$SOURCE_ARG" ] && ! is_stamp "$SOURCE_ARG"; then
    local path="$SOURCE_ARG"
    [ -f "$path" ] || path="${INSTALL_DIR}/backup/$(basename "$SOURCE_ARG")"
    [ -f "$path" ] || die "No such archive: ${SOURCE_ARG}"
    local resolved
    resolved="$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
    case "$resolved" in
      "${INSTALL_DIR}/backup/"*) ;;
      *) die "The archive must sit in ${INSTALL_DIR}/backup - that is the only
    directory the database container can read. Copy it there and re-run." ;;
    esac
    [ -s "$resolved" ] || die "Archive is empty: ${resolved}"
    SRC_DUMP="backup/$(basename "$resolved")"
    [ "$UPLOADS_ONLY" = "1" ] \
      && die "--uploads-only needs a backup set; a single archive holds the database only."
    DB_ONLY=1
    return 0
  fi

  if [ -n "$SOURCE_ARG" ]; then
    SET_STAMP="$SOURCE_ARG"
  else
    choose_stamp
  fi

  [ -n "$(members_of "$SET_STAMP")" ] \
    || die "No backup set named ${SET_STAMP} in ${INSTALL_DIR}/backup."

  local dump="backup/${SET_STAMP}-mredb.dump.gz"
  local uploads="backup/${SET_STAMP}-uploads.tar.gz"
  local envcopy="backup/${SET_STAMP}-env"
  [ -f "${INSTALL_DIR}/${dump}" ]    && SRC_DUMP="$dump"
  [ -f "${INSTALL_DIR}/${uploads}" ] && SRC_UPLOADS="$uploads"
  [ -f "${INSTALL_DIR}/${envcopy}" ] && SRC_ENV="$envcopy"

  [ "$DB_ONLY" = "1" ]      && SRC_UPLOADS=""
  [ "$UPLOADS_ONLY" = "1" ] && SRC_DUMP=""

  if [ -z "$SRC_DUMP" ] && [ -z "$SRC_UPLOADS" ]; then
    die "Nothing to restore from ${SET_STAMP} with these options."
  fi
  if [ -n "$SRC_DUMP" ] && [ ! -s "${INSTALL_DIR}/${SRC_DUMP}" ]; then
    die "The database archive of ${SET_STAMP} is empty - do not restore from it."
  fi
  return 0
}

check_secrets() {
  if [ -z "$SRC_ENV" ]; then
    [ -n "$SRC_DUMP" ] && warn "This set has no secrets copy, so it cannot be checked against the
    current .env. If it was taken on another installation, the encrypted fields
    (third-party credentials) will not be readable."
    if [ "$RESTORE_ENV" = "1" ]; then
      die "--restore-env was passed but this set holds no <stamp>-env file."
    fi
    return 0
  fi

  local key mismatched=""
  for key in CIPHER_KEY CIPHER_IV_KEY ACCESS_TOKEN_SECRET; do
    if [ "$(env_value_of "${INSTALL_DIR}/${SRC_ENV}" "$key")" != "${ENV_CURRENT[$key]:-}" ]; then
      mismatched="${mismatched:+$mismatched, }$key"
    fi
  done
  [ -n "$mismatched" ] || { ok "Secrets in the set match the live .env"; return 0; }

  warn "The secrets of this backup differ from the live .env (${mismatched})."
  detail "Encrypted database fields would be unreadable and every session would break."
  if [ "$RESTORE_ENV" = "1" ]; then
    info "--restore-env: the archived .env will be installed with the data."
    return 0
  fi
  [ "$ASSUME_YES" = "1" ] \
    && { warn "--yes given: continuing without installing the archived secrets."; return 0; }
  die "Refusing to restore data next to different secrets.
    Pass --restore-env to install ${SRC_ENV} as the live .env (the current one is
    kept as .env.bak.<stamp>), or --yes to restore the data anyway."
}

confirm() {
  [ "$ASSUME_YES" = "1" ] && return 0
  [ -r /dev/tty ] && [ -t 0 ] \
    || die "This restore needs a confirmation and there is no terminal to ask on.
    Re-run with --yes to confirm up front."
  local reply=""
  read -r -p "Type 'yes' to restore: " reply < /dev/tty || true
  [ "$reply" = "yes" ] || die "Aborted at your request. Nothing has been changed."
}

print_intent() {
  # Without --yes this is what the confirmation gets answered against.
  [ "$QUIET" = "1" ] && [ "$ASSUME_YES" = "1" ] && return 0
  local db; db="$(db_name_from_uri "$MONGO_URI")"
  echo
  printf '%sAbout to restore into %s%s\n' "$C_BOLD" "$INSTALL_DIR" "$C_OFF"
  echo
  detail "What will be restored:"
  if [ -n "$SET_STAMP" ]; then
    detail "  • Set:      ${SET_STAMP}  ($(stamp_to_human "$SET_STAMP"))"
  fi
  if [ -n "$SRC_DUMP" ]; then
    detail "  • Database: ${SRC_DUMP}"
    detail "             -> restores the data into the '${db}' database"
  fi
  if [ -n "$SRC_UPLOADS" ]; then
    if [ "$REPLACE_UPLOADS" = "1" ]; then
      detail "  • Uploads:  ${SRC_UPLOADS}"
      detail "             -> restored on top of the current uploaded documents"
      detail "                (current ones kept as data/uploads.bak.${RUN_STAMP})"
    else
      detail "  • Uploads:  ${SRC_UPLOADS}"
      detail "             -> restored on top of the current uploaded documents"
    fi
  fi
  if [ "$RESTORE_ENV" = "1" ]; then
    detail "  • Secrets:  ${SRC_ENV}"
    detail "             -> becomes the new .env"
    detail "                (current one kept as .env.bak.${RUN_STAMP})"
  fi
  if [ "$SAFETY_BACKUP" = "1" ]; then
    detail "  • Undo:     the current data is saved first, as backup/${RUN_STAMP}-*"
  else
    warn "--no-safety-backup was given: the current data will not be saved anywhere."
    detail "  You will not be able to reverse this restore."
  fi
  echo
}

safety_backup() {
  [ "$SAFETY_BACKUP" = "1" ] || return 0
  if ! data_exists; then
    info "No existing database found, nothing to save first"
    return 0
  fi
  step "Safety backup"
  ensure_backup_dir

  local dump="backup/${RUN_STAMP}-mredb.dump.gz"
  detail "database -> ${dump}"
  dump_database_to "$dump" \
    || die "Could not save the current database. Nothing has been restored.
    Re-run once the problem is fixed, or pass --no-safety-backup to accept the risk."

  if [ -d "${INSTALL_DIR}/data/uploads" ]; then
    local uploads="backup/${RUN_STAMP}-uploads.tar.gz"
    detail "uploads -> ${uploads}"
    archive_uploads_to "$uploads" \
      || die "Could not save the current uploads. Nothing has been restored."
  fi

  local envcopy="backup/${RUN_STAMP}-env"
  detail "secrets -> ${envcopy}"
  copy_env_to "$envcopy" \
    || die "Could not save the current .env. Nothing has been restored."
  ok "Current data saved as backup/${RUN_STAMP}-*"
}

stop_application() {
  local -a running=()
  mapfile -t running < <(compose ps --status running --services 2>/dev/null || true)
  local svc
  local -a to_stop=()
  for svc in "${running[@]}"; do
    [ -n "$svc" ] || continue
    [ "$svc" = "mongo" ] && continue
    to_stop+=("$svc")
    SERVICES_TO_RESTART+=("$svc")
  done
  if [ "${#to_stop[@]}" -gt 0 ]; then
    info "Stopping the application while the data is replaced..."
    # compose_capture, not '>/dev/null': compose reports progress on stderr.
    compose_capture stop "${to_stop[@]}" \
      || die "Could not stop the application. Nothing has been restored."
  fi
}

restore_database() {
  [ -n "$SRC_DUMP" ] || return 0
  info "Restoring the database from ${SRC_DUMP}..."
  local -a restore_args=()
  mapfile -t restore_args < <(mongo_tool_args mongorestore --uri="$MONGO_URI" --drop --gzip --archive="/${SRC_DUMP}")
  compose_capture run --rm --user "$(owner_uid):$(owner_gid)" mongo "${restore_args[@]}" \
    || die "Database restore failed. The safety backup taken above still holds the
    previous data; restore it with:  ./mre.sh restore ${RUN_STAMP}"
  ok "Database restored"
}

restore_uploads() {
  [ -n "$SRC_UPLOADS" ] || return 0
  if [ "$REPLACE_UPLOADS" = "1" ] && [ -d "${INSTALL_DIR}/data/uploads" ]; then
    mv "${INSTALL_DIR}/data/uploads" "${INSTALL_DIR}/data/uploads.bak.${RUN_STAMP}" \
      || die "Could not move data/uploads aside. The database has already been restored."
    detail "current uploads kept as data/uploads.bak.${RUN_STAMP}"
  fi
  info "Restoring the uploaded documents from ${SRC_UPLOADS}..."
  # No chown: the init service re-applies uid 1000 on the next start.
  tar xzf "${INSTALL_DIR}/${SRC_UPLOADS}" -C "${INSTALL_DIR}" \
    || die "Could not unpack ${SRC_UPLOADS}."
  ok "Uploaded documents restored"
}

install_archived_env() {
  [ "$RESTORE_ENV" = "1" ] || return 0
  [ -n "$SRC_ENV" ] || return 0
  local backup=".env.bak.${RUN_STAMP}"
  cp -p "${INSTALL_DIR}/.env" "${INSTALL_DIR}/${backup}" \
    || die "Could not back up the current .env; it has not been replaced."
  chmod 600 "${INSTALL_DIR}/${backup}"
  claim_for_owner "${INSTALL_DIR}/${backup}"
  cp "${INSTALL_DIR}/${SRC_ENV}" "${INSTALL_DIR}/.env" \
    || die "Could not install ${SRC_ENV} as .env. The previous one is at ${backup}."
  chmod 600 "${INSTALL_DIR}/.env"
  claim_for_owner "${INSTALL_DIR}/.env"
  ENV_REPLACED=1
  ok "Archived secrets installed as .env (previous one kept as ${backup})"
}

restart_application() {
  if [ "${#SERVICES_TO_RESTART[@]}" -eq 0 ]; then
    if [ "$STARTED_MONGO" = "1" ]; then
      info "Stopping mongo again (nothing was running before this restore)..."
      compose stop mongo >/dev/null 2>&1 || warn "Could not stop the mongo service again."
    fi
    info "The application was not running; start it with:  ./mre.sh start"
    return 0
  fi
  info "Starting the application again..."
  # Named rather than a bare 'up -d', so a service already stopped stays stopped.
  local -a up_args=(up -d)
  # A container's environment is fixed at creation, so new secrets need a recreate.
  [ "$ENV_REPLACED" = "1" ] && up_args+=(--force-recreate)
  compose_capture "${up_args[@]}" "${SERVICES_TO_RESTART[@]}" \
    || die "Could not start the application again. For details run, from ${INSTALL_DIR}:
    $(compose_hint) logs"
  ok "Application started"
}

restore_summary() {
  [ "$QUIET" = "1" ] && return 0
  echo
  printf '%s%s%s\n' "$C_GREEN$C_BOLD" " Restore complete" "$C_OFF"
  [ -n "$SRC_DUMP" ]    && detail "database from ${SRC_DUMP}"
  [ -n "$SRC_UPLOADS" ] && detail "uploads from ${SRC_UPLOADS}"
  [ "$ENV_REPLACED" = "1" ] && detail "secrets from ${SRC_ENV}"
  if [ "${#WRITTEN_FILES[@]}" -gt 0 ]; then
    echo
    echo "The data replaced was saved first, as backup/${RUN_STAMP}-*."
    echo "Undo this restore with:  ./mre.sh restore ${RUN_STAMP}"
  fi
  echo
}

cmd_restore() {
  step "MicroRealEstate restore"
  prepare_installation
  require_cmd tar

  resolve_source
  check_secrets
  print_intent
  confirm

  ensure_backup_dir
  ensure_mongo_up
  safety_backup
  stop_application
  # Not a duplicate: stopping the application may have taken mongo down with it.
  ensure_mongo_up

  step "Restore"
  restore_database
  restore_uploads
  install_archived_env

  step "Starting up"
  restart_application
  restore_summary
}

cmd_start() {
  prepare_installation
  info "Starting MicroRealEstate..."
  # No --remove-orphans: the project name is the compose file's parent directory
  # ("docker"), so it can match an unrelated stack and delete it.
  compose_capture up -d || die "Could not start the application. For details run:
    ./mre.sh logs"
  ok "Started"
}

# 'stop', not 'down': 'down' deletes the containers, for every stack sharing
# the project name above.
cmd_stop() {
  prepare_installation
  info "Stopping MicroRealEstate..."
  compose_capture stop || die "Could not stop the application."
  ok "Stopped. The containers are kept; './mre.sh start' brings them back."
}

cmd_restart() {
  prepare_installation
  info "Restarting MicroRealEstate..."
  compose_capture restart || die "Could not restart the application."
  ok "Restarted"
}

# --all, so a stopped stack still lists its containers. It also shows 'init',
# the one-shot service that is meant to sit at Exited (0).
cmd_status() {
  prepare_installation
  compose ps --all
}

cmd_logs() {
  prepare_installation
  local -a args=(logs)
  [ "$LOGS_FOLLOW" = "1" ] && args+=(-f)
  compose "${args[@]}" ${PASSTHRU_ARGS[@]+"${PASSTHRU_ARGS[@]}"}
}

prepare_installation() {
  require_installation
  load_env_file ".env"
  resolve_mongo_uri
  ensure_docker
  ensure_docker_running
  ensure_compose
  resolve_compose_files
}

show_help() {
  cat <<EOF
${C_BOLD}MicroRealEstate operations${C_OFF}

${C_BOLD}Usage${C_OFF}
  ./mre.sh <command> [options]

${C_BOLD}Commands${C_OFF}
  start              Start the application, applying an edited .env on the way.
  stop               Stop it, keeping the containers so 'start' is instant.
  restart            Restart the running containers as they are. An edited .env
                     is not picked up - 'start' does that.
  status             Show every container, running or not.
  logs [SERVICE...]  Follow the logs, of one service or of all of them.
  backup             Write the database, the uploaded documents and a copy of
                     .env into ./backup, under one timestamp.
  restore [SET]      Put a backup set back. Destructive - see below.

${C_BOLD}Options${C_OFF} (any command)
  --dir PATH         Install directory (default: current dir).
  --quiet, -q        Print warnings and errors only (for cron).
  -h, --help         Show this help.

${C_BOLD}backup${C_OFF}
  --db-only          The database only: no uploads, no .env copy.
  --no-env           Skip the .env copy. The set then needs the installation's
                     own secrets to be restorable.

  Writes into ./backup, all sharing one UTC timestamp:
    <stamp>-mredb.dump.gz    the database
    <stamp>-uploads.tar.gz   data/uploads
    <stamp>-env              a copy of .env, mode 600

${C_BOLD}restore${C_OFF} [STAMP | ARCHIVE]
  (none)             List the sets in ./backup and ask which one to restore.
  STAMP              A set written by 'backup' or by './install.sh update',
                     named by its timestamp, e.g. 20260827T033000Z.
  ARCHIVE            A single mongodump archive in ./backup. Database only.

  --yes, -y          Do not ask for confirmation. Also acknowledges a secrets
                     mismatch (see below), so use it knowingly.
  --db-only          Restore the database, leave data/uploads alone.
  --uploads-only     Restore the uploaded documents, leave the database alone.
  --restore-env      Also install the set's <stamp>-env as the live .env. The
                     current one is kept as .env.bak.<stamp>.
  --replace-uploads  Move the current data/uploads aside to
                     data/uploads.bak.<stamp> instead of unpacking over it.
  --no-safety-backup Skip the backup of the current data taken first.

${C_BOLD}logs${C_OFF}
  --no-follow        Print what is there and exit, instead of following.
  Anything else is handed to 'compose logs', e.g. --tail 50, --since 10m.

${C_BOLD}Notes${C_OFF}
  - Every backup set holds the installation's secrets. Keep ./backup as private
    as .env, or use 'backup --no-env' when the archives leave this machine.
  - Nothing is ever deleted here: sets accumulate, prune them yourself.

${C_BOLD}Cron${C_OFF} (daily at 03:30, as the account that owns the installation)
  30 3 * * * cd /path/to/microrealestate && ./mre.sh backup --quiet
EOF
}

parse_backup_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dir)      shift; INSTALL_DIR="${1:-}"; [ -n "$INSTALL_DIR" ] || die "--dir requires a path" ;;
      --quiet|-q) QUIET=1 ;;
      -h|--help)  show_help; exit 0 ;;
      --db-only)  DB_ONLY=1 ;;
      --no-env)   WITH_ENV=0 ;;
      *)          die "Unknown argument for 'backup': $1 (try --help)" ;;
    esac
    shift
  done
  [ "$DB_ONLY" = "1" ] && WITH_ENV=0
  return 0
}

parse_restore_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dir)      shift; INSTALL_DIR="${1:-}"; [ -n "$INSTALL_DIR" ] || die "--dir requires a path" ;;
      --quiet|-q) QUIET=1 ;;
      -h|--help)  show_help; exit 0 ;;
      --yes|-y)            ASSUME_YES=1 ;;
      --db-only)           DB_ONLY=1 ;;
      --uploads-only)      UPLOADS_ONLY=1 ;;
      --restore-env)       RESTORE_ENV=1 ;;
      --replace-uploads)   REPLACE_UPLOADS=1 ;;
      --no-safety-backup)  SAFETY_BACKUP=0 ;;
      -*)                  die "Unknown option for 'restore': $1 (try --help)" ;;
      *)
        [ -z "$SOURCE_ARG" ] || die "Only one backup source can be given (got '$SOURCE_ARG' and '$1')."
        SOURCE_ARG="$1"
        ;;
    esac
    shift
  done
  if [ "$DB_ONLY" = "1" ] && [ "$UPLOADS_ONLY" = "1" ]; then
    die "--db-only and --uploads-only cannot be combined."
  fi
  return 0
}

parse_logs_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dir)        shift; INSTALL_DIR="${1:-}"; [ -n "$INSTALL_DIR" ] || die "--dir requires a path" ;;
      --quiet|-q)   QUIET=1 ;;
      -h|--help)    show_help; exit 0 ;;
      --no-follow)  LOGS_FOLLOW=0 ;;
      *)            PASSTHRU_ARGS+=("$1") ;;
    esac
    shift
  done
  return 0
}

parse_simple_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dir)      shift; INSTALL_DIR="${1:-}"; [ -n "$INSTALL_DIR" ] || die "--dir requires a path" ;;
      --quiet|-q) QUIET=1 ;;
      -h|--help)  show_help; exit 0 ;;
      *)          die "Unknown argument for '${SUBCOMMAND}': $1 (try --help)" ;;
    esac
    shift
  done
  return 0
}

parse_args() {
  local -a rest=()
  local skip_next=0
  while [ $# -gt 0 ]; do
    # The value of --dir is a path, never a command, even when it reads as one.
    if [ "$skip_next" = "1" ]; then
      skip_next=0
      rest+=("$1")
      shift
      continue
    fi
    case "$1" in
      --dir)
        skip_next=1
        rest+=("$1")
        ;;
      backup|restore|start|stop|restart|status|logs)
        if [ -z "$SUBCOMMAND" ]; then SUBCOMMAND="$1"; else rest+=("$1"); fi
        ;;
      -h|--help) show_help; exit 0 ;;
      *)         rest+=("$1") ;;
    esac
    shift
  done
  [ -n "$SUBCOMMAND" ] || { show_help >&2; exit 1; }
  case "$SUBCOMMAND" in
    backup)  parse_backup_args  ${rest[@]+"${rest[@]}"} ;;
    restore) parse_restore_args ${rest[@]+"${rest[@]}"} ;;
    logs)    parse_logs_args    ${rest[@]+"${rest[@]}"} ;;
    *)       parse_simple_args  ${rest[@]+"${rest[@]}"} ;;
  esac
}

main() {
  parse_args "$@"
  INSTALL_DIR="$(cd "$INSTALL_DIR" 2>/dev/null && pwd)" \
    || die "No such directory: ${INSTALL_DIR}"

  case "$SUBCOMMAND" in
    backup)  cmd_backup ;;
    restore) cmd_restore ;;
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    restart) cmd_restart ;;
    status)  cmd_status ;;
    logs)    cmd_logs ;;
    *)       die "Unknown command: $SUBCOMMAND" ;;
  esac
  { [ "$SUBCOMMAND" = "logs" ] && [ "$LOGS_FOLLOW" = "1" ]; } || print_donation
}

main "$@"
