// lib/starkzap.ts
// Real Starkzap SDK integration for production use

import { StarkZap, OnboardStrategy as OnboardStrategyEnum } from 'starkzap';

// Re-export for backwards compatibility
export { OnboardStrategyEnum as OnboardStrategy };

export interface Token {
  name: string; symbol: string; decimals: number; address: string;
}

export const mainnetTokens: Record<string, Token> = {
  USDC: { name: 'USD Coin',       symbol: 'USDC', decimals: 6,  address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8' },
  STRK: { name: 'Starknet Token', symbol: 'STRK', decimals: 18, address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' },
  ETH:  { name: 'Ether',          symbol: 'ETH',  decimals: 18, address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7' },
};

export const sepoliaTokens: Record<string, Token> = {
  USDC: { name: 'USD Coin',       symbol: 'USDC', decimals: 6,  address: '0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343' },
  STRK: { name: 'Starknet Token', symbol: 'STRK', decimals: 18, address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' },
  ETH:  { name: 'Ether',          symbol: 'ETH',  decimals: 18, address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7' },
};

export const networkTokens: Record<string, Token> =
  (process.env.NEXT_PUBLIC_NETWORK || 'sepolia') === 'mainnet' ? mainnetTokens : sepoliaTokens;

// ─── Amount class ────────────────────────────────────────────────────────────
export class Amount {
  private _raw: bigint;
  private _token: Token;

  constructor(raw: bigint, token: Token) { this._raw = raw; this._token = token; }

  static parse(human: string, token: Token): Amount {
    const raw = BigInt(Math.round((parseFloat(human) || 0) * 10 ** token.decimals));
    return new Amount(raw, token);
  }
  static fromRaw(raw: bigint, token: Token): Amount { return new Amount(raw, token); }

  toUnit(): string { return (Number(this._raw) / 10 ** this._token.decimals).toFixed(this._token.decimals <= 6 ? 2 : 4); }
  toFormatted(compressed = false): string {
    const val = Number(this._raw) / 10 ** this._token.decimals;
    const dp = compressed ? 2 : this._token.decimals <= 6 ? 2 : 4;
    return `${this._token.symbol} ${val.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
  }
  toBase(): bigint { return this._raw; }
  isZero(): boolean { return this._raw === 0n; }
  isPositive(): boolean { return this._raw > 0n; }
  add(o: Amount): Amount { return new Amount(this._raw + o._raw, this._token); }
  subtract(o: Amount): Amount { const r = this._raw - o._raw; return new Amount(r < 0n ? 0n : r, this._token); }
  multiply(n: number | string): Amount { const s = BigInt(Math.round(parseFloat(String(n)) * 1000)); return new Amount((this._raw * s) / 1000n, this._token); }
  gt(o: Amount): boolean  { return this._raw > o._raw; }
  gte(o: Amount): boolean { return this._raw >= o._raw; }
  lt(o: Amount): boolean  { return this._raw < o._raw; }
  eq(o: Amount): boolean  { return this._raw === o._raw; }
  getToken(): Token { return this._token; }
  getSymbol(): string { return this._token.symbol; }
}

// ─── Tx result ───────────────────────────────────────────────────────────────
export interface TxResult {
  transaction_hash: string;
  explorerUrl: string;
  wait: () => Promise<{ status: string }>;
}

export interface QuoteResult {
  amountInBase: bigint; amountOutBase: bigint;
  priceImpactBps: bigint; provider: string;
}

// ─── Wallet interface ────────────────────────────────────────────────────────
export interface WalletInterface {
  address: string;
  getChainId(): string;
  balanceOf(token: Token): Promise<Amount>;
  transfer(token: Token, recipients: { to: string; amount: Amount }[], opts?: { feeMode?: string }): Promise<TxResult>;
  swap(params: { tokenIn: Token; tokenOut: Token; amountIn: Amount; slippageBps?: bigint }, opts?: { feeMode?: string }): Promise<TxResult>;
  getQuote(params: { tokenIn: Token; tokenOut: Token; amountIn: Amount }): Promise<QuoteResult>;
  _creditUsdc?(amount: string): void;
}

// ─── Starkzap SDK Wrapper ────────────────────────────────────────────────────
// Wrapper class to adapt StarkZap wallet to our WalletInterface
class StarkZapWalletAdapter implements WalletInterface {
  private wallet: any; // StarkZap wallet instance
  address: string;

  constructor(wallet: any) {
    this.wallet = wallet;
    this.address = wallet.address;
  }

  getChainId(): string {
    return this.wallet.getChainId();
  }

  async balanceOf(token: Token): Promise<Amount> {
    const balance = await this.wallet.balanceOf(token.address);
    return Amount.fromRaw(balance, token);
  }

  async transfer(
    token: Token,
    recipients: { to: string; amount: Amount }[],
    opts?: { feeMode?: string }
  ): Promise<TxResult> {
    const calls = recipients.map(r => ({
      contractAddress: token.address,
      entrypoint: 'transfer',
      calldata: [r.to, r.amount.toBase().toString(), '0'],
    }));

    const tx = await this.wallet.execute(calls, { feeMode: opts?.feeMode });
    const network = process.env.NEXT_PUBLIC_NETWORK || 'sepolia';
    const explorerBase = network === 'mainnet'
      ? 'https://voyager.online'
      : 'https://sepolia.voyager.online';

    return {
      transaction_hash: tx.transaction_hash,
      explorerUrl: `${explorerBase}/tx/${tx.transaction_hash}`,
      wait: async () => {
        await this.wallet.waitForTransaction(tx.transaction_hash);
        return { status: 'ACCEPTED_ON_L2' };
      },
    };
  }

  async swap(
    params: { tokenIn: Token; tokenOut: Token; amountIn: Amount; slippageBps?: bigint },
    opts?: { feeMode?: string }
  ): Promise<TxResult> {
    const swapParams = {
      tokenInAddress: params.tokenIn.address,
      tokenOutAddress: params.tokenOut.address,
      amountIn: params.amountIn.toBase().toString(),
      slippageBps: Number(params.slippageBps || 100n),
    };

    const tx = await this.wallet.swap(swapParams, { feeMode: opts?.feeMode });
    const network = process.env.NEXT_PUBLIC_NETWORK || 'sepolia';
    const explorerBase = network === 'mainnet'
      ? 'https://voyager.online'
      : 'https://sepolia.voyager.online';

    return {
      transaction_hash: tx.transaction_hash,
      explorerUrl: `${explorerBase}/tx/${tx.transaction_hash}`,
      wait: async () => {
        await this.wallet.waitForTransaction(tx.transaction_hash);
        return { status: 'ACCEPTED_ON_L2' };
      },
    };
  }

  async getQuote(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: Amount;
  }): Promise<QuoteResult> {
    const quote = await this.wallet.getQuote({
      tokenInAddress: params.tokenIn.address,
      tokenOutAddress: params.tokenOut.address,
      amountIn: params.amountIn.toBase().toString(),
    });

    return {
      amountInBase: BigInt(quote.amountIn),
      amountOutBase: BigInt(quote.amountOut),
      priceImpactBps: BigInt(quote.priceImpactBps || 0),
      provider: quote.provider || 'avnu',
    };
  }
}

// ─── SDK Instance ─────────────────────────────────────────────────────────────
const network = (process.env.NEXT_PUBLIC_NETWORK as 'mainnet' | 'sepolia') || 'sepolia';

const sdk = new StarkZap({
  network,
  paymaster: { nodeUrl: '/api/paymaster' },
});

// ─── Public API ───────────────────────────────────────────────────────────────
let _creatorWallet: WalletInterface | null = null;

async function resolvePrivySignerContext(getAccessToken: () => Promise<string | null>) {
  const token = await getAccessToken();
  const response = await fetch('/api/signer-context', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Signer context failed (${response.status})`);
  }
  const ctx = await response.json();
  // Attach the auth token as a header for signing requests
  return {
    ...ctx,
    headers: async () => {
      const t = await getAccessToken();
      return t ? { Authorization: `Bearer ${t}` } : {};
    },
  };
}

export async function onboardCreator(getAccessToken: () => Promise<string | null>): Promise<WalletInterface> {
  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategyEnum.Privy,
    privy: { resolve: () => resolvePrivySignerContext(getAccessToken) },
    accountPreset: 'argentXV050',
    feeMode: 'sponsored',
    deploy: 'if_needed',
  });

  const adapter = new StarkZapWalletAdapter(wallet);
  _creatorWallet = adapter;
  return adapter;
}

export async function onboardSupporter(getAccessToken: () => Promise<string | null>): Promise<WalletInterface> {
  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategyEnum.Privy,
    privy: { resolve: () => resolvePrivySignerContext(getAccessToken) },
    accountPreset: 'argentXV050',
    feeMode: 'sponsored',
    deploy: 'if_needed',
  });

  return new StarkZapWalletAdapter(wallet);
}

