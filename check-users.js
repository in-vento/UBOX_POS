const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.map(u => ({ id: u.id, name: u.name, role: u.role, pin: u.pin })));
    } catch (error) {
        console.error('Error fetching users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
