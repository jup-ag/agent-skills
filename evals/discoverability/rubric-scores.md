# Rubric Scores — Current Assessment

Scored against the 5-dimension rubric in `rubric.md`. Based on analysis of each skill's frontmatter (name, description, tags, triggers, use/do-not-use).

---

## integrating-jupiter

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Trigger Recall | 4 | 44 triggers cover all 13 APIs with good breadth. Includes casual terms like "best route" and "gasless". Misses some informal phrasings ("swap some SOL", "trade crypto"). |
| Trigger Precision | 2 | Triggers like `swap`, `lend`, `borrow`, `earn` overlap directly with both focused skills. Any swap or lending query will match this skill alongside the focused one. |
| Description Clarity | 4 | Description lists all 13 APIs explicitly. The parenthetical API list makes scope very clear. However, "comprehensive guidance" is vague about depth vs breadth tradeoff. |
| Differentiation | 2 | As the superset skill, it competes with both focused skills on their domains. Description doesn't explain when to prefer this over a focused skill. No "use this for multi-API tasks" framing. |
| Tag/Keyword Coverage | 4 | 18 tags cover all major APIs. Includes variants like `jlp`, `iris`, `jupiterz-rfq`. Misses some natural terms: `token swap`, `yield`, `APY`, `leverage trading`. |
| **Composite** | **3.2** | Precision and differentiation drag the score down. The broad skill needs clearer "when to use me vs focused skills" language. |

### Recommendations
- Add differentiation language: "Use when the task spans multiple Jupiter APIs or when no focused skill matches"
- Consider removing triggers that overlap with focused skills, or add priority/specificity metadata
- Add tags for common natural language terms: `yield`, `APY`, `leverage trading`, `token swap`

---

## executing-ultra-swaps

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Trigger Recall | 4 | 13 triggers cover the core swap vocabulary well. Includes error scenarios (`swap failed`, `re-quote`, `swap error`). Covers `gasless` and `Shield`. Misses casual: "trade SOL for USDC", "convert tokens", "exchange crypto". |
| Trigger Precision | 4 | "Do not use" section explicitly excludes non-swap APIs. Triggers are swap-focused. Minor risk: `swap` and `trade` are generic enough to fire on non-Jupiter swap questions. |
| Description Clarity | 5 | Description is specific: "the full /order -> sign -> /execute flow". Lists exact capabilities: slippage, routing decisions, re-quote logic, error recovery. Clear scope boundaries. |
| Differentiation | 4 | Clear contrast with lending. The "/order -> sign -> /execute flow" phrasing is unique. Could be confused with integrating-jupiter on basic swap tasks — description says "beyond a basic quote-and-execute" which helps. |
| Tag/Keyword Coverage | 3 | 8 tags are focused but sparse. Missing: `trade`, `exchange`, `convert`, `dex`, `token swap`, `order flow`, `transaction failed`. Has `solana` and `token-shield` which are good. |
| **Composite** | **4.0** | Meets target. Description clarity is excellent. Tag coverage is the main gap — adding synonyms would improve recall without hurting precision. |

### Recommendations
- Add tags: `trade`, `exchange`, `convert`, `dex`, `token-swap`, `order-flow`
- Add triggers for casual phrasings: "trade SOL for USDC", "convert my tokens"
- Tag coverage is the easiest win for this skill

---

## jupiter-lending

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Trigger Recall | 4 | 13 triggers cover core lending vocabulary. Includes risk terms: `health factor`, `liquidation`. Has `receipt token` which is domain-specific. Misses: "supply assets", "lending rates", "borrow rate", "interest". |
| Trigger Precision | 5 | Triggers are tightly scoped to lending. "Do not use" explicitly excludes swapping. No generic terms that would fire on swap or perps queries. `earn` is the only term that could be ambiguous (but is correct for this skill). |
| Description Clarity | 5 | Description nails the scope: "deposit/withdraw flows via REST API, position and earnings monitoring, risk management". Lists specific operations: health factors, liquidation boundaries, mint/redeem receipt tokens. |
| Differentiation | 4 | Strong separation from swap skills. "supplying assets for yield or managing Jupiter Lend positions" is clearly different from swap/trade language. Minor overlap: `integrating-jupiter` also has `lend` and `borrow` triggers. |
| Tag/Keyword Coverage | 4 | 10 tags include good specifics: `lending`, `earn`, `yield`, `deposit`, `withdraw`. Has broader `defi` tag for discovery. Missing: `interest`, `borrow-rate`, `supply`, `collateral`, `APR`. |
| **Composite** | **4.4** | Strongest of the three skills. Precision and clarity are excellent. Minor tag gaps are the only improvement area. |

### Recommendations
- Add tags: `interest`, `borrow-rate`, `supply`, `collateral`, `APR`
- Add triggers for: "what's the lending rate", "supply my SOL", "interest on USDC"
- This skill is the best model for the others to follow

---

## Summary

| Skill | Recall | Precision | Clarity | Differentiation | Tags | Composite |
|-------|--------|-----------|---------|-----------------|------|-----------|
| integrating-jupiter | 4 | 2 | 4 | 2 | 4 | **3.2** |
| executing-ultra-swaps | 4 | 4 | 5 | 4 | 3 | **4.0** |
| jupiter-lending | 4 | 5 | 5 | 4 | 4 | **4.4** |

**Key finding:** The broad skill (`integrating-jupiter`) scores lowest because it competes with focused skills on precision and differentiation. The focused skills score well because their descriptions and triggers clearly define narrow scope. The main systemic issue is lack of a routing priority mechanism — when a focused skill and the broad skill both match, there's no signal for which should win.
