---
title: Fees and Pricing
description: Fee structures for Jupiter ULTRA SWAP ORDER and METIS SWAP API including platform fees, integrator fees, and gasless mechanisms.
---

# Fees and Pricing

## Ultra Swap Fees

Ultra has 8-10x lower fees than market average, with only 5 to 10 bps of the swap amount as a fee.

### Platform Fees

| Token Type | Fee (bps) |
|------------|-----------|
| Buying Jupiter tokens (SOL/Stable → JUP/JLP/jupSOL) | 0 |
| Pegged Assets (LST-LST, Stable-Stable) | 0 |
| SOL-Stable | 2 |
| LST-Stable | 5 |
| Everything else | 10 |
| New Tokens (within 24 hours token age) | 50 |

**Token support:** SPL and Token2022 tokens are both supported.

### Fee Mint Priority

Ultra decides which mint to take fees in based on this priority:

1. **SOL** - Native Solana
2. **Stablecoins** - USDC, USDT, etc.
3. **LSTs** - JupSOL, etc.
4. **Bluechips** - Large market cap tokens
5. **Others** - Everything else

Check fees via the `/fees` endpoint:

```bash
curl -X GET 'https://api.jup.ag/ultra/v1/fees?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112' \
  -H 'x-api-key: your-api-key'
```

Or check `feeMint` and `feeBps` fields in the `/order` response.

### Gasless Support

Ultra provides automatic gasless support when:
- Swap is routed via JupiterZ (RFQ)
- Trade size meets minimum threshold
- Taker has < 0.01 SOL

When gasless is active:
- `gasless: true` in response
- `signatureFeeLamports: 0`
- `prioritizationFeeLamports: 0`

## Metis Swap Fees

Metis itself has no platform fee. You manage:
- Priority fees (set via `prioritizationFeeLamports`)
- Network fees (base transaction cost)
- DEX fees (varies by AMM)

## Integrator Fees

### Ultra Swap Integrator Fees

Add fees via referral program.

**Important:** Ultra takes 20% of your integrator fees.

```typescript
const orderParams = new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '100000000',
  taker: walletAddress,
  referralAccount: '<your-referral-account>',
  referralFee: '100', // 1% (100 bps)
});

const order = await fetch(`https://api.jup.ag/ultra/v1/order?${orderParams}`, {
  headers: { 'x-api-key': API_KEY },
}).then(r => r.json());
```

### Metis Swap Integrator Fees

Add fees via `platformFeeBps` in quote:

```typescript
// 1. Include platformFeeBps in quote
const quote = await fetch(
  'https://api.jup.ag/swap/v1/quote' +
  '?inputMint=So11111111111111111111111111111111111111112' +
  '&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' +
  '&amount=100000000' +
  '&platformFeeBps=50', // 0.5% fee
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());

// 2. Include feeAccount in swap request
const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse: quote,
    feeAccount: '<your-fee-token-account>', // Must match output mint
  }),
}).then(r => r.json());
```

## Integrator Payer (Ultra)

Pay network fees on behalf of users:

| Parameter | Description |
|-----------|-------------|
| `payer` | Public key paying for fees and rent |
| `closeAuthority` | Close authority for created token accounts |
| `referralAccount` | Required with payer |
| `referralFee` | Required with payer |

```typescript
const orderParams = new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '100000000',
  taker: userWallet,
  payer: integratorPayerWallet, // You pay fees
  referralAccount: referralAccount,
  referralFee: '100',
});
```

**Note**: When using `payer`, transaction requires TWO signatures (user + integrator).

See [ultra-swap-integrator-payer.md](./ultra-swap-integrator-payer.md) for details.

## Priority Fees

### Ultra

Ultra automatically optimizes priority fees. No configuration needed.

### Metis

Set priority fees in `/swap` request:

```typescript
// Auto priority fee
body: JSON.stringify({
  userPublicKey: wallet.publicKey.toBase58(),
  quoteResponse: quote,
  prioritizationFeeLamports: 'auto',
})

// Fixed priority fee
body: JSON.stringify({
  userPublicKey: wallet.publicKey.toBase58(),
  quoteResponse: quote,
  prioritizationFeeLamports: 100000, // 0.0001 SOL
})

// Jito tip
body: JSON.stringify({
  userPublicKey: wallet.publicKey.toBase58(),
  quoteResponse: quote,
  prioritizationFeeLamports: {
    jitoTipLamports: 1000000, // 0.001 SOL tip
  },
})
```

## Fee Comparison

| Feature | Ultra | Metis |
|---------|-------|-------|
| Platform fee | 0-50 bps (varies by token type) | None |
| Integrator fee share | 80% (Ultra takes 20%) | 100% (you keep all) |
| Priority fee | Auto-optimized | Manual |
| Gasless | Automatic | Not available |
| Integrator fee | Via referral | Via platformFeeBps |
| Integrator payer | Supported | Not available |

---

## Common Fee & Transaction Questions

### Priority Fees & Jito Tips

**Does Ultra API support Jito tips?**
- Yes, Ultra API uses Jupiter Beam which includes Jito integration automatically.
- You don't need to configure Jito manually with Ultra.

**With Metis API:**
- You must handle priority fees and Jito tips yourself.
- Add compute budget instructions to your transaction.

```typescript
// Metis: Jito tip configuration
const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse: quote,
    prioritizationFeeLamports: {
      jitoTipLamports: 1000000, // 0.001 SOL tip
    },
  }),
}).then(r => r.json());
```

### Wrapped SOL (WSOL)

**When swapping from SOL:**
- Jupiter automatically handles wrapping/unwrapping
- Use the native SOL mint: `So11111111111111111111111111111111111111112`
- No need to pre-wrap SOL

**Token account creation:**
- Ultra: Automatic ATA creation
- Metis: Set `wrapAndUnwrapSol: true` (default) in `/swap` request

```typescript
// Metis: SOL handling options
const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse: quote,
    wrapAndUnwrapSol: true, // Auto wrap input SOL, unwrap output SOL
  }),
}).then(r => r.json());
```

## Lend Fees
There are no fees to use the Earn Protocol on Jupiter Lend.

## References

- [Add Fees to Ultra](https://dev.jup.ag/docs/ultra/add-fees-to-ultra)
- [Add Fees to Metis](https://dev.jup.ag/docs/swap/add-fees-to-swap)
- [Referral Program](https://dev.jup.ag/tool-kits/referral-program)
