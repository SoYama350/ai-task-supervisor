import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseTaskFromNaturalLanguage } from '@/lib/ai/parse-task';
import { computeQuadrant, computePriorityScore } from '@/lib/ai/prioritize';
import { isFeatureEnabled } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** GET /api/tasks — List all tasks for the authenticated user */
export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const quadrant = searchParams.get('quadrant');

    let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (quadrant) query = query.eq('quadrant', parseInt(quadrant));

    const { data: tasks, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ tasks });
}

/** POST /api/tasks — Create a new task (with optional NLP parsing) */
export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { raw_input, title, description, deadline, urgency, importance } = body;

    // Check daily task quota
    const today = new Date().toISOString().split('T')[0];
    const { data: usageLog } = await supabase
        .from('usage_logs')
        .select('tasks_created')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

    const { data: userProfile } = await supabase
        .from('users')
        .select('quota_tasks_per_day')
        .eq('id', user.id)
        .single();

    if (usageLog && userProfile && usageLog.tasks_created >= userProfile.quota_tasks_per_day) {
        return NextResponse.json(
            { error: 'Daily task creation quota exceeded' },
            { status: 429 }
        );
    }

    let taskData: {
        title: string;
        description?: string;
        deadline?: string | null;
        urgency: number;
        importance: number;
        quadrant: number;
        raw_input?: string;
    };
    let promptTokens = 0;
    let completionTokens = 0;

    // If raw_input is provided and NLP feature is enabled, use AI parsing
    if (raw_input) {
        const nlpEnabled = await isFeatureEnabled(supabase, 'ai_nlp_parse');
        if (nlpEnabled) {
            const parsed = await parseTaskFromNaturalLanguage(raw_input);
            taskData = {
                raw_input,
                title: parsed.title,
                description: parsed.description,
                deadline: parsed.deadline,
                urgency: parsed.urgency,
                importance: parsed.importance,
                quadrant: parsed.quadrant,
            };
            promptTokens = parsed.promptTokens;
            completionTokens = parsed.completionTokens;

            // Store AI insight
            await supabase.from('ai_insights').insert({
                user_id: user.id,
                type: 'parse',
                model: 'gpt-4o-mini',
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                response_json: { parsed: taskData },
            });
        } else {
            // NLP disabled: use raw_input as title
            taskData = {
                raw_input,
                title: raw_input.slice(0, 60),
                urgency: urgency ?? 5,
                importance: importance ?? 5,
                quadrant: computeQuadrant(urgency ?? 5, importance ?? 5),
            };
        }
    } else {
        // Manual task entry
        taskData = {
            title,
            description,
            deadline,
            urgency: urgency ?? 5,
            importance: importance ?? 5,
            quadrant: computeQuadrant(urgency ?? 5, importance ?? 5),
        };
    }

    const { data: task, error } = await supabase
        .from('tasks')
        .insert({ ...taskData, user_id: user.id })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update usage log
    const totalTokens = promptTokens + completionTokens;
    await supabase
        .from('usage_logs')
        .upsert({
            user_id: user.id,
            log_date: today,
            tasks_created: (usageLog?.tasks_created ?? 0) + 1,
            ai_calls: promptTokens > 0 ? 1 : 0,
            total_tokens: totalTokens,
        }, { onConflict: 'user_id,log_date' });

    return NextResponse.json({ task }, { status: 201 });
}
