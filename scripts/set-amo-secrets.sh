#!/usr/bin/env bash
# Stores the addons.mozilla.org API credentials as GitHub Actions secrets
# (AMO_JWT_ISSUER / AMO_JWT_SECRET), used by .github/workflows/release.yml.
# Key: https://addons.mozilla.org/developers/addon/api/key/
set -euo pipefail

REPO="${1:-brokoskokoli/chat-exporter-for-claude}"

command -v gh >/dev/null || { echo "gh (GitHub CLI) is not installed." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Not logged in: run 'gh auth login' first." >&2; exit 1; }

read -r  -p "JWT issuer (e.g. user:12345:67): " issuer
read -rs -p "JWT secret (input hidden): " secret
echo

issuer="$(printf '%s' "$issuer" | tr -d '[:space:]')"
secret="$(printf '%s' "$secret" | tr -d '[:space:]')"
[[ -n "$issuer" && -n "$secret" ]] || { echo "Both values are required." >&2; exit 1; }

# Read the values from stdin so they never show up in the process list.
printf '%s' "$issuer" | gh secret set AMO_JWT_ISSUER --repo "$REPO"
printf '%s' "$secret" | gh secret set AMO_JWT_SECRET --repo "$REPO"

echo
echo "Secrets in $REPO:"
gh secret list --repo "$REPO"
