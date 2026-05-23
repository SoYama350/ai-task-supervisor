import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createServiceClient } from '@/lib/supabase/server';
import { checkSustainability } from '@/lib/sustainability-monitor';

/** GET /api/sustainability — Get current sustainability status */
export async function GET(req: NextRequest) {
    const supabase = createServiceClient();

    // Simple check: just return the feature flag status + metrics
    const { data: sunsetFlag } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('key', 'project_sunset')
        .single();

    const status = await checkSustainability();
    return NextResponse.json({ ...status, sunsetFlagEnabled: sunsetFlag?.enabled ?? false });
}
