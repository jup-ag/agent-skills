---
title: API Endpoint Name
description: Brief description of what this API does and when to use it
baseUrl:
notes:
  - See `../responses/[response-file].md` for response examples.
---

# Table of Contents
- [Table of Contents](#table-of-contents)
- [API Name](#api-name)
  - [Base URL](#base-url)
  - [Guidelines](#guidelines)
  - [Common Mistakes](#common-mistakes)
  - [Endpoints](#endpoints)
  - [1. METHOD /endpoint1](#1-method-endpoint1)
    - [Example](#example)
  - [2. METHOD /endpoint2](#2-method-endpoint2)
    - [Example](#example-1)
  - [Workflows](#workflows)
    - [Complete Flow: Primary Workflow Name](#complete-flow-primary-workflow-name)
    - [Specific Workflow Name: Use Case](#specific-workflow-name-use-case)
  - [Tips and Best Practices](#tips-and-best-practices)
    - [General](#general)
    - [Category-specific Tips](#category-specific-tips)
  - [References](#references)

# API Name

## Base URL

```
[BASE_URL]
```

## Guidelines
   - ALWAYS key requirement 1
   - NEVER common anti-pattern
   - PREFER recommended approach
   - Additional important guideline
   
## Common Mistakes
- Mistake 1 - e.g., wrong data type, format
- Mistake 2 - e.g., missing required parameter

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/endpoint1` | Description |
| POST | `/endpoint2` | Description |

---

## 1. METHOD /endpoint1

Brief description of what this endpoint does

```
METHOD /[path]/endpoint1
```

**Query Parameters** (or **Request Body** for POST):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param1` | string | Yes | Description |
| `param2` | number | No | Description with constraints |

### Example

```typescript
// Example code here
```

---

## 2. METHOD /endpoint2

Brief description

```
[METHOD] /[path]/endpoint2
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field1` | string | Yes | Description |

### Example

```typescript
// Example code here
```

---

## Workflows

### Complete Flow: Primary Workflow Name

```typescript
// Full working example showing the complete integration flow
```

### Specific Workflow Name: Use Case

```typescript
// Example for a specific use case or variation
```

---

## Tips and Best Practices

### General
1. **Tip title** - Explanation
2. **Tip title** - Explanation

### Category-specific Tips
| Scenario | Recommendation |
|----------|----------------|
| Scenario 1 | Recommendation |
| Scenario 2 | Recommendation |


## References
- [Response Examples](../responses/[response-file].md)
- [Official API Reference]([URL])
- [Additional Documentation]([URL])
