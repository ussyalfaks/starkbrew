import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const PRIVY_APP_ID     = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET ?? '';

const privy = PRIVY_APP_ID && PRIVY_APP_SECRET
  ? new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET)
  : null;

export async function POST(req: NextRequest) {
  if (!privy) {
    return NextResponse.json({ error: 'Privy not configured' }, { status: 503 });
  }

  // Validate the caller is an authenticated user
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }
  try {
    await privy.verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { walletId, hash } = await req.json();
  if (!walletId || !hash) {
    return NextResponse.json({ error: 'Missing walletId or hash' }, { status: 400 });
  }

  try {
    const { signature } = await privy.walletApi.ethereum.secp256k1Sign({ walletId, hash });
    return NextResponse.json({ signature });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Signing failed' }, { status: 500 });
  }
}
