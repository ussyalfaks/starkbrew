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
  const [menuOpen, setMenuOpen] = useState(false);
  const reconnectAttempted = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const short = wallet?.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : null;

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Close menu on route change (resize to desktop)
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMenuOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setHasConnected(true);
    } catch {
      // silently fail — user can retry
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    setHasConnected(false);
    clearWallet();
    setMenuOpen(false);
    await logout();
  }

  const navLinks = (
    <>
      <Link href="/explore" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
        Explore
      </Link>
      <Link href="/membership" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
        Membership
      </Link>
      <Link href="/shop" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
        Shop
      </Link>
      {profile && (
        <>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
            Dashboard
          </Link>
          <Link href="/withdraw" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
            Withdraw
          </Link>
        </>
      )}
    </>
  );

  const walletSection = wallet ? (
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
  );

  return (
    <nav ref={menuRef} style={{
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(250,246,239,0.88)', backdropFilter: 'blur(14px)',
    }}>
      <style>{`
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
        }
        .nav-links-desktop {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--text2);
          align-items: center;
          justify-content: center;
        }
        .nav-mobile-menu {
          display: none;
        }
        @media (max-width: 767px) {
          .nav-links-desktop {
            display: none;
          }
          .nav-hamburger {
            display: flex;
          }
          .nav-mobile-menu {
            display: flex;
            flex-direction: column;
            gap: 0;
            border-top: 1px solid var(--border);
            padding: 8px 0 12px;
            animation: fadeIn .18s ease forwards;
          }
          .nav-mobile-menu a, .nav-mobile-link {
            display: block;
            padding: 10px 24px;
            font-family: var(--mono);
            font-size: 13px;
            color: var(--text2);
            text-decoration: none;
          }
          .nav-mobile-menu a:hover, .nav-mobile-link:hover {
            background: var(--cream2);
          }
          .nav-mobile-divider {
            height: 1px;
            background: var(--border);
            margin: 8px 24px;
          }
          .nav-mobile-wallet {
            padding: 4px 24px 0;
          }
        }
      `}</style>

      <div className="nav-inner">
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

        {/* Desktop links */}
        <div className="nav-links-desktop">
          {navLinks}
          {walletSection}
        </div>

        {/* Mobile: hamburger button */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
            {menuOpen ? (
              /* X icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          {navLinks}
          <div className="nav-mobile-divider" />
          <div className="nav-mobile-wallet">
            {walletSection}
          </div>
        </div>
      )}
    </nav>
  );
}
