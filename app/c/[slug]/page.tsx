'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePrivy } from '@privy-io/react-auth';
import { useStore } from '@/store';
import { onboardSupporter, sendCoffee } from '@/lib/starkzap';
import { Button, Card, Badge, ProgressBar, toast } from '@/components/ui';
import type { CreatorProfile, Support } from '@/types';

export default function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('');
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [supports, setSupports] = useState<Support[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [coffees, setCoffees] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const qrOverlayRef = useRef<HTMLDivElement>(null);

  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const { wallet, setWallet, addSupport } = useStore();

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/creator/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) { setNotFound(true); setLoading(false); return; }
        setCreator({
          slug: data.slug,
          name: data.name,
          bio: data.bio,
          avatarEmoji: data.avatar_emoji,
          avatarUrl: data.avatar_url || undefined,
          coffeePrice: data.coffee_price,
          walletAddress: data.wallet_address,
          goalAmount: data.goal_amount,
          goalLabel: data.goal_label,
          totalRaised: data.total_raised,
          supporterCount: data.supporter_count,
          createdAt: data.created_at,
        });
        setLoading(false);
      });

    fetch(`/api/supports/${slug}`)
      .then(r => r.ok ? r.json() : [])
      .then(setSupports)
      .catch(() => {});
  }, [slug]);

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', color: 'var(--text3)' }}>
      Loading…
    </div>
  );

  if (notFound || !creator) return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
      <h2 style={{ fontFamily: 'var(--display)', color: 'var(--brown)' }}>Creator not found</h2>
      <p style={{ color: 'var(--text2)' }}>This page doesn't exist yet.</p>
    </div>
  );

  const totalNum = parseFloat(creator.totalRaised);
  const goalNum = parseFloat(creator.goalAmount || '0');
  const goalPct = goalNum > 0 ? Math.min((totalNum / goalNum) * 100, 100) : 0;
  const coffeeTotal = (parseFloat(creator.coffeePrice) * coffees).toFixed(2);

  const creatorUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/c/${slug}`
    : `https://starkbrew.xyz/c/${slug}`;

  const twitterText = `❯ I'm on starkbrew. If you like my work, you can buy me a coffee and share your thoughts 🎉☕ ${creatorUrl}`;

  function handleTwitterShare() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  async function handleCopyLink() {
    await navigator.clipboard?.writeText(creatorUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleSupport() {
    if (!ready) return;
    if (!authenticated) { login(); return; }

    setPaying(true);
    try {
      let w = wallet;
      if (!w) {
        setProgress('Setting up your wallet…');
        w = await onboardSupporter(getAccessToken);
        setWallet(w);
      }

      const tx = await sendCoffee(w, creator!.walletAddress, coffeeTotal, 'USDC', setProgress);
      await tx.wait();

      // Record support
      const support: Support = {
        id: tx.transaction_hash,
        creatorSlug: creator!.slug,
        supporterName: name || 'Anonymous',
        message,
        coffees,
        amount: coffeeTotal,
        token: 'USDC',
        txHash: tx.transaction_hash,
        timestamp: Date.now(),
      };
      addSupport(support);
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: tx.transaction_hash,
          fromAddress: w.address,
          toAddress: creator!.walletAddress,
          amountUsdc: coffeeTotal,
          token: 'USDC',
          blockNumber: 0,
          timestamp: Date.now(),
          supporterName: name || 'Anonymous',
          message,
          coffees,
          creatorSlug: creator!.slug,
        }),
      });

      setDone(true);
      toast('Thanks for the coffee! ☕');
    } catch (e: any) {
      toast(e.message || 'Payment failed', 'error');
    }
    setPaying(false);
    setProgress('');
  }

  if (done) return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div className="animate-fade-up">
        <div style={{ fontSize: 64, marginBottom: 16 }}>☕</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>
          Coffee sent!
        </h2>
        <p style={{ color: 'var(--text2)', marginBottom: 4 }}>
          You bought {coffees} coffee{coffees > 1 ? 's' : ''} for {creator.name}.
        </p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 28 }}>
          Gas: $0.00 · sponsored by AVNU
        </p>
        <Button onClick={() => setDone(false)} variant="ghost">Send another</Button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Creator header */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 32 }}>
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, display: 'inline-block' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ fontSize: 64, marginBottom: 12 }}>{creator.avatarEmoji}</div>
        )}
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>
          {creator.name}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{creator.bio}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
          <span>☕ {creator.supporterCount} supporters</span>
          <span>· ${creator.totalRaised} raised</span>
        </div>
      </div>

      {/* Share bar */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
        <button
          onClick={handleTwitterShare}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border2)',
            background: '#fff', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brown2)',
            fontWeight: 500,
          }}
        >
          {/* X / Twitter icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </button>

        <button
          onClick={() => setQrOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border2)',
            background: '#fff', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brown2)',
            fontWeight: 500,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <line x1="14" y1="14" x2="14" y2="14" /><line x1="17" y1="14" x2="17" y2="14" />
            <line x1="20" y1="14" x2="20" y2="14" /><line x1="14" y1="17" x2="14" y2="17" />
            <line x1="17" y1="17" x2="17" y2="17" /><line x1="20" y1="20" x2="20" y2="20" />
            <line x1="20" y1="17" x2="20" y2="17" />
          </svg>
          QR Code
        </button>

        <button
          onClick={handleCopyLink}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border2)',
            background: '#fff', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 12,
            color: linkCopied ? 'var(--green)' : 'var(--brown2)',
            fontWeight: 500,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {linkCopied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* QR Code Modal */}
      {qrOpen && (
        <div
          ref={qrOverlayRef}
          onClick={(e) => { if (e.target === qrOverlayRef.current) setQrOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div className="animate-slide-up" style={{
            background: 'var(--cream)', borderRadius: 'var(--r-lg)',
            padding: '28px 28px 24px',
            boxShadow: '0 24px 60px rgba(44,26,14,0.18)',
            textAlign: 'center', maxWidth: 320, width: '100%',
          }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--brown)', marginBottom: 4 }}>
              Share {creator.name}'s page
            </div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>
              Scan to open this page
            </p>
            <div style={{ display: 'inline-flex', padding: 12, background: '#fff', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <QRCodeSVG
                value={creatorUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#2c1a0e"
                level="M"
                imageSettings={{
                  src: '/favicon.ico',
                  x: undefined,
                  y: undefined,
                  height: 28,
                  width: 28,
                  excavate: true,
                }}
              />
            </div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', wordBreak: 'break-all', marginBottom: 18 }}>
              {creatorUrl}
            </p>
            <button
              onClick={() => setQrOpen(false)}
              style={{
                background: 'var(--brown)', color: 'var(--cream)',
                border: 'none', borderRadius: 'var(--r-sm)',
                padding: '8px 24px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Goal */}
      {creator.goalAmount && creator.goalLabel && (
        <Card style={{ marginBottom: 24, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--brown)' }}>{creator.goalLabel}</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
              ${creator.totalRaised} / ${creator.goalAmount}
            </span>
          </div>
          <ProgressBar value={goalPct} />
        </Card>
      )}

      {/* Support form */}
      <Card elevated style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--brown)', marginBottom: 16 }}>
          Buy {creator.name} a coffee ☕
        </h3>

        {/* Coffee count */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1, 3, 5].map(n => (
            <button key={n} onClick={() => setCoffees(n)} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--r-sm)', border: '1px solid',
              fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: coffees === n ? 'var(--brown)' : '#fff',
              color: coffees === n ? 'var(--cream)' : 'var(--brown2)',
              borderColor: coffees === n ? 'var(--brown)' : 'var(--border)',
            }}>
              {'☕'.repeat(n)}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginBottom: 16 }}>
          {coffees} × ${creator.coffeePrice} = <strong style={{ color: 'var(--brown)' }}>${coffeeTotal} USDC</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input
            placeholder="Your name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontFamily: 'var(--font)', background: 'var(--cream2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
          <textarea
            placeholder="Leave a message… (optional)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontFamily: 'var(--font)', background: 'var(--cream2)', color: 'var(--text)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {wallet && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--cream2)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 2 }}>Your wallet</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--brown2)' }}>
                {wallet.address.slice(0, 10)}…{wallet.address.slice(-6)}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(wallet.address);
                setAddrCopied(true);
                setTimeout(() => setAddrCopied(false), 2000);
              }}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, color: addrCopied ? 'var(--green)' : 'var(--brown3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              {addrCopied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        )}

        {paying && progress && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brown3)', marginBottom: 10 }}>
            {progress}
          </p>
        )}

        <Button fullWidth size="lg" loading={paying || !ready} onClick={handleSupport}>
          {paying ? 'Processing…' : `Support $${coffeeTotal} USDC →`}
        </Button>
        <p style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
          Via Privy · Gas free · Powered by Starkzap
        </p>
      </Card>

      {/* Support feed */}
      {supports.length > 0 && (
        <div className="animate-fade-up delay-2">
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 12 }}>
            Recent supporters
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {supports.map(s => (
              <Card key={s.id} style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: s.message ? 4 : 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--brown)' }}>
                    {s.supporterName} <span style={{ fontWeight: 400 }}>bought {s.coffees} ☕</span>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>${s.amount}</span>
                </div>
                {s.message && (
                  <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{s.message}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
