import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const limit = searchParams.get('limit');
        const after = searchParams.get('after');

        const where: any = {};
        if (action) where.action = action;
        if (after) {
            where.timestamp = {
                gt: new Date(after)
            };
        }

        const logs = await prisma.log.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
            take: limit ? parseInt(limit) : undefined,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                    },
                },
            },
        });
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, details, userId } = body;

        const log = await prisma.log.create({
            data: {
                action,
                details,
                userId, // Optional: can be null if system action or unauthenticated
            },
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error('Error creating log:', error);
        return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }
}
