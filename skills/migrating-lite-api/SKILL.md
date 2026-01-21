---
name: migrating-lite-api
description: Guide for migrating from deprecated lite-api.jup.ag to api.jup.ag. Includes step-by-step migration instructions, endpoint mapping, and common issues.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
---

# Migrate from Lite API

## Overview

Migrate from `lite-api.jup.ag` to `api.jup.ag`. The migration is straightforward—only the base URL and API key requirement changes.

**Deadline**: `lite-api.jup.ag` will be deprecated on March 1st, 2026.

## What Changed

| Before (Deprecated) | After (Current) |
|---------------------|-----------------|
| `https://lite-api.jup.ag/...` | `https://api.jup.ag/...` |
| No API key required | API key required (free tier available) |

## Migration Steps

### Step 1: Generate API Key

1. Visit [portal.jup.ag](https://portal.jup.ag)
2. Connect via email
3. Generate an API key (free tier available)
4. Copy your API key

Free tier provides 60 requests per minute.

### Step 2: Update Base URL

Replace all instances of `lite-api.jup.ag` with `api.jup.ag`:

```diff
- const baseUrl = 'https://lite-api.jup.ag';
+ const baseUrl = 'https://api.jup.ag';
```

### Step 3: Add API Key Header

Pass the API key via header as `x-api-key`:

```typescript
// Before (deprecated)
const response = await fetch('https://lite-api.jup.ag/ultra/v1/order?...');

// After (current)
const response = await fetch('https://api.jup.ag/ultra/v1/order?...', {
  headers: {
    'x-api-key': 'your-api-key-here',
  },
});
```

```typescript
// With a reusable fetch wrapper
const jupiterClient = async (endpoint: string, options?: RequestInit) => {
  return fetch(`https://api.jup.ag${endpoint}`, {
    ...options,
    headers: {
      'x-api-key': process.env.JUPITER_API_KEY!,
      ...options?.headers,
    },
  });
};

// Usage
const response = await jupiterClient('/ultra/v1/order?inputMint=...&outputMint=...');
```

## Migration Checklist

- [ ] Generate API key from [portal.jup.ag](https://portal.jup.ag)
- [ ] Update all `lite-api.jup.ag` URLs to `api.jup.ag`
- [ ] Add `x-api-key` header to all API requests
- [ ] Test API calls with new endpoint
- [ ] Update environment variables/config files

## Endpoint Mapping

All endpoints remain the same, only the base URL changes:

| Service | Old Endpoint | New Endpoint |
|---------|--------------|--------------|
| Ultra API | `lite-api.jup.ag/ultra/v1/...` | `api.jup.ag/ultra/v1/...` |
| Swap API | `lite-api.jup.ag/swap/v1/...` | `api.jup.ag/swap/v1/...` |
| Price API | `lite-api.jup.ag/price/v2/...` | `api.jup.ag/price/v2/...` |
| Tokens API | `lite-api.jup.ag/tokens/v1/...` | `api.jup.ag/tokens/v1/...` |
| Trigger API | `lite-api.jup.ag/trigger/v1/...` | `api.jup.ag/trigger/v1/...` |
| Recurring API | `lite-api.jup.ag/recurring/v1/...` | `api.jup.ag/recurring/v1/...` |
| Send API | `lite-api.jup.ag/send/v1/...` | `api.jup.ag/send/v1/...` |
| Studio API | `lite-api.jup.ag/studio/v1/...` | `api.jup.ag/studio/v1/...` |
| Lend API | `lite-api.jup.ag/lend/v1/...` | `api.jup.ag/lend/v1/...` |

## Rate Limits

Rate limits are applied based on your API key tier and the type of API you're using.

### Fixed Rate Limit (Free & Pro Tiers)

Applies to all public Jupiter APIs except Ultra Swap API. Uses a sliding window method to enforce request quotas.

| Tier    | Est. Requests per Minute | Requests Per Period | Sliding Window Period |
|---------|--------------------------|---------------------|----------------------|
| Free    | 60                       | 60                  | 60 seconds           |
| Pro I   | ~600                     | 100                 | 10 seconds           |
| Pro II  | ~3,000                   | 500                 | 10 seconds           |
| Pro III | ~6,000                   | 1,000               | 10 seconds           |
| Pro IV  | ~30,000                  | 5,000               | 10 seconds           |

**Request Buckets:**
- **Price API Bucket** – dedicated for `/price/v3/` only (separate from Default Bucket)
- **Studio API Bucket** – dedicated for `/studio/` only (Free: 100 requests per 5 minutes, Pro: 10 requests per 10 seconds)
- **Default Bucket** – used for all other APIs

### Dynamic Rate Limit (Ultra Swap API)

The Ultra Swap API uses a unique rate limiting mechanism that scales with your **executed swap volume** over time.

Every 10 minutes, the system aggregates your swap volume from `/execute` on Ultra for the current rolling day and updates your Added Quota.

| Swap Volume | Requests Per Period       | Sliding Window Period |
|-------------|---------------------------|----------------------|
| $0          | 50 Base + 0 Added = 50    | 10 seconds           |
| $10,000     | 50 Base + 1 Added = 51    | 10 seconds           |
| $100,000    | 50 Base + 11 Added = 61   | 10 seconds           |
| $1,000,000  | 50 Base + 115 Added = 165 | 10 seconds           |

### Managing Rate Limits

If you receive a 429 response:
1. Implement exponential backoff in your retry logic
2. Wait for the sliding window to allow for more requests
3. **Upgrade your tier (Pro)** or **scale your Ultra usage** to unlock higher limits

> **Note:** API Keys are universal across both Fixed and Dynamic Rate Limit systems. Rate limits apply on a per-account basis, not to individual API keys.

## Common Issues

### 401 Unauthorized
**Problem**: Getting 401 errors after migration  
**Solution**: Ensure `x-api-key` header is included in all requests.

### Rate Limit Errors (429)
**Problem**: Hitting rate limits  
**Solution**: Free tier provides 60 requests per minute. Consider upgrading to Pro tier for higher limits.

## References

- [API Key Setup Guide](https://portal.jup.ag)
- [Rate Limits](https://dev.jup.ag/portal/rate-limit.md)
- [Support](https://discord.gg/jup)
