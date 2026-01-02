#!/usr/bin/env bash
set -euo pipefail

# Sets Cloudflare DNS records for civer.online (or any zone) via API Token.
# SECURITY: Use a scoped API Token (Zone.DNS:Edit for the zone), NOT the Global API Key.
#
# Required env vars:
#   CF_API_TOKEN        - Cloudflare API Token
#   CF_ZONE_ID          - Zone ID for the domain
#   CF_RECORD_NAME      - Record name, e.g. "civer.online" (or "@" depending on your preference)
#   CF_RECORD_CONTENT   - VPS public IPv4 address
# Optional:
#   CF_TTL              - default 120
#   CF_PROXIED          - default false (recommended for first TLS issuance)
#
# Usage:
#   CF_API_TOKEN=... CF_ZONE_ID=... CF_RECORD_NAME=civer.online CF_RECORD_CONTENT=1.2.3.4 bash deploy/cloudflare/set_dns.sh

: "${CF_API_TOKEN:?Missing CF_API_TOKEN}"
: "${CF_ZONE_ID:?Missing CF_ZONE_ID}"
: "${CF_RECORD_NAME:?Missing CF_RECORD_NAME}"
: "${CF_RECORD_CONTENT:?Missing CF_RECORD_CONTENT}"

CF_TTL="${CF_TTL:-120}"
CF_PROXIED="${CF_PROXIED:-false}"

api="https://api.cloudflare.com/client/v4"

# Find existing record
existing_id=$(curl -fsS "$api/zones/$CF_ZONE_ID/dns_records?type=A&name=$CF_RECORD_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  | python -c 'import json,sys; d=json.load(sys.stdin); r=(d.get("result") or []); print(r[0]["id"] if r else "")')

payload=$(python -c 'import json,os; print(json.dumps({
  "type":"A",
  "name":os.environ["CF_RECORD_NAME"],
  "content":os.environ["CF_RECORD_CONTENT"],
  "ttl":int(os.environ.get("CF_TTL","120")),
  "proxied":(os.environ.get("CF_PROXIED","false").lower()=="true"),
}))')

if [[ -n "$existing_id" ]]; then
  echo "Updating existing A record: $CF_RECORD_NAME -> $CF_RECORD_CONTENT"
  curl -fsS -X PUT "$api/zones/$CF_ZONE_ID/dns_records/$existing_id" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$payload" \
    | python -c 'import json,sys; d=json.load(sys.stdin); print("ok" if d.get("success") else d)'
else
  echo "Creating A record: $CF_RECORD_NAME -> $CF_RECORD_CONTENT"
  curl -fsS -X POST "$api/zones/$CF_ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$payload" \
    | python -c 'import json,sys; d=json.load(sys.stdin); print("ok" if d.get("success") else d)'
fi

echo "Done. Note: keep CF_PROXIED=false until Caddy issues TLS the first time."