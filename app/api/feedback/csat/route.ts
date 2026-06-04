import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** POST /api/feedback/csat — Submit a CSAT score */
export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { score, comment, context } = await req.json();
    if (!score || score < 1 || score > 5) {
        return NextResponse.json({ error: 'Score must be between 1 and 5' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('csat_responses')
        .insert({ user_id: user.id, score, comment: comment ?? null, context: context ?? null })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ response: data }, { status: 201 });
}

/** GET /api/feedback/csat — Check if user recently submitted CSAT (to avoid spam) */
export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
        .from('csat_responses')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo)
        .limit(1);

    return NextResponse.json({ hasRecentResponse: (data?.length ?? 0) > 0 });
}
