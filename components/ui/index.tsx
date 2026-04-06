'use client';
import React, { useEffect, useState } from 'react';

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span className="animate-spin" style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      border: '2px solid var(--cream3)', borderTopColor: 'var(--brown3)', flexShrink: 0,
    }} />
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  children, variant = 'primary', size = 'md', disabled, loading,
  onClick, fullWidth, style: sp, type = 'button',
}: {
  children: React.ReactNode; variant?: BtnVariant; size?: 'sm' | 'md' | 'lg';
  disabled?: boolean; loading?: boolean; onClick?: () => void;
  fullWidth?: boolean; style?: React.CSSProperties; type?: 'button' | 'submit';
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--sans)', fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.45 : 1, border: '1px solid transparent',
    borderRadius: 'var(--r-sm)', transition: 'all 0.13s', whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
    padding: size === 'sm' ? '7px 14px' : size === 'lg' ? '14px 28px' : '10px 18px',
    letterSpacing: '-0.01em',
  };
  const vs: Record<BtnVariant, React.CSSProperties> = {
    primary:   { background: 'var(--brown)', color: 'var(--cream)',  borderColor: 'var(--brown)' },
    secondary: { background: 'var(--gold)',  color: 'var(--brown)',  borderColor: 'var(--gold)' },
    ghost:     { background: 'transparent',  color: 'var(--brown2)', borderColor: 'var(--border2)' },
    danger:    { background: 'var(--red-dim)', color: 'var(--red)',  borderColor: 'rgba(192,57,43,.25)' },
  };
  return (
    <button type={type} disabled={disabled || loading} onClick={onClick}
      style={{ ...base, ...vs[variant], ...sp }}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, placeholder, value, onChange, type = 'text', mono, hint, prefix, suffix, autoFocus, rows }: {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void;
  type?: string; mono?: boolean; hint?: string; prefix?: string; suffix?: string; autoFocus?: boolean; rows?: number;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
    fontSize: 14, padding: `10px ${suffix ? '40px' : '13px'} 10px ${prefix ? '32px' : '13px'}`,
    outline: 'none', transition: 'border-color .15s',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text3)', pointerEvents: 'none' }}>{prefix}</span>}
        {rows ? (
          <textarea rows={rows} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        ) : (
          <input type={type} autoFocus={autoFocus} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        )}
        {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)', pointerEvents: 'none' }}>{suffix}</span>}
      </div>
      {hint && <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{hint}</p>}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, elevated }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; elevated?: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: 20,
      boxShadow: elevated ? '0 2px 12px rgba(44,26,14,0.07)' : 'none',
      cursor: onClick ? 'pointer' : undefined, transition: 'box-shadow 0.15s', ...style,
    }}>{children}</div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'gold' | 'muted' | 'success' | 'error';
export function Badge({ children, variant = 'muted' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  const vs: Record<BadgeVariant, React.CSSProperties> = {
    gold:    { background: 'var(--gold-dim)', color: 'var(--brown2)', border: '1px solid var(--gold-border)' },
    muted:   { background: 'var(--cream2)',   color: 'var(--text3)',  border: '1px solid var(--border)' },
    success: { background: 'var(--green-dim)',color: 'var(--green)',  border: '1px solid rgba(39,174,96,.25)' },
    error:   { background: 'var(--red-dim)',  color: 'var(--red)',    border: '1px solid rgba(192,57,43,.25)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 100, ...vs[variant] }}>
      {children}
    </span>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: 'var(--border)', ...style }} />;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown2)', fontFamily: 'var(--mono)' }}>{Math.min(100, Math.round(value))}%</span>
        </div>
      )}
      <div style={{ height: 6, background: 'var(--cream2)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, var(--brown3), var(--gold))',
          borderRadius: 100, width: `${Math.min(100, Math.max(0, value))}%`,
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
              background: i < current ? 'var(--green-dim)' : i === current ? 'var(--gold-dim)' : 'var(--cream2)',
              border: `1px solid ${i < current ? 'rgba(39,174,96,.3)' : i === current ? 'var(--gold-border)' : 'var(--border)'}`,
              color: i < current ? 'var(--green)' : i === current ? 'var(--brown2)' : 'var(--text3)',
            }}>{i < current ? '✓' : i + 1}</div>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: i === current ? 'var(--brown2)' : 'var(--text3)', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? 'rgba(39,174,96,.3)' : 'var(--border)', margin: '0 8px', marginBottom: 18, transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--cream2)', borderRadius: 'var(--r-sm)', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--brown)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Coffee cup SVG ────────────────────────────────────────────────────────────
export function CoffeeCup({ filled = false, size = 32 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="12" width="16" height="14" rx="3" fill={filled ? 'var(--brown)' : 'var(--cream3)'} stroke="var(--brown3)" strokeWidth="1.5" />
      <path d="M22 15 Q28 15 28 19 Q28 23 22 23" stroke="var(--brown3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="9" y="10" width="10" height="2" rx="1" fill="var(--brown3)" />
      {filled && <rect x="8" y="14" width="12" height="8" rx="2" fill="var(--brown2)" opacity="0.5" />}
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastItem = { id: string; msg: string; variant: 'success' | 'error' | 'info' };
let _push: ((t: ToastItem) => void) | null = null;
export function toast(msg: string, variant: ToastItem['variant'] = 'success') { _push?.({ id: crypto.randomUUID(), msg, variant }); }

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    _push = (t) => {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 3800);
    };
    return () => { _push = null; };
  }, []);
  const icons: Record<string, string> = { success: '☕', error: '✕', info: 'i' };
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => (
        <div key={t.id} className="animate-slide-up" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: `1px solid ${t.variant === 'error' ? 'rgba(192,57,43,.3)' : t.variant === 'success' ? 'rgba(39,174,96,.3)' : 'var(--border2)'}`,
          borderRadius: 'var(--r-sm)', padding: '11px 16px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(44,26,14,0.10)',
          color: t.variant === 'error' ? 'var(--red)' : 'var(--brown)',
        }}>{icons[t.variant]} {t.msg}</div>
      ))}
    </div>
  );
}
