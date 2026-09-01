#!/usr/bin/env bash
#
# MicroRealEstate installer
# https://github.com/microrealestate/microrealestate
#
# Licensed under the Sustainable Use License v2.0 - see LICENSE.md
#
# Usage
#   curl -sSL <raw-url>/install.sh | bash
#   ./install.sh install            # default: fresh install, idempotent re-run
#   ./install.sh update             # pull latest images and restart
#   ./install.sh --help
#
# Environment variables (all optional)
#   ADVERTISE_ADDR   Manual address override if auto-detection fails.
#   MRE_HTTP_PORT    Host port for HTTP (default: 80). Takes precedence over
#   MRE_HTTPS_PORT   .env, as compose does. Only a fresh 'install' writes it
#                    there; every other run honours it for that run only.
#   MRE_SKIP_BACKUP  Set to 1 to skip the automatic pre-change backup.
#   MRE_SRC_URL      Where the compose file, Caddyfile and .env template are
#                    fetched from. That compose file then runs as root, so point
#                    this only at a host you trust.
#
# MRE_VERSION is read from .env only; edit .env to change the image tag.
#
# Note: with non-default host ports, Let's Encrypt cannot reach Caddy on
# 80/443 from the internet, so automatic HTTPS for domains will not work.
#
# Behavior notes
#   - 'update' owns every change to an installation. 'install' only installs:
#     run on a directory that already holds one, it changes nothing and just
#     starts the app if it is not running, so it is safe to re-run at any time.
#   - 'install' reuses images already present locally; only 'update' re-pulls
#     the tag in .env (MRE_VERSION).
#   - 'update' also re-downloads docker-compose.yml, the Caddyfile and the
#     .env.domain template from MRE_SRC_URL, so new images do not run under the
#     previous release's topology. Replaced copies are kept as
#     'backup/<timestamp>-<filename>'. In a git checkout 'git pull' owns those
#     files instead. '.env' is never rewritten by 'update': keys a release adds
#     must be copied from .env.domain by hand.
#   - 'update' always takes a hot backup before it changes anything.
#     'backup/<timestamp>-mredb.dump.gz' and
#     'backup/<timestamp>-uploads.tar.gz' accumulate and hold secrets - prune
#     them yourself. MRE_SKIP_BACKUP=1 disables the data backup.
#   - Running the installation day to day belongs to './mre.sh', which
#     'install' drops next to .env and 'update' refreshes.

set -euo pipefail

# --- Constants ------------------------------------------------------------

MRE_SRC_URL_DEFAULT="https://raw.githubusercontent.com/microrealestate/microrealestate/main"
MRE_SRC_URL="${MRE_SRC_URL:-$MRE_SRC_URL_DEFAULT}"
SPONSOR_URL="https://ko-fi.com/camelaissani/tip"
INSTALL_DIR="${INSTALL_DIR:-$PWD}"
COMPOSE_HINT_DEFAULT="docker compose --env-file .env -f docker/docker-compose.yml"
SUBCOMMAND=""
HEALTH_WAIT_SECONDS=180
# One stamp per run, shared by every file it writes into backup/.
RUN_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RESOLVED_HTTP_PORT=""
RESOLVED_HTTPS_PORT=""
# Set by probe_stack_files: one 'tmp|dest|backup' triple per file to install.
declare -a STACK_FILE_UPDATES=()

SECRET_KEYS=(
  ACCESS_TOKEN_SECRET
  REFRESH_TOKEN_SECRET
  RESET_TOKEN_SECRET
  CIPHER_KEY
  CIPHER_IV_KEY
  REDIS_PASSWORD
)

PLACEHOLDER_VALUES=(
  "" access_token_secret refresh_token_secret reset_token_secret
  cipher_key cipher_iv_key cypher_iv_key redis_password
)

# Populated by detect_address / preflight / load_env
RESOLVED_ADDR=""
OS_ID=""            # e.g. ubuntu, debian, fedora, almalinux, rocky
OS_FAMILY=""        # debian | rhel | other
PKG_INSTALL=""      # e.g. "apt install", "dnf install"
DOCKER_DOC_URL="https://docs.docker.com/engine/install"
CONTAINER_ENGINE=""       # docker | podman
CONTAINER_CLI="docker"    # binary used for raw ps/run/inspect/info calls
ROOT_CMD=""               # set to "sudo" by require_root when needed
declare -a COMPOSE_CMD=(docker compose)
declare -a COMPOSE_ARGS=()
declare -A ENV_CURRENT=()

# --- Output helpers -------------------------------------------------------

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
  C_BLUE=$'\033[34m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_DIM=""; C_BOLD=""; C_OFF=""
fi

# Prefixes are padded to three columns, so every message starts at the same one
# and a multi-line message indents its continuations by MSG_INDENT.
MSG_INDENT="    "

info()   { printf '%s  >%s %s\n' "$C_BLUE"   "$C_OFF" "$*"; }
ok()     { printf '%s OK%s %s\n' "$C_GREEN"  "$C_OFF" "$*"; }
warn()   { printf '%s !!%s %s\n' "$C_YELLOW" "$C_OFF" "$*" >&2; }
err()    { printf '%sERR%s %s\n' "$C_RED"    "$C_OFF" "$*" >&2; }
die()    { err "$@"; exit 1; }
detail() { printf '%s%s%s\n' "$C_DIM" "${MSG_INDENT}$*" "$C_OFF"; }
step()   { printf '\n%s%s%s\n' "$C_BOLD" "$*" "$C_OFF"; }

print_disclaimer() {
  printf '%s%s%s\n' "$C_DIM" "MicroRealEstate is source-available under the Sustainable Use License v2.0. See LICENSE.md." "$C_OFF"
  printf '%s%s%s\n' "$C_DIM" "Provided 'as is', without warranty of any kind; the Licensor is not liable for any damages. You are responsible for your own data, including backups and any data loss." "$C_OFF"
}

