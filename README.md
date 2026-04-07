# Agent Skills

Skills for AI coding agents to integrate with the Jupiter ecosystem.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Plugins

This repo intentionally packages agent-specific plugins under `.plugins/<plugin-name>/<agent>`.
Use `bash scripts/install_plugin.sh` as the single installer entrypoint for packaged plugins in this repo.
Run it from a cloned repo to install for Codex, Claude Code, or both. The installer is interactive by default and lets the user choose the provider during setup.
For Codex, the marketplace entry points to `./.plugins/integrate-jupiter/codex` rather than the simpler `./plugins/<plugin-name>` layout so the same repository can ship both Codex and Claude variants side by side.

### Install from GitHub

Install on your machine from GitHub:

1. Clone the repository: `git clone https://github.com/jup-ag/agent-skills.git`
2. Run `bash scripts/install_plugin.sh` from the cloned repo root.
3. Choose `Codex`, `Claude Code`, or `Both`.
4. Follow the provider-specific next steps printed by the installer.

### Manual provider installs

Claude Code:

```bash
claude plugin marketplace add /path/to/agent-skills
claude plugin install integrate-jupiter@jup-ag-skills
```

Codex:

```bash
bash scripts/install_plugin.sh --provider codex
```

Repo-local install:

1. Open this repository root in Codex.
2. Restart Codex if the workspace was already open so it reloads `.agents/plugins/marketplace.json`.
3. Open `/plugins`.
4. Install `integrate-jupiter` from the `Jupiter` marketplace.

The Codex marketplace entry intentionally resolves to `./.plugins/integrate-jupiter/codex`.

## Available Skills

### integrating-jupiter

Helps agents integrate with the whole Jupiter Suite of APIs.

#### Installation

```bash
npx skills add jup-ag/agent-skills --skill "integrating-jupiter"
```

### jupiter-lend

Helps agents integrate with Jupiter Lend protocol (powered by Fluid Protocol) — lending, borrowing, vaults, and jlTokens on Solana.

#### Installation

```bash
npx skills add jup-ag/agent-skills --skill "jupiter-lend"
```

### jupiter-vrfd

Helps agents guide users through the Jupiter Token Verification express flow — submit verification requests, pay with JUP tokens, and check verification status.

#### Installation

```bash
npx skills add jup-ag/agent-skills --skill "jupiter-vrfd"
```

### jupiter-swap-migration

Helps agents migrate existing Jupiter integrations from Metis (v1) or Ultra to Swap API v2.

#### Installation

```bash
npx skills add jup-ag/agent-skills --skill "jupiter-swap-migration"
```

## Quick Install

### Installation

```bash
npx skills add jup-ag/agent-skills
```

## License

MIT
