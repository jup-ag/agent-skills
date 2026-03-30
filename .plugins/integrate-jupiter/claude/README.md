# Jupiter Plugin for Claude Code

Jupiter integration and documentation skills for Solana, crypto, and finance workflows.

## Installation

Use `bash scripts/install_plugin.sh` as the installer entrypoint for this packaged plugin.

Install from a local clone:

1. Clone the repository: `git clone https://github.com/jup-ag/agent-skills.git`
2. Run `bash scripts/install_plugin.sh` from the cloned repo root.
3. Choose `Claude Code` or `Both`.

Manual alternative:

```bash
claude plugin marketplace add /path/to/agent-skills
claude plugin install integrate-jupiter@jup-ag-skills
```

Or test locally:

```bash
claude --plugin-dir ./.plugins/integrate-jupiter/claude
```

## Included Skills

- **integrating-jupiter** — Comprehensive guide for all Jupiter APIs (Swap, Lend, Perps, Trigger, Recurring, Tokens, Price, Portfolio, etc.)
- **jupiter-lend** — Deep SDK-level integration for Jupiter Lend earn, borrow, vaults, and jlTokens
- **jupiter-swap-migration** — Migration guide from Metis (v1) or Ultra to Swap API v2

## MCP Server

This plugin configures the [Jupiter MCP server](https://dev.jup.ag/docs/ai/mcp) — a read-only documentation server that exposes all Jupiter documentation and OpenAPI specs through the MCP protocol.

## Links

- [jup.ag](https://jup.ag) — Jupiter
- [Agent Skills](https://github.com/jup-ag/agent-skills) — Source repository

## License

MIT
