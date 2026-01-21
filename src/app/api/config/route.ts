import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener configuración actual
export async function GET() {
    try {
        let config = await prisma.appConfig.findUnique({
            where: { id: 'default' }
        });

        // Si no existe el registro, crear con valores por defecto
        if (!config) {
            config = await prisma.appConfig.create({
                data: {
                    id: 'default',
                    masajistaRoleName: 'Masajista',
                    masajistaRoleNamePlural: 'Masajistas'
                }
            });
        }

        return NextResponse.json(config);
    } catch (error: any) {
        console.error('Error fetching app config:', error);

        // Si el error es que la tabla no existe, intentar crearla
        if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
            try {
                console.log('Table AppConfig missing, attempting to create...');
                await prisma.$executeRawUnsafe(`
                    CREATE TABLE IF NOT EXISTS "AppConfig" (
                        "id" TEXT NOT NULL PRIMARY KEY,
                        "masajistaRoleName" TEXT NOT NULL DEFAULT 'Masajista',
                        "masajistaRoleNamePlural" TEXT NOT NULL DEFAULT 'Masajistas',
                        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Reintentar crear el registro por defecto
                const config = await prisma.appConfig.create({
                    data: {
                        id: 'default',
                        masajistaRoleName: 'Masajista',
                        masajistaRoleNamePlural: 'Masajistas'
                    }
                });
                return NextResponse.json(config);
            } catch (innerError) {
                console.error('Failed to create AppConfig table:', innerError);
            }
        }

        return NextResponse.json(
            { error: 'Failed to fetch configuration', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Actualizar configuración (solo Super Admin)
export async function PUT(request: Request) {
    let masajistaRoleName = '';
    let masajistaRoleNamePlural = '';

    try {
        const body = await request.json();
        masajistaRoleName = body.masajistaRoleName;
        masajistaRoleNamePlural = body.masajistaRoleNamePlural;

        // Validación
        if (!masajistaRoleName || !masajistaRoleNamePlural) {
            return NextResponse.json(
                { error: 'Both singular and plural names are required' },
                { status: 400 }
            );
        }

        if (masajistaRoleName.length > 30 || masajistaRoleNamePlural.length > 30) {
            return NextResponse.json(
                { error: 'Role names must be 30 characters or less' },
                { status: 400 }
            );
        }

        // Actualizar o crear configuración
        const config = await prisma.appConfig.upsert({
            where: { id: 'default' },
            update: {
                masajistaRoleName,
                masajistaRoleNamePlural
            },
            create: {
                id: 'default',
                masajistaRoleName,
                masajistaRoleNamePlural
            }
        });

        return NextResponse.json(config);
    } catch (error: any) {
        console.error('Error updating app config:', error);

        // Si el error es que la tabla no existe, intentar crearla y reintentar
        if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
            try {
                await prisma.$executeRawUnsafe(`
                    CREATE TABLE IF NOT EXISTS "AppConfig" (
                        "id" TEXT NOT NULL PRIMARY KEY,
                        "masajistaRoleName" TEXT NOT NULL DEFAULT 'Masajista',
                        "masajistaRoleNamePlural" TEXT NOT NULL DEFAULT 'Masajistas',
                        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                const config = await prisma.appConfig.upsert({
                    where: { id: 'default' },
                    update: { masajistaRoleName, masajistaRoleNamePlural },
                    create: { id: 'default', masajistaRoleName, masajistaRoleNamePlural }
                });
                return NextResponse.json(config);
            } catch (innerError) {
                console.error('Failed to recover from missing table in PUT:', innerError);
            }
        }

        return NextResponse.json(
            { error: 'Failed to update configuration', details: error.message },
            { status: 500 }
        );
    }
}
