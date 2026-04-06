'use client';
import Link from 'next/link';
import { useStore } from '@/store';
import { Badge } from '@/components/ui';

export function Nav() {
  const { wallet, profile } = useStore();
  const short = wallet?.address ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : null;

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
          <Badge variant="gold">
            <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
            {short}
          </Badge>
        ) : (
          <Badge variant="muted">not connected</Badge>
        )}
      </div>
    </nav>
  );
}
