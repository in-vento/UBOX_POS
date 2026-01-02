
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateCustomOrderId } = require('../src/lib/orderIdGenerator');

async function main() {
    try {
        console.log('Fetching waiter...');
        const waiter = await prisma.user.findFirst({
            where: { role: 'Mozo' }
        });

        if (!waiter) {
            console.error('No waiter found!');
            return;
        }
        console.log('Waiter found:', waiter.name, waiter.id);

        console.log('Fetching product...');
        const product = await prisma.product.findFirst();
        if (!product) {
            console.error('No product found!');
            return;
        }
        console.log('Product found:', product.name, product.id);

        console.log('Generating custom ID...');
        const customId = await generateCustomOrderId();
        console.log('Generated Custom ID:', customId);

        console.log('Creating order...');
        const order = await prisma.order.create({
            data: {
                customId,
                waiterId: waiter.id,
                customer: 'Debug Customer',
                totalAmount: product.price,
                status: 'Pending',
                items: {
                    create: [{
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }]
                }
            }
        });
        console.log('Order created successfully:', order.id, order.customId);

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
