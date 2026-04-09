import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from('supports')
    .select('*')
    .eq('creator_slug', slug)
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  const supports = (data ?? []).map(s => ({
    id: s.id,
    creatorSlug: s.creator_slug,
    supporterName: s.supporter_name,
    message: s.message,
    coffees: s.coffees,
    amount: s.amount,
    token: s.token,
    txHash: s.tx_hash,
    timestamp: s.timestamp,
  }));

  return NextResponse.json(supports);
}
