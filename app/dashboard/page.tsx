'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { networkTokens, Amount } from '@/lib/starkzap';
import { Button, Card, Badge, StatCard, ProgressBar, Divider, toast } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { wallet, profile, updateProfile, supports } = useStore();
  const [balance, setBalance] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    wallet.balanceOf(networkTokens.USDC).then(b => setBalance(b.toFormatted(true)));
  }, [wallet]);

  if (!wallet || !profile) { router.push('/'); return null; }

  const creatorSupports = supports.filter(s => s.creatorSlug === profile.slug);
  const pageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${profile.slug}`;
  const totalNum = parseFloat(profile.totalRaised);
  const goalNum = parseFloat(profile.goalAmount || '0');
  const goalPct = goalNum > 0 ? (totalNum / goalNum) * 100 : 0;

  function copyLink() {
    navigator.clipboard?.writeText(pageUrl);
    setCopying(true);
    toast('Link copied! Share it everywhere ☕');
    setTimeout(() => setCopying(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '36px 24px 80px' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{ fontSize: 44 }}>{profile.avatarEmoji}</div>
        )}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--brown)', marginBottom: 2 }}>{profile.name}</h2>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>starkbrew.xyz/c/{profile.slug}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => router.push('/withdraw')}>Withdraw</Button>
          <Button size="sm" variant="ghost" onClick={() => router.push('/setup')}>Edit</Button>
        </div>
      </div>

      {/* Share link */}
      <div className="animate-fade-up delay-1" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pageUrl}
          </div>
          <Button onClick={copyLink} style={{ flexShrink: 0 }}>
            {copying ? 'Copied! ✓' : 'Copy link'}
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/c/${profile.slug}`)} style={{ flexShrink: 0 }}>
            View →
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Total raised" value={`$${totalNum.toFixed(2)}`} sub="USDC" />
        <StatCard label="Supporters" value={String(profile.supporterCount)} sub={`${profile.supporterCount === 1 ? 'person' : 'people'}`} />
        <StatCard label="Coffees" value={String(creatorSupports.reduce((s, x) => s + x.coffees, 0))} sub="sent" />
        <StatCard label="Wallet balance" value={balance ?? '...'} sub="live" />
      </div>

      {/* Goal progress */}
      {profile.goalAmount && profile.goalLabel && (
        <div className="animate-fade-up delay-2" style={{ marginBottom: 24 }}>
          <Card style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--brown)' }}>{profile.goalLabel}</div>
              <Badge variant="gold">${totalNum.toFixed(2)} / ${parseFloat(profile.goalAmount).toFixed(2)}</Badge>
            </div>
            <ProgressBar value={goalPct} label={`Funding goal`} />
          </Card>
        </div>
      )}

      {/* Wallet address */}
      <div className="animate-fade-up delay-2" style={{ marginBottom: 24 }}>
        <Card style={{ padding: '12px 16px', background: 'var(--cream2)', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 4 }}>Receiving wallet</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brown2)' }}>
                {wallet.address.slice(0, 10)}…{wallet.address.slice(-6)}
              </div>
            </div>
            <Badge variant="gold">
              <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
              Active
            </Badge>
          </div>
        </Card>
      </div>

      {/* Earnings breakdown by token */}
      {creatorSupports.length > 0 && (
        <div className="animate-fade-up delay-2" style={{ marginBottom: 24 }}>
          <Card style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 14 }}>
              Earnings by token
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['USDC', 'STRK', 'ETH'] as const).map(t => {
                const tokenSupports = creatorSupports.filter(s => s.token === t);
                if (tokenSupports.length === 0) return null;
                const total = tokenSupports.reduce((s, x) => s + parseFloat(x.amount), 0);
                const pct = totalNum > 0 ? (total / totalNum) * 100 : 0;
                return (
                  <div key={t}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--brown2)' }}>{t}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                        ${total.toFixed(2)} · {tokenSupports.length} {tokenSupports.length === 1 ? 'tx' : 'txs'}
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--cream2)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: t === 'USDC' ? 'var(--green)' : t === 'STRK' ? 'var(--gold)' : 'var(--brown3)', borderRadius: 100, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <Card style={{ padding: '14px 16px', cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push(`/c/${profile.slug}`)}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>👁</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brown)', marginBottom: 2 }}>View page</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>See your public profile</div>
        </Card>
        <Card style={{ padding: '14px 16px', cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/withdraw')}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>💸</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brown)', marginBottom: 2 }}>Withdraw</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Move funds to any wallet</div>
        </Card>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {/* Support feed */}
      <div className="animate-fade-up delay-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)' }}>
            Recent supporters
          </div>
          <Badge variant="muted">{creatorSupports.length} total</Badge>
        </div>

        {creatorSupports.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '36px 20px', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>☕</div>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>No supporters yet. Share your link!</p>
            <Button size="sm" variant="secondary" onClick={copyLink}>Copy your link</Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {creatorSupports.map(s => (
              <Card key={s.id} style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 20, marginTop: 2 }}>☕</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--brown)' }}>{s.supporterName}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Badge variant="gold">{'☕'.repeat(Math.min(s.coffees, 5))} ×{s.coffees}</Badge>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown2)' }}>${s.amount}</span>
                      </div>
                    </div>
                    {s.message && <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6 }}>&ldquo;{s.message}&rdquo;</p>}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>
                        {new Date(s.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>via {s.token}</span>
                      <a href={`https://sepolia.voyager.online/tx/${s.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--brown3)', textDecoration: 'none' }}>
                        tx ↗
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
