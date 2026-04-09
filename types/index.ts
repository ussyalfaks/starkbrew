// types/index.ts

export interface CreatorProfile {
  slug: string;              // URL slug e.g. "alex"
  name: string;
  bio: string;
  avatarEmoji: string;       // e.g. "☕"
  avatarUrl?: string;        // uploaded image URL (Uploadthing)
  coffeePrice: string;       // USDC per coffee e.g. "3.00"
  walletAddress: string;
  goalAmount?: string;       // optional goal e.g. "150.00"
  goalLabel?: string;        // e.g. "New microphone"
  totalRaised: string;       // running total
  supporterCount: number;
  createdAt: number;
}

export interface Support {
  id: string;
  creatorSlug: string;
  supporterName: string;
  message: string;
  coffees: number;
  amount: string;            // USDC
  token: string;             // "USDC" | "STRK" | "ETH"
  txHash: string;
  timestamp: number;
}

export interface WalletState {
  address: string;
  connected: boolean;
}
