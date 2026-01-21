/**
 * SUNAT Configuration API
 * 
 * GET/PUT /api/sunat/config
 * 
 * Manages the SUNAT configuration for the business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        let config = await prisma.companySunatConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            // Create default config
            config = await prisma.companySunatConfig.create({
                data: { id: 'default' }
            });
        }

        return NextResponse.json(config);

    } catch (error: any) {
        console.error('[SunatConfigAPI] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        const config = await prisma.companySunatConfig.upsert({
            where: { id: 'default' },
            update: body,
            create: {
                id: 'default',
                ...body
            }
        });

        // Log the configuration change
        await prisma.log.create({
            data: {
                action: 'SUNAT_CONFIG_UPDATE',
                details: `Configuración SUNAT actualizada - Provider: ${config.provider}, Enabled: ${config.sunatEnabled}`
            }
        });

        return NextResponse.json(config);

    } catch (error: any) {
        console.error('[SunatConfigAPI] PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
