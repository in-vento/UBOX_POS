const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`NAME: "${u.name}" | ROLE: "${u.role}" | PIN: "${u.pin}"`);
        });
        console.log('-----------------');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
