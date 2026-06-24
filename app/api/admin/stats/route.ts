export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/server';


function verifyAdmin(req: NextRequest): boolean {
    const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
    return secret === process.env.ADMIN_SECRET;
}

/** GET /api/admin/stats — Aggregate usage, tokens, user count */
export async function GET(req: NextRequest) {
    if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = createServiceClient();

    const [
        { count: totalUsers },
        { count: totalTasks },
        { data: tokenStats },
        { data: csatData },
        { data: featureFlags },
        { data: recentMetrics },
    ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'archived'),
        supabase.from('ai_insights').select('prompt_tokens, completion_tokens, created_at'),
        supabase.from('csat_responses').select('score'),
        supabase.from('feature_flags').select('*'),
        supabase
            .from('usage_logs')
            .select('log_date, total_tokens, ai_calls, tasks_created')
            .gte('log_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('log_date', { ascending: true }),
    ]);

    const totalTokensUsed = tokenStats?.reduce(
        (sum, r) => sum + r.prompt_tokens + r.completion_tokens,
        0
    ) ?? 0;

    const avgCsat =
        csatData && csatData.length > 0
            ? csatData.reduce((s, r) => s + r.score, 0) / csatData.length
            : null;

    return NextResponse.json({
        totalUsers: totalUsers ?? 0,
        totalTasks: totalTasks ?? 0,
        totalTokensUsed,
        avgCsat: avgCsat ? Math.round(avgCsat * 100) / 100 : null,
        csatCount: csatData?.length ?? 0,
        featureFlags: featureFlags ?? [],
        dailyUsage: recentMetrics ?? [],
    });
}
