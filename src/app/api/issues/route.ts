import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Issues GET]', error);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[Supabase Issues GET Unhandled]', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const issueId = crypto.randomUUID();

    // Verify or safely normalize reported_by to respect foreign key constraint
    let validReportedBy: string | null = null;
    const candidateUserId = body.reported_by || body.reported_byId;

    if (candidateUserId && UUID_REGEX.test(candidateUserId)) {
      const { data: userRow } = await supabaseServer
        .from('users')
        .select('id')
        .eq('id', candidateUserId)
        .maybeSingle();

      if (userRow) {
        validReportedBy = userRow.id;
      } else {
        // Create user record in public.users to satisfy foreign key
        const { error: userInsertErr } = await supabaseServer
          .from('users')
          .insert({
            id: candidateUserId,
            name: body.reported_by_name || 'Citizen User',
            email: body.reported_by_email || null,
            civic_points: 0,
          });

        if (!userInsertErr) {
          validReportedBy = candidateUserId;
        } else {
          console.warn('[Supabase Auto-User Provision Failed]', userInsertErr);
        }
      }
    }

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
      reported_by: validReportedBy,
      status: 'Awaiting Approval',
      likes: 0,
      dislikes: 0,
      created_at: new Date().toISOString(),
    };

    const { data: insertedRow, error: insertError } = await supabaseServer
      .from('issues')
      .insert(issueData)
      .select()
      .single();

    if (insertError) {
      console.error('[Supabase Issue Insert Error]', insertError);
      return NextResponse.json(
        { error: `Database insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: insertedRow.id,
        issue: insertedRow,
        message: 'Issue successfully created and persisted to database.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API Issues POST Unhandled Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create issue' },
      { status: 500 }
    );
  }
}

