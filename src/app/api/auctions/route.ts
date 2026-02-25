import { NextResponse } from 'next/server';
import { getAuctions } from '@/lib/auctions-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === '1';

    const result = await getAuctions(forceRefresh);

    if (result.status === 'error') {
        return NextResponse.json(
            { status: 'error', message: result.message },
            { status: result.code ?? 500 }
        );
    }

    return NextResponse.json(result);
}
