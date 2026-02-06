import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';

export async function POST() {
    try {
        // Trigger background sync without awaiting to free up the browser connection slot
        SyncService.processQueue().catch(err => console.error('[SyncAPI] Background processQueue error:', err));
        SyncService.syncConfigToCloud().catch(err => console.error('[SyncAPI] Background syncConfigToCloud error:', err));

        return NextResponse.json({ success: true, message: 'Sync process triggered in background' });
    } catch (error: any) {
        console.error('Internal sync API error:', error);
        // Include more details for debugging in the browser console
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            code: error.code // Prisma error codes are helpful
        }, { status: 500 });
    }
}
