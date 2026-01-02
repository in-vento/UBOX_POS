
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getDayPrefix(dayOfWeek) {
    const prefixes = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    return prefixes[dayOfWeek];
}

async function generateCustomOrderId() {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayPrefix = getDayPrefix(now.getDay());

    // Get or create counter for today
    let counter = await prisma.orderCounter.findUnique({
        where: { date: dateKey }
    });

    if (!counter) {
        // Create new counter for today
        counter = await prisma.orderCounter.create({
            data: {
                date: dateKey,
                count: 1
            }
        });
    } else {
        // Increment existing counter
        counter = await prisma.orderCounter.update({
            where: { date: dateKey },
            data: { count: { increment: 1 } }
        });
    }

    // Format: XX-NNNNNN (e.g., JU-000001)
    const customId = `${dayPrefix}-${counter.count.toString().padStart(6, '0')}`;
    return customId;
}

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
