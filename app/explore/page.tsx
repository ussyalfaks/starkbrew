'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';

interface Creator {
  slug: string;
  name: string;
  bio: string;
  avatar_emoji: string;
  coffee_price: string;
  total_raised: string;
  supporter_count: number;
  goal_amount: string | null;
  goal_label: string | null;
}

export default function ExplorePage() {
  const router = useRouter();
  const { profile } = useStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creators')
      .then(r => r.ok ? r.json() : [])
      .then((data: Creator[]) => {
        setCreators(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, color: 'var(--brown)', marginBottom: 8, letterSpacing: '-0.025em' }}>
          Explore creators
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          Support creators you love with a coffee. Zero gas. Instant.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '60px 0', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Loading creators…
        </div>
      ) : creators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 20 }}>No creators yet. Be the first!</p>
          <Button onClick={() => router.push('/')}>Create my page →</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {creators.map((c, i) => {
            const totalNum = parseFloat(c.total_raised);
            const goalNum  = parseFloat(c.goal_amount ?? '0');
            const pct      = goalNum > 0 ? Math.min(100, (totalNum / goalNum) * 100) : 0;
            const isMe     = profile?.slug === c.slug;

            return (
              <div key={c.slug} className={`animate-fade-up${i > 0 ? ` delay-${Math.min(i, 5)}` : ''}`}>
                <Card
                  elevated
                  onClick={() => router.push(`/c/${c.slug}`)}
                  style={{ cursor: 'pointer', padding: '20px 18px', transition: 'box-shadow 0.2s', height: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{c.avatar_emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--brown)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        {isMe && <Badge variant="gold">you</Badge>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{c.bio}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: goalNum > 0 ? 10 : 0, fontSize: 12 }}>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>☕ {c.supporter_count} supporters</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brown2)' }}>${totalNum.toFixed(2)}</span>
                  </div>

                  {goalNum > 0 && c.goal_label && (
                    <ProgressBar value={pct} label={c.goal_label} />
                  )}

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown)' }}>${c.coffee_price} / ☕</span>
                    <span style={{ fontSize: 12, color: 'var(--brown3)', fontFamily: 'var(--mono)' }}>Buy a coffee →</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      {!loading && creators.length > 0 && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 14 }}>Want your own page?</p>
          <Button onClick={() => router.push('/')}>Create my page →</Button>
        </div>
      )}
    </div>
  );
}
