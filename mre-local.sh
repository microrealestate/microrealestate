#!/usr/bin/env bash
# MicroRealEstate — arranque nativo (sin Docker) para el proyecto de Just.
# Levanta mongod + los 7 servicios backend + 2 frontends Next.js.
# Puerto público: 8001 (gateway).

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT/.env"
RUN_DIR="$ROOT/.run"
LOG_DIR="$ROOT/logs"
NODE_BIN_DIR="/home/tuf-arch/.hermes/tools/node-26.7.0-linux-x64/bin"
MONGOD="$HOME/.local/opt/mongodb/mongodb-linux-x86_64-ubuntu2204-7.0.21/bin/mongod"
MONGO_DATA="$HOME/.local/share/mongodb/data"
REDIS_SERVER="$HOME/.local/opt/redis/bin/redis-server"
REDIS_CONF="$HOME/.config/mre/redis.conf"

export PATH="$NODE_BIN_DIR:$PATH"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: falta $ENV_FILE" >&2
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

mkdir -p "$RUN_DIR" "$LOG_DIR" "$MONGO_DATA"

pidfile() { echo "$RUN_DIR/$1.pid"; }
logfile() { echo "$LOG_DIR/$1.log"; }

is_up() {
  local pf; pf="$(pidfile "$1")"
  [[ -f "$pf" ]] && kill -0 "$(cat "$pf")" 2>/dev/null
}

port_open() {
  timeout 1 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/$1" 2>/dev/null
}

wait_port() {
  local port="$1" name="$2" tries="${3:-90}"
  for ((i = 0; i < tries; i++)); do
    if port_open "$port"; then
      echo "  OK  $name (:$port)"
      return 0
    fi
    sleep 1
  done
  echo "  FAIL $name (:$port) no respondió en ${tries}s — ver $(logfile "$name")" >&2
  return 1
}

start_svc() {
  local name="$1" dir="$2" port="$3"; shift 3
  # Detectar por puerto, no por pidfile: el proceso real es el hijo node,
  # y el $! guardado es sólo el wrapper de yarn.
  if port_open "$port"; then
    echo "  =   $name ya corre (:$port)"
    return 0
  fi
  ( cd "$dir" && env "$@" nohup yarn start >"$(logfile "$name")" 2>&1 & )
  wait_port "$port" "$name" || return 1
}

# ---------------------------------------------------------------- mongod
start_mongo() {
  if port_open 27017; then
    echo "  =   mongod ya corre (:27017)"
    return 0
  fi
  "$MONGOD" --dbpath "$MONGO_DATA" \
    --logpath "$HOME/.local/share/mongodb/log/mongod.log" \
    --bind_ip 127.0.0.1 --port 27017 --fork >/dev/null 2>&1
  wait_port 27017 mongod 60
}

start_redis() {
  if port_open 6379; then
    echo "  =   redis ya corre (:6379)"
    return 0
  fi
  LC_ALL=C LANG=C "$REDIS_SERVER" "$REDIS_CONF" --daemonize yes >/dev/null 2>&1
  wait_port 6379 redis 30
}

kill_port() {
  local port="$1"
  local pids
  pids="$(ss -tlnp 2>/dev/null \
    | grep -oE "pid=[0-9]+.*:${port}\b|:${port} .*pid=[0-9]+" \
    | grep -oE '[0-9]+' | sort -u)"
  local pid
  for pid in $pids; do
    [[ "$pid" == "$$" ]] && continue
    kill "$pid" 2>/dev/null && echo "  - puerto $port (pid $pid)"
  done
}

