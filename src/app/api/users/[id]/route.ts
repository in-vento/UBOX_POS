import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Extract allowed fields to update
        const { status, role, pin, password, name, phone, email, commission, failedLoginAttempts, isLocked } = body;
        const data: any = {};
        if (status) data.status = status;
        if (role) data.role = role;
        if (pin) data.pin = pin;
        if (password) data.password = password;
        if (name) data.name = name;
        if (phone) data.phone = phone;
        if (email) data.email = email;
        if (commission !== undefined) data.commission = commission;
        if (failedLoginAttempts !== undefined) data.failedLoginAttempts = failedLoginAttempts;
        if (isLocked !== undefined) data.isLocked = isLocked;

        const user = await prisma.user.update({
            where: { id },
            data,
        });

        // Add to sync queue
        try {
            const { SyncService } = await import('@/lib/sync-service');
            await SyncService.addToQueue('User', id, 'UPDATE', user);
        } catch (e) {
            console.error('Failed to add user update to sync queue:', e);
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.user.delete({
            where: { id },
        });

        // Add to sync queue
        try {
            const { SyncService } = await import('@/lib/sync-service');
            await SyncService.addToQueue('User', id, 'DELETE', { id });
        } catch (e) {
            console.error('Failed to add user deletion to sync queue:', e);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
