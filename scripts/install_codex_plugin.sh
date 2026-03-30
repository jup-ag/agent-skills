#!/usr/bin/env bash

set -euo pipefail

PLUGIN_NAME="integrate-jupiter"
PLUGIN_CATEGORY="Developer Tools"
MARKETPLACE_NAME="local-plugins"
MARKETPLACE_DISPLAY_NAME="Local Plugins"

FORCE=0
INSTALL_DIR="${HOME}/plugins"
MARKETPLACE_PATH="${HOME}/.agents/plugins/marketplace.json"

usage() {
  cat <<'EOF'
Install the Jupiter Codex plugin into ~/plugins and register it in
~/.agents/plugins/marketplace.json.

Usage:
  bash scripts/install_codex_plugin.sh [--force] [--install-dir PATH] [--marketplace-path PATH]

Options:
  --force                  Replace an existing installed integrate-jupiter directory.
  --install-dir PATH       Parent directory where the plugin should be installed.
                           Default: ~/plugins
  --marketplace-path PATH  Path to the Codex marketplace file.
                           Default: ~/.agents/plugins/marketplace.json
  -h, --help               Show this help message.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    --install-dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    --marketplace-path)
      MARKETPLACE_PATH="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to update the Codex marketplace file." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE_DIR="${REPO_ROOT}/.plugins/${PLUGIN_NAME}/codex"
MANIFEST_PATH="${SOURCE_DIR}/.codex-plugin/plugin.json"

if [[ ! -f "${MANIFEST_PATH}" ]]; then
  echo "Codex plugin manifest not found: ${MANIFEST_PATH}" >&2
  exit 1
fi

INSTALL_DIR="${INSTALL_DIR/#\~/${HOME}}"
MARKETPLACE_PATH="${MARKETPLACE_PATH/#\~/${HOME}}"

TARGET_DIR="${INSTALL_DIR}/${PLUGIN_NAME}"

if [[ -e "${TARGET_DIR}" ]]; then
  if [[ "${FORCE}" -ne 1 ]]; then
    echo "Plugin already exists at ${TARGET_DIR}. Re-run with --force to replace it." >&2
    exit 1
  fi
  rm -rf "${TARGET_DIR}"
  PLUGIN_ACTION="updated"
else
  PLUGIN_ACTION="installed"
fi

mkdir -p "${TARGET_DIR}"
cp -R "${SOURCE_DIR}/." "${TARGET_DIR}"
rm -rf "${TARGET_DIR}/skills/jupiter-lend"

MARKETPLACE_DIR="$(dirname "${MARKETPLACE_PATH}")"
mkdir -p "${MARKETPLACE_DIR}"

if [[ -f "${MARKETPLACE_PATH}" ]]; then
  jq empty "${MARKETPLACE_PATH}" >/dev/null
  if jq -e --arg plugin_name "${PLUGIN_NAME}" '
    if type != "object" then
      error("Marketplace file must contain a JSON object")
    elif (.interface != null and (.interface | type) != "object") then
      error("Marketplace interface must be an object")
    elif (.plugins != null and (.plugins | type) != "array") then
      error("Marketplace plugins field must be an array")
    else
      (.plugins // []) | any(.[]?; (type == "object") and .name == $plugin_name)
    end
  ' "${MARKETPLACE_PATH}" >/dev/null; then
    MARKETPLACE_ACTION="updated"
  else
    MARKETPLACE_ACTION="added"
  fi
else
  MARKETPLACE_ACTION="added"
fi

ENTRY_JSON="$(jq -n \
  --arg plugin_name "${PLUGIN_NAME}" \
  --arg plugin_category "${PLUGIN_CATEGORY}" \
  '{
    name: $plugin_name,
    source: {
      source: "local",
      path: ("./plugins/" + $plugin_name)
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL"
    },
    category: $plugin_category
  }'
)"

TMP_FILE="$(mktemp)"
jq \
  --arg marketplace_name "${MARKETPLACE_NAME}" \
  --arg marketplace_display_name "${MARKETPLACE_DISPLAY_NAME}" \
  --arg plugin_name "${PLUGIN_NAME}" \
  --argjson entry "${ENTRY_JSON}" \
  '
  if . == null then
    {
      name: $marketplace_name,
      interface: { displayName: $marketplace_display_name },
      plugins: []
    }
  else
    .
  end
  | if type != "object" then
      error("Marketplace file must contain a JSON object")
    elif (.interface != null and (.interface | type) != "object") then
      error("Marketplace interface must be an object")
    elif (.plugins != null and (.plugins | type) != "array") then
      error("Marketplace plugins field must be an array")
    else
      .
    end
  | .name = (if (.name | type) == "string" then .name else $marketplace_name end)
  | .interface = (if .interface == null then {} else .interface end)
  | .interface.displayName = (
      if (.interface.displayName | type) == "string" then
        .interface.displayName
      else
        $marketplace_display_name
      end
    )
  | .plugins = (if .plugins == null then [] else .plugins end)
  | .plugins |= (
      map(if (type == "object" and .name == $plugin_name) then $entry else . end)
      as $plugins
      | if any($plugins[]?; (type == "object") and .name == $plugin_name) then
          $plugins
        else
          $plugins + [$entry]
        end
    )
  ' \
  <(if [[ -f "${MARKETPLACE_PATH}" ]]; then cat "${MARKETPLACE_PATH}"; else printf 'null'; fi) \
  > "${TMP_FILE}"

mv "${TMP_FILE}" "${MARKETPLACE_PATH}"

echo "Plugin ${PLUGIN_ACTION} at ${TARGET_DIR}"
echo "Marketplace entry ${MARKETPLACE_ACTION} in ${MARKETPLACE_PATH}"
echo "Restart Codex, open /plugins, and install \`${PLUGIN_NAME}\` from your local marketplace."
