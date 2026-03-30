#!/usr/bin/env bash

set -euo pipefail

PLUGIN_NAME="integrate-jupiter"
PLUGIN_CATEGORY="Developer Tools"
CODEX_MARKETPLACE_NAME="local-plugins"
CODEX_MARKETPLACE_DISPLAY_NAME="Local Plugins"
CLAUDE_MARKETPLACE_MANIFEST_REL=".claude-plugin/marketplace.json"

FORCE=0
INTERACTIVE=1
PROVIDER=""
CODEX_INSTALL_DIR="${HOME}/plugins"
CODEX_MARKETPLACE_PATH="${HOME}/.agents/plugins/marketplace.json"
CLAUDE_SCOPE="user"

usage() {
  cat <<'EOF'
Install the Jupiter plugin for Codex, Claude Code, or both.

Usage:
  bash scripts/install_plugin.sh
  bash scripts/install_plugin.sh --provider codex
  bash scripts/install_plugin.sh --provider claude
  bash scripts/install_plugin.sh --provider both

Options:
  --provider TARGET       One of: codex, claude, both.
  --force                 Replace an existing Codex install without prompting.
  --install-dir PATH      Parent directory for the Codex install.
                          Default: ~/plugins
  --marketplace-path PATH Path to the Codex marketplace file.
                          Default: ~/.agents/plugins/marketplace.json
  --claude-scope SCOPE    Claude install scope: user, project, or local.
                          Default: user
  --non-interactive       Do not prompt. Requires --provider.
  -h, --help              Show this help message.
EOF
}

normalize_provider() {
  case "${1,,}" in
    codex|claude|both)
      printf '%s\n' "${1,,}"
      ;;
    *)
      return 1
      ;;
  esac
}

confirm() {
  local prompt="$1"
  local default="${2:-N}"
  local reply=""

  while true; do
    read -r -p "${prompt} " reply
    reply="${reply:-${default}}"
    case "${reply,,}" in
      y|yes)
        return 0
        ;;
      n|no)
        return 1
        ;;
      *)
        echo "Please answer yes or no." >&2
        ;;
    esac
  done
}

prompt_provider() {
  local choice=""

  echo "Select which plugin provider to install:"
  echo "  1) Codex"
  echo "  2) Claude Code"
  echo "  3) Both"

  while true; do
    read -r -p "Enter choice [1-3]: " choice
    case "${choice}" in
      1)
        PROVIDER="codex"
        return 0
        ;;
      2)
        PROVIDER="claude"
        return 0
        ;;
      3)
        PROVIDER="both"
        return 0
        ;;
      *)
        echo "Please enter 1, 2, or 3." >&2
        ;;
    esac
  done
}

read_json_name() {
  local file_path="$1"

  if command -v jq >/dev/null 2>&1; then
    jq -r '.name // empty' "${file_path}"
  else
    sed -n 's/^[[:space:]]*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${file_path}" | head -n 1
  fi
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required for Codex installs." >&2
    exit 1
  fi
}

install_codex() {
  require_jq

  local source_dir="${REPO_ROOT}/.plugins/${PLUGIN_NAME}/codex"
  local manifest_path="${source_dir}/.codex-plugin/plugin.json"
  local install_dir="${CODEX_INSTALL_DIR/#\~/${HOME}}"
  local marketplace_path="${CODEX_MARKETPLACE_PATH/#\~/${HOME}}"
  local target_dir="${install_dir}/${PLUGIN_NAME}"
  local plugin_action="installed"
  local marketplace_action="added"
  local marketplace_dir=""
  local entry_json=""
  local tmp_file=""

  if [[ ! -f "${manifest_path}" ]]; then
    echo "Codex plugin manifest not found: ${manifest_path}" >&2
    exit 1
  fi

  if [[ -e "${target_dir}" ]]; then
    if [[ "${FORCE}" -eq 1 ]]; then
      rm -rf "${target_dir}"
      plugin_action="updated"
    elif [[ "${INTERACTIVE}" -eq 1 ]]; then
      if confirm "Codex plugin already exists at ${target_dir}. Replace it? [y/N]" "N"; then
        rm -rf "${target_dir}"
        plugin_action="updated"
      else
        echo "Skipped Codex install."
        return 0
      fi
    else
      echo "Codex plugin already exists at ${target_dir}. Re-run with --force to replace it." >&2
      exit 1
    fi
  fi

  mkdir -p "${target_dir}"
  cp -R "${source_dir}/." "${target_dir}"

  marketplace_dir="$(dirname "${marketplace_path}")"
  mkdir -p "${marketplace_dir}"

  if [[ -f "${marketplace_path}" ]]; then
    jq empty "${marketplace_path}" >/dev/null
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
    ' "${marketplace_path}" >/dev/null; then
      marketplace_action="updated"
    fi
  fi

  entry_json="$(jq -n \
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

  tmp_file="$(mktemp)"
  jq \
    --arg marketplace_name "${CODEX_MARKETPLACE_NAME}" \
    --arg marketplace_display_name "${CODEX_MARKETPLACE_DISPLAY_NAME}" \
    --arg plugin_name "${PLUGIN_NAME}" \
    --argjson entry "${entry_json}" \
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
    <(if [[ -f "${marketplace_path}" ]]; then cat "${marketplace_path}"; else printf 'null'; fi) \
    > "${tmp_file}"

  mv "${tmp_file}" "${marketplace_path}"

  echo "Codex plugin ${plugin_action} at ${target_dir}"
  echo "Codex marketplace entry ${marketplace_action} in ${marketplace_path}"
  echo "Restart Codex, open /plugins, and install \`${PLUGIN_NAME}\` from your local marketplace."
}

