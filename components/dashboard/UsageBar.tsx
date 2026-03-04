'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export function UsageBar() {
    const [usage, setUsage] = useState<{ tasks_created: number; ai_calls: number } | null>(null);
    const [quotas, setQuotas] = useState<{ quota_tasks: number; quota_ai: number } | null>(null);

    useEffect(() => {
        async function fetchUsage() {
            const res = await fetch('/api/tasks');
            if (!res.ok) return;
            // Usage bar relies on usage_logs — simple approach via tasks count
            // In production, add a dedicated /api/usage endpoint
        }
        fetchUsage();
    }, []);

    // Minimal fallback display
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>AI-powered · Free tier</span>
        </div>
    );
}
