import { NextRequest, NextResponse } from 'next/server';
import { checkSustainability } from '@/lib/sustainability-monitor';

export const dynamic = "force-dynamic";

/** POST /api/cron/sustainability — Daily cron job (called by Vercel) */
export async function POST(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await checkSustainability();

    console.log('[Cron] Sustainability check:', JSON.stringify(status));

    return NextResponse.json({
        ok: true,
        status,
        timestamp: new Date().toISOString(),
    });
}
