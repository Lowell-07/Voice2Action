import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseServer
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // Prevent overriding primary key
    delete updates.id;

    const { data, error } = await supabaseServer
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Supabase Issue PATCH Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, issue: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update issue' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseServer
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase Issue DELETE Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Issue ${id} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete issue' }, { status: 500 });
  }
}
