# Agent Skills

Skills for AI coding agents to integrate with the Jupiter ecosystem.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Plugins

This repo intentionally packages agent-specific plugins under `.plugins/<plugin-name>/<agent>`.
For Codex, the marketplace entry points to `./.plugins/integrate-jupiter/codex` rather than the simpler `./plugins/<plugin-name>` layout so the same repository can ship both Codex and Claude variants side by side.

### Claude Code

```
/plugin marketplace add jup-ag/agent-skills
/plugin install integrate-jupiter@jup-ag-skills
```

### Codex

Install on your machine from GitHub:

1. Clone the repository: `git clone https://github.com/jup-ag/agent-skills.git`
2. Run `bash scripts/install_codex_plugin.sh` from the cloned repo root.
3. Restart Codex.
4. Open `/plugins`.
5. Install `integrate-jupiter` from your local marketplace.

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
