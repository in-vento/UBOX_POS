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
        // We generally assume if they authenticated with Supabase, they are valid.
        // In a real scenario, we might verify the supabaseToken with Supabase Admin API.
        // For now, consistent with the "offline-first" approach and clock skew bypass,
        // we trust the client's assertion if they passed the OAuth flow.

        let user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            console.log('[Onboard] Creating new local user');
            // Mock a PIN or requirement for new users?
            // For now, create a default user.
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    role: 'ADMIN', // Default first user to Admin? Or pending?
                    // status: 'ACTIVE',
                },
            });
        }

        // 2. Generate a local session token
        // In this local-first architecture, this token validates API requests to *this* Next.js server.
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
                    businesses: [] // Initialize empty businesses array for the UI
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
