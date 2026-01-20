# Ultra Swap Data API

Ultra is Jupiter's flagship trading solution. These endpoints handle data endpoints for tokens and accounts

**Recommended for most use cases.**

## Base URL

```
https://api.jup.ag/ultra/v1
```

## Guidelines
   - NEVER skip error handling for both endpoints
   
## Common Mistakes
- Forgetting to deserialize as VersionedTransaction (not Transaction)
- Using wrong amount units (should be native units, before decimals)

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search for a token by symbol, name, or mint address |
| GET | `/shield` | Retrieve token information and associated warnings for the specified mint addresses. |
| GET | `/holdings` | Get the detailed token holdings of an account. |
| GET | `/mint` | Get token mint information |


---


## 1. GET /search

Returns useful mint information for search results by token symbol, name or mint address.
```
GET /ultra/v1/search
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Token symbol, name or mint address for query by . Acepts up to 100 tokens in a single request using a comma separated list.|



### Example

```typescript
const searchResponse = await (
  await fetch(`https://api.jup.ag/ultra/v1/search?query=So11111111111111111111111111111111111111112`,
    {
      headers: {
        'x-api-key': 'your-api-key',
      },
    }
  )
).json();
```



## 2. GET /shield

Returns token warnings for specified mint addresses to help identify potentially malicious tokens before transacting.

```
GET /ultra/v1/shield
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mints` | string | Yes | Mint addresses to get warnings for.



### Example

```typescript
const shieldResponse = await (
  await fetch(`https://api.jup.ag/ultra/v1/shield?mints=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,someTokenAddressForEducationalPurposes`,
    {
      headers: {
        'x-api-key': 'your-api-key',
      },
    }
  )
).json();
```


## . GET /holdings

Request for token balances of an account including token account information
```
GET /ultra/v1/shield
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mints` | string | Yes | Mint addresses to get warnings for.


### Example

```typescript
const shieldResponse = await (
  await fetch(`https://api.jup.ag/ultra/v1/shield?mints=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,someTokenAddressForEducationalPurposes`,
    {
      headers: {
        'x-api-key': 'your-api-key',
      },
    }
  )
).json();
```

---

## Tips and Best Practices

1. **Check `/shield`** before displaying unknown tokens to users
2. **Use `/holdings`** to get wallet balances before initiating swaps
3. **For large wallets**: Wallets with thousands of token holdings may have slower response times - response time varies depending on the number of token holdings
4. **For SOL-only queries**: Use `/holdings/{address}/native` to get just the native SOL balance for faster responses

 **Note**: The top level response outside of `tokens` in the `holdings` response is the native SOL balance.





## References
- [Response Examples](/responses/ultra-swap-data.md)
- [Ultra Swap API Reference](https://dev.jup.ag/api-reference/ultra)

