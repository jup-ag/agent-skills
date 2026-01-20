---
title: Portfolio API
description: Track DeFi wallet positions across the Solana ecosystem and view aggregated portfolio data. Query user positions, balances, and staking information across multiple DeFi platforms and protocols.
baseUrl: https://api.jup.ag/portfolio/v1
notes:
  - See `../responses/portfolio.md` for response examples.
  - The Portfolio API is currently in beta.
---

## Table of Contents

- [Portfolio API](#portfolio-api)
  - [Base URL](#base-url)
  - [Guidelines](#guidelines)
  - [Common Mistakes](#common-mistakes)
  - [Endpoints](#endpoints)
  - [1. GET /positions/{address}](#1-get-positionsaddress)
  - [2. GET /platforms](#2-get-platforms)
  - [3. GET /staked-jup/{address}](#3-get-staked-jupaddress)
  - [Workflows](#workflows)
    - [Complete Portfolio Overview](#complete-portfolio-overview)
    - [Jupiter-Only Positions Dashboard](#jupiter-only-positions-dashboard)
    - [Staking Dashboard with Unstaking Schedule](#staking-dashboard-with-unstaking-schedule)
    - [Multi-Platform Position Aggregation](#multi-platform-position-aggregation)
  - [Tips and Best Practices](#tips-and-best-practices)
    - [General](#general)
    - [Position Type Handling](#position-type-handling)
    - [Performance Optimization](#performance-optimization)
  - [References](#references)

---

# Portfolio API

## Base URL

```
https://api.jup.ag/portfolio/v1
```

## Guidelines
   - ALWAYS include the `x-api-key` header with your API key
   - PREFER filtering by specific platforms when you only need Jupiter positions
   - ALWAYS handle empty position arrays for new/inactive wallets
   - NEVER assume all position types will be present in a response
   - Use `/staked-jup/{address}` for JUP-specific staking data instead of filtering positions
   
## Common Mistakes
- Not handling different position types (`multiple`, `liquidity`, `leverage`, `borrowlend`, `trade`)
- Forgetting to convert native token amounts using decimals from `tokenInfo`
- Not checking `fetcherReports` status before processing platform data
- Assuming all platforms will return data (some may fail or timeout)

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/positions/{address}` | Get all portfolio positions for a wallet |
| GET | `/platforms` | List all supported platforms |
| GET | `/staked-jup/{address}` | Get JUP staking information |

---

## 1. GET /positions/{address}

Retrieve all portfolio positions for a wallet across supported Jupiter platforms.

```
GET /portfolio/v1/positions/{address}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Solana wallet address |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platforms` | string | No | Comma-separated platform IDs to filter (e.g., `jupiter-governance,jupiter-pm`) |

**Response Structure**:

The response contains position elements with different types:

| Type | Description | Use Case |
|------|-------------|----------|
| `multiple` | Wallet token holdings | Token balances |
| `liquidity` | Liquidity pool positions | LP tokens, pool shares |
| `leverage` | Perpetual/leveraged positions | Perps, margin trading |
| `borrowlend` | Lending/borrowing positions | Collateral, debt |
| `trade` | Active trade positions | Pending orders |

See [Complete Workflows](#workflows) for full integration examples.

---

## 2. GET /platforms

List all platforms supported by the Portfolio API with metadata.

```
GET /portfolio/v1/platforms
```

**No Parameters Required**

Returns an array of platform objects containing:
- Platform ID (for filtering)
- Name and description
- Logo/image URLs
- Tags for categorization
- External links (website, docs, social)
- Supported token list

See [Complete Workflows](#workflows) for full integration examples.

---

## 3. GET /staked-jup/{address}

Get JUP governance token staking information for a wallet.

```
GET /portfolio/v1/staked-jup/{address}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Solana wallet address |

**Response Fields**:
- `stakedAmount`: Total JUP staked (native units)
- `unstaking`: Array of unstaking schedules with amounts and unlock timestamps

See [Complete Workflows](#workflows) for full integration examples.

---

## Workflows

### Complete Portfolio Overview

Build a comprehensive portfolio dashboard showing all positions and total value.

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const API_KEY = process.env.JUPITER_API_KEY!;
const BASE_URL = 'https://api.jup.ag/portfolio/v1';

interface PortfolioOverview {
  totalValue: number;
  positions: any[];
  platforms: string[];
  stakedJup: number;
}

async function getCompletePortfolio(
  walletAddress: string
): Promise<PortfolioOverview> {
  // Step 1. Fetch all positions
  const positionsResponse = await fetch(
    `${BASE_URL}/positions/${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const positionsData = await positionsResponse.json();

  // Step 2. Fetch staked JUP
  const stakedJupResponse = await fetch(
    `${BASE_URL}/staked-jup/${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const stakedJupData = await stakedJupResponse.json();

  // Step 3. Calculate total portfolio value
  const totalValue = positionsData.elements.reduce(
    (sum: number, element: any) => sum + (element.value || 0),
    0
  );

  // Step 4. Extract unique platforms
  const platforms = [
    ...new Set(
      positionsData.elements.map((el: any) => el.platformId)
    ),
  ];

  // Step 5. Convert staked JUP from native units (6 decimals)
  const stakedJup = stakedJupData.stakedAmount / 1e6;

  return {
    totalValue,
    positions: positionsData.elements,
    platforms,
    stakedJup,
  };
}

// Usage
const portfolio = await getCompletePortfolio(
  'YourWalletAddressHere'
);

console.log(`Total Portfolio Value: $${portfolio.totalValue.toFixed(2)}`);
console.log(`Staked JUP: ${portfolio.stakedJup.toFixed(2)}`);
console.log(`Active Platforms: ${portfolio.platforms.join(', ')}`);
```

---

### Jupiter-Only Positions Dashboard

Filter positions to show only Jupiter-specific platforms.

```typescript
async function getJupiterPositions(walletAddress: string) {
  // Step 1. Fetch available platforms to get Jupiter platform IDs
  const platformsResponse = await fetch(
    `${BASE_URL}/platforms`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const platforms = await platformsResponse.json();

  // Step 2. Filter Jupiter platforms
  const jupiterPlatforms = platforms
    .filter((p: any) => 
      p.id.startsWith('jupiter-') || 
      p.tags?.includes('jupiter')
    )
    .map((p: any) => p.id);

  console.log('Jupiter Platforms:', jupiterPlatforms);
  // Example: ['jupiter-exchange', 'jupiter-governance', 'jupiter-perps']

  // Step 3. Fetch positions filtered by Jupiter platforms
  const positionsResponse = await fetch(
    `${BASE_URL}/positions/${walletAddress}?platforms=${jupiterPlatforms.join(',')}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const positionsData = await positionsResponse.json();

  // Step 4. Group positions by type
  const positionsByType = positionsData.elements.reduce(
    (acc: any, element: any) => {
      const type = element.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(element);
      return acc;
    },
    {}
  );

  // Step 5. Calculate value per type
  const valueByType = Object.entries(positionsByType).map(
    ([type, positions]: [string, any]) => ({
      type,
      count: positions.length,
      totalValue: positions.reduce(
        (sum: number, p: any) => sum + (p.value || 0),
        0
      ),
    })
  );

  return {
    positions: positionsData.elements,
    positionsByType,
    valueByType,
    fetcherReports: positionsData.fetcherReports,
  };
}

// Usage
const jupiterPositions = await getJupiterPositions(
  'YourWalletAddressHere'
);

console.log('Positions by Type:');
jupiterPositions.valueByType.forEach(({ type, count, totalValue }) => {
  console.log(`  ${type}: ${count} positions, $${totalValue.toFixed(2)}`);
});
```

---

### Staking Dashboard with Unstaking Schedule

Display staked JUP and calculate when unstaking periods complete.

```typescript
interface UnstakingSchedule {
  amount: number;
  amountFormatted: number;
  unlockDate: Date;
  daysRemaining: number;
}

async function getStakingDashboard(walletAddress: string) {
  // Step 1. Fetch staked JUP data
  const response = await fetch(
    `${BASE_URL}/staked-jup/${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const data = await response.json();

  const stakedJup = data.stakedAmount;

  // Step 3. Process unstaking schedules
  const now = Date.now();
  const unstakingSchedules: UnstakingSchedule[] = data.unstaking.map(
    (schedule: any) => {
      const unlockDate = new Date(parseInt(schedule.until) * 1000);
      const daysRemaining = Math.max(
        0,
        Math.ceil((unlockDate.getTime() - now) / (1000 * 60 * 60 * 24))
      );

      return {
        amount: schedule.amount,
        amountFormatted: schedule.amount,
        unlockDate,
        daysRemaining,
      };
    }
  );

  // Step 4. Calculate total unstaking
  const totalUnstaking = unstakingSchedules.reduce(
    (sum, s) => sum + s.amountFormatted,
    0
  );

  // Step 5. Sort by unlock date
  unstakingSchedules.sort(
    (a, b) => a.unlockDate.getTime() - b.unlockDate.getTime()
  );

  return {
    stakedJup,
    totalUnstaking,
    unstakingSchedules,
    nextUnlock: unstakingSchedules[0] || null,
  };
}

  // Usage
  const stakingInfo = await getStakingDashboard(
    'YourWalletAddressHere'
  );

  console.log(`Currently Staked: ${stakingInfo.stakedJup.toFixed(2)} JUP`);
  console.log(`Total Unstaking: ${stakingInfo.totalUnstaking.toFixed(2)} JUP`);

  if (stakingInfo.nextUnlock) {
    console.log(
      `Next Unlock: ${stakingInfo.nextUnlock.amountFormatted.toFixed(2)} JUP in ${stakingInfo.nextUnlock.daysRemaining} days`
    );
  }

  console.log('\nUnstaking Schedule:');
  stakingInfo.unstakingSchedules.forEach((schedule, index) => {
    console.log(
      `  ${index + 1}. ${schedule.amountFormatted.toFixed(2)} JUP - ${schedule.unlockDate.toLocaleDateString()} (${schedule.daysRemaining} days)`
    );
  });
```

---

### Multi-Platform Position Aggregation

Aggregate positions across multiple platforms with error handling.

```typescript
interface PlatformSummary {
  platformId: string;
  platformName: string;
  totalValue: number;
  positionCount: number;
  status: string;
  duration: number;
}

async function aggregatePositionsByPlatform(walletAddress: string) {
  // Step 1. Fetch positions
  const positionsResponse = await fetch(
    `${BASE_URL}/positions/${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const positionsData = await positionsResponse.json();

  // Step 2. Fetch platform metadata
  const platformsResponse = await fetch(
    `${BASE_URL}/platforms`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const platforms = await platformsResponse.json();

  // Step 3. Create platform lookup map
  const platformMap = new Map(
    platforms.map((p: any) => [p.id, p])
  );

  // Step 4. Check fetcher reports for failures
  const failedPlatforms = positionsData.fetcherReports
    .filter((report: any) => report.status !== 'succeeded')
    .map((report: any) => ({
      id: report.id,
      status: report.status,
      error: report.error,
    }));

  if (failedPlatforms.length > 0) {
    console.warn('Some platforms failed to fetch:');
    failedPlatforms.forEach((p: any) => {
      console.warn(`  - ${p.id}: ${p.status} ${p.error || ''}`);
    });
  }

  // Step 5. Aggregate positions by platform
  const platformSummaries: Map<string, PlatformSummary> = new Map();

  positionsData.elements.forEach((element: any) => {
    const platformId = element.platformId;
    const platform = platformMap.get(platformId);

    if (!platformSummaries.has(platformId)) {
      const report = positionsData.fetcherReports.find(
        (r: any) => r.id === platformId
      );

      platformSummaries.set(platformId, {
        platformId,
        platformName: platform?.name || platformId,
        totalValue: 0,
        positionCount: 0,
        status: report?.status || 'unknown',
        duration: report?.duration || 0,
      });
    }

    const summary = platformSummaries.get(platformId)!;
    summary.totalValue += element.value || 0;
    summary.positionCount += 1;
  });

  // Step 6. Sort by total value descending
  const sortedSummaries = Array.from(platformSummaries.values()).sort(
    (a, b) => b.totalValue - a.totalValue
  );

  // Step 7. Calculate overall metrics
  const totalPortfolioValue = sortedSummaries.reduce(
    (sum, s) => sum + s.totalValue,
    0
  );

  return {
    platforms: sortedSummaries,
    totalValue: totalPortfolioValue,
    platformCount: sortedSummaries.length,
    failedPlatforms,
    tokenInfo: positionsData.tokenInfo,
  };
}

// Usage
const aggregated = await aggregatePositionsByPlatform(
  'YourWalletAddressHere'
);

console.log(`Total Portfolio: $${aggregated.totalValue.toFixed(2)}`);
console.log(`Active Platforms: ${aggregated.platformCount}\n`);

console.log('Platform Breakdown:');
aggregated.platforms.forEach((platform, index) => {
  const percentage = (platform.totalValue / aggregated.totalValue) * 100;
  console.log(
    `  ${index + 1}. ${platform.platformName}: $${platform.totalValue.toFixed(2)} (${percentage.toFixed(1)}%) - ${platform.positionCount} positions`
  );
});
```

---

## Tips and Best Practices

### General
1. **Always check `fetcherReports`** - Some platforms may fail or timeout; check status before processing
2. **Use platform filtering** - When you only need specific platforms, filter to reduce response size and latency
3. **Handle empty positions gracefully** - New or inactive wallets may return empty `elements` arrays
4. **Cache platform metadata** - The `/platforms` endpoint data changes infrequently; cache it locally
5. **Convert native amounts** - Use `decimals` from `tokenInfo` to convert token amounts to human-readable format

### Position Type Handling

| Position Type | Key Fields to Check | Common Use Cases |
|---------------|---------------------|------------------|
| `multiple` | `data.assets[]` | Display wallet token balances |
| `liquidity` | `data.assets[]`, `assetsYields`, `netApy` | Show LP positions with APY |
| `leverage` | `data.positionSize`, `data.unrealizedPnl`, `data.liquidationPrice` | Perp trading dashboards |
| `borrowlend` | `data.collateral`, `data.debt`, `data.ltv` | Lending protocol positions |
| `trade` | Varies by platform | Active order tracking |

### Performance Optimization

| Scenario | Recommendation |
|----------|----------------|
| Only need JUP staking | Use `/staked-jup/{address}` instead of filtering positions |
| Jupiter products only | Filter with `?platforms=jupiter-exchange,jupiter-governance` |
| Display token prices | Use `tokenInfo` from response instead of separate price API calls |
| Multiple wallets | Batch requests with Promise.all() but respect rate limits |
| Real-time updates | Poll every 30-60 seconds; positions don't change frequently |

## References
- [Response Examples](../responses/portfolio.md)
- [Portfolio API Reference](https://dev.jup.ag/api-reference/portfolio)
- [Jupiter Positions Documentation](https://dev.jup.ag/docs/portfolio/jupiter-positions)
- [Portfolio Website](https://jup.ag/portfolio)
