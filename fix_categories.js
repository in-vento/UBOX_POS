const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.product.updateMany({
        where: { name: 'wisky black' },
        data: { category: 'Bebida' }
    });
    console.log(`Updated ${result.count} products.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
