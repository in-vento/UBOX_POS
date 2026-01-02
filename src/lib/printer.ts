import net from 'net';

export const ESC = '\x1b';
export const GS = '\x1d';
export const LF = '\x0a';

export const COMMANDS = {
    INIT: ESC + '@',
    CUT: GS + 'V' + '\x41' + '\x03', // Cut paper (partial cut)
    TEXT_FORMAT: {
        NORMAL: ESC + '!' + '\x00',
        BOLD: ESC + '!' + '\x08',
        DOUBLE_HEIGHT: ESC + '!' + '\x10',
        DOUBLE_WIDTH: ESC + '!' + '\x20',
        UNDERLINE: ESC + '-' + '\x01',
        UNDERLINE_OFF: ESC + '-' + '\x00',
    },
    ALIGN: {
        LEFT: ESC + 'a' + '\x00',
        CENTER: ESC + 'a' + '\x01',
        RIGHT: ESC + 'a' + '\x02',
    }
};

export async function printReceipt(ip: string, port: number, data: Buffer | string, retries: number = 3): Promise<void> {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
        try {
            await new Promise<void>((resolve, reject) => {
                const client = new net.Socket();
                const timeout = setTimeout(() => {
                    client.destroy();
                    reject(new Error('Connection timed out'));
                }, 10000); // Increased to 10s

                client.connect(port, ip, () => {
                    clearTimeout(timeout);
                    client.write(data, (err) => {
                        if (err) {
                            client.destroy();
                            reject(err);
                        } else {
                            client.end();
                            resolve();
                        }
                    });
                });

                client.on('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });
            console.log(`Successfully printed to ${ip} on attempt ${i + 1}`);
            return; // Success!
        } catch (error) {
            lastError = error;
            console.warn(`Print attempt ${i + 1} failed for ${ip}:`, error instanceof Error ? error.message : error);
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s before retry
            }
        }
    }

    throw lastError || new Error(`Failed to print to ${ip} after ${retries} attempts`);
}

export function buildReceiptData(order: any, cashierName: string, paymentDetails?: { tendered: number, change: number, operationCode?: string }, waiterName?: string): string {
    let buffer = '';

    // Helper to append text
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    // Init
    add(COMMANDS.INIT);

    // Header
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('Ticket de Venta');
    addLine(new Date().toLocaleString('es-PE'));
    addLine('--------------------------------');

    // Order Info
    add(COMMANDS.ALIGN.LEFT);
    addLine(`Orden: ${order.customId || order.id.slice(-6)}`);
    addLine(`Cliente: ${order.customer}`);

    let finalWaiterName = waiterName || 'Caja';
    if (!waiterName) {
        if (order.waiter && typeof order.waiter === 'object' && order.waiter.name) {
            finalWaiterName = order.waiter.name;
        } else if (order.waiterId) {
            finalWaiterName = order.waiterId;
        }
    }

    addLine(`Atendido por Mozo: ${finalWaiterName}`);
    addLine(`Cajero a cargo: ${cashierName}`);
    addLine('--------------------------------');

    // Items
    if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
            const name = item.product?.name || 'Producto';
            const qty = item.quantity;
            const price = item.price * qty;

            // Format: Qty x Name
            addLine(`${qty}x ${name}`);
            // Price aligned right
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            add(COMMANDS.ALIGN.LEFT);
        });
    }
    addLine('--------------------------------');

    // Totals
    add(COMMANDS.ALIGN.LEFT);
    add('TOTAL:');
    add(COMMANDS.ALIGN.RIGHT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine(`S/ ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    add(COMMANDS.TEXT_FORMAT.NORMAL);

    if (paymentDetails) {
        const isYapePlin = paymentDetails.operationCode && paymentDetails.operationCode.length > 0;

        add(COMMANDS.ALIGN.LEFT);
        add(isYapePlin ? 'Yape / Plin Recibido:' : 'Efectivo Recibido:');
        add(COMMANDS.ALIGN.RIGHT);
        addLine(`S/ ${paymentDetails.tendered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        add(COMMANDS.ALIGN.LEFT);
        if (isYapePlin) {
            add('N° de operacion:');
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`${paymentDetails.operationCode}`);
        } else {
            add('Vuelto:');
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${paymentDetails.change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
    }

    add(COMMANDS.ALIGN.LEFT);
    addLine('--------------------------------');

    // Footer
    add(COMMANDS.ALIGN.CENTER);
    addLine('¡Gracias por su preferencia!');
    addLine(LF + LF + LF); // Feed

    // Cut
    add(COMMANDS.CUT);

    return buffer;
}

export function buildBarTicketData(order: any, waiterName: string): string {
    let buffer = '';

    // Helper to append text
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    // Init
    add(COMMANDS.INIT);

    // Header
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('Ticket de Barra / Cocina');
    addLine(new Date().toLocaleString('es-PE'));
    addLine('--------------------------------');

    // Order Info
    add(COMMANDS.ALIGN.LEFT);
    addLine(`Orden: ${order.customId || order.id.slice(-6)}`);
    addLine(`Mesa/Cliente: ${order.customer}`);
    addLine(`Mozo: ${waiterName}`);
    addLine('--------------------------------');

    // Items (No prices, just Qty x Name)
    if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
            const name = item.product?.name || 'Producto';
            const qty = item.quantity;

            add(COMMANDS.TEXT_FORMAT.BOLD);
            add(`${qty}x `);
            add(COMMANDS.TEXT_FORMAT.NORMAL);
            addLine(`${name}`);
        });
    }
    addLine('--------------------------------');

    // Footer
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('PENDIENTE');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine(LF + LF + LF); // Feed

    // Cut
    add(COMMANDS.CUT);

    return buffer;
}

