'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useStore } from '@/store';
import { onboardCreator } from '@/lib/starkzap';
import { Badge, Button } from '@/components/ui';

export function Nav() {
  const { wallet, profile, setWallet, clearWallet, hasConnected, setHasConnected } = useStore();
  const { ready, authenticated, login, logout, getAccessToken } = usePrivy();
  const [connecting, setConnecting] = useState(false);
  const [pendingConnect, setPendingConnect] = useState(false);
  const reconnectAttempted = useRef(false);

  const short = wallet?.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : null;

  // On page refresh: if user had previously connected and Privy session is still active,
  // silently restore the wallet without requiring a click.
  useEffect(() => {
    if (!ready || !authenticated || wallet || !hasConnected || reconnectAttempted.current) return;
    reconnectAttempted.current = true;
    onboardCreator(getAccessToken)
      .then(setWallet)
      .catch(() => { reconnectAttempted.current = false; });
  }, [ready, authenticated, wallet, hasConnected, getAccessToken, setWallet]);

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
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/explore" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
          Explore
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
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)',
                padding: '2px 6px', borderRadius: 4,
                textDecoration: 'underline',
              }}
            >
              disconnect
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
