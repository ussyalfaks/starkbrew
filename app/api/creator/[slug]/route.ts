import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from('creators')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
