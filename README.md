# Agent Skills

Skills for AI coding agents to integrate with the Jupiter ecosystem.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### integrating-jupiter

Helps agents integrate with the whole Jupiter Suite of APIs. 

#### Installation

```bash
npx add-skill jup-ag/agents-skills --skill "integrating-jupiter"
```



## Quick Install

### Installation

```bash
npx add-skill jup-ag/agents-skills
```

## Community Tools

### jov-cli

CLI wrapper for all 15 Jupiter APIs. Swap, lend, DCA, limit orders, price feeds, portfolio, token search — one command each.
```bash
npm install -g jovebot
jovebot price SOL ETH BTC
jovebot swap SOL USDC 2.0
jovebot lend pools
jovebot trigger create USDC SOL 150 1.0
jovebot dca create USDC SOL 1000 10 daily
jovebot tokens trending
jovebot portfolio
jovebot doctor
```

Source: [github.com/J0VEBOT/jov-cli](https://github.com/J0VEBOT/jov-cli)

## License

MIT
