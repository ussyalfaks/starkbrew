import { NextRequest, NextResponse } from 'next/server';

const NETWORK  = process.env.NEXT_PUBLIC_NETWORK ?? 'sepolia';
const AVNU_URL = NETWORK === 'mainnet'
  ? 'https://starknet.paymaster.avnu.fi'
  : 'https://sepolia.paymaster.avnu.fi';
const API_KEY  = process.env.AVNU_API_KEY ?? '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(AVNU_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-paymaster-api-key': API_KEY } : {}) },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Paymaster proxy error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, configured: Boolean(API_KEY) });
}
