const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('TOTAL USERS:', users.length);
        for (const u of users) {
            console.log(`- NAME: ${u.name} | ROLE: ${u.role} | PIN: ${u.pin} | EMAIL: ${u.email}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
