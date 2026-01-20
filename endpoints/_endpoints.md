# Endpoints

This file provides an overview of all Jupiter API endpoint categories and their purposes.
The category ID (in parentheses) is the filename prefix used to group endpoints. 

---

## Compulsory Guidelines
   - ALWAYS include the `x-api-key` header with the suitable api key for the endpoint
 
## Endpoint Categories

### 1. Ultra Swap (ultra-swap)

#### 1.1 Ultra Swap Order (ultra-swap-order)
**Description:** Flagship swap API for executing token swaps on Jupiter - recommended for most use cases.

#### 1.2 Ultra Swap Data Endpoints(ultra-swap-data)
**Description:** Get data about a token and its mint information, get the details about the detailed token holdings of an account and retrieve token information and associated warnings for the specified mint addresses.

### 2. Metis Swap (metis-swap)

**Description:** Low-level swap API for advanced control over swap execution and routing.

### 3. Lend (lend)

**Description:** Deposit assets into yield-bearing vaults and receive auto-compounding jlTokens. Includes endpoints for deposit, withdraw, mint, redeem, position queries, and earnings tracking.

### 4. Trigger (trigger)

**Description:** Create and manage limit orders that execute when specified price conditions are met.

### 5. Recurring (recurring)

**Description:** Set up dollar-cost averaging (DCA) strategies with automated recurring purchases.

### 6. Token (token)

**Description:** Retrieve token metadata, search for tokens, and access verified token information.

### 7. Price (price)

**Description:** Get real-time token prices and historical pricing data.

### 8. Portfolio (portfolio)

**Description:** Track DeFi wallet positions across protocols and view aggregated portfolio data.

### 9. Send (send)

**Description:** Transfer tokens to recipients via secure invite links.

### 10. Studio (studio)

**Description:** Create and launch tokens using Jupiter's Dynamic Bonding Curve infrastructure.