show_help() {
  cat <<EOF
${C_BOLD}MicroRealEstate installer${C_OFF}

${C_BOLD}Usage${C_OFF}
  ./install.sh [install|update] [--dir PATH]

${C_BOLD}Commands${C_OFF}
  install            Install, or start an existing installation without
                     changing it (default when no args).
  update             Pull the latest images, refresh the stack files, restart.

${C_BOLD}Options${C_OFF}
  --dir PATH         Install directory (default: current dir).
  -h, --help         Show this help.

${C_BOLD}Environment${C_OFF} (all optional)
  ADVERTISE_ADDR     Address override when auto-detection fails.
  MRE_HTTP_PORT      Host port for HTTP (default: 80).
  MRE_HTTPS_PORT     Host port for HTTPS (default: 443).
                     Both take precedence over .env, as compose does. A fresh
                     'install' writes them there; every other run honours them
                     for that run only.
  MRE_SKIP_BACKUP    Set to 1 to skip the automatic pre-change backup.
  MRE_SRC_URL        Where docker-compose.yml, the Caddyfile and .env.domain
                     are fetched from. That compose file runs as root, so
                     point this only at a host you trust.
  MRE_VERSION        Read from .env only; edit .env to change the image tag.

${C_BOLD}Useful commands${C_OFF} (run from the install directory)
EOF
  print_useful_commands "$COMPOSE_HINT_DEFAULT"
  cat <<EOF
  ${C_DIM}# podman: prefix each compose command with
  #   DOCKER_HOST=unix:///run/podman/podman.sock${C_OFF}

${C_BOLD}Notes${C_OFF}
  - 'update' owns every change. 'install' re-run on an existing installation
    changes nothing and only starts the app, so it is always safe to re-run.
  - 'update' always backs up before it changes anything. The archives land in
    ./backup, accumulate and hold secrets - prune them yourself. To back up
    on demand, or to restore, use ./mre.sh.
  - 'update' never rewrites .env: keys a new release adds must be copied from
    .env.domain by hand.
  - With non-default ports, Let's Encrypt cannot reach Caddy on 80/443, so
    automatic HTTPS for a domain will not work.
EOF
}

# --- Argument parsing -----------------------------------------------------

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      install|update) SUBCOMMAND="$1" ;;
      --dir)
        shift
        INSTALL_DIR="${1:-}"
        [ -n "$INSTALL_DIR" ] || die "--dir requires a path"
        ;;
      -h|--help) show_help; exit 0 ;;
      *)         die "Unknown argument: $1 (try --help)" ;;
    esac
    shift
  done
  SUBCOMMAND="${SUBCOMMAND:-install}"
}

# --- Preflight ------------------------------------------------------------

pkg_for_cmd() {
  case "$1" in
    ss)       [ "$OS_FAMILY" = rhel ] && echo iproute || echo iproute2 ;;
    netstat)  echo net-tools ;;
    *)        echo "$1" ;;
  esac
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 && return 0
  local pkg
  pkg="$(pkg_for_cmd "$1")"
  if [ -n "$PKG_INSTALL" ]; then
    die "Required command not found: $1. Install it with:  $PKG_INSTALL $pkg"
  fi
  die "Required command not found: $1. Install it and re-run."
}

# Split out of detect_os to keep the OS checks and the distro table apart.
detect_distro() {
  local id="" id_like=""
  if [ -r /etc/os-release ]; then
    id="$(. /etc/os-release 2>/dev/null && printf '%s' "${ID:-}")"
    id_like="$(. /etc/os-release 2>/dev/null && printf '%s' "${ID_LIKE:-}")"
  fi
  OS_ID="$id"
  case " $id $id_like " in
    *" debian "*|*" ubuntu "*)                  OS_FAMILY=debian ;;
    *" rhel "*|*" fedora "*|*" centos "*)       OS_FAMILY=rhel ;;
    *)                                          OS_FAMILY=other ;;
  esac
  case "$OS_FAMILY" in
    debian) PKG_INSTALL="apt install" ;;
    rhel)   PKG_INSTALL="dnf install" ;;
    *)      PKG_INSTALL="" ;;
  esac
  case "$id" in
    ubuntu|debian|fedora|rhel|centos) DOCKER_DOC_URL="https://docs.docker.com/engine/install/$id/" ;;
    almalinux|rocky)                  DOCKER_DOC_URL="https://docs.docker.com/engine/install/rhel/" ;;
    *)                                DOCKER_DOC_URL="$DOCKER_DOC_URL" ;;
  esac
}

selinux_enforcing() {
  if [ -r /sys/fs/selinux/enforce ]; then
    [ "$(cat /sys/fs/selinux/enforce 2>/dev/null)" = "1" ]
  elif command -v getenforce >/dev/null 2>&1; then
    [ "$(getenforce 2>/dev/null)" = "Enforcing" ]
  else
    return 1
  fi
}

detect_os() {
  local uname_s
  uname_s="$(uname -s 2>/dev/null || echo unknown)"
  case "$uname_s" in
    Darwin) die "macOS is not supported. Use Docker Desktop and 'yarn start' from a checkout." ;;
    Linux)  ;;
    *)      die "Unsupported OS: $uname_s" ;;
  esac
  detect_distro
  [ -n "$OS_ID" ] && info "Distribution: $OS_ID (${OS_FAMILY} family)"
  if [ -f /.dockerenv ] || grep -qE '(docker|kubepods|lxc)' /proc/1/cgroup 2>/dev/null; then
    die "Refusing to install inside a container. Run on the host."
  fi
  if grep -qi microsoft /proc/version 2>/dev/null && ! grep -qi 'WSL2' /proc/version 2>/dev/null; then
    warn "Detected WSL1. WSL2 is strongly recommended. Proceeding anyway."
  fi
  if selinux_enforcing; then
    info "SELinux is enforcing. The bind mounts are labelled ':z', so this is expected to work."
    detail "If a service reports 'permission denied' on its volume, check the mongo service logs."
  fi
}

docker_is_podman_shim() {
  command -v docker >/dev/null 2>&1 \
    && docker --version 2>/dev/null | grep -qi podman
}

