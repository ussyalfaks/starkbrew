// store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreatorProfile, Support } from '@/types';
import type { WalletInterface } from '@/lib/starkzap';

interface AppState {
  // Runtime wallet (not persisted)
  wallet: WalletInterface | null;
  setWallet: (w: WalletInterface) => void;

  // Creator profile (persisted)
  profile: CreatorProfile | null;
  setProfile: (p: CreatorProfile) => void;
  updateProfile: (patch: Partial<CreatorProfile>) => void;

  // Support feed (persisted)
  supports: Support[];
  addSupport: (s: Support) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      wallet: null,
      setWallet: (wallet) => set({ wallet }),

      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (patch) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...patch } : null })),

      supports: [],
      addSupport: (s) =>
        set((state) => ({
          supports: [s, ...state.supports].slice(0, 100), // keep latest 100
        })),
    }),
    {
      name: 'starkbrew-store',
      partialize: (s) => ({ profile: s.profile, supports: s.supports }),
    }
  )
);

// Helper: build a fresh profile
export function buildProfile(
  name: string,
  bio: string,
  avatarEmoji: string,
  coffeePrice: string,
  walletAddress: string,
  goalAmount?: string,
  goalLabel?: string,
): CreatorProfile {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    slug,
    name,
    bio,
    avatarEmoji,
    coffeePrice,
    walletAddress,
    goalAmount,
    goalLabel,
    totalRaised: '0.00',
    supporterCount: 0,
    createdAt: Date.now(),
  };
}
