import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const status = searchParams.get('status');

        const where: any = {};
        if (role) where.role = role;
        if (status) where.status = status;

        let users = await prisma.user.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        // Aggressive Fail-safe: If no users at all, or no admins found, ensure at least one exists
        if (users.length === 0) {
            const anyAdmin = await prisma.user.findFirst({
                where: { role: { in: ['admin', 'Admin', 'Administrador', 'super administrador'] } }
            });

            if (!anyAdmin) {
                console.log('No admins found in database. Creating default ADMIN...');
                const defaultAdmin = await prisma.user.create({
                    data: {
                        name: 'ADMIN',
                        role: 'admin',
                        pin: '1234',
                        email: 'admin@ubox.com',
                        status: 'Active',
                        avatarUrl: `https://ui-avatars.com/api/?name=ADMIN&background=random`,
                    }
                });

                // If the original query would have included this new admin, return it
                if (!role || ['admin', 'Admin', 'Administrador'].includes(role)) {
                    return NextResponse.json([defaultAdmin]);
                }
            }
        }

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        try {
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            const logPath = path.join(os.homedir(), 'Desktop', 'API-ERROR.txt');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error: ${error?.message || error}\nStack: ${error?.stack}\n`);
        } catch (e) { }
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, role, pin, password, phone, commission } = body;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                role,
                pin,
                password,
                phone,
                commission: commission ? parseFloat(commission) : null,
                status: 'Active',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
