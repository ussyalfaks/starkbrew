import Link from 'next/link';
export default function NotFound() {
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>☕</div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>Page not found</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14 }}>This page doesn&apos;t exist. Want to create yours?</p>
      <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--brown)', color: 'var(--cream)', borderRadius: 'var(--r-sm)', fontWeight: 600, fontSize: 14 }}>
        ← Back home
      </Link>
    </div>
  );
}
