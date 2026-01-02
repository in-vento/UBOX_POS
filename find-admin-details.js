const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: { name: 'ADMIN' }
        });
        if (user) {
            console.log('--- ADMIN USER DETAILS ---');
            console.log(`ID: ${user.id}`);
            console.log(`NAME: "${user.name}"`);
            console.log(`ROLE: "${user.role}"`);
            console.log(`STATUS: "${user.status}"`);
            console.log(`PIN: "${user.pin}"`);
            console.log('---------------------------');
        } else {
            console.log('ADMIN USER NOT FOUND');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
