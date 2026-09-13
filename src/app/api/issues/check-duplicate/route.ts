import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title = '', description = '', lat, lng } = body;

    // Check Supabase if configured and RPC exists
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data, error } = await supabase.rpc('match_issues', {
          query_embedding: [],
          match_threshold: 0.85,
          match_count: 5,
          p_lat: lat || 0,
          p_lng: lng || 0,
          radius_meters: 500,
        });

        if (!error && Array.isArray(data)) {
          return NextResponse.json(data);
        }
      }
    } catch {
      // Fallback
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
