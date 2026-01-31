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
        console.error('Data recovery API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
