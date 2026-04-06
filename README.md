# StarkBrew — Buy Me a Coffee on Starknet

Accept USDC support from fans on Starknet. Zero gas fees. Any token. Instant settlement. No custom smart contract required.

## Live demo flow

1. Visit `/` → connect wallet (email via Privy)
2. Visit `/setup` → set name, bio, price, optional goal
3. Share your `/c/yourname` link
4. Fans buy you coffees with USDC, STRK, or ETH
5. Visit `/dashboard` to see supporters and earnings
6. Visit `/withdraw` to move funds to any Starknet address

---

## Project structure

```
starkbrew/
├── app/
│   ├── page.tsx                    Home — hero, how it works, explore CTA
│   ├── layout.tsx                  Root layout, Nav, ambient glow, ToastContainer
│   ├── globals.css                 Fraunces display + DM Sans + DM Mono
│   ├── not-found.tsx               Global 404
│   ├── setup/page.tsx              3-step wizard — create or edit profile
│   ├── dashboard/page.tsx          Creator dashboard — stats, feed, quick actions
│   ├── withdraw/page.tsx           Withdraw USDC/STRK/ETH to any address
│   ├── explore/page.tsx            Browse all creator pages
│   ├── c/[slug]/
│   │   ├── page.tsx                Public creator page (coffee picker, pay widget)
│   │   ├── loading.tsx             Skeleton loader
│   │   └── metadata.ts             og:image / Twitter card helpers
│   └── api/
│       ├── paymaster/route.ts      AVNU paymaster proxy
│       ├── signer-context/route.ts Privy signer relay
│       ├── support/route.ts        On-chain support webhook (Apibara indexer)
│       └── creator/[slug]/route.ts Public creator profile API
├── components/
│   ├── Nav.tsx                     Sticky nav — Explore, Dashboard, Withdraw
│   └── ui/index.tsx                Button, Input, Card, Badge, Spinner,
│                                   Steps, ProgressBar, StatCard, CoffeeCup,
│                                   Divider, Toast
├── lib/starkzap.ts                 Starkzap SDK abstraction
│                                   (mock internals, real API signatures)
├── store/index.ts                  Zustand store — persisted to localStorage
├── types/index.ts                  TypeScript types
├── .env.local.example              Environment template
└── README.md
```

---

## Running locally

```bash
# 1. Unpack and install
tar xf starkbrew.tar
cd starkbrew
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local — add AVNU_API_KEY and Privy credentials

# 3. Run
npm run dev
# → http://localhost:3000
```

---

## Going to production

### Step 1 — Install the real SDK

```bash
npm install starkzap
```

### Step 2 — Replace the mock in `lib/starkzap.ts`

The entire file is structured around real Starkzap API signatures. Only the mock class internals need replacing. Uncomment the real SDK block in `onboardCreator()`:

```ts
import { StarkZap, OnboardStrategy, accountPresets } from 'starkzap';

const sdk = new StarkZap({
  network: process.env.NEXT_PUBLIC_NETWORK as 'mainnet' | 'sepolia',
  paymaster: { nodeUrl: '/api/paymaster' }, // your server-side proxy
});

export async function onboardCreator(): Promise<WalletInterface> {
  // privy is your frontend Privy client instance
  const accessToken = await privy.getAccessToken();

  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategy.Privy,
    privy: {
      resolve: async () =>
        fetch('/api/signer-context', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()),
    },
    accountPreset: accountPresets.argentXV050,
    feeMode: 'sponsored',   // AVNU covers all gas
    deploy: 'if_needed',    // auto-deploys Argent wallet on first use
  });

  return wallet;
}
```

The payment calls are already correct:

```ts
// Send USDC directly — no contract needed
await wallet.transfer(USDC, [{ to: creatorAddress, amount }], { feeMode: 'sponsored' });

// Swap STRK/ETH → USDC then transfer — no contract needed
await wallet.swap({ tokenIn: STRK, tokenOut: USDC, amountIn, slippageBps: 100n }, { feeMode: 'sponsored' });
```

### Step 3 — Add a database

Profiles are currently stored in `localStorage` via Zustand persist. For production, replace with Supabase, PlanetScale, or any Postgres:

```ts
// store/index.ts — replace persist with DB calls
// app/api/creator/[slug]/route.ts — already wired, just add DB query
```

### Step 4 — Set environment variables

```bash
NEXT_PUBLIC_NETWORK=mainnet
AVNU_API_KEY=            # from portal.avnu.fi — enables sponsored gas
NEXT_PUBLIC_PRIVY_APP_ID=   # from dashboard.privy.io
PRIVY_APP_SECRET=            # server-side only — never expose to client
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 5 — Apply for gas subsidies

AVNU's [Propulsion Program](https://docs.avnu.fi/docs/paymaster/propulsion-program) offers up to **$1M in gas subsidies** for qualifying apps. Apply once your page is live.

---

## Why no custom contract?

Every payment is a direct `wallet.transfer(USDC, recipients)` call on the existing USDC ERC20 contract already deployed on Starknet. Starkzap wraps this into one line. For non-USDC payments, `wallet.swap()` routes through AVNU first. No contract to write, audit, or deploy.

## V2 features that would need a contract

| Feature | Why a contract |
|---|---|
| Goal-based escrow | Hold funds until target hit, auto-refund if not |
| NFT supporter badge | ERC721 mint on payment |
| Revenue split | Auto-split payment between multiple creators |
| Recurring subscriptions | Time-locked streaming payments |
| Trustless milestones | Release tranches as goals are reached |

