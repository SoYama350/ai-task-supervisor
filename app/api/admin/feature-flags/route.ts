import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function verifyAdmin(req: NextRequest): boolean {
    const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
    return secret === process.env.ADMIN_SECRET;
}

/** GET /api/admin/feature-flags — List all flags */
export async function GET(req: NextRequest) {
    if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabase = createServiceClient();
    const { data, error } = await supabase.from('feature_flags').select('*').order('key');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flags: data });
}

/** PUT /api/admin/feature-flags — Toggle a feature flag */
export async function PUT(req: NextRequest) {
    if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabase = createServiceClient();
    const { key, enabled } = await req.json();
    if (!key || typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'key and enabled (boolean) are required' }, { status: 400 });
    }
    const { data, error } = await supabase
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flag: data });
}
