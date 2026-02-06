import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

// Secret key for local session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'local-secret-revery-pos';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { supabaseToken, email, name } = body;

        console.log('[Onboard] Processing login for:', email);

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Create or update the local user
        let user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            console.log('[Onboard] Creating new local user');
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    role: 'ADMIN',
                },
            });
        }

        // 2. Save Cloud Configuration for Sync
        // This is critical for the SyncService to start working
        const { businessId } = body;
        if (businessId || supabaseToken) {
            console.log('[Onboard] Saving cloud configuration for sync');
            await prisma.systemConfig.upsert({
                where: { id: 'default' },
                update: {
                    cloudToken: supabaseToken,
                    businessId: businessId,
                },
                create: {
                    id: 'default',
                    cloudToken: supabaseToken,
                    businessId: businessId,
                }
            });
        }

        // 3. Generate a local session token
        const token = sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('[Onboard] Login successful for:', email);

        return NextResponse.json({
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    businesses: []
                }
            }
        });

    } catch (error: any) {
        console.error('[Onboard] Error:', error);
        return NextResponse.json(
            { error: { message: error.message || 'Internal server error' } },
            { status: 500 }
        );
    }
}
