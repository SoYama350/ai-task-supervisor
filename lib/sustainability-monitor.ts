import { createServiceClient } from '@/lib/supabase/server';
import type { SustainabilityStatus } from '@/lib/types';

const DEPLOYMENT_DATE = process.env.DEPLOYMENT_DATE ?? new Date().toISOString().split('T')[0];
const WINDOW_DAYS = parseInt(process.env.SUSTAINABILITY_WINDOW_DAYS ?? '90', 10);

/**
 * Reads sustainability_metrics, computes 90-day P&L, and triggers sunset if needed.
 * Returns current sustainability status.
 */
export async function checkSustainability(): Promise<SustainabilityStatus> {
    const supabase = createServiceClient();

    const deployDate = new Date(DEPLOYMENT_DATE);
    const today = new Date();
    const daysSince = Math.floor(
        (today.getTime() - deployDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Fetch all metrics in the window
    const { data: metrics, error } = await supabase
        .from('sustainability_metrics')
        .select('*')
        .gte('metric_date', DEPLOYMENT_DATE)
        .order('metric_date', { ascending: true });

    if (error) {
        // If table doesn't exist yet, or other DB error, return a default status instead of crashing build
        return {
            daysSinceDeployment: daysSince,
            windowDays: WINDOW_DAYS,
            totalRevenue: 0,
            totalCost: 0,
            isSunset: false,
            message: `Sustainability metrics unavailable: ${error.message}`
        };
    }

    const totalRevenue = metrics?.reduce((sum, m) => sum + Number(m.revenue_usd), 0) ?? 0;
    const totalCost = metrics?.reduce((sum, m) => sum + Number(m.operating_cost_usd), 0) ?? 0;

    // Project growth: simple linear extrapolation of revenue trend
    let projectedRevenue = totalRevenue;
    if (metrics && metrics.length >= 7) {
        const recentRevenue = metrics.slice(-7).reduce((s, m) => s + Number(m.revenue_usd), 0);
        const dailyRate = recentRevenue / 7;
        const remainingDays = Math.max(0, WINDOW_DAYS - daysSince);
        projectedRevenue = totalRevenue + dailyRate * remainingDays;
    }

    const isSunset = daysSince >= WINDOW_DAYS && projectedRevenue < totalCost;

    // If sunset threshold is hit, enable the feature flag
    if (isSunset) {
        await supabase
            .from('feature_flags')
            .update({ enabled: true, updated_at: new Date().toISOString() })
            .eq('key', 'project_sunset');
    }

    return {
        daysSinceDeployment: daysSince,
        windowDays: WINDOW_DAYS,
        totalRevenue,
        totalCost,
        isSunset,
        message: isSunset
            ? `After ${daysSince} days, revenue ($${totalRevenue.toFixed(2)}) does not cover costs ($${totalCost.toFixed(2)}). Project sunset initiated.`
            : `Day ${daysSince}/${WINDOW_DAYS} — Revenue: $${totalRevenue.toFixed(2)} | Cost: $${totalCost.toFixed(2)}`,
    };
}
