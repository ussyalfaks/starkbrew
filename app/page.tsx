'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useStore } from '@/store';
import { onboardCreator } from '@/lib/starkzap';
import { Button, Badge, CoffeeCup, toast } from '@/components/ui';

interface Creator {
  slug: string;
  name: string;
  bio: string;
  avatar_emoji: string;
  total_raised: string;
  supporter_count: number;
}

export default function HomePage() {
  const [connecting, setConnecting] = useState(false);
  const [pendingConnect, setPendingConnect] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const { wallet, setWallet, profile } = useStore();
  const router = useRouter();
  const { ready, authenticated, login, getAccessToken } = usePrivy();

  useEffect(() => {
    fetch('/api/creators')
      .then((r) => r.json())
      .then((data) => setCreators(Array.isArray(data) ? data : []))
      .catch(() => setCreators([]))
      .finally(() => setCreatorsLoading(false));
  }, []);

  // After Privy login completes, proceed with wallet onboarding
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
      toast('Wallet connected!');
    } catch (e: any) {
      toast(e.message || 'Failed to connect', 'error');
    }
    setConnecting(false);
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px 100px' }}>
      {/* Hero */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
        <div className="animate-float" style={{ fontSize: 64, marginBottom: 20, display: 'block' }}>☕</div>

        <div style={{ marginBottom: 16 }}>
          <Badge variant="gold">
            <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
            Powered by Starkzap
          </Badge>
        </div>

        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(2.4rem, 7vw, 3.6rem)',
          fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.05,
          color: 'var(--brown)', marginBottom: 18,
        }}>
          Let your fans buy<br />
          <em style={{ fontStyle: 'italic', color: 'var(--brown3)' }}>you a coffee</em>
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--text2)', maxWidth: 380, margin: '0 auto 36px' }}>
          Accept USDC support on Starknet. Fans pay with any token — zero gas fees,
          instant settlement, no crypto knowledge needed.
        </p>

        {wallet ? (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {profile ? (
              <>
                <Button size="lg" onClick={() => router.push('/dashboard')}>My dashboard →</Button>
                <Button size="lg" variant="ghost" onClick={() => router.push(`/c/${profile.slug}`)}>View page</Button>
              </>
            ) : (
              <Button size="lg" onClick={() => router.push('/setup')}>Set up my page →</Button>
            )}
          </div>
        ) : (
          <Button size="lg" onClick={handleConnect} loading={connecting || !ready} style={{ minWidth: 240 }}>
            {connecting ? 'Connecting...' : 'Get started — it\'s free →'}
          </Button>
        )}

        {!wallet && (
          <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            Via Privy · Email / social login · No seed phrases
          </p>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => router.push('/explore')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)', textDecoration: 'underline' }}
          >
            Browse creators →
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="animate-fade-up delay-1" style={{ marginBottom: 56 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 20, textAlign: 'center' }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            ['☕', 'Set your price', 'Choose how much one coffee costs — e.g. $3 USDC'],
            ['🔗', 'Share your link', 'starkbrew.xyz/c/yourname — share anywhere'],
            ['💰', 'Receive support', 'USDC lands in your wallet. Gas is on us.'],
          ].map(([emoji, title, desc]) => (
            <div key={title} style={{ textAlign: 'center', padding: '20px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: '0 1px 4px rgba(44,26,14,0.05)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--brown)' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live creator pages */}
      {(creatorsLoading || creators.length > 0) && (
        <div className="animate-fade-up delay-2" style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 16, textAlign: 'center' }}>
            Live pages
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {creatorsLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} style={{ height: 72, background: 'var(--cream2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', opacity: 0.6 }} />
              ))
            ) : (
              creators.slice(0, 5).map((c) => (
                <a key={c.slug} href={`/c/${c.slug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: '0 1px 4px rgba(44,26,14,0.04)' }}>
                  <div style={{ fontSize: 28, width: 44, height: 44, background: 'var(--cream2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.avatar_emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--brown)', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.bio}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--brown)', marginBottom: 2 }}>${c.total_raised}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{c.supporter_count} ☕</div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}

      {/* Features strip */}
      <div className="animate-fade-up delay-3">
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          {['$0 gas fees', 'USDC / STRK / ETH','StarZap', 'Auto-swap via AVNU', 'Privy auth', 'Starknet', 'Instant settlement'].map(f => (
            <Badge key={f} variant="muted">{f}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
