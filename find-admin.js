const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: { name: 'Super Admin' }
        });
        if (user) {
            console.log('SUPER ADMIN FOUND:');
            console.log(`- NAME: ${user.name}`);
            console.log(`- ROLE: ${user.role}`);
            console.log(`- PIN: ${user.pin}`);
            console.log(`- EMAIL: ${user.email}`);
        } else {
            console.log('SUPER ADMIN NOT FOUND');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
