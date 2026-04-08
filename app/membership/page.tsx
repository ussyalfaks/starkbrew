export default function MembershipPage() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px 100px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 24 }}>🎖️</div>
      <h1 style={{
        fontFamily: 'var(--display)', fontSize: 'clamp(2rem, 6vw, 2.8rem)',
        fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--brown)', marginBottom: 16,
      }}>
        Membership Plans
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.65, maxWidth: 380, margin: '0 auto 32px' }}>
        Let your biggest fans subscribe to exclusive tiers — Bronze, Silver, Gold — with recurring USDC payments and member-only perks.
      </p>
      <div style={{
        display: 'inline-block',
        padding: '10px 20px',
        background: 'var(--cream2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        fontFamily: 'var(--mono)',
        fontSize: 12,
        color: 'var(--text3)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Coming soon · V2
      </div>
    </div>
  );
}
