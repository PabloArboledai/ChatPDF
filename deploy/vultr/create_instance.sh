#!/usr/bin/env bash
set -euo pipefail

# Creates a Vultr VPS instance via API.
# SECURITY: Use an API token via env var. Do NOT hardcode tokens.
#
# Required env vars:
#   VULTR_API_KEY      - Vultr API token
#   VULTR_REGION       - e.g. "ewr" (New Jersey) / "ams" / etc.
#   VULTR_PLAN         - e.g. "vc2-1c-1gb" (varies)
#   VULTR_OS_ID        - e.g. 1743 for Ubuntu 24.04 x64 (check Vultr API)
#   VULTR_LABEL        - e.g. "chatpdf-prod"
# Optional env vars:
#   VULTR_SSH_KEY_ID   - existing SSH key ID in Vultr (recommended)
#
# Usage:
#   VULTR_API_KEY=... VULTR_REGION=... VULTR_PLAN=... VULTR_OS_ID=... VULTR_LABEL=... bash deploy/vultr/create_instance.sh

: "${VULTR_API_KEY:?Missing VULTR_API_KEY}"
: "${VULTR_REGION:?Missing VULTR_REGION}"
: "${VULTR_PLAN:?Missing VULTR_PLAN}"
: "${VULTR_OS_ID:?Missing VULTR_OS_ID}"
: "${VULTR_LABEL:?Missing VULTR_LABEL}"

api="https://api.vultr.com/v2"

payload=$(python - <<'PY'
import json, os
p = {
  "region": os.environ["VULTR_REGION"],
  "plan": os.environ["VULTR_PLAN"],
  "os_id": int(os.environ["VULTR_OS_ID"]),
  "label": os.environ["VULTR_LABEL"],
  "hostname": os.environ.get("VULTR_HOSTNAME", os.environ["VULTR_LABEL"]),
}
ssh = os.environ.get("VULTR_SSH_KEY_ID")
if ssh:
  p["sshkey_id"] = [ssh]
print(json.dumps(p))
PY
)

resp=$(curl -fsS -X POST "$api/instances" \
  -H "Authorization: Bearer $VULTR_API_KEY" \
  -H "Content-Type: application/json" \
  --data "$payload")

instance_id=$(python - <<PY
import json,sys
print(json.loads('''$resp''')["instance"]["id"])
PY
)

echo "Created instance: $instance_id"
echo "Fetch details (including IP) with:"
echo "  curl -H 'Authorization: Bearer $VULTR_API_KEY' $api/instances/$instance_id"