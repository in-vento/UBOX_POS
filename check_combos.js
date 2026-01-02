const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const combos = await prisma.product.findMany({
        where: { isCombo: true },
        include: {
            comboItems: {
                include: {
                    product: true
                }
            }
        }
    });
    console.log(JSON.stringify(combos, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
