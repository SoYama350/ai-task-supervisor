export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeQuadrant } from '@/lib/ai/prioritize';

type Params = { params: { id: string } };

/** PUT /api/tasks/[id] — Update task */
export async function PUT(req: NextRequest, { params }: Params) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, description, deadline, urgency, importance, status, sort_order } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Recompute quadrant if urgency/importance changed
    if (urgency !== undefined || importance !== undefined) {
        if (urgency !== undefined) updateData.urgency = urgency;
        if (importance !== undefined) updateData.importance = importance;

        // Fetch current values if only one is being updated
        if (urgency === undefined || importance === undefined) {
            const { data: current } = await supabase
                .from('tasks')
                .select('urgency, importance')
                .eq('id', params.id)
                .eq('user_id', user.id)
                .single();
            if (current) {
                updateData.quadrant = computeQuadrant(
                    (urgency ?? current.urgency) as number,
                    (importance ?? current.importance) as number
                );
            }
        } else {
            updateData.quadrant = computeQuadrant(urgency as number, importance as number);
        }
    }

    const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ task });
}

/** DELETE /api/tasks/[id] — Archive (soft delete) task */
export async function DELETE(_req: NextRequest, { params }: Params) {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
        .from('tasks')
        .update({ status: 'archived' })
        .eq('id', params.id)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