install_claude() {
  local manifest_path="${REPO_ROOT}/${CLAUDE_MARKETPLACE_MANIFEST_REL}"
  local marketplace_name=""
  local plugin_id=""
  local marketplace_action="added"
  local plugin_action="installed"
  local add_output=""
  local update_output=""
  local install_output=""

  if ! command -v claude >/dev/null 2>&1; then
    echo "The Claude CLI is required for Claude installs." >&2
    exit 1
  fi

  if [[ ! -f "${manifest_path}" ]]; then
    echo "Claude marketplace manifest not found: ${manifest_path}" >&2
    exit 1
  fi

  claude plugin validate "${manifest_path}" >/dev/null

  marketplace_name="$(read_json_name "${manifest_path}")"
  if [[ -z "${marketplace_name}" ]]; then
    echo "Unable to read Claude marketplace name from ${manifest_path}" >&2
    exit 1
  fi

  if add_output="$(claude plugin marketplace add "${REPO_ROOT}" 2>&1)"; then
    printf '%s\n' "${add_output}"
  else
    printf '%s\n' "${add_output}"
    if [[ "${add_output}" != *"already installed"* ]]; then
      exit 1
    fi
    marketplace_action="updated"
    update_output="$(claude plugin marketplace update "${marketplace_name}" 2>&1)" || {
      printf '%s\n' "${update_output}" >&2
      exit 1
    }
    printf '%s\n' "${update_output}"
  fi

  plugin_id="${PLUGIN_NAME}@${marketplace_name}"
  if command -v jq >/dev/null 2>&1 && [[ -f "${HOME}/.claude/plugins/installed_plugins.json" ]]; then
    if jq -e --arg plugin_id "${plugin_id}" '.plugins[$plugin_id] != null' "${HOME}/.claude/plugins/installed_plugins.json" >/dev/null; then
      plugin_action="updated"
    fi
  fi

  install_output="$(claude plugin install --scope "${CLAUDE_SCOPE}" "${plugin_id}" 2>&1)" || {
    printf '%s\n' "${install_output}" >&2
    exit 1
  }
  printf '%s\n' "${install_output}"

  echo "Claude marketplace ${marketplace_action}: ${marketplace_name}"
  echo "Claude plugin ${plugin_action}: ${plugin_id} (scope: ${CLAUDE_SCOPE})"
  echo "Restart Claude Code if it is already running."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --provider)
      PROVIDER="$(normalize_provider "$2")" || {
        echo "Unknown provider: $2" >&2
        usage >&2
        exit 1
      }
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --install-dir)
      CODEX_INSTALL_DIR="$2"
      shift 2
      ;;
    --marketplace-path)
      CODEX_MARKETPLACE_PATH="$2"
      shift 2
      ;;
    --claude-scope)
      case "$2" in
        user|project|local)
          CLAUDE_SCOPE="$2"
          ;;
        *)
          echo "Unknown Claude scope: $2" >&2
          usage >&2
          exit 1
          ;;
      esac
      shift 2
      ;;
    --non-interactive)
      INTERACTIVE=0
      shift
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -z "${PROVIDER}" ]]; then
  if [[ "${INTERACTIVE}" -eq 1 ]]; then
    prompt_provider
  else
    echo "--provider is required when --non-interactive is used." >&2
    exit 1
  fi
fi

case "${PROVIDER}" in
  codex)
    install_codex
    ;;
  claude)
    install_claude
    ;;
  both)
    install_codex
    install_claude
    ;;
esac
