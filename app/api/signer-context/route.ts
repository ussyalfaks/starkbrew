import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient as PrivyAuthClient } from '@privy-io/server-auth';
import { PrivyClient } from '@privy-io/node';

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
    // Look for an existing server-managed Starknet wallet for this user
    const existing = await privyNode.wallets().list({ user_id: userId, chain_type: 'starknet' });
    let wallet = existing.data?.[0];

    // If none exists, create one (server-managed, Starknet, linked to this user)
    if (!wallet) {
      wallet = await privyNode.wallets().create({
        chain_type: 'starknet',
        owner: { user_id: userId },
      });
    }

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
