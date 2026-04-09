import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { CreatorProfile } from '@/types';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  { walletApi: { authorizationPrivateKey: process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY?.replace(/\\n/g, '\n') } },
);

export async function POST(req: NextRequest) {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await privy.verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const profile: CreatorProfile = await req.json();

  const { error } = await supabaseAdmin
    .from('creators')
    .upsert({
      slug: profile.slug,
      name: profile.name,
      bio: profile.bio,
      avatar_emoji: profile.avatarEmoji,
      avatar_url: profile.avatarUrl ?? null,
      coffee_price: profile.coffeePrice,
      wallet_address: profile.walletAddress,
      goal_amount: profile.goalAmount ?? null,
      goal_label: profile.goalLabel ?? null,
      total_raised: profile.totalRaised,
      supporter_count: profile.supporterCount,
      created_at: profile.createdAt,
    }, { onConflict: 'slug' });

  if (error) {
    console.error('[creator-upsert]', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
