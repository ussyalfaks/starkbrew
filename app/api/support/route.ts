import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface SupportPayload {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amountUsdc: string;
  token: string;
  blockNumber: number;
  timestamp: number;
  supporterName?: string;
  message?: string;
  coffees?: number;
  creatorSlug?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SupportPayload = await req.json();

    if (!body.txHash || !body.toAddress || !body.amountUsdc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find creator by wallet address if slug not provided
    let creatorSlug = body.creatorSlug;
    if (!creatorSlug) {
      const { data: creator } = await supabaseAdmin
        .from('creators')
        .select('slug')
        .eq('wallet_address', body.toAddress)
        .single();
      if (!creator) {
        return NextResponse.json({ error: 'Creator not found for this address' }, { status: 404 });
      }
      creatorSlug = creator.slug;
    }

    // Upsert support record (idempotent on tx_hash)
    const { error: insertError } = await supabaseAdmin
      .from('supports')
      .upsert({
        creator_slug: creatorSlug,
        supporter_name: body.supporterName ?? 'Anonymous',
        message: body.message ?? '',
        coffees: body.coffees ?? 1,
        amount: body.amountUsdc,
        token: body.token,
        tx_hash: body.txHash,
        timestamp: body.timestamp,
      }, { onConflict: 'tx_hash' });

    if (insertError) {
      console.error('[support] insert error', insertError);
      return NextResponse.json({ error: 'Failed to record support' }, { status: 500 });
    }

    // Increment creator stats
    await supabaseAdmin.rpc('increment_creator_stats', {
      p_slug: creatorSlug,
      p_amount: body.amountUsdc,
    });

    return NextResponse.json({ ok: true, txHash: body.txHash });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    description: 'POST here when a USDC transfer to a creator is confirmed on-chain.',
    expectedFields: ['txHash', 'fromAddress', 'toAddress', 'amountUsdc', 'token', 'blockNumber', 'timestamp'],
  });
}
