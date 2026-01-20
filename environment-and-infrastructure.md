---
title: Jupiter API Environment and Infrastructure
description: Infrastructure details, server locations, and optimization tips for Jupiter API integrations.
---

# Jupiter API Environment and Infrastructure

## API Gateway Infrastructure

Jupiter's API is hosted on AWS infrastructure. For optimal latency, deploy your services in regions close to the API gateway.

### Recommended Regions

| Region | Location | Latency |
|--------|----------|---------|
| `us-east-1` | N. Virginia | Lowest |
| `us-west-2` | Oregon | Low |
| `eu-west-1` | Ireland | Medium |

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

Deploy on AWS `us-east-1` or nearby regions for lowest latency.

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

| Need | Endpoint | Latency |
|------|----------|---------|
| SOL balance only | `/holdings/{address}/native` | 30ms |
| Full holdings | `/holdings/{address}` | 70ms |
| Token search | `/search` | 15ms |
| Token warnings | `/shield` | 150ms |

## Response Codes

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Process response |
| 400 | Bad request | Check parameters |
| 401 | Unauthorized | Check API key |
| 429 | Rate limited | Implement backoff |
| 500 | Server error | Retry with backoff |

### Rate Limit Headers

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 598
X-RateLimit-Reset: 1704067200
```

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

## Monitoring

### API Status

Check real-time API status at: [status.jup.ag](https://status.jup.ag)

### Latency Benchmarks (P50)

| Endpoint | Latency |
|----------|---------|
| `/ultra/v1/order` | 300ms |
| `/ultra/v1/execute` | 700ms (Iris), 2s (JupiterZ) |
| `/ultra/v1/holdings` | 70ms |
| `/ultra/v1/shield` | 150ms |
| `/ultra/v1/search` | 15ms |
| `/swap/v1/quote` | 200ms |
| `/price/v3` | 50ms |

## References

- [Portal](https://portal.jup.ag) - API key management
- [Status](https://status.jup.ag) - API status page
- [Migration Guide](./migration.md) - Migrate from lite-api
