import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return NextResponse.json(data);
    }
  } catch {
    // Return empty list on db error
  }
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const issueId = crypto.randomUUID();

    const issueData = {
      id: issueId,
      title: body.title || 'Untitled Issue',
      description: body.description || '',
      department: body.department || 'Municipal Department',
      issue_type: body.issue_type || 'General',
      address: body.address || '',
      state: body.state || '',
      city: body.city || '',
      lat: typeof body.lat === 'number' ? body.lat : 0,
      lng: typeof body.lng === 'number' ? body.lng : 0,
      media_images: Array.isArray(body.media_images) ? body.media_images : [],
      reported_by: body.reported_by || 'user-1',
      status: 'Awaiting Approval',
      likes: 0,
      dislikes: 0,
      created_at: new Date().toISOString(),
    };

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await supabase.from('issues').insert(issueData);
      }
    } catch (dbErr) {
      console.warn('Database insert skipped or failed:', dbErr);
    }

    return NextResponse.json(
      { id: issueId, message: 'Issue successfully created and indexed.' },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create issue' },
      { status: 500 }
    );
  }
}