# Point DOCKER_HOST at podman's Docker-API socket, so the real Compose v2 binary
# and every raw CLI call keep working unchanged.
setup_podman() {
  CONTAINER_ENGINE=podman
  local ver major
  ver="$(podman --version 2>/dev/null | awk '{print $3}')"
  major="${ver%%.*}"
  if [ -z "$major" ] || ! [ "$major" -ge 4 ] 2>/dev/null; then
    die "podman ${ver:-<unknown>} is too old; 4.0 or newer is required for the Docker-compatible API.
    Upgrade with:  ${PKG_INSTALL:-your package manager} podman"
  fi
  ok "Podman found: $ver"

  local sudo_cmd=""
  [ "$(id -u)" -eq 0 ] || { require_cmd sudo; sudo_cmd="sudo"; }

  if [ -z "${DOCKER_HOST:-}" ]; then
    info "Enabling podman's Docker-compatible API socket..."
    $sudo_cmd systemctl enable --now podman.socket >/dev/null 2>&1 \
      || warn "Could not enable podman.socket; continuing in case it is already running."
    export DOCKER_HOST="unix:///run/podman/podman.sock"
  fi
  [ -S "${DOCKER_HOST#unix://}" ] \
    || die "podman's API socket is not available at ${DOCKER_HOST#unix://}.
    Enable it with:  sudo systemctl enable --now podman.socket"
  ok "Using podman via $DOCKER_HOST"

  # Without this, 'restart: unless-stopped' does not survive a reboot.
  $sudo_cmd systemctl enable --now podman-restart.service >/dev/null 2>&1 \
    || warn "Could not enable podman-restart.service: containers will not restart after a reboot."
}

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
  if command -v docker >/dev/null 2>&1; then
    CONTAINER_ENGINE=docker
    ok "Docker found: $(docker --version 2>/dev/null | head -n1)"
    return
  fi
  require_cmd curl
  local sudo_cmd=""
  [ "$(id -u)" -eq 0 ] || { require_cmd sudo; sudo_cmd="sudo"; }

  # Unpinned remote code, run as root: say so and let a terminal decline. The
  # documented 'curl … | bash' flow has no tty, so it warns and proceeds.
  info "Docker not found. It can be installed with the official convenience script:"
  detail "curl -fsSL https://get.docker.com | ${sudo_cmd:-}sh"
  detail "That downloads and runs a script from Docker as root."
  detail "To install it yourself instead: $DOCKER_DOC_URL"
  if [ -r /dev/tty ] && [ -t 0 ]; then
    local reply=""
    read -r -p "Run the Docker install script now? [y/N] " reply < /dev/tty || true
    case "$reply" in
      [yY]|[yY][eE][sS]) ;;
      *) die "Aborted at your request. Install Docker manually and re-run." ;;
    esac
  else
    warn "No terminal available to confirm; proceeding with the Docker install."
  fi
  curl -fsSL https://get.docker.com | $sudo_cmd sh \
    || die "Docker install failed. Install it manually for ${OS_ID:-your distribution}: $DOCKER_DOC_URL"
  CONTAINER_ENGINE=docker
  ok "Docker installed"
  if ! $sudo_cmd systemctl is-active --quiet docker 2>/dev/null; then
    $sudo_cmd systemctl start docker 2>/dev/null || true
  fi
}

# 'podman compose' is deliberately avoided: it dispatches to podman-compose,
# which does not implement the 'service_healthy' and
# 'service_completed_successfully' conditions this stack depends on.
ensure_compose() {
  local -a candidates=()
  if [ "$CONTAINER_ENGINE" = podman ] && docker_is_podman_shim; then
    # 'docker compose' here would be 'podman compose'; require the real binary.
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
        ok "Compose v2 found: $cand $ver"
        return
        ;;
    esac
  done

  if [ "$CONTAINER_ENGINE" = podman ]; then
    die "Compose v2 is required and was not found.
    Install it with:  ${PKG_INSTALL:-your package manager} docker-compose
    ('podman compose' is not used: it cannot honour this stack's healthcheck-gated
    service dependencies.)"
  fi
  die "Docker Compose v2 is required. Install the compose plugin: https://docs.docker.com/compose/install/linux"
}

ensure_docker_running() {
  if ! "$CONTAINER_CLI" info >/dev/null 2>&1; then
    local sudo_cmd=""
    [ "$(id -u)" -eq 0 ] || { require_cmd sudo; sudo_cmd="sudo"; }
    $sudo_cmd systemctl start docker 2>/dev/null || true
    sleep 2
    "$CONTAINER_CLI" info >/dev/null 2>&1 \
      || die "Container engine not reachable. Start it (e.g. 'sudo systemctl start docker', or 'sudo systemctl start podman.socket') and re-run."
  fi
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -Htln "sport = :$port" 2>/dev/null | grep -q LISTEN
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${port}$"
  else
    # Guessing "free" would surface later as a confusing compose bind error.
    die "Cannot check whether port $port is free: neither 'ss' nor 'netstat' is installed.
    Install one with:  ${PKG_INSTALL:-your package manager} $(pkg_for_cmd ss)"
  fi
}

check_ports() {
  local p
  for p in "$RESOLVED_HTTP_PORT" "$RESOLVED_HTTPS_PORT"; do
    if port_in_use "$p"; then
      die "Port $p is already in use. Stop the conflicting service, or choose other ports via MRE_HTTP_PORT/MRE_HTTPS_PORT."
    fi
  done
  ok "Ports $RESOLVED_HTTP_PORT and $RESOLVED_HTTPS_PORT are available"
}

is_valid_port() {
  [[ "$1" =~ ^[0-9]{1,5}$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]
}

# resolve_ports <bootstrap|persisted>
#
# Environment, then .env, then the default -- matching compose, which lets host
# environment variables win over --env-file. Resolving any other way makes the
# banner and the readiness probe disagree with the ports compose publishes.
# The mode only changes the warning: 'install' persists the value, 'update' not.
resolve_ports() {
  local mode="$1"
  local key candidate from_env from_file default
  for key in MRE_HTTP_PORT MRE_HTTPS_PORT; do
    case "$key" in
      MRE_HTTP_PORT)  default=80 ;;
      MRE_HTTPS_PORT) default=443 ;;
    esac
    from_env="${!key:-}"
    from_file="${ENV_CURRENT[$key]:-}"
    is_valid_port "$from_env"  || from_env=""
    is_valid_port "$from_file" || from_file=""

    candidate="${from_env:-${from_file:-$default}}"
    if [ -n "$from_env" ] && [ -n "$from_file" ] && [ "$from_env" != "$from_file" ]; then
      if [ "$mode" = "bootstrap" ]; then
        warn "$key=$from_env from the environment overrides $from_file in .env, and is written there permanently."
      else
        warn "$key=$from_env from the environment overrides $from_file in .env for this run only; this run does not rewrite .env, so a later '${COMPOSE_CMD[*]} up' without $key set will publish $from_file again."
      fi
    fi
    ENV_CURRENT["$key"]="$candidate"
  done
  RESOLVED_HTTP_PORT="${ENV_CURRENT[MRE_HTTP_PORT]}"
  RESOLVED_HTTPS_PORT="${ENV_CURRENT[MRE_HTTPS_PORT]}"
  if [ "$RESOLVED_HTTP_PORT" = "$RESOLVED_HTTPS_PORT" ]; then
    die "MRE_HTTP_PORT and MRE_HTTPS_PORT must differ (both are $RESOLVED_HTTP_PORT)."
  fi
  ok "HTTP port: $RESOLVED_HTTP_PORT / HTTPS port: $RESOLVED_HTTPS_PORT"
}

