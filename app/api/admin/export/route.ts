import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";
function verifyAdmin(req: NextRequest): boolean {
    const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
    return secret === process.env.ADMIN_SECRET;
}

/** GET /api/admin/export — Full data export as JSON */
export async function GET(req: NextRequest) {
    if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = createServiceClient();

    const [
        { data: users },
        { data: tasks },
        { data: aiInsights },
        { data: csatResponses },
        { data: sustainabilityMetrics },
        { data: featureFlags },
    ] = await Promise.all([
        supabase.from('users').select('id, email, full_name, created_at, quota_tasks_per_day, quota_ai_calls_per_day'),
        supabase.from('tasks').select('*'),
        supabase.from('ai_insights').select('id, task_id, user_id, type, model, total_tokens, created_at'),
        supabase.from('csat_responses').select('*'),
        supabase.from('sustainability_metrics').select('*'),
        supabase.from('feature_flags').select('*'),
    ]);

    const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        users: users ?? [],
        tasks: tasks ?? [],
        aiInsights: aiInsights ?? [],
        csatResponses: csatResponses ?? [],
        sustainabilityMetrics: sustainabilityMetrics ?? [],
        featureFlags: featureFlags ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="ai-task-supervisor-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
    });
}
