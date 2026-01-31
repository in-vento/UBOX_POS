import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';

export async function POST() {
    try {
        // Trigger background sync
        // We don't await this because we don't want to block the response
        // However, in a serverless/Next.js route, we might need to await to ensure it runs?
        // For Electron it's fine as it's a long-running Node process.
        // But to be safe and report status, let's await a single pass.

        await SyncService.processQueue();

        // Also trigger config sync lightly
        await SyncService.syncConfigToCloud();

        return NextResponse.json({ success: true, message: 'Sync process triggered' });
    } catch (error: any) {
        console.error('Internal sync API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
