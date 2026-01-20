---
title: Jupiter API Environment and Infrastructure
description: Infrastructure details, server locations, optimization tips for Jupiter API integrations and resources
---

# Jupiter API Environment and Infrastructure

## API Gateway Infrastructure

Jupiter's API is hosted on AWS infrastructure. For optimal latency, deploy your services in regions close to the API gateway.

### Recommended Regions

| Region | Location | Area |
|--------|----------|------|
| `us-east-1` | N. Virginia | North America East Coast |
| `us-east-2` | Ohio | North America Central |
| `eu-central-1` | Frankfurt | Central Europe |
| `eu-west-1` | Ireland | Western Europe |
| `ap-southeast-1` | Singapore | Southeast Asia |
| `ap-northeast-1` | Tokyo | Northeast Asia |

## Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| Production | `https://api.jup.ag` | Main API (requires API key) |
| Lite (deprecated) | `https://lite-api.jup.ag` | Legacy API (no auth, DEPRECATED Jan 31, 2026) |

## Authentication

All requests to `api.jup.ag` require the `x-api-key` header:

```typescript
const response = await fetch('https://api.jup.ag/ultra/v1/order?...', {
  headers: {
    'x-api-key': process.env.JUPITER_API_KEY!,
  },
});
```

### Getting an API Key

1. Visit [portal.jup.ag](https://portal.jup.ag)
2. Connect via email
3. Generate API key
4. Store securely (never commit to version control)

## Rate Limiting

### Fixed Rate Limits (Most APIs)

| Tier | Rate Limit | Window |
|------|------------|--------|
| Free | 60 req/min | 60s sliding |
| Pro I | 600 req/min | 10s |
| Pro II | 3,000 req/min | 10s |
| Pro III | 6,000 req/min | 10s |
| Pro IV | 30,000 req/min | 10s |

### Rate Limit Buckets

Requests are distributed across 3 buckets:

1. **Price API Bucket** - `/price/v3` endpoint
2. **Studio API Bucket** - `/studio` endpoints
3. **Default Bucket** - All other endpoints (except Ultra)

### Dynamic Rate Limits (Ultra API)

Ultra API uses volume-based rate limiting:

```
Quota = Base + (24h Volume × Multiplier)
```

- No Pro plan required
- Scales automatically with swap volume
- Rolling 24h window

## Latency Optimization

### 1. Server Collocation

Deploy on AWS `us-east-1` or any recommended region for lowest latency.

### 2. Connection Pooling

Reuse HTTP connections:

```typescript
import { Agent } from 'https';

const agent = new Agent({ keepAlive: true });

const response = await fetch(url, {
  agent,
  headers: { 'x-api-key': API_KEY },
});
```

### 3. Parallel Requests

Batch independent requests:

```typescript
const [quote, holdings, shield] = await Promise.all([
  fetch(`${API_URL}/ultra/v1/order?...`),
  fetch(`${API_URL}/ultra/v1/holdings/${address}`),
  fetch(`${API_URL}/ultra/v1/shield?mints=${mint}`),
]);
```

### 4. Use Appropriate Endpoints

| Need | Endpoint |
|------|----------|
| SOL balance only | `/holdings/{address}/native` |
| Full holdings | `/holdings/{address}` |
| Token search | `/search` |
| Token warnings | `/shield` |
| Ultra swap order | `/order` |
| Ultra swap execute | `/execute` |

## Response Codes

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Process response |
| 400 | Bad request | Check parameters |
| 401 | Unauthorized | Check API key |
| 429 | Rate limited | Implement backoff |
| 500 | Server error | Retry with backoff |

## Error Handling Best Practices

```typescript
async function jupiterFetch(endpoint: string) {
  const response = await fetch(`https://api.jup.ag${endpoint}`, {
    headers: { 'x-api-key': process.env.JUPITER_API_KEY! },
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || '1';
    await sleep(parseInt(retryAfter) * 1000);
    return jupiterFetch(endpoint); // Retry
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
```

## Core Programs

All of Jupiter's programs are deployed on Solana Mainnet only.

| Program | Address |
|---------|---------|
| Jupiter Swap | `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4` |
| Jupiter Referral | `REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3` |
| Jupiter Perpetuals | `PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu` |
| Jupiter Doves | `DoVEsk76QybCEHQGzkvYPWLQu9gzNoZZZt3TPiL597e` |
| Jupiter Lend Earn | `jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9` |
| Jupiter Lend Borrow | `jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi` |
| Jupiter Lend Earn Rewards | `jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar` |
| Jupiter Lend Liquidity | `jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC` |
| Jupiter Lend Borrow Oracle | `jupnw4B6Eqs7ft6rxpzYLJZYSnrpRgPcr589n5Kv4oc` |
| Jupiter Limit Order V2 | `j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X` |
| Jupiter DCA | `DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M` |
| Jupiter Lock | `LocpQgucEQHbqNABEYvBvwoxCPsSbG91A1QaQhQQqjn` |
| Jupiter Governance | `GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY` |
| Jupiter Voter | `voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj` |


## Jupiter Lend Program

### Program ID

| Program | Address |
|---------|---------|
| Jupiter Lend Earn | `jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9` |
| Jupiter Lend Borrow | `jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi` |
| Jupiter Lend Earn Rewards | `jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar` |
| Jupiter Lend Liquidity | `jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC` |
| Jupiter Lend Borrow Oracle | `jupnw4B6Eqs7ft6rxpzYLJZYSnrpRgPcr589n5Kv4oc` |

## Monitoring

### API Status

Check real-time API status at: [status.jup.ag](https://status.jup.ag)

## References

- [Portal](https://portal.jup.ag) - API key management
- [Dev Portal](https://dev.jup.ag) - API documentation
- [Status](https://status.jup.ag) - API status page
- [Migration Guide](./migration.md) - Migrate from lite-api