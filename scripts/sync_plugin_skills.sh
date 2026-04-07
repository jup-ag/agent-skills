#!/usr/bin/env bash

set -euo pipefail

PLUGIN_NAME="integrate-jupiter"
PACKAGED_SKILLS=(
  "integrating-jupiter"
  "jupiter-lend"
  "jupiter-swap-migration"
)

usage() {
  cat <<'EOF'
Sync the packaged Jupiter plugin skills for Codex, Claude Code, or both.

Usage:
  bash scripts/sync_plugin_skills.sh
  bash scripts/sync_plugin_skills.sh --provider codex
  bash scripts/sync_plugin_skills.sh --provider claude
  bash scripts/sync_plugin_skills.sh --provider both
  bash scripts/sync_plugin_skills.sh --dry-run

Options:
  --provider TARGET  One of: codex, claude, both. Default: both.
  --dry-run          Print planned actions without changing files.
  -h, --help         Show this help message.
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

contains_skill() {
  local wanted="$1"
  local skill=""

  for skill in "${PACKAGED_SKILLS[@]}"; do
    if [[ "${skill}" == "${wanted}" ]]; then
      return 0
    fi
  done

  return 1
}

run_step() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '[dry-run] %s\n' "$*"
    return 0
  fi

  "$@"
}

sync_provider() {
  local provider="$1"
  local plugin_root="${REPO_ROOT}/.plugins/${PLUGIN_NAME}/${provider}"
  local target_skills_dir="${plugin_root}/skills"
  local existing_path=""
  local existing_name=""
  local skill_name=""
  local source_dir=""
  local target_dir=""

  if [[ ! -d "${plugin_root}" ]]; then
    echo "Plugin provider directory not found: ${plugin_root}" >&2
    exit 1
  fi

  run_step mkdir -p "${target_skills_dir}"

  for existing_path in "${target_skills_dir}"/*; do
    if [[ ! -e "${existing_path}" ]]; then
      continue
    fi

    existing_name="$(basename "${existing_path}")"
    if ! contains_skill "${existing_name}"; then
      run_step rm -rf "${existing_path}"
      if [[ "${DRY_RUN}" -eq 1 ]]; then
        echo "Would remove stale ${provider} packaged skill: ${existing_name}"
      else
        echo "Removed stale ${provider} packaged skill: ${existing_name}"
      fi
    fi
  done

  for skill_name in "${PACKAGED_SKILLS[@]}"; do
    source_dir="${REPO_ROOT}/skills/${skill_name}"
    target_dir="${target_skills_dir}/${skill_name}"

    if [[ ! -d "${source_dir}" ]]; then
      echo "Source skill directory not found: ${source_dir}" >&2
      exit 1
    fi

    if [[ -e "${target_dir}" ]]; then
      run_step rm -rf "${target_dir}"
    fi

    run_step cp -R "${source_dir}" "${target_dir}"
    if [[ "${DRY_RUN}" -eq 1 ]]; then
      echo "Would sync ${provider} packaged skill: ${skill_name}"
    else
      echo "Synced ${provider} packaged skill: ${skill_name}"
    fi
  done
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DRY_RUN=0
PROVIDER="both"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --provider)
      if [[ $# -lt 2 || -z "${2}" || "${2}" == -* ]]; then
        echo "Missing value for --provider." >&2
        usage >&2
        exit 1
      fi
      if ! PROVIDER="$(normalize_provider "$2")"; then
        echo "Invalid provider: $2" >&2
        usage >&2
        exit 1
      fi
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "${REPO_ROOT}/skills" ]]; then
  echo "Skills directory not found: ${REPO_ROOT}/skills" >&2
  exit 1
fi

case "${PROVIDER}" in
  codex)
    sync_provider "codex"
    ;;
  claude)
    sync_provider "claude"
    ;;
  both)
    sync_provider "codex"
    sync_provider "claude"
    ;;
esac
