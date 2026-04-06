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

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  let userId: string;
  try {
    const claims = await privy.verifyAuthToken(token);
    userId = claims.userId;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const user = await privy.getUser(userId);
    const wallet = user.linkedAccounts.find(
      (a): a is Extract<typeof a, { type: 'wallet' }> =>
        a.type === 'wallet' && (a as any).walletClientType === 'privy'
    );
    if (!wallet) {
      return NextResponse.json({ error: 'No embedded wallet found' }, { status: 404 });
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return NextResponse.json({
      walletId: wallet.address,
      publicKey: (wallet as any).publicKey ?? wallet.address,
      serverUrl: `${appUrl}/api/sign`,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
