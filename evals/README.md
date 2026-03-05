# Skill Discoverability Eval Suite

Measures whether an agent reliably routes to the correct Jupiter skill given a user prompt.

## What This Tests

Three Jupiter skills have overlapping domains:
- **integrating-jupiter** — broad, covers all 13 Jupiter APIs
- **executing-ultra-swaps** — focused on Ultra Swap order/sign/execute flow
- **jupiter-lending** — focused on Lend Earn deposit/withdraw flow

The eval suite answers: does each skill fire when it should, stay quiet when it shouldn't, and win over siblings when it's the best match?

## Structure

```
evals/
├── discoverability/
│   ├── rubric.md                          # Scoring rubric (5 dimensions, 1-5 scale)
│   ├── rubric-scores.md                   # Current scores for all 3 skills
│   ├── trigger-evals/
│   │   ├── integrating-jupiter.json       # 20 queries (10 trigger, 10 don't)
│   │   ├── executing-ultra-swaps.json     # 20 queries
│   │   └── jupiter-lending.json           # 20 queries
│   └── differentiation-evals/
│       └── cross-skill.json               # 15 ambiguous prompts testing routing
```

## Running Trigger Evals

Trigger evals use the format expected by `skill-creator/scripts/run_eval.py`:

```bash
# From the skill-creator repo, point at a skill and its eval file
python scripts/run_eval.py \
  --skill-path ../agent-skills/skills/integrating-jupiter/SKILL.md \
  --eval-path ../agent-skills/evals/discoverability/trigger-evals/integrating-jupiter.json
```

Each eval file contains 20 queries: 10 `should_trigger: true`, 10 `should_trigger: false`.

## Running the Description Optimization Loop

Use `skill-creator/scripts/run_loop.py` to iteratively improve a skill's description based on eval results:

```bash
python scripts/run_loop.py \
  --skill-path ../agent-skills/skills/executing-ultra-swaps/SKILL.md \
  --eval-path ../agent-skills/evals/discoverability/trigger-evals/executing-ultra-swaps.json \
  --max-iterations 5
```

## Interpreting Rubric Scores

See `discoverability/rubric.md` for the 5-dimension scoring rubric. Each dimension is scored 1-5. Target composite score (average of 5 dimensions) is **>= 4.0** per skill.

Current scores are in `discoverability/rubric-scores.md`.

## Adding New Eval Queries

Trigger eval format (append to the skill's JSON array):
```json
{"query": "realistic user prompt", "should_trigger": true}
```

Cross-skill differentiation format (append to `cross-skill.json`):
```json
{
  "query": "ambiguous prompt where multiple skills could trigger",
  "correct_skill": "executing-ultra-swaps",
  "wrong_skills": ["integrating-jupiter"],
  "reason": "Why this skill should win"
}
```

### Query Design Guidelines

- **Should-trigger:** Vary phrasing (formal/casual/abbreviated), include error scenarios, mix explicit domain mentions with task descriptions
- **Should-NOT-trigger:** Near-misses from sibling skills, adjacent Solana/DeFi tasks, generic programming with shared keywords
- **Cross-skill:** Prompts where 2+ skills could plausibly trigger; tests boundary between broad vs focused skills