# INSTALL_DIR defaults to $PWD, so 'curl … | bash' in the wrong directory would
# have write_env rewrite someone else's .env.
#
# Greps .env itself, not ENV_CURRENT: .env.domain is loaded first and carries
# every one of these keys as a placeholder, so the merged map always has them.
refuse_foreign_env() {
  [ -f "${INSTALL_DIR}/.env" ] || return 0
  local key pattern=""
  for key in MRE_VERSION "${SECRET_KEYS[@]}"; do
    pattern="${pattern:+$pattern|}$key"
  done
  grep -qE "^[[:space:]]*($pattern)[[:space:]]*=" "${INSTALL_DIR}/.env" && return 0
  die "${INSTALL_DIR}/.env exists but holds no MicroRealEstate settings, so it
    belongs to another project and this installer would rewrite it.
    Install somewhere else with:  ./install.sh install --dir /path/to/microrealestate"
}

# Refuse to scatter an install across the filesystem root or a system tree.
validate_install_dir() {
  local d="$1"
  case "$d" in
    / | /home | /root)
      die "Refusing to install directly into '$d'. Pass a dedicated directory with --dir."
      ;;
  esac
  if [[ "$d" =~ ^/(bin|boot|dev|etc|lib|lib64|proc|run|sbin|sys|usr|var)(/|$) ]]; then
    die "Refusing to install into the system directory '$d'. Pass a dedicated directory with --dir."
  fi
}

require_root() {
  [ "$RESOLVED_HTTP_PORT" -lt 1024 ] || [ "$RESOLVED_HTTPS_PORT" -lt 1024 ] || return 0
  [ "$(id -u)" -eq 0 ] && return 0

  info "Ports $RESOLVED_HTTP_PORT/$RESOLVED_HTTPS_PORT are below 1024 and need root to bind. Using sudo for the remaining docker/compose steps; you may be prompted for your password."
  if ! { [ -r /dev/tty ] && [ -t 0 ]; }; then
    die "No terminal available to prompt for sudo. Re-run with sudo, or pick unprivileged ports via MRE_HTTP_PORT/MRE_HTTPS_PORT."
  fi
  require_cmd sudo
  sudo -v || die "sudo authentication failed. Re-run with sudo, or pick unprivileged ports via MRE_HTTP_PORT/MRE_HTTPS_PORT."
  ROOT_CMD="sudo"
}

find_running_mre_container() {
  local c
  c="$("$CONTAINER_CLI" ps --filter 'label=com.docker.compose.project=docker' \
        --format '{{.Names}}' | head -n1)"
  if [ -n "$c" ]; then
    echo "$c"
    return 0
  fi
  "$CONTAINER_CLI" ps --format '{{.Names}}|{{.Image}}' \
    | grep -E 'ghcr\.io/microrealestate|localhost:[0-9]+/mre/' \
    | cut -d'|' -f1 | head -n1
}

# --- Address detection ----------------------------------------------------

