import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        // Extract allowed fields to update
        const { status, role, pin, password, name, phone, commission, failedLoginAttempts, isLocked } = body;
        const data: any = {};
        if (status) data.status = status;
        if (role) data.role = role;
        if (pin) data.pin = pin;
        if (password) data.password = password;
        if (name) data.name = name;
        if (phone) data.phone = phone;
        if (commission !== undefined) data.commission = commission;
        if (failedLoginAttempts !== undefined) data.failedLoginAttempts = failedLoginAttempts;
        if (isLocked !== undefined) data.isLocked = isLocked;

        const user = await prisma.user.update({
            where: { id },
            data,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