stop_all() {
  echo "Deteniendo MicroRealEstate..."
  # Matar por puerto: el $! del subshell es el wrapper de yarn, no el node
  # que escucha. Matar sólo el pidfile dejaba huérfano ocupando el puerto.
  local pair name port
  for pair in \
    "gateway:$PORT_GATEWAY" "landlord:$PORT_LANDLORD_FRONTEND" \
    "tenant:$PORT_TENANT_FRONTEND" "authenticator:$PORT_AUTHENTICATOR" \
    "api:$PORT_API" "tenantapi:$PORT_TENANTAPI" \
    "pdfgenerator:$PORT_PDFGENERATOR" "emailer:$PORT_EMAILER" \
    "resetservice:$PORT_RESETSERVICE"
  do
    name="${pair%%:*}"
    port="${pair##*:}"
    if port_open "$port"; then
      kill_port "$port"
      for _ in 1 2 3 4 5 6 7 8 9 10; do
        port_open "$port" || break
        sleep 0.5
      done
      port_open "$port" && kill_port "$port"
    fi
    rm -f "$(pidfile "$name")"
  done
}

status_all() {
  printf '%-16s %-8s %-6s %s\n' SERVICIO PUERTO ESTADO PID
  local pair name port
  for pair in \
    "gateway:$PORT_GATEWAY" "landlord:$PORT_LANDLORD_FRONTEND" \
    "tenant:$PORT_TENANT_FRONTEND" "authenticator:$PORT_AUTHENTICATOR" \
    "api:$PORT_API" "tenantapi:$PORT_TENANTAPI" \
    "pdfgenerator:$PORT_PDFGENERATOR" "emailer:$PORT_EMAILER" \
    "resetservice:$PORT_RESETSERVICE"
  do
    name="${pair%%:*}"
    port="${pair##*:}"
    local pid
    pid="$(ss -tlnp 2>/dev/null | grep ":$port " \
      | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)"
    if port_open "$port"; then
      printf '%-16s %-8s %-6s %s\n' "$name" "$port" CORRIENDO "${pid:-?}"
    else
      printf '%-16s %-8s %-6s %s\n' "$name" "$port" MUERTO "-"
    fi
  done
  port_open 27017 && printf '%-16s %-8s %-6s %s\n' mongod 27017 CORRIENDO "-" \
    || printf '%-16s %-8s %-6s %s\n' mongod 27017 MUERTO "-"
  port_open 6379 && printf '%-16s %-8s %-6s %s\n' redis 6379 CORRIENDO "-" \
    || printf '%-16s %-8s %-6s %s\n' redis 6379 MUERTO "-"
}

