#!/usr/bin/env bash
set -euo pipefail

PREVIEW_URL="${PREVIEW_URL:?PREVIEW_URL is required}"
ROOT_HTML="$(mktemp)"
LOGIN_BODY="$(mktemp)"
GET_BODY="$(mktemp)"
trap 'rm -f "$ROOT_HTML" "$LOGIN_BODY" "$GET_BODY"' EXIT

printf 'Runtime smoke target: %s\n' "$PREVIEW_URL"

root_status="000"
for attempt in $(seq 1 36); do
  root_status="$(curl --connect-timeout 10 --max-time 20 -sS -L -o "$ROOT_HTML" -w '%{http_code}' "$PREVIEW_URL/" || true)"
  if [[ "$root_status" == "200" ]]; then
    break
  fi
  printf 'Preview not ready yet (attempt %s, HTTP %s)\n' "$attempt" "$root_status"
  sleep 5
done

if [[ "$root_status" != "200" ]]; then
  echo "FAIL: preview root never returned HTTP 200 (last status: $root_status)."
  exit 1
fi

grep -q 'id="root"' "$ROOT_HTML" || {
  echo 'FAIL: preview HTML did not contain the React root element.'
  exit 1
}
echo 'PASS: preview root returned HTTP 200 with React root.'

asset_path="$(grep -oE 'src="/assets/[^\"]+\.js"' "$ROOT_HTML" | head -n 1 | cut -d'"' -f2 || true)"
if [[ -n "$asset_path" ]]; then
  curl --connect-timeout 10 --max-time 30 -fsS -o /dev/null "$PREVIEW_URL$asset_path"
  echo 'PASS: primary JavaScript asset is reachable.'
else
  echo 'WARN: no Vite JavaScript asset path was found in root HTML.'
fi

get_status="$(curl --connect-timeout 10 --max-time 20 -sS -o "$GET_BODY" -w '%{http_code}' "$PREVIEW_URL/api/auth/login" || true)"
if [[ "$get_status" != "405" ]]; then
  echo "FAIL: GET /api/auth/login expected HTTP 405, got $get_status."
  cat "$GET_BODY" || true
  exit 1
fi
echo 'PASS: auth endpoint exists and rejects unsupported GET with HTTP 405.'

smoke_username="p0_smoke_nonexistent_${GITHUB_RUN_ID:-manual}_${GITHUB_RUN_ATTEMPT:-1}"
login_status="$(curl --connect-timeout 10 --max-time 30 -sS -o "$LOGIN_BODY" -w '%{http_code}' \
  -X POST "$PREVIEW_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"username\":\"$smoke_username\",\"password\":\"definitely-wrong-smoke-password\"}" || true)"

cat "$LOGIN_BODY" || true

case "$login_status" in
  401)
    echo 'PASS: random invalid credentials are rejected with HTTP 401.'
    ;;
  500)
    echo 'FAIL: auth endpoint returned HTTP 500. This usually means Preview Firebase Admin environment is not configured or server bootstrap failed.'
    exit 1
    ;;
  *)
    echo "FAIL: invalid login expected HTTP 401, got $login_status."
    exit 1
    ;;
esac

echo 'P0 Preview runtime smoke passed.'
