# Agent Skills

Skills for AI coding agents to integrate with the Jupiter ecosystem.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

## Which skill should I use?

- Use `integrating-jupiter` when you want planning help: which Jupiter product to use, what flow to follow, and what can go wrong.
- Use `executing-jupiter` when you want to actually place/cancel orders or send transactions from the command line.
- If your intent is "do it now" (swap, place order, cancel order, send funds), choose `executing-jupiter`.

## Non-technical trader start

If you are not technical, copy this to your agent:

```text
Use the executing-jupiter skill.
I am a non-technical trader.
First do read-only checks (holdings/price), then show me exactly what trade will happen.
Do not sign or submit any transaction until I reply exactly: CONFIRM_EXECUTE=yes.
```

### integrating-jupiter

Helps agents integrate with the whole Jupiter Suite of APIs. 

#### Installation

```bash
npx add-skill jup-ag/agent-skills --skill "integrating-jupiter"
```

### executing-jupiter

Helps agents execute Jupiter API operations using scripts for fetch, sign, and swap execution flows.

#### Installation

```bash
npx add-skill jup-ag/agent-skills --skill "executing-jupiter"
```



## Quick Install

### Installation

```bash
npx add-skill jup-ag/agent-skills
```

## License

MIT