case "${1:-up}" in
  up)
    echo "==> Base de datos"
    start_mongo || exit 1
    start_redis || exit 1

    echo "==> Servicios backend (orden de dependencias)"
    # emailer primero: api y authenticator lo necesitan para enviar correos.
    start_svc emailer "$ROOT/services/emailer" "$PORT_EMAILER" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_EMAILER" \
      MONGO_URL="$MONGO_URL" \
      ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
      REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
      RESET_TOKEN_SECRET="$RESET_TOKEN_SECRET" \
      CIPHER_KEY="$CIPHER_KEY" CIPHER_IV_KEY="$CIPHER_IV_KEY" \
      EMAILER_URL="http://127.0.0.1:$PORT_EMAILER/emailer" || exit 1

    start_svc pdfgenerator "$ROOT/services/pdfgenerator" "$PORT_PDFGENERATOR" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_PDFGENERATOR" \
      MONGO_URL="$MONGO_URL" CHROMIUM_BIN="$CHROMIUM_BIN" \
      ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
      CIPHER_KEY="$CIPHER_KEY" CIPHER_IV_KEY="$CIPHER_IV_KEY" || exit 1

    start_svc authenticator "$ROOT/services/authenticator" "$PORT_AUTHENTICATOR" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_AUTHENTICATOR" \
      MONGO_URL="$MONGO_URL" TRUST_PROXY="$TRUST_PROXY" \
      ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
      REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
      RESET_TOKEN_SECRET="$RESET_TOKEN_SECRET" \
      CIPHER_KEY="$CIPHER_KEY" CIPHER_IV_KEY="$CIPHER_IV_KEY" \
      EMAILER_URL="http://127.0.0.1:$PORT_EMAILER/emailer" || exit 1

    start_svc api "$ROOT/services/api" "$PORT_API" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_API" \
      MONGO_URL="$MONGO_URL" TRUST_PROXY="$TRUST_PROXY" \
      EMAILER_URL="http://127.0.0.1:$PORT_EMAILER/emailer" \
      PDFGENERATOR_URL="http://127.0.0.1:$PORT_PDFGENERATOR/pdfgenerator" \
      ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
      CIPHER_KEY="$CIPHER_KEY" CIPHER_IV_KEY="$CIPHER_IV_KEY" || exit 1

    start_svc tenantapi "$ROOT/services/tenantapi" "$PORT_TENANTAPI" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_TENANTAPI" \
      MONGO_URL="$MONGO_URL" TRUST_PROXY="$TRUST_PROXY" \
      ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
      CIPHER_KEY="$CIPHER_KEY" CIPHER_IV_KEY="$CIPHER_IV_KEY" || exit 1

    # resetservice sólo corre en dev/CI, pero el /health del gateway lo exige
    # cuando PRODUCTION=false. Sin él /health devuelve 500.
    start_svc resetservice "$ROOT/services/resetservice" "$PORT_RESETSERVICE" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_RESETSERVICE" \
      MONGO_URL="$MONGO_URL" TRUST_PROXY="$TRUST_PROXY" \
      REDIS_URL="$REDIS_URL" REDIS_PASSWORD="$REDIS_PASSWORD" || exit 1

    echo "==> Frontends (Next.js, primer arranque compila ~1-3 min)"
    start_svc landlord "$ROOT/webapps/landlord" "$PORT_LANDLORD_FRONTEND" \
      NODE_ENV=production PORT="$PORT_LANDLORD_FRONTEND" \
      HOSTNAME=127.0.0.1 TRUST_PROXY="$TRUST_PROXY" \
      GATEWAY_URL="http://127.0.0.1:$PORT_GATEWAY" || exit 1

    start_svc tenant "$ROOT/webapps/tenant" "$PORT_TENANT_FRONTEND" \
      NODE_ENV=production PORT="$PORT_TENANT_FRONTEND" \
      HOSTNAME=127.0.0.1 TRUST_PROXY="$TRUST_PROXY" \
      GATEWAY_URL="http://127.0.0.1:$PORT_GATEWAY" || exit 1

    echo "==> Gateway (proxy público)"
    start_svc gateway "$ROOT/services/gateway" "$PORT_GATEWAY" \
      NODE_ENV=development LOGGER_LEVEL=info PORT="$PORT_GATEWAY" \
      TRUST_PROXY="$TRUST_PROXY" \
      AUTHENTICATOR_URL="http://127.0.0.1:$PORT_AUTHENTICATOR" \
      API_URL="http://127.0.0.1:$PORT_API/api/v2" \
      TENANTAPI_URL="http://127.0.0.1:$PORT_TENANTAPI/tenantapi" \
      PDFGENERATOR_URL="http://127.0.0.1:$PORT_PDFGENERATOR" \
      EMAILER_URL="http://127.0.0.1:$PORT_EMAILER" \
      RESETSERVICE_URL="http://127.0.0.1:$PORT_RESETSERVICE" \
      LANDLORD_FRONTEND_URL="http://127.0.0.1:$PORT_LANDLORD_FRONTEND" \
      TENANT_FRONTEND_URL="http://127.0.0.1:$PORT_TENANT_FRONTEND" || exit 1

    echo
    echo "=========================================================="
    echo " MicroRealEstate corriendo"
    echo "   Administrador (papá):  http://localhost:$PORT_GATEWAY/landlord"
    echo "   Portal inquilinos:      http://localhost:$PORT_GATEWAY/tenant"
    echo "   Health check:           http://localhost:$PORT_GATEWAY/health"
    echo "=========================================================="
    ;;
  down) stop_all ;;
  restart) stop_all; sleep 2; exec "$0" up ;;
  status) status_all ;;
  logs) tail -n 100 "$LOG_DIR"/*.log ;;
  *) echo "uso: $0 {up|down|restart|status|logs}" >&2; exit 1 ;;
esac