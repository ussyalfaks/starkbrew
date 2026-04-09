'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useStore, buildProfile } from '@/store';
import { Button, Input, Steps, Card, Badge, toast } from '@/components/ui';
import { supabase } from '@/lib/supabase';

const EMOJIS = ['☕','🎨','🎵','✍️','🎮','📷','🎬','🎤','💻','📚','🌱','🔬','🎯','⚡','🚀'];

export default function SetupPage() {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { wallet, setProfile, updateProfile, profile } = useStore();
  const isEditing = Boolean(profile);
  const [step, setStep] = useState(0);

  const [name, setName]               = useState(profile?.name || '');
  const [bio, setBio]                 = useState(profile?.bio || '');
  const [emoji, setEmoji]             = useState(profile?.avatarEmoji || '☕');
  const [avatarUrl, setAvatarUrl]     = useState(profile?.avatarUrl || '');
  const [uploading, setUploading]     = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [coffeePrice, setCoffeePrice] = useState(profile?.coffeePrice || '3.00');
  const [goalAmount, setGoalAmount]   = useState(profile?.goalAmount || '');
  const [goalLabel, setGoalLabel]     = useState(profile?.goalLabel || '');
  const [saving, setSaving]           = useState(false);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast('Photo uploaded!');
    } catch {
      toast('Upload failed', 'error');
    }
    setUploading(false);
  }

  if (!wallet) { router.push('/'); return null; }

  const canNext0 = name.trim().length > 1 && bio.trim().length > 5;
  const canNext1 = parseFloat(coffeePrice) >= 1;

  async function handleSave() {
    if (!wallet) return;
    setSaving(true);
    try {
      let savedProfile;
      if (isEditing && profile) {
        const patch = {
          name, bio, avatarEmoji: emoji, avatarUrl: avatarUrl || undefined, coffeePrice,
          goalAmount: goalAmount || undefined,
          goalLabel: goalLabel || undefined,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        };
        updateProfile(patch);
        savedProfile = { ...profile, ...patch };
      } else {
        savedProfile = buildProfile(name, bio, emoji, coffeePrice, wallet.address, goalAmount || undefined, goalLabel || undefined, avatarUrl || undefined);
        setProfile(savedProfile);
      }

      const token = await getAccessToken();
      await fetch('/api/creator-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(savedProfile),
      });

      toast(isEditing ? 'Profile updated!' : 'Page created!');
      router.push('/dashboard');
    } catch {
      toast('Failed to save profile', 'error');
    }
    setSaving(false);
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'yourname';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Steps steps={['Profile', 'Pricing', 'Preview']} current={step} />

      {/* Step 0 — Profile */}
      {step === 0 && (
        <div className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, color: 'var(--brown)' }}>
              {isEditing ? 'Edit your profile' : 'Your profile'}
            </h2>
            {isEditing && <Badge variant="gold">editing</Badge>}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Tell your supporters who you are.</p>

          {/* Avatar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 8 }}>Avatar</div>

            {/* Upload area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--border)',
                  overflow: 'hidden', cursor: 'pointer', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', background: 'var(--cream2)',
                  position: 'relative', transition: 'border-color .13s',
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                    uploading…
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await uploadAvatar(file);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                    background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)',
                    color: 'var(--brown2)', marginBottom: 4, display: 'block',
                  }}
                >
                  {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)', padding: 0, fontFamily: 'var(--mono)' }}
                  >
                    Remove → use emoji
                  </button>
                )}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>JPG, PNG, WebP · max 2MB</div>
              </div>
            </div>

            {/* Emoji picker — shown only when no photo uploaded */}
            {!avatarUrl && (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', marginBottom: 6 }}>Or pick an emoji instead</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setEmoji(e)} style={{
                      width: 40, height: 40, fontSize: 20, borderRadius: 'var(--r-sm)', border: '1px solid',
                      cursor: 'pointer', transition: 'all .13s',
                      background: emoji === e ? 'var(--gold-dim)' : '#fff',
                      borderColor: emoji === e ? 'var(--gold-border)' : 'var(--border)',
                    }}>{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Your name" placeholder="Alex Johnson" value={name} onChange={setName} autoFocus />
            <Input label="Bio" placeholder="What do you create? Who do you help?" value={bio} onChange={setBio} rows={3} />
          </div>

          {name && (
            <div style={{ marginTop: 14, padding: '8px 12px', background: 'var(--cream2)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
              starkbrew.xyz/c/<strong style={{ color: 'var(--brown2)' }}>{slug}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {isEditing && (
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>Cancel</Button>
            )}
            <Button fullWidth={!isEditing} size="lg" disabled={!canNext0} onClick={() => setStep(1)} style={{ flex: isEditing ? 1 : undefined }}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 1 — Pricing */}
      {step === 1 && (
        <div className="animate-fade-up">
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--brown)' }}>Set your price</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>How much is one coffee? $3 is standard.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Price per coffee (USDC)" placeholder="3.00" type="number" value={coffeePrice} onChange={setCoffeePrice} prefix="$" suffix="USDC" mono hint="Minimum $1 USDC per coffee." />

            {/* Quick presets */}
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 8 }}>Quick set</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['1', '3', '5', '10'].map(v => (
                  <button key={v} onClick={() => setCoffeePrice(v + '.00')} style={{
                    flex: 1, padding: '9px 0', borderRadius: 'var(--r-sm)', border: '1px solid',
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .13s',
                    background: coffeePrice === v + '.00' ? 'var(--brown)' : '#fff',
                    color: coffeePrice === v + '.00' ? 'var(--cream)' : 'var(--brown2)',
                    borderColor: coffeePrice === v + '.00' ? 'var(--brown)' : 'var(--border)',
                  }}>${v}</button>
                ))}
              </div>
            </div>

            {/* Optional goal */}
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 12 }}>Optional: funding goal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input label="Goal amount (USDC)" placeholder="e.g. 150.00" type="number" value={goalAmount} onChange={setGoalAmount} prefix="$" mono />
                <Input label="Goal label" placeholder="e.g. New microphone, Server costs..." value={goalLabel} onChange={setGoalLabel} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
            <Button disabled={!canNext1} onClick={() => setStep(2)} style={{ flex: 1 }}>Preview →</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Preview */}
      {step === 2 && (
        <div className="animate-fade-up">
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--brown)' }}>Looks good?</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>Here's a preview of your page.</p>

          <Card elevated style={{ marginBottom: 20, textAlign: 'center', padding: '28px 24px' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
            ) : (
              <div style={{ fontSize: 52, marginBottom: 12 }}>{emoji}</div>
            )}
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>{name}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.55 }}>{bio}</p>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 20px', background: 'var(--cream2)', borderRadius: 100 }}>
              <span style={{ fontSize: 18 }}>☕</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--brown)' }}>${coffeePrice}</span>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>per coffee</span>
            </div>
            {goalAmount && goalLabel && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--gold-dim)', borderRadius: 'var(--r-sm)', border: '1px solid var(--gold-border)' }}>
                <div style={{ fontSize: 12, color: 'var(--brown2)', fontWeight: 600, marginBottom: 4 }}>Goal: {goalLabel}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>Target: ${parseFloat(goalAmount).toFixed(2)} USDC</div>
              </div>
            )}
          </Card>

          <Card style={{ marginBottom: 24, background: 'var(--cream2)', border: 'none', padding: '12px 16px' }}>
            {[['Gas fee', 'Sponsored by AVNU'], ['Token support', 'USDC, STRK, ETH'], ['Wallet', 'Argent · auto-deployed']].map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: i < 2 ? 5 : 0 }}>
                <span>{l}</span><span style={{ color: 'var(--brown2)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button loading={saving} onClick={handleSave} style={{ flex: 1 }}>
              {saving ? 'Saving...' : isEditing ? 'Save changes →' : 'Create my page →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