is_ipv4()  { [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; }
is_ipv6()  { [[ "$1" =~ ^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$ ]]; }
is_fqdn()  { [[ "$1" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$ ]]; }

fetch_public_ip() {
  local url
  for url in \
    https://ifconfig.io \
    https://icanhazip.com \
    https://ipecho.net/plain \
    https://checkip.amazonaws.com
  do
    local ip
    ip="$(curl -fsSL --max-time 3 "$url" 2>/dev/null | tr -d '[:space:]' || true)"
    if [ -n "$ip" ] && { is_ipv4 "$ip" || is_ipv6 "$ip"; }; then
      printf '%s' "$ip"
      return 0
    fi
  done
  return 1
}

fetch_lan_ip() {
  local ip=""
  if command -v ip >/dev/null 2>&1; then
    ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  [ -n "$ip" ] || return 1
  printf '%s' "$ip"
}

# RESOLVED_ADDR only feeds the banner, so a failure here is never fatal: it
# would abort an otherwise healthy install over a printed URL.
detect_address() {
  local input="${ADVERTISE_ADDR:-}"
  if [ -z "$input" ]; then
    info "Detecting this server's address..."
    input="$(fetch_public_ip || true)"
    if [ -z "$input" ]; then
      input="$(fetch_lan_ip || true)"
    fi
  fi

  if [ -z "$input" ] || ! { is_fqdn "$input" || is_ipv4 "$input" || is_ipv6 "$input"; }; then
    local reason
    if [ -z "$input" ]; then
      reason="Could not determine server address."
    else
      reason="Could not parse '$input' as a domain or IP address (single-label names like 'localhost' are not accepted)."
    fi
    warn "$reason Using 'localhost' for the banner; set ADVERTISE_ADDR to fix it."
    RESOLVED_ADDR="localhost"
    return 0
  fi

  RESOLVED_ADDR="$input"
  # is_fqdn also matches a dotted-quad, so the IP tests come first.
  if is_ipv4 "$input" || is_ipv6 "$input"; then
    info "Detected IP: $RESOLVED_ADDR"
  else
    info "Detected FQDN: $RESOLVED_ADDR (HTTPS will be available after domain setup)"
  fi
  ok "Server address: $RESOLVED_ADDR"
}

# --- Compose file resolution ----------------------------------------------

download_file() {
  local url="$1" dest="$2"
  require_cmd curl
  local tmp
  tmp="$(mktemp "$(dirname "$dest")/.mre-download.XXXXXX")" || return 1
  if curl -fsSL "$url" -o "$tmp"; then
    mv "$tmp" "$dest"
  else
    rm -f "$tmp"
    return 1
  fi
}

# Downloads <url> beside <dest> and echoes the temp path when the content differs;
# echoes nothing when it matches. Returns 1 on a failed download, leaving <dest>
# untouched. Separate from applying so 'update' can tell what a run changes before
# the dump, which has to run against the compose file still on disk.
probe_file() {
  local url="$1" dest="$2"
  require_cmd curl
  local tmp
  tmp="$(mktemp "$(dirname "$dest")/.mre-download.XXXXXX")" || return 1
  if ! curl -fsSL "$url" -o "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  # A missing cmp reports failure, which only costs a redundant rewrite.
  if [ -f "$dest" ] && cmp -s "$tmp" "$dest" 2>/dev/null; then
    rm -f "$tmp"
    return 0
  fi
  printf '%s' "$tmp"
}

# Moves a file probe_file held back into place, keeping the replaced copy.
apply_file() {
  local tmp="$1" dest="$2" backup_path="$3"
  if [ -f "$dest" ]; then
    ensure_backup_dir
    cp -p "$dest" "$backup_path" || die "Could not back up $dest before replacing it"
    claim_for_owner "$backup_path"
    mv "$tmp" "$dest"
    ok "Refreshed $dest (previous copy kept as ${backup_path#"$INSTALL_DIR"/})"
  else
    mv "$tmp" "$dest"
    ok "Added $dest"
  fi
}

resolve_compose_files() {
  cd "$INSTALL_DIR"
  if [ -f "docker/docker-compose.yml" ]; then
    COMPOSE_ARGS=(-f "docker/docker-compose.yml")
    ok "Using local compose file: docker/docker-compose.yml"
    return
  fi
  if [ -f "docker-compose.yml" ]; then
    if [ ! -f "Caddyfile" ]; then
      info "Fetching missing Caddyfile from $MRE_SRC_URL..."
      download_file "$MRE_SRC_URL/docker/Caddyfile" "Caddyfile" \
        || die "Failed to download Caddyfile from $MRE_SRC_URL"
    fi
    COMPOSE_ARGS=(-f "docker-compose.yml")
    ok "Using local compose file: docker-compose.yml"
    return
  fi
  info "Fetching docker-compose.yml and Caddyfile from $MRE_SRC_URL..."
  mkdir -p docker
  download_file "$MRE_SRC_URL/docker/docker-compose.yml" "docker/docker-compose.yml" \
    || die "Failed to download docker-compose.yml from $MRE_SRC_URL"
  download_file "$MRE_SRC_URL/docker/Caddyfile" "docker/Caddyfile" \
    || die "Failed to download Caddyfile from $MRE_SRC_URL"
  COMPOSE_ARGS=(-f "docker/docker-compose.yml")
  ok "Downloaded docker/docker-compose.yml and docker/Caddyfile"
}

ensure_env_domain_template() {
  cd "$INSTALL_DIR"
  if [ -f ".env.domain" ]; then
    return 0
  fi
  info "Fetching .env.domain template from $MRE_SRC_URL..."
  download_file "$MRE_SRC_URL/.env.domain" ".env.domain" \
    || warn "Could not download .env.domain template (not fatal)."
}

ensure_mre_script() {
  cd "$INSTALL_DIR"
  if [ -f "mre.sh" ]; then
    chmod 755 "mre.sh" 2>/dev/null || true
    return 0
  fi
  info "Fetching mre.sh from $MRE_SRC_URL..."
  if download_file "$MRE_SRC_URL/mre.sh" "mre.sh"; then
    # 755, not '+x': download_file writes through mktemp (mode 600), so '+x'
    # would leave 711 on a script that holds no secrets.
    chmod 755 "mre.sh"
    claim_for_owner "${INSTALL_DIR}/mre.sh"
    ok "Added mre.sh (start, stop, status, logs, backup, restore)"
  else
    warn "Could not download mre.sh (not fatal). Fetch it later with:
    curl -sSLO $MRE_SRC_URL/mre.sh && chmod +x mre.sh"
  fi
}

# 'update' pulls new images; without new stack files those images would run
# under the previous release's topology, and a service added upstream would
# never start. Writes nothing: the files whose content differs are held back in
# STACK_FILE_UPDATES as 'tmp|dest|backup' triples for apply_stack_files.
probe_stack_files() {
  cd "$INSTALL_DIR"
  STACK_FILE_UPDATES=()
  if [ -d ".git" ]; then
    info "Git checkout: the compose file, Caddyfile and .env.domain are left to git."
    return 0
  fi

  local compose_file="${COMPOSE_ARGS[1]:-}"
  [ -n "$compose_file" ] || die "No compose file resolved; cannot refresh the stack files."
  local caddy_file
  case "$compose_file" in
    docker/*) caddy_file="docker/Caddyfile" ;;
    *)        caddy_file="Caddyfile" ;;
  esac

  # .env.domain loses its leading dot so the copy is not a hidden file.
  local bk="${INSTALL_DIR}/backup/${RUN_STAMP}"
  local tmp

  info "Checking the stack files against $MRE_SRC_URL..."
  tmp="$(probe_file "$MRE_SRC_URL/docker/docker-compose.yml" "$compose_file")" \
    || die "Failed to download docker-compose.yml from $MRE_SRC_URL. Nothing has been changed."
  [ -n "$tmp" ] && STACK_FILE_UPDATES+=("${tmp}|${compose_file}|${bk}-docker-compose.yml")
  tmp="$(probe_file "$MRE_SRC_URL/docker/Caddyfile" "$caddy_file")" \
    || { discard_stack_files
         die "Failed to download the Caddyfile from $MRE_SRC_URL. Nothing has been changed.
    Re-run './install.sh update' once the source is reachable."; }
  [ -n "$tmp" ] && STACK_FILE_UPDATES+=("${tmp}|${caddy_file}|${bk}-Caddyfile")
  # Template only, read by 'install' and by operators: never fatal.
  tmp="$(probe_file "$MRE_SRC_URL/.env.domain" ".env.domain")" \
    || { warn "Could not check the .env.domain template (not fatal)."; tmp=""; }
  [ -n "$tmp" ] && STACK_FILE_UPDATES+=("${tmp}|.env.domain|${bk}-env.domain")
  # Not fatal either: the images still update, mre.sh just stays as it is.
  tmp="$(probe_file "$MRE_SRC_URL/mre.sh" "mre.sh")" \
    || { warn "Could not check mre.sh (not fatal)."; tmp=""; }
  [ -n "$tmp" ] && STACK_FILE_UPDATES+=("${tmp}|mre.sh|${bk}-mre.sh")

  [ "${#STACK_FILE_UPDATES[@]}" -eq 0 ] && ok "Stack files are up to date"
  return 0
}

# Drops what probe_stack_files held back when a later probe in the run fails.
discard_stack_files() {
  [ "${#STACK_FILE_UPDATES[@]}" -eq 0 ] && return 0
  local entry
  for entry in "${STACK_FILE_UPDATES[@]}"; do
    rm -f "${entry%%|*}"
  done
  STACK_FILE_UPDATES=()
}

# Installs whatever probe_stack_files held back.
apply_stack_files() {
  [ "${#STACK_FILE_UPDATES[@]}" -eq 0 ] && return 0
  local entry tmp dest backup
  for entry in "${STACK_FILE_UPDATES[@]}"; do
    tmp="${entry%%|*}"
    backup="${entry##*|}"
    dest="${entry#*|}"
    dest="${dest%|*}"
    apply_file "$tmp" "$dest" "$backup"
    # apply_file moves a mode-600 temp file into place; put the mode back.
    [ "$dest" = "mre.sh" ] && chmod 755 "${INSTALL_DIR}/mre.sh"
  done
  STACK_FILE_UPDATES=()
}

# --- .env load / merge / write --------------------------------------------

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

is_placeholder() {
  local val="$1"
  for p in "${PLACEHOLDER_VALUES[@]}"; do
    [ "$val" = "$p" ] && return 0
  done
  return 1
}

gen_secret() {
  openssl rand -base64 32 2>/dev/null | tr -d '\n/+=' | cut -c1-32
}

# True when generate_secrets would replace a secret: what tells an installation
# apart from an empty or half-written directory.
secrets_will_change() {
  local key existing
  for key in "${SECRET_KEYS[@]}"; do
    existing="${ENV_CURRENT[$key]:-}"
    if [ -z "$existing" ] || is_placeholder "$existing"; then
      return 0
    fi
  done
  return 1
}

generate_secrets() {
  require_cmd openssl
  for key in "${SECRET_KEYS[@]}"; do
    local existing="${ENV_CURRENT[$key]:-}"
    if [ -n "$existing" ] && ! is_placeholder "$existing"; then
      continue
    fi
    ENV_CURRENT["$key"]="$(gen_secret)"
  done
}

# --- .env writing ---------------------------------------------------------

# The canonical key order we emit. Keys missing from this list go at the end.
ENV_KEY_ORDER=(
  MRE_VERSION
  MRE_HTTP_PORT MRE_HTTPS_PORT
  MONGO_URL
  ACCESS_TOKEN_SECRET REFRESH_TOKEN_SECRET RESET_TOKEN_SECRET
  CIPHER_KEY CIPHER_IV_KEY
  REDIS_PASSWORD
)

env_quote() {
  # Quote value if it contains whitespace or shell-special chars.
  local v="$1"
  if [[ "$v" =~ [[:space:]\'\"\$\`\\] ]]; then
    printf "'%s'" "${v//\'/\'\\\'\'}"
  else
    printf '%s' "$v"
  fi
}

write_env() {
  cd "$INSTALL_DIR"
  local tmp
  tmp="$(mktemp "${INSTALL_DIR}/.env.tmp.XXXXXX")" \
    || die "Cannot create temporary file in $INSTALL_DIR"
  if ! {
    echo "# MicroRealEstate configuration"
    echo "# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ). Secrets are auto-generated; keep this file safe."
    echo
    local seen="|"
    local key
    for key in "${ENV_KEY_ORDER[@]}"; do
      if [ -n "${ENV_CURRENT[$key]+x}" ]; then
        printf '%s=%s\n' "$key" "$(env_quote "${ENV_CURRENT[$key]}")"
        seen+="$key|"
      fi
    done
    if [ "${#ENV_CURRENT[@]}" -gt 0 ]; then
      local extras=()
      for key in "${!ENV_CURRENT[@]}"; do
        [[ "$seen" == *"|$key|"* ]] || extras+=("$key")
      done
      if [ "${#extras[@]}" -gt 0 ]; then
        echo
        echo "# Additional values"
        printf '%s\n' "${extras[@]}" | sort | while read -r key; do
          printf '%s=%s\n' "$key" "$(env_quote "${ENV_CURRENT[$key]}")"
        done
      fi
    fi
  } > "$tmp"; then
    rm -f "$tmp"
    die "Failed to write .env"
  fi
  if [ -f "${INSTALL_DIR}/.env" ]; then
    # One-second stamp resolution: suffix until free rather than overwrite an
    # earlier backup.
    local stamp backup n=1
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    backup="${INSTALL_DIR}/.env.bak.${stamp}"
    while [ -e "$backup" ]; do
      backup="${INSTALL_DIR}/.env.bak.${stamp}.${n}"
      n=$((n + 1))
    done
    cp -p "${INSTALL_DIR}/.env" "$backup" || die "Could not back up the existing .env"
    chmod 600 "$backup"
    ok "Previous .env saved as $(basename "$backup")"
  fi
  mv "$tmp" "${INSTALL_DIR}/.env"
  chmod 600 "${INSTALL_DIR}/.env"
  ok "Wrote ${INSTALL_DIR}/.env (mode 600)"
}

# --- Docker compose wrapping ----------------------------------------------

compose() {
  (cd "$INSTALL_DIR" && $ROOT_CMD "${COMPOSE_CMD[@]}" --env-file .env "${COMPOSE_ARGS[@]}" "$@")
}

# The compose file lives in docker/ while .env lives in the install dir, so a
# bare 'docker compose' finds neither: every command we print carries both flags.
compose_hint() {
  # Without DOCKER_HOST the pasted command would look for a Docker daemon.
  local prefix=""
  [ "$CONTAINER_ENGINE" = podman ] && prefix="DOCKER_HOST=$DOCKER_HOST "
  printf '%s%s --env-file .env %s' "$prefix" "${COMPOSE_CMD[*]}" "${COMPOSE_ARGS[*]}"
}

print_useful_commands() {
  local compose_cmd="$1"
  echo "  ${C_DIM}# show service status, or follow a service's logs${C_OFF}"
  echo "  ./mre.sh status"
  echo "  ./mre.sh logs gateway"
  echo "  ${C_DIM}# start, stop or restart the application${C_OFF}"
  echo "  ./mre.sh start | stop | restart"
  echo "  ${C_DIM}# back up the data, or put a backup back${C_OFF}"
  echo "  ./mre.sh backup"
  echo "  ./mre.sh restore"
  echo "  ${C_DIM}# update to the latest images${C_OFF}"
  echo "  ./install.sh update"
  echo "  ${C_DIM}# anything else, straight through compose${C_OFF}"
  echo "  $compose_cmd ps"
}

pull_images() {
  info "Pulling images (this may take a few minutes)..."
  compose pull || die "'${COMPOSE_CMD[*]} pull' failed. Check your internet connection and retry."
  ok "Images pulled"
}

images_locally_available() {
  local img
  local imgs=()
  mapfile -t imgs < <(compose config --images)
  [ "${#imgs[@]}" -gt 0 ] || return 1
  for img in "${imgs[@]}"; do
    "$CONTAINER_CLI" image inspect "$img" >/dev/null 2>&1 || return 1
  done
  return 0
}

pull_images_if_needed() {
  if images_locally_available; then
    ok "Images already available locally, skipping pull"
    return
  fi
  pull_images
}

start_stack() {
  info "Starting services..."
  # No --remove-orphans: the project name comes from the compose file's parent
  # directory ("docker"), so it can match an unrelated stack and delete it.
  compose up -d || die "'${COMPOSE_CMD[*]} up -d' failed. For details run, from ${INSTALL_DIR}:
    $(compose_hint) logs"
  ok "Services started"
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
  die "Mongo did not become ready within 30s; cannot take a safe backup.
    Start the stack and re-run, or set MRE_SKIP_BACKUP=1 to skip backups."
}

# Under sudo the files must end up owned by the invoking user, or their own
# 'docker compose' can no longer read .env afterwards.
owner_uid() { echo "${SUDO_UID:-$(id -u)}"; }
owner_gid() { echo "${SUDO_GID:-$(id -g)}"; }

# Anything this script writes as root under sudo would otherwise need root to
# read or prune afterwards. Best-effort: restore_ownership is the backstop.
claim_for_owner() {
  [ -n "${SUDO_UID:-}" ] || return 0
  chown "$(owner_uid):$(owner_gid)" "$@" 2>/dev/null || true
}

# data/ is deliberately left alone: Docker creates it and the services run as
# uid 1000/999 inside their containers.
restore_ownership() {
  [ -n "${SUDO_UID:-}" ] || return 0
  local target
  target="$(owner_uid):$(owner_gid)"
  local path
  # Non-recursive for backup/: archives the operator put there are theirs, and
  # OPERATIONS.md promises we never touch them.
  for path in "${INSTALL_DIR}/.env" "${INSTALL_DIR}/.env.domain" \
              "${INSTALL_DIR}/mre.sh" \
              "${INSTALL_DIR}/backup" "${INSTALL_DIR}"/.env.bak.*; do
    [ -e "$path" ] || continue
    chown "$target" "$path" 2>/dev/null || true
  done
  # Both hold only what this script wrote, so they are ours to claim recursively.
  [ -d "${INSTALL_DIR}/docker" ] && chown -R "$target" "${INSTALL_DIR}/docker" 2>/dev/null || true
  ok "Install files handed back to uid $(owner_uid) (sudo invoker)"
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

backup_data() {
  if [ "${MRE_SKIP_BACKUP:-0}" = "1" ]; then
    warn "MRE_SKIP_BACKUP is set: skipping the pre-flight data backup"
    return
  fi
  if ! data_exists; then
    info "No existing MicroRealEstate data found, skipping backup"
    return
  fi
  ensure_backup_dir
  # backup/ is the container's /backup, so one relative path names both sides.
  local dump="backup/${RUN_STAMP}-mredb.dump.gz"
  info "Backing up existing data..."
  detail "database -> ${dump}"
  if ! compose run --rm --user "$(owner_uid):$(owner_gid)" mongo \
      mongodump --uri=mongodb://mongo/mredb --gzip \
        --archive="/${dump}"; then
    if [ -s "${INSTALL_DIR}/${dump}" ]; then
      warn "An incomplete archive was left at ${dump} - do not restore from it."
    else
      rm -f "${INSTALL_DIR}/${dump}"
    fi
    die "Database backup failed. Nothing has been changed.
    A 'permission denied' here means ${INSTALL_DIR}/backup does not belong to
    uid $(owner_uid), the user the dump runs as.
    Fix the issue and re-run, or set MRE_SKIP_BACKUP=1 to skip backups."
  fi
  claim_for_owner "${INSTALL_DIR}/${dump}"
  if [ -d "${INSTALL_DIR}/data/uploads" ]; then
    local uploads="backup/${RUN_STAMP}-uploads.tar.gz"
    detail "uploads -> ${uploads}"
    tar czf "${INSTALL_DIR}/${uploads}" -C "${INSTALL_DIR}" data/uploads \
      || die "Uploads backup failed. Nothing has been changed."
    claim_for_owner "${INSTALL_DIR}/${uploads}"
  else
    detail "uploads -> none yet, nothing to archive"
  fi
  ok "Data backed up to backup/${RUN_STAMP}-*"
}

# The dump needs mongo up; a stopped stack is started for it.
backup_before_change() {
  step "Backup"
  if data_exists && ! mongo_service_running; then
    start_stack
    wait_for_mongo
  fi
  backup_data
}

wait_until_responding() {
  info "Waiting for services to come up (max ${HEALTH_WAIT_SECONDS}s)..."
  # The proxy answers as soon as it binds, long before the upstreams listen, so
  # a bare "connection succeeded" is not readiness: keep polling through 5xx.
  # A deadline rather than an iteration count, since each probe costs
  # --max-time plus the sleep; the bound is one probe cycle (~5s) over budget.
  local code deadline=$((SECONDS + HEALTH_WAIT_SECONDS))
  while [ "$SECONDS" -lt "$deadline" ]; do
    # curl prints 000 on failure itself; a "|| echo 000" fallback would
    # concatenate a second one and match neither case arm below.
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 4 \
              "http://127.0.0.1:${RESOLVED_HTTP_PORT}/landlord" 2>/dev/null)" || true
    [ -n "$code" ] || code=000
    case "$code" in
      5??|000) ;;
      *) ok "Services are responding (HTTP $code)"; return 0 ;;
    esac
    sleep 1
  done
  warn "Services did not respond within ${HEALTH_WAIT_SECONDS}s (last status: ${code:-000}). They may still be starting; check, from ${INSTALL_DIR}:
    $(compose_hint) logs"
}

# --- Banner ---------------------------------------------------------------

public_url() {
  local host="$RESOLVED_ADDR"
  is_ipv6 "$host" && host="[$host]"
  if [ "$RESOLVED_HTTP_PORT" = "80" ]; then
    printf 'http://%s' "$host"
  else
    printf 'http://%s:%s' "$host" "$RESOLVED_HTTP_PORT"
  fi
}

print_banner() {
  local url; url="$(public_url)"
  local compose_cmd; compose_cmd="$(compose_hint)"
  echo
  printf '%s' "$C_GREEN$C_BOLD"
  cat <<EOF
 ==========================================
  MicroRealEstate is running
 ==========================================
EOF
  printf '%s' "$C_OFF"
  echo
  echo "  Landlord UI:  $url/landlord"
  echo "  Tenant UI:    $url/tenant"
  echo
  echo "Useful commands (run from ${C_BOLD}$INSTALL_DIR${C_OFF}):"
  print_useful_commands "$compose_cmd"
  echo
}

print_donation() {
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

# --- Subcommands ----------------------------------------------------------

cmd_install() {
  step "MicroRealEstate installer"

  step "Preflight"
  detect_os

  # Cheapest guard first: refusing here leaves the directory untouched, with
  # nothing downloaded and no engine installed.
  cd "$INSTALL_DIR"
  refuse_foreign_env

  ensure_docker
  ensure_docker_running
  ensure_compose
  require_cmd curl
  require_cmd openssl

  # ../backup is bind-mounted by the mongo service: without this Docker creates
  # it as root on the first 'up'.
  ensure_backup_dir

  step "Configuration"
  resolve_compose_files
  ensure_env_domain_template
  ensure_mre_script

  load_env_file ".env.domain"
  load_env_file ".env"

  detect_address

  # 'install' never changes an installation that is already there; every change
  # belongs to 'update'. This path only brings the app up.
  if [ -f ".env" ] && ! secrets_will_change; then
    resolve_ports persisted
    require_root

    local installed_container
    installed_container="$(find_running_mre_container)" || true
    if [ -n "$installed_container" ]; then
      ok "MicroRealEstate is already installed and running"
    else
      # A partially running stack legitimately holds its own ports.
      check_ports
      info "Existing installation found; starting it without changing anything"
    fi

    step "Starting up"
    pull_images_if_needed
    start_stack
    restore_ownership
    wait_until_responding

    print_banner
    print_donation
    return
  fi

  resolve_ports bootstrap
  require_root
  check_ports

  if [ ! -f ".env" ] && data_exists; then
    die "Existing data found in ${INSTALL_DIR}/data but .env is missing, so this
    would be treated as a fresh install: new secrets would be generated, and the
    retained database was encrypted with the OLD ones. It would not be readable
    with the new secrets and existing logins would stop working.
    Restore the previous .env, or move ${INSTALL_DIR}/data aside, then re-run."
  fi

  generate_secrets
  write_env

  step "Images"
  pull_images_if_needed

  step "Starting up"
  start_stack
  # Before the readiness wait, not after: a Ctrl-C during those minutes would
  # otherwise leave a root-owned tree behind.
  restore_ownership
  wait_until_responding

  print_banner
  print_donation
}

cmd_update() {
  step "MicroRealEstate update"

  step "Preflight"
  detect_os

  # Cheap guards first: resolving the engine can offer to install Docker, which
  # would be wasted work if there is nothing to update here.
  cd "$INSTALL_DIR"
  [ -f ".env" ] || die "No .env found in $INSTALL_DIR. Run './install.sh install' first."
  if [ ! -r ".env" ]; then
    die ".env is not readable by user '$(id -un)'. Re-run with sudo."
  fi
  # Loaded before anything is fetched, so a directory with no installation in it
  # is refused before a stack file lands there.
  load_env_file ".env"
  if secrets_will_change; then
    die "${INSTALL_DIR}/.env holds no usable secrets, so nothing is installed here.
    Run './install.sh install' first."
  fi

  # Resolves the engine and, for podman, DOCKER_HOST. Installs nothing when an
  # engine is already present.
  ensure_docker
  ensure_docker_running
  ensure_compose

  if [ -d ".git" ] && command -v git >/dev/null 2>&1; then
    if [ -n "${SUDO_USER:-}" ]; then
      # git pull runs repository hooks: as root, that is arbitrary code
      # execution, and it leaves root-owned objects behind.
      warn "Skipping 'git pull': running under sudo would execute this repository's hooks as root.
    Pull it yourself first if you want the newest files:  git -C $INSTALL_DIR pull --ff-only"
    else
      info "Updating the git checkout..."
      git pull --ff-only || warn "git pull failed or diverged. Continuing with local files."
    fi
  fi

  step "Configuration"
  resolve_compose_files
  # 'update' re-pulls whatever tag .env holds; only a floating tag moves.
  local pinned="${ENV_CURRENT[MRE_VERSION]:-}"
  if [ -n "$pinned" ] && [ "$pinned" != "latest" ]; then
    info "MRE_VERSION=$pinned in .env: images stay pinned to that tag. Edit .env to change it."
  fi
  detect_address
  resolve_ports persisted

  # Runs before anything is written or pulled: 'update' always backs up first,
  # not only when it detects a change to make.
  step "Refresh"
  backup_before_change
  probe_stack_files
  apply_stack_files
  pull_images

  step "Starting up"
  info "Recreating containers..."
  compose up -d || die "'${COMPOSE_CMD[*]} up -d' failed during update."

  restore_ownership
  wait_until_responding

  print_banner
  print_donation
}

# --- Entrypoint -----------------------------------------------------------

main() {
  parse_args "$@"
  print_disclaimer
  # Twice: before creating anything, and again once symlinks and relative
  # segments are resolved, so '--dir /opt/../etc' cannot slip through.
  validate_install_dir "$INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"
  INSTALL_DIR="$(cd "$INSTALL_DIR" && pwd)"
  validate_install_dir "$INSTALL_DIR"
  case "$SUBCOMMAND" in
    install) cmd_install ;;
    update)  cmd_update ;;
    *)       die "Unknown subcommand: $SUBCOMMAND" ;;
  esac
}

main "$@"