export function buildCommissionTicketData(staffName: string, amount: number): string {
    let buffer = '';

    // Helper to append text
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    // Init
    add(COMMANDS.INIT);

    // Header
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('TICKET DE COMISION');
    addLine(new Date().toLocaleString('es-PE'));
    addLine('--------------------------------');

    // Info
    add(COMMANDS.ALIGN.LEFT);
    addLine(`Masajista: ${staffName}`);
    addLine('--------------------------------');

    // Total
    add(COMMANDS.ALIGN.RIGHT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine(`Total: S/ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('--------------------------------');

    // Signature
    addLine(LF + LF);
    add(COMMANDS.ALIGN.CENTER);
    addLine('__________________________');
    addLine('Firma de Conformidad');
    addLine(LF + LF + LF); // Feed

    // Cut
    add(COMMANDS.CUT);

    return buffer;
}

export function buildAuditTicketData(order: any, cashierName: string): string {
    console.log('buildAuditTicketData received order:', JSON.stringify(order, null, 2));
    let buffer = '';

    // Helper to append text
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    // Init
    add(COMMANDS.INIT);

    // Header
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('Detalle del Pedido');
    addLine(order.customId || order.id.slice(-6));
    addLine('--------------------------------');

    // Info
    add(COMMANDS.ALIGN.LEFT);
    addLine(`Cliente: ${order.customer}`);

    let waiterName = 'N/A';
    if (order.waiter) {
        waiterName = typeof order.waiter === 'object' ? order.waiter.name : order.waiter;
    }
    addLine(`Atendido por: ${waiterName}`);
    addLine(`Cajero: ${cashierName}`);
    addLine(`Fecha: ${order.date} ${order.time}`);

    if (order.editedBy) {
        add(COMMANDS.TEXT_FORMAT.BOLD);
        addLine(`* ${order.status === 'Cancelled' ? 'Anulado' : 'Editado'} por: ${order.editedBy}`);
        add(COMMANDS.TEXT_FORMAT.NORMAL);
    }
    if (order.cancelReason) {
        addLine(`Motivo: ${order.cancelReason}`);
    }
    addLine('--------------------------------');

    // Products
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('Productos Consumidos');
    add(COMMANDS.TEXT_FORMAT.NORMAL);

    if (order.products && order.products.length > 0) {
        order.products.forEach((item: any) => {
            const name = item.name || 'Producto';
            const qty = item.quantity;
            const price = item.price * qty;

            addLine(`${qty}x ${name}`);
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            add(COMMANDS.ALIGN.LEFT);
        });
    }
    addLine('--------------------------------');

    // Masajistas & Comision
    if (order.masajistas && order.masajistas.length > 0) {
        add(COMMANDS.TEXT_FORMAT.BOLD);
        addLine('Masajistas Asignados');
        add(COMMANDS.TEXT_FORMAT.NORMAL);

        order.masajistas.forEach((m: any) => {
            addLine(`- ${m.name}`);
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`Comision: S/ ${Number(m.commission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            add(COMMANDS.ALIGN.LEFT);
        });
        addLine('--------------------------------');
    }

    // Payments
    if (order.payments && order.payments.length > 0) {
        add(COMMANDS.TEXT_FORMAT.BOLD);
        addLine('Metodos de Pago');
        add(COMMANDS.TEXT_FORMAT.NORMAL);
        order.payments.forEach((p: any) => {
            add(COMMANDS.ALIGN.LEFT);
            add(`${p.method}`);
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        });
        addLine('--------------------------------');
    }

    // Totals
    add(COMMANDS.ALIGN.LEFT);
    add('Total de la Orden');
    add(COMMANDS.ALIGN.RIGHT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine(`S/ ${(order.amount || order.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('--------------------------------');

    // Footer
    addLine(LF + LF);
    add(COMMANDS.ALIGN.CENTER);
    addLine('Auditoria de Transacciones');
    addLine(LF + LF + LF); // Feed

    // Cut
    add(COMMANDS.CUT);

    return buffer;
}

export function buildShiftReportData(data: {
    type: 'CLOSE' | 'RECEIVE',
    inventory: any[],
    discrepancies?: any[],
    barmanName: string
}): string {
    let buffer = '';
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    add(COMMANDS.INIT);
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine(data.type === 'CLOSE' ? 'REPORTE DE CIERRE (BAR)' : 'REPORTE DE RECEPCION (BAR)');
    addLine(new Date().toLocaleString('es-PE'));
    addLine('--------------------------------');

    add(COMMANDS.ALIGN.LEFT);
    addLine(`Barman: ${data.barmanName}`);
    addLine('--------------------------------');

    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine(data.type === 'CLOSE' ? 'Inventario al Cierre:' : 'Inventario Recibido:');
    add(COMMANDS.TEXT_FORMAT.NORMAL);

    data.inventory.forEach((item: any) => {
        const unit = item.unit === 'units' ? 'ud' : item.unit === 'bottles' ? 'bot' : item.unit === 'liters' ? 'lt' : (item.unit || 'ud');
        addLine(`${item.name.padEnd(20)} ${item.stock} ${unit}`);
    });

    if (data.discrepancies && data.discrepancies.length > 0) {
        addLine('--------------------------------');
        add(COMMANDS.TEXT_FORMAT.BOLD);
        addLine('DISCREPANCIAS DETECTADAS:');
        add(COMMANDS.TEXT_FORMAT.NORMAL);
        data.discrepancies.forEach((d: any) => {
            addLine(`${d.productName}`);
            addLine(`  Rep: ${d.reported} | Real: ${d.actual} | Dif: ${d.difference}`);
        });
    }

    addLine('--------------------------------');
    addLine(LF + LF);
    add(COMMANDS.ALIGN.CENTER);
    addLine('__________________________');
    addLine('Firma de Conformidad');
    addLine(LF + LF + LF);

    add(COMMANDS.CUT);
    return buffer;
}

export function buildCashierReportData(data: {
    totalSales: number,
    paymentMethods: Record<string, number>,
    masajistaCommissions: { name: string, commission: number }[],
    staffCommissionPool: number,
    activeStaff: any[],
    commissionPerStaff: number
}): string {
    let buffer = '';
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    add(COMMANDS.INIT);
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('REPORTE DE CIERRE DE CAJA');
    addLine(new Date().toLocaleString('es-PE'));
    addLine('--------------------------------');

    add(COMMANDS.ALIGN.LEFT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('VENTAS TOTALES:');
    add(COMMANDS.ALIGN.RIGHT);
    addLine(`S/ ${data.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('--------------------------------');

    add(COMMANDS.ALIGN.LEFT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('DESGLOSE POR PAGO:');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    Object.entries(data.paymentMethods).forEach(([method, amount]) => {
        add(`${method.padEnd(20)}`);
        add(COMMANDS.ALIGN.RIGHT);
        addLine(`S/ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        add(COMMANDS.ALIGN.LEFT);
    });
    addLine('--------------------------------');

    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('COMISIONES MASAJISTAS:');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    if (data.masajistaCommissions.length > 0) {
        data.masajistaCommissions.forEach(item => {
            add(`${item.name.padEnd(20)}`);
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${item.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            add(COMMANDS.ALIGN.LEFT);
        });
    } else {
        addLine('No se generaron comisiones.');
    }
    addLine('--------------------------------');

    add(COMMANDS.ALIGN.LEFT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('COMISION DE PERSONAL:');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    add('Fondo (10%):');
    add(COMMANDS.ALIGN.RIGHT);
    addLine(`S/ ${data.staffCommissionPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    add(COMMANDS.ALIGN.LEFT);
    add(`Por persona (${data.activeStaff.length}):`);
    add(COMMANDS.ALIGN.RIGHT);
    addLine(`S/ ${data.commissionPerStaff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    add(COMMANDS.ALIGN.LEFT);

    addLine('Detalle Personal:');
    data.activeStaff.forEach(staff => {
        addLine(`- ${staff.name} (${staff.role})`);
    });

    addLine('--------------------------------');
    addLine(LF + LF);
    add(COMMANDS.ALIGN.CENTER);
    addLine('__________________________');
    addLine('Firma Responsable');
    addLine(LF + LF + LF);

    add(COMMANDS.CUT);
    return buffer;
}

export function buildTestTicketData(printerName: string): string {
    let buffer = '';
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    add(COMMANDS.INIT);
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine('PRUEBA DE CONEXION');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine(`Impresora: ${printerName}`);
    addLine(new Date().toLocaleString('es-PE'));
    addLine('--------------------------------');
    addLine('Si puedes leer esto, la');
    addLine('impresora esta configurada');
    addLine('correctamente.');
    addLine('--------------------------------');
    addLine(LF + LF + LF);
    add(COMMANDS.CUT);
    return buffer;
}
