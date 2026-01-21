const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                pin: true,
                password: true,
                status: true
            }
        });
        fs.writeFileSync('users_data_clean.json', JSON.stringify(users, null, 2));
        console.log('User data written to users_data_clean.json');
    } catch (error) {
        console.error('Error fetching users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
