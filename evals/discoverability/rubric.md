# Discoverability Rubric

Five dimensions, each scored 1-5. Composite score = average of all five. Target: **>= 4.0** per skill.

---

## 1. Trigger Recall

*Does the skill fire when it should?*

| Score | Criteria |
|-------|----------|
| 5 | Fires for all natural phrasings including casual, abbreviated, and domain-adjacent |
| 4 | Fires for most phrasings; misses only rare or highly indirect formulations |
| 3 | Fires for obvious keywords but misses casual or indirect phrasings |
| 2 | Fires only for a narrow set of explicit terms |
| 1 | Only fires for exact skill name or very specific terms |

---

## 2. Trigger Precision

*Does the skill stay quiet when it shouldn't fire?*

| Score | Criteria |
|-------|----------|
| 5 | Never fires for adjacent-but-wrong domains |
| 4 | Rarely fires incorrectly; only on genuinely ambiguous boundary cases |
| 3 | Occasionally fires for sibling skill domains |
| 2 | Frequently fires for related but wrong domains |
| 1 | Fires broadly for any Jupiter/Solana/DeFi prompt |

---

## 3. Description Clarity

*Does the description communicate scope?*

| Score | Criteria |
|-------|----------|
| 5 | A human reading the description immediately knows what's in and out of scope |
| 4 | Scope is clear with minimal effort; minor ambiguity on edge cases |
| 3 | Scope is inferrable but requires reading carefully |
| 2 | Description is generic; scope boundaries are unclear |
| 1 | Vague or overlapping with sibling skills |

---

## 4. Differentiation

*Can an agent distinguish this skill from its siblings?*

| Score | Criteria |
|-------|----------|
| 5 | Clear, non-overlapping language; an agent given all 3 descriptions picks this one correctly |
| 4 | Strong differentiation; only rare boundary cases cause confusion |
| 3 | Some ambiguity on boundary cases |
| 2 | Significant overlap with one or more siblings |
| 1 | Description could apply to multiple skills equally |

---

## 5. Tag/Keyword Coverage

*Do tags catch natural language variations?*

| Score | Criteria |
|-------|----------|
| 5 | Tags cover all major synonyms, abbreviations, and related concepts |
| 4 | Tags cover primary and most secondary terms; minor gaps |
| 3 | Tags cover primary terms but miss common alternatives |
| 2 | Tags are narrow; miss many natural phrasings |
| 1 | Tags are sparse or too generic |

---

## Composite Score

**Composite = (Recall + Precision + Clarity + Differentiation + Tags) / 5**

| Range | Interpretation |
|-------|---------------|
| 4.5-5.0 | Excellent — skill routes correctly in nearly all cases |
| 4.0-4.4 | Good — meets target, minor improvements possible |
| 3.0-3.9 | Needs work — noticeable routing errors expected |
| < 3.0 | Poor — skill is unreliable for agent routing |
