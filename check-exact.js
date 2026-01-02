const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: { name: 'ADMIN' }
        });
        if (user) {
            console.log('--- EXACT STRINGS ---');
            console.log(`ROLE: "${user.role}" (length: ${user.role.length})`);
            console.log(`STATUS: "${user.status}" (length: ${user.status.length})`);
            console.log('----------------------');
        } else {
            console.log('ADMIN NOT FOUND');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
