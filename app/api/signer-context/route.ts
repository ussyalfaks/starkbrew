import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient as PrivyAuthClient } from '@privy-io/server-auth';
import { PrivyClient } from '@privy-io/node';
import { supabaseAdmin } from '@/lib/supabase';

const PRIVY_APP_ID     = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET ?? '';

const privyAuth = PRIVY_APP_ID && PRIVY_APP_SECRET
  ? new PrivyAuthClient(PRIVY_APP_ID, PRIVY_APP_SECRET)
  : null;

const privyNode = PRIVY_APP_ID && PRIVY_APP_SECRET
  ? new PrivyClient({ appId: PRIVY_APP_ID, appSecret: PRIVY_APP_SECRET })
  : null;

export async function POST(req: NextRequest) {
  if (!privyAuth || !privyNode) {
    return NextResponse.json({ error: 'Privy not configured' }, { status: 503 });
  }

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  let userId: string;
  try {
    const claims = await privyAuth.verifyAuthToken(token);
    userId = claims.userId;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Check if we already have a Starknet wallet for this user in our DB
    const { data: existing } = await supabaseAdmin
      .from('starknet_wallets')
      .select('wallet_id, public_key, address')
      .eq('privy_user_id', userId)
      .single();

    if (existing) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      return NextResponse.json({
        walletId: existing.wallet_id,
        publicKey: existing.public_key,
        serverUrl: `${appUrl}/api/sign`,
      });
    }

    // Create a server-managed Starknet wallet owned by our authorization key quorum
    const wallet = await privyNode.wallets().create({
      chain_type: 'starknet',
      owner_id: process.env.PRIVY_QUORUM_ID!,
      idempotency_key: `starknet-v3-${userId}`,
    });

    // Store it so we can look it up next time
    await supabaseAdmin.from('starknet_wallets').insert({
      privy_user_id: userId,
      wallet_id: wallet.id,
      public_key: (wallet as any).public_key ?? '',
      address: wallet.address,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return NextResponse.json({
      walletId: wallet.id,
      publicKey: (wallet as any).public_key ?? wallet.address,
      serverUrl: `${appUrl}/api/sign`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
