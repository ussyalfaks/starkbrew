'use client';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';

// Demo creators shown when no real profiles exist
const DEMO = [
  { slug: 'maya', name: 'Maya Chen', emoji: '🎨', bio: 'Indie game developer & pixel artist. Building my first commercial title.', coffeePrice: '3.00', totalRaised: '126.00', supporterCount: 42, goalAmount: '300.00', goalLabel: 'New drawing tablet' },
  { slug: 'luca', name: 'Luca Romano', emoji: '🎵', bio: 'Open-source music producer. All my beats are free — keep me caffeinated!', coffeePrice: '5.00', totalRaised: '267.00', supporterCount: 53, goalAmount: '500.00', goalLabel: 'Studio upgrade' },
  { slug: 'priya', name: 'Priya Sharma', emoji: '✍️', bio: 'Web3 technical writer. Making blockchain accessible, one article at a time.', coffeePrice: '3.00', totalRaised: '93.00', supporterCount: 31, goalAmount: '200.00', goalLabel: 'New laptop' },
  { slug: 'james', name: 'James Okafor', emoji: '💻', bio: 'Full-stack dev sharing OSS tools & tutorials for African developers.', coffeePrice: '3.00', totalRaised: '54.00', supporterCount: 18, goalAmount: '150.00', goalLabel: 'Server costs' },
  { slug: 'sara', name: 'Sara Nielsen', emoji: '📷', bio: 'Street photographer documenting urban life across Scandinavia.', coffeePrice: '5.00', totalRaised: '210.00', supporterCount: 42, goalAmount: '400.00', goalLabel: 'Film equipment' },
  { slug: 'tom', name: 'Tom Walsh', emoji: '🎬', bio: 'Documentary filmmaker. My next project: the lives of stablecoins.', coffeePrice: '5.00', totalRaised: '385.00', supporterCount: 77, goalAmount: '500.00', goalLabel: 'Camera rig' },
];

export default function ExplorePage() {
  const router = useRouter();
  const { profile } = useStore();

  // Show real profile first if it exists, then fill with demo
  const creators = profile
    ? [profile, ...DEMO.filter(d => d.slug !== profile.slug)]
    : DEMO;

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

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {creators.map((c, i) => {
          const totalNum = parseFloat(c.totalRaised);
          const goalNum  = parseFloat(c.goalAmount ?? '0');
          const pct      = goalNum > 0 ? Math.min(100, (totalNum / goalNum) * 100) : 0;
          const isReal   = profile && c.slug === profile.slug;

          return (
            <div key={c.slug} className={`animate-fade-up${i > 0 ? ` delay-${Math.min(i, 5)}` : ''}`}>
              <Card
                elevated
                onClick={() => router.push(`/c/${c.slug}`)}
                style={{ cursor: 'pointer', padding: '20px 18px', transition: 'box-shadow 0.2s', height: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{'emoji' in c ? c.emoji : c.avatarEmoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--brown)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                      {isReal && <Badge variant="gold">you</Badge>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{c.bio}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: goalNum > 0 ? 10 : 0, fontSize: 12 }}>
                  <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>☕ {c.supporterCount} supporters</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brown2)' }}>${totalNum.toFixed(2)}</span>
                </div>

                {goalNum > 0 && c.goalLabel && (
                  <div>
                    <ProgressBar value={pct} label={c.goalLabel} />
                  </div>
                )}

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown)' }}>${c.coffeePrice} / ☕</span>
                  <span style={{ fontSize: 12, color: 'var(--brown3)', fontFamily: 'var(--mono)' }}>Buy a coffee →</span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 14 }}>Want your own page?</p>
        <Button onClick={() => router.push('/')}>Create my page →</Button>
      </div>
    </div>
  );
}
