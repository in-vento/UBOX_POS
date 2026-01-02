const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: { name: 'ADMIN' }
        });
        if (user && user.pin === '1234') {
            console.log('VERIFICATION SUCCESS: ADMIN user exists with PIN 1234');
        } else {
            console.log('VERIFICATION FAILED');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
