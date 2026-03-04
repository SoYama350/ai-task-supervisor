import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Format a date string as a friendly relative label */
export function formatRelativeDate(dateStr: string | null): string {
    if (!dateStr) return 'No deadline';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Track AI token usage for a given user (upserts daily log) */
export async function incrementUsageLog(
    supabase: ReturnType<typeof import('@/lib/supabase/server').createClient>,
    userId: string,
    { aiCalls = 1, tokens = 0, tasksCreated = 0 }: { aiCalls?: number; tokens?: number; tasksCreated?: number }
) {
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('increment_usage_log', {
        p_user_id: userId,
        p_date: today,
        p_ai_calls: aiCalls,
        p_tokens: tokens,
        p_tasks: tasksCreated,
    });
}

/** Checks if a feature flag is enabled */
export async function isFeatureEnabled(
    supabase: ReturnType<typeof import('@/lib/supabase/server').createClient>,
    flagKey: string
): Promise<boolean> {
    const { data } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('key', flagKey)
        .single();
    return data?.enabled ?? false;
}
