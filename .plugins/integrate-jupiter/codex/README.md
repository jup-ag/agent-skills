# Jupiter Plugin for Codex

Jupiter integration skills for Solana — swap, perps, trigger, and more.

## Installation

This repository intentionally keeps the Codex plugin package at `./.plugins/integrate-jupiter/codex`.
That path is what `.agents/plugins/marketplace.json` registers for Codex, so the plugin can live alongside the Claude package in the same repo.

Repo-local install:

1. Open this repository root in Codex.
2. Restart Codex if the workspace was already open so Codex reloads the local marketplace definition.
3. Open `/plugins`.
4. Install `integrate-jupiter` from the `Jupiter` marketplace.

Home-local install:

1. Copy this folder to `~/plugins/integrate-jupiter`.
2. Add a home-local marketplace entry in `~/.agents/plugins/marketplace.json` that points to `./plugins/integrate-jupiter`.
3. Restart Codex.
4. Install `integrate-jupiter` from `/plugins`.

## Included Skills

- **integrating-jupiter** — Comprehensive guide for all Jupiter APIs (Swap, Lend, Perps, Trigger, Recurring, Tokens, Price, Portfolio, etc.)
- **jupiter-swap-migration** — Migration guide from Metis (v1) or Ultra to Swap API v2

## MCP Server

This plugin configures the [Jupiter MCP server](https://dev.jup.ag/ai/mcp) — a read-only documentation server that exposes all Jupiter documentation and OpenAPI specs through the MCP protocol.

## Links

- [jup.ag](https://jup.ag) — Jupiter
- [Agent Skills](https://github.com/jup-ag/agent-skills) — Source repository

## License

MIT
