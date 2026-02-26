#!/usr/bin/env bash
set -euo pipefail

INGEST_BASE_URL="${INGEST_BASE_URL:-http://localhost:8080}"
INGEST_API_KEY="${INGEST_API_KEY:-}"

if [[ -z "$INGEST_API_KEY" ]]; then
  echo "Missing INGEST_API_KEY. Set it to your project API key."
  exit 1
fi

echo "Checking ingest gateway at $INGEST_BASE_URL"
status=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $INGEST_API_KEY" \
  "$INGEST_BASE_URL/healthz")

if [[ "$status" != "200" ]]; then
  echo "Ingest gateway is not healthy (status=$status)."
  exit 1
fi

echo "Ingest gateway reachable."
