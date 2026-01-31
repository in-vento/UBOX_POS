import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';

export async function POST() {
    try {
        console.log('[API] Triggering data recovery from cloud...');
        const success = await SyncService.recoverData();

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Data recovery completed successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Data recovery failed. Check server logs.'
            }, { status: 500 });
        }
    } catch (error: any) {
        // Improve error logging: Log the full error object, including stack trace if available.
        // console.error typically handles logging the stack trace for Error objects.
        console.error('Data recovery API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error) // Ensure a string message is always returned
        }, { status: 500 });
    }
}
