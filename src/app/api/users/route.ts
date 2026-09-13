import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, mobile, email, avatar_url, civic_points } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userData = {
      id,
      name: name || 'Citizen User',
      mobile: mobile || null,
      email: email || null,
      avatar_url: avatar_url || null,
      civic_points: typeof civic_points === 'number' ? civic_points : 0,
    };

    const { data, error } = await supabaseServer
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase User Upsert Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    console.error('[API Users POST Error]', err);
    return NextResponse.json({ error: err?.message || 'Failed to sync user' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch user' }, { status: 500 });
  }
}
