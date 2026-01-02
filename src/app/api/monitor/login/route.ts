import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                email,
                password,
                role: 'Monitor',
                status: 'Active'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarUrl: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Credenciales incorrectas o usuario inactivo' }, { status: 401 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error in monitor login:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
