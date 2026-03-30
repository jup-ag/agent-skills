# Jupiter Plugin for Claude Code

Jupiter integration and documentation skills for Solana, crypto, and finance workflows.

## Installation

```
/plugin marketplace add jup-ag/agent-skills
/plugin install integrate-jupiter@jup-ag-skills
```

Or test locally:

```bash
claude --plugin-dir ./.plugins/integrate-jupiter/claude
```

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
