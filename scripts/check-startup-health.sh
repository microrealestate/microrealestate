#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-${APP_HOST:-$(hostname -I | awk '{print $1}')}}"
PORT="${2:-${APP_PORT:-8080}}"
BASE_URL="http://${HOST}:${PORT}"
ATTEMPTS="${ATTEMPTS:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_endpoint() {
  local name="$1"
  local path="$2"
  local expected_csv="$3"
  local attempt=1

  while [[ "$attempt" -le "$ATTEMPTS" ]]; do
    local status
    status="$(curl -sS -L -o /tmp/mre-health-body.out -w "%{http_code}" --max-time 8 "${BASE_URL}${path}" || true)"

    IFS=',' read -r -a expected <<< "$expected_csv"
    for code in "${expected[@]}"; do
      if [[ "$status" == "$code" ]]; then
        printf "${GREEN}PASS${NC} %-14s %s -> HTTP %s\n" "$name" "${BASE_URL}${path}" "$status"
        return 0
      fi
    done

    printf "${YELLOW}WAIT${NC} %-14s %s -> HTTP %s (attempt %s/%s)\n" "$name" "${BASE_URL}${path}" "${status:-000}" "$attempt" "$ATTEMPTS"
    sleep "$SLEEP_SECONDS"
    attempt=$((attempt + 1))
  done

  echo ""
  printf "${RED}FAIL${NC} %-14s %s did not reach expected codes [%s]\n" "$name" "${BASE_URL}${path}" "$expected_csv"
  if [[ -s /tmp/mre-health-body.out ]]; then
    echo "Response excerpt:"
    head -c 280 /tmp/mre-health-body.out
    echo ""
  fi
  return 1
}

echo "Checking MicroRealEstate endpoints at ${BASE_URL}"
echo "Retries: ${ATTEMPTS}, interval: ${SLEEP_SECONDS}s"
echo ""

check_endpoint "gateway" "/health" "200"
check_endpoint "landlord" "/landlord" "200,301,302"
check_endpoint "tenant" "/tenant" "200,301,302"

echo ""
printf "${GREEN}All startup checks passed.${NC}\n"
