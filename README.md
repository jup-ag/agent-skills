# Jupiter API Skill

A skill for AI coding assistants that provides comprehensive Jupiter API specification guidelines and best practices. Enables agents or LLMs to write, review, and refactor Jupiter API related code with knowledge of optimal patterns, proper error handling, and recommended practices for development and integration with the Jupiter API.

## What's Included

- **SKILL.md** - Main skill file with quick reference and guidelines
- **_endpoints.md** - Overview of all Jupiter API endpoint categories
- **endpoints/** - Detailed documentation for each API endpoint
- **responses/** - Response examples for each API endpoint

## API Categories

| Category | Description |
|----------|-------------|
| Ultra Swap Order | Flagship swap API with managed transaction landing and gasless support - recommended for most use cases |
| Ultra Swap Data | Token search, shield warnings, holdings, and mint information |
| Ultra Swap Integrator Payer | Pay network fees and rent on behalf of users |
| Metis Swap | Low-level swap API for advanced control and custom transaction composition |
| Lend (coming soon) | Deposit and withdraw assets to earn yield |
| Trigger (coming soon) | Limit orders with **price** conditions |
| Recurring (coming soon) | Dollar-cost averaging (DCA) strategies |
| Token | Token metadata and search |
| Price | Real-time and historical pricing |
| Portfolio (coming soon) | DeFi wallet positions across protocols |
| Send (coming soon) | Token transfers via invite links |
| Studio (coming soon) | Token creation with Dynamic Bonding Curve |

## Ultra vs Metis

| Use Case | Recommended API |
|----------|-----------------|
| Simple swaps, new developers | **Ultra** |
| Need managed tx landing | **Ultra** |
| Most trading applications | **Ultra** |
| Custom tx composition | **Metis** |
| CPI integration | **Metis** |
| Specific broadcasting strategies | **Metis** |

## Installation

TBD

## License

MIT