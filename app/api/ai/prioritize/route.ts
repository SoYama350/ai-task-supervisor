import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDailyPlan } from '@/lib/ai/daily-optimizer';
import { isFeatureEnabled } from '@/lib/utils';

export const dynamic = "force-dynamic";

/** POST /api/ai/prioritize — Generate daily optimized task plan */
export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const enabled = await isFeatureEnabled(supabase, 'ai_daily_optimizer');
    if (!enabled) {
        return NextResponse.json({ error: 'Daily Optimizer feature is disabled' }, { status: 403 });
    }

    const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false });

    if (tasksErr) return NextResponse.json({ error: tasksErr.message }, { status: 500 });

    const { plan, inputTokens, outputTokens } = await generateDailyPlan(tasks ?? []);

    // Store the insight
    await supabase.from('ai_insights').insert({
        user_id: user.id,
        type: 'daily_plan',
        model: 'gpt-4o-mini',
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        response_json: { plan },
    });

    return NextResponse.json({ plan });
}