export async function sendCoffee(
  supporterWallet: WalletInterface,
  creatorAddress: string,
  usdcAmount: string,
  payWithToken = 'USDC',
  onProgress?: (msg: string) => void,
): Promise<TxResult> {
  const USDC = networkTokens.USDC;
  const payToken = networkTokens[payWithToken] ?? USDC;

  // If paying in non-USDC, swap first then transfer
  if (payWithToken !== 'USDC') {
    onProgress?.(`Checking ${payWithToken} balance…`);
    const amountIn = Amount.parse(usdcAmount, payToken);
    const payBalance = await supporterWallet.balanceOf(payToken);
    if (payBalance.lt(amountIn)) {
      throw new Error(
        `Insufficient ${payWithToken} balance. You have ${payBalance.toFormatted(true)} but need approximately ${amountIn.toFormatted(true)}.`
      );
    }

    onProgress?.(`Getting quote: ${payWithToken} → USDC...`);
    const q = await supporterWallet.getQuote({ tokenIn: payToken, tokenOut: USDC, amountIn });
    const outVal = (Number(q.amountOutBase) / 10 ** USDC.decimals).toFixed(2);

    onProgress?.(`Swapping ${payWithToken} → ${outVal} USDC via AVNU...`);
    // REAL: wallet.swap({ tokenIn, tokenOut, amountIn, slippageBps: 100n }, { feeMode: 'sponsored' })
    const swapTx = await supporterWallet.swap({ tokenIn: payToken, tokenOut: USDC, amountIn, slippageBps: 100n }, { feeMode: 'sponsored' });
    await swapTx.wait();

    onProgress?.('Sending USDC to creator...');
    // REAL: wallet.transfer(USDC, [{ to: creatorAddress, amount }], { feeMode: 'sponsored' })
    const tx = await supporterWallet.transfer(USDC, [{ to: creatorAddress, amount: Amount.parse(outVal, USDC) }], { feeMode: 'sponsored' });
    await tx.wait();
    return tx;
  }

  onProgress?.('Checking balance…');
  const needed = Amount.parse(usdcAmount, USDC);
  const balance = await supporterWallet.balanceOf(USDC);
  if (balance.lt(needed)) {
    throw new Error(
      `Insufficient USDC balance. You have ${balance.toFormatted(true)} but need ${needed.toFormatted(true)}. ` +
      `Get Sepolia USDC from a faucet to continue.`
    );
  }

  onProgress?.('Sending USDC...');
  const tx = await supporterWallet.transfer(USDC, [{ to: creatorAddress, amount: needed }], { feeMode: 'sponsored' });
  await tx.wait();
  return tx;
}

export function getCreatorWallet() { return _creatorWallet; }
