export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'archived';
export type AiInsightType = 'parse' | 'prioritize' | 'suggest' | 'daily_plan';

/** Eisenhower quadrant: 1=Do Now, 2=Schedule, 3=Delegate, 4=Eliminate */
export type EisenhowerQuadrant = 1 | 2 | 3 | 4;

// ─── Database Tables ──────────────────────────────────────────────────────────

export interface DbUser {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    quota_tasks_per_day: number;
    quota_ai_calls_per_day: number;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbTask {
    id: string;
    user_id: string;
    raw_input: string | null;
    title: string;
    description: string | null;
    deadline: string | null;
    urgency: number;
    importance: number;
    quadrant: EisenhowerQuadrant;
    status: TaskStatus;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface DbAiInsight {
    id: string;
    task_id: string | null;
    user_id: string;
    type: AiInsightType;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    response_json: Json;
    created_at: string;
}

export interface DbUsageLog {
    id: string;
    user_id: string;
    log_date: string;
    tasks_created: number;
    ai_calls: number;
    total_tokens: number;
    created_at: string;
}

export interface DbFeatureFlag {
    key: string;
    enabled: boolean;
    description: string | null;
    updated_at: string;
}

export interface DbCsatResponse {
    id: string;
    user_id: string;
    score: number;
    comment: string | null;
    context: string | null;
    created_at: string;
}

export interface DbSustainabilityMetric {
    id: string;
    metric_date: string;
    revenue_usd: number;
    operating_cost_usd: number;
    active_users: number;
    new_signups: number;
    churn_count: number;
    total_ai_tokens: number;
    recorded_at: string;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface ParsedTask {
    title: string;
    description: string;
    deadline: string | null;
    urgency: number;
    importance: number;
    quadrant: EisenhowerQuadrant;
}

export interface ActionableSuggestion {
    step: number;
    action: string;
    detail: string;
    type: 'email' | 'code' | 'outline' | 'research' | 'call' | 'other';
}

export interface DailyPlanItem {
    taskId: string;
    title: string;
    quadrant: EisenhowerQuadrant;
    estimatedMinutes: number;
    rationale: string;
    sortOrder: number;
}

export interface SustainabilityStatus {
    daysSinceDeployment: number;
    windowDays: number;
    totalRevenue: number;
    totalCost: number;
    isSunset: boolean;
    message: string;
}
