const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | PIN: ${u.pin} | Email: ${u.email}`);
        });
        console.log('-----------------');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
