const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.upsert({
            where: { email: 'admin@ubox.com' },
            update: {
                name: 'ADMIN',
                role: 'admin',
                pin: '1234',
                status: 'Active'
            },
            create: {
                name: 'ADMIN',
                role: 'admin',
                pin: '1234',
                email: 'admin@ubox.com',
                status: 'Active'
            }
        });
        console.log('ADMIN USER CREATED/UPDATED:', user);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
