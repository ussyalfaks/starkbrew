'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useStore } from '@/store';
import { onboardCreator } from '@/lib/starkzap';
import { Badge, Button } from '@/components/ui';

export function Nav() {
  const { wallet, profile, setWallet, setProfile, clearWallet, hasConnected, setHasConnected } = useStore();
  const { ready, authenticated, login, logout, getAccessToken } = usePrivy();
  const [connecting, setConnecting] = useState(false);
  const [pendingConnect, setPendingConnect] = useState(false);
  const reconnectAttempted = useRef(false);

  const short = wallet?.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : null;

  // On page refresh: if user had previously connected and Privy session is still active,
  // silently restore the wallet without requiring a click.
  // Also restores the profile from the DB in case localStorage was cleared.
  useEffect(() => {
    if (!ready || !authenticated || wallet || !hasConnected || reconnectAttempted.current) return;
    reconnectAttempted.current = true;
    onboardCreator(getAccessToken)
      .then(async (w) => {
        setWallet(w);
        if (!profile) {
          const res = await fetch(`/api/my-profile?address=${w.address}`);
          if (res.ok) {
            const data = await res.json();
            if (data && !data.error) {
              setProfile({
                slug: data.slug,
                name: data.name,
                bio: data.bio,
                avatarEmoji: data.avatar_emoji,
                avatarUrl: data.avatar_url || undefined,
                coffeePrice: data.coffee_price,
                walletAddress: data.wallet_address,
                goalAmount: data.goal_amount || undefined,
                goalLabel: data.goal_label || undefined,
                totalRaised: data.total_raised,
                supporterCount: data.supporter_count,
                createdAt: data.created_at,
              });
            }
          }
        }
      })
      .catch(() => { reconnectAttempted.current = false; });
  }, [ready, authenticated, wallet, hasConnected, getAccessToken, setWallet, setProfile, profile]);

  // After Privy login modal completes, proceed with wallet onboarding
  useEffect(() => {
    if (pendingConnect && authenticated) {
      setPendingConnect(false);
      handleConnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, pendingConnect]);

  async function handleConnect() {
    if (!authenticated) {
      setPendingConnect(true);
      login();
      return;
    }
    setConnecting(true);
    try {
      const w = await onboardCreator(getAccessToken);
      setWallet(w);
      setHasConnected(true); // persist the fact that user explicitly connected
    } catch {
      // silently fail — user can retry
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    setHasConnected(false);
    clearWallet();
    await logout();
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(250,246,239,0.88)', backdropFilter: 'blur(14px)',
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>☕</span>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--brown)', letterSpacing: '-0.02em' }}>
          StarkBrew
        </span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
          color: '#7c5c2e', background: '#f5e9c8', border: '1px solid #e0c97a',
          borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Sepolia
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/explore" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
          Explore
        </Link>
        <Link href="/membership" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
          Membership
        </Link>
        <Link href="/shop" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
          Shop
        </Link>
        {profile && (
          <>
            <Link href="/dashboard" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
              Dashboard
            </Link>
            <Link href="/withdraw" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
              Withdraw
            </Link>
          </>
        )}

        {wallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge variant="gold">
              <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
              {short}
            </Badge>
            <button
              onClick={handleDisconnect}
              title="Disconnect"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 4, borderRadius: 4, color: 'var(--text3)',
                lineHeight: 1,
              }}
            >
              {/* Power / disconnect icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            loading={connecting || (pendingConnect && !authenticated) || !ready}
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </Button>
        )}
      </div>
    </nav>
  );
}
