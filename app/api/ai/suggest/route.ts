import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { generateActionableSuggestions } from '@/lib/ai/suggest';
import { isFeatureEnabled } from '@/lib/utils';

/** POST /api/ai/suggest — Generate actionable suggestions for a task */
export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Feature flag check
    const enabled = await isFeatureEnabled(supabase, 'ai_execution_suggestions');
    if (!enabled) {
        return NextResponse.json(
            { error: 'AI Execution Suggestions feature is currently disabled' },
            { status: 403 }
        );
    }

    const { taskId } = await req.json();
    if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });

    // Fetch the task
    const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

    if (taskErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Check for cached insights (within last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
        .from('ai_insights')
        .select('response_json')
        .eq('task_id', taskId)
        .eq('type', 'suggest')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (cached?.response_json) {
        return NextResponse.json({ suggestions: (cached.response_json as { suggestions: unknown[] }).suggestions, cached: true });
    }

    // Check AI call quota
    const today = new Date().toISOString().split('T')[0];
    const { data: usageLog } = await supabase
        .from('usage_logs')
        .select('ai_calls')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

    const { data: userProfile } = await supabase
        .from('users')
        .select('quota_ai_calls_per_day')
        .eq('id', user.id)
        .single();

    if (usageLog && userProfile && usageLog.ai_calls >= userProfile.quota_ai_calls_per_day) {
        return NextResponse.json({ error: 'Daily AI quota exceeded' }, { status: 429 });
    }

    const { suggestions, promptTokens, completionTokens } = await generateActionableSuggestions(task);

    // Cache the insight
    await supabase.from('ai_insights').insert({
        task_id: taskId,
        user_id: user.id,
        type: 'suggest',
        model: 'gpt-4o-mini',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        response_json: { suggestions },
    });

    // Update usage log
    await supabase.from('usage_logs').upsert({
        user_id: user.id,
        log_date: today,
        ai_calls: (usageLog?.ai_calls ?? 0) + 1,
        total_tokens: (promptTokens + completionTokens),
    }, { onConflict: 'user_id,log_date' });

    return NextResponse.json({ suggestions, cached: false });
}
