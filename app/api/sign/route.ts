import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient as PrivyAuthClient } from '@privy-io/server-auth';
import { PrivyClient } from '@privy-io/node';

const PRIVY_APP_ID     = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET ?? '';

const privyAuth = PRIVY_APP_ID && PRIVY_APP_SECRET
  ? new PrivyAuthClient(PRIVY_APP_ID, PRIVY_APP_SECRET)
  : null;

// Server-managed wallets — no authorization key needed, app credentials are enough
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
  try {
    await privyAuth.verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { walletId, hash } = await req.json();
  if (!walletId || !hash) {
    return NextResponse.json({ error: 'Missing walletId or hash' }, { status: 400 });
  }

  try {
    // Server-managed wallet — sign with app credentials, no JWT needed
    const result = await privyNode.wallets().rawSign(walletId, {
      params: { hash },
    });
    return NextResponse.json({ signature: result.signature });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Signing failed' }, { status: 500 });
  }
}
