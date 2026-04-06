'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { networkTokens, Amount } from '@/lib/starkzap';
import {
  Button,
  Card,
  Input,
  Badge,
  Divider,
  StatCard,
  Spinner,
  toast,
} from '@/components/ui';

const TOKENS = ['USDC', 'STRK', 'ETH'] as const;
type WithdrawToken = (typeof TOKENS)[number];

export default function WithdrawPage() {
  const router = useRouter();
  const { wallet, profile } = useStore();

  const [token, setToken]       = useState<WithdrawToken>('USDC');
  const [amount, setAmount]     = useState('');
  const [toAddress, setToAddr]  = useState('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [progress, setProgress] = useState('');
  const [done, setDone]         = useState<{ hash: string; amount: string; token: string } | null>(null);

  useEffect(() => {
    if (!wallet) return;
    Promise.all(
      TOKENS.map(t =>
        wallet.balanceOf(networkTokens[t]).then(b => [t, b.toFormatted(true)] as const)
      )
    ).then(entries => {
      setBalances(Object.fromEntries(entries));
      setLoading(false);
    });
  }, [wallet]);

  if (!wallet || !profile) {
    router.push('/');
    return null;
  }

  const currentBalance = balances[token] ?? '…';

  function setMax() {
    const raw = balances[token];
    if (!raw) return;
    // Extract the numeric part from "USDC 42.50"
    const num = raw.split(' ')[1] ?? raw;
    setAmount(num);
  }

  async function handleWithdraw() {
    if (!wallet) return;
    if (!toAddress.trim().startsWith('0x')) {
      toast('Enter a valid Starknet address (starts with 0x)', 'error');
      return;
    }
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast('Enter an amount greater than 0', 'error');
      return;
    }

    setSending(true);
    setProgress('Preparing transfer…');
    try {
      const tkn = networkTokens[token];
      const amt = Amount.parse(amount, tkn);

      setProgress('Sending transaction…');
      // REAL: wallet.transfer(token, [{ to: toAddress, amount }], { feeMode: 'sponsored' })
      const tx = await wallet.transfer(tkn, [{ to: toAddress, amount: amt }], {
        feeMode: 'sponsored',
      });

      setProgress('Confirming on Starknet…');
      await tx.wait();

      setDone({ hash: tx.transaction_hash, amount, token });
      toast('Withdrawn successfully!');

      // Refresh balances
      const fresh = await wallet.balanceOf(tkn);
      setBalances(prev => ({ ...prev, [token]: fresh.toFormatted(true) }));
    } catch (e: any) {
      toast(e.message || 'Withdrawal failed', 'error');
    }
    setSending(false);
    setProgress('');
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div className="animate-fade-up">
          <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--brown)',
              marginBottom: 8,
            }}
          >
            Withdrawn!
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: 6 }}>
            {done.amount} {done.token} sent successfully.
          </p>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--text3)',
              marginBottom: 28,
            }}
          >
            Gas: $0.00 · sponsored by AVNU
          </p>

          <a
            href={`https://sepolia.voyager.online/tx/${done.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', textDecoration: 'none', marginBottom: 10 }}
          >
            <Button variant="ghost" fullWidth>
              View on Voyager ↗
            </Button>
          </a>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setDone(null);
              setAmount('');
              setToAddr('');
            }}
          >
            Withdraw again
          </Button>
          <div style={{ marginTop: 10 }}>
            <Button variant="ghost" fullWidth size="sm" onClick={() => router.push('/dashboard')}>
              ← Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Withdraw form ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text3)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            marginBottom: 16,
            padding: 0,
          }}
        >
          ← Dashboard
        </button>
        <h2
          style={{
            fontFamily: 'var(--display)',
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--brown)',
            marginBottom: 6,
          }}
        >
          Withdraw funds
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          Move your earnings to any Starknet wallet. Gas is sponsored.
        </p>
      </div>

      {/* Balances */}
      <div
        className="animate-fade-up delay-1"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}
      >
        {loading
          ? TOKENS.map(t => (
              <div key={t} className="skeleton" style={{ height: 64 }} />
            ))
          : TOKENS.map(t => (
              <StatCard
                key={t}
                label={t}
                value={balances[t]?.split(' ')[1] ?? '0.00'}
                sub={t === token ? '← selected' : undefined}
              />
            ))}
      </div>

      {/* Token picker */}
      <div className="animate-fade-up delay-2" style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text3)',
            marginBottom: 8,
          }}
        >
          Token
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {TOKENS.map(t => (
            <button
              key={t}
              onClick={() => setToken(t)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'var(--r-sm)',
                border: '1px solid',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .13s',
                background: token === t ? 'var(--brown)' : '#fff',
                color: token === t ? 'var(--cream)' : 'var(--text2)',
                borderColor: token === t ? 'var(--brown)' : 'var(--border)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="animate-fade-up delay-2">
        <Card elevated style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Amount */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text3)',
                  }}
                >
                  Amount
                </span>
                <button
                  onClick={setMax}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--brown3)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Max: {currentBalance}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--mono)',
                    fontSize: 14,
                    color: 'var(--text3)',
                    pointerEvents: 'none',
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--cream2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--text)',
                    fontFamily: 'var(--mono)',
                    fontSize: 20,
                    fontWeight: 500,
                    padding: '12px 60px 12px 28px',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: 'var(--text3)',
                    pointerEvents: 'none',
                  }}
                >
                  {token}
                </span>
              </div>
            </div>

            <Divider />

            {/* Destination */}
            <Input
              label="To address"
              placeholder="0x..."
              value={toAddress}
              onChange={setToAddr}
              mono
              hint="Any Starknet wallet address."
            />
          </div>
        </Card>

        {/* Gas info */}
        <Card
          style={{
            background: 'var(--cream2)',
            border: 'none',
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          {[
            ['Gas fee', <span key="gas" style={{ color: 'var(--green)', fontWeight: 600 }}>$0.00 — sponsored by AVNU</span>],
            ['Network', 'Starknet mainnet'],
            ['Confirmation', '< 2 seconds'],
          ].map(([label, value], i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--text3)',
                marginBottom: i < 2 ? 5 : 0,
              }}
            >
              <span>{label}</span>
              <span style={{ color: 'var(--brown2)' }}>{value}</span>
            </div>
          ))}
        </Card>

        {/* Progress */}
        {sending && progress && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 12,
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--brown3)',
            }}
          >
            <Spinner size={12} />
            {progress}
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          loading={sending}
          disabled={!amount || !toAddress || parseFloat(amount) <= 0}
          onClick={handleWithdraw}
        >
          {sending ? 'Withdrawing…' : `Withdraw ${amount || '0'} ${token} →`}
        </Button>
      </div>
    </div>
  );
}
