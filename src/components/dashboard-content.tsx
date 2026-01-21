'use client';

import { useState, useEffect, useMemo } from 'react';
import { useConfig } from '@/contexts/config-context';
import {
    Activity,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Users,
    Download,
    Printer,
    User as UserIcon,
    Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import SalesReport from '@/app/(main)/dashboard/components/sales-report';
import type { Order, Product, User } from '@/lib/types';
import AllTransactionsDialog from '@/app/(main)/dashboard/components/all-transactions-dialog';
import CalendarAuditDialog from '@/app/(main)/dashboard/components/calendar-audit-dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DashboardContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const { config } = useConfig();
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders?limit=100');
                if (res.ok) {
                    const ordersData = await res.json();
                    const transformedOrders = ordersData.map((order: any) => ({
                        ...order,
                        amount: order.totalAmount || 0,
                        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'),
                        time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                        color: '#3b82f6',
                        masajistaIds: (() => {
                            try {
                                return order.masajistaIds ? JSON.parse(order.masajistaIds) : [];
                            } catch (e) {
                                console.warn('Failed to parse masajistaIds for order', order.id, e);
                                return [];
                            }
                        })(),
                        products: (order.items || []).map((item: any) => ({
                            id: item.product?.id || item.productId,
                            name: item.product?.name || 'Producto',
                            quantity: item.quantity,
                            price: item.price,
                            category: item.product?.category
                        }))
                    }));
                    setOrders(transformedOrders);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setIsLoadingOrders(false);
            }
        };

        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchOrders();
        fetchUsers();
    }, []);

    const [isAllTransactionsOpen, setIsAllTransactionsOpen] = useState(false);
    const [isCalendarAuditOpen, setIsCalendarAuditOpen] = useState(false);
    const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);

    useEffect(() => {
        const fetchShiftStart = async () => {
            try {
                const res = await fetch('/api/logs?action=SHIFT_CLOSE&limit=1', { cache: 'no-store' });
                const resPending = await fetch('/api/logs?action=SHIFT_CLOSE_WITH_PENDING&limit=1', { cache: 'no-store' });

                let lastCloseTime = null;

                if (res.ok) {
                    const logs = await res.json();
                    if (logs && logs.length > 0) {
                        lastCloseTime = new Date(logs[0].timestamp);
                    }
                }

                if (resPending.ok) {
                    const logs = await resPending.json();
                    if (logs && logs.length > 0) {
                        const pendingTime = new Date(logs[0].timestamp);
                        if (!lastCloseTime || pendingTime > lastCloseTime) {
                            lastCloseTime = pendingTime;
                        }
                    }
                }
                setShiftStartTime(lastCloseTime);
            } catch (error) {
                console.error("Error fetching shift start time:", error);
            }
        };
        fetchShiftStart();
    }, []);

    const { totalSales, totalOrders, totalTransactions, activeCustomers, recentTransactions } = useMemo(() => {
        const liveOrders = orders || [];
        const shiftOrders = liveOrders.filter(order => {
            if (!shiftStartTime) return true;
            return new Date(order.createdAt) > shiftStartTime;
        });

        let sales = 0;
        let transactions = 0;
        const customers = new Set<string>();
        const transactionsList: any[] = [];

        liveOrders.forEach(order => {
            if (order.status === 'Cancelled') {
                const cancelTime = new Date(order.updatedAt);
                if (!shiftStartTime || cancelTime > shiftStartTime) {
                    transactionsList.push({
                        id: `cancel-${order.id}`,
                        amount: order.totalAmount,
                        timestamp: order.updatedAt,
                        method: 'Anulado',
                        orderId: order.id,
                        customer: order.customer,
                        orderDisplayId: order.customId || order.id.slice(-6),
                        status: 'Anulado',
                    });
                }
            }

            if (order.payments && order.payments.length > 0) {
                order.payments.forEach(payment => {
                    const paymentTime = new Date(payment.timestamp);
                    if (!shiftStartTime || paymentTime > shiftStartTime) {
                        sales += payment.amount;
                        transactions++;
                        customers.add(order.customer);

                        transactionsList.push({
                            ...payment,
                            orderId: order.id,
                            customer: order.customer,
                            orderDisplayId: order.customId || order.id.slice(-6),
                            status: order.status !== 'Cancelled' && order.editedBy ? 'Editado' : 'Aprobado',
                        });
                    }
                });
            }
        });

        transactionsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return {
            totalSales: sales,
            totalOrders: shiftOrders.length,
            totalTransactions: transactions,
            activeCustomers: customers.size,
            recentTransactions: transactionsList.slice(0, 5),
        };
    }, [orders, shiftStartTime]);

    const handleOpenDetails = (orderId: string) => {
        if (!orders) return;
        const orderToShow = orders.find(o => o.id === orderId);
        if (orderToShow) {
            setDetailedOrder(orderToShow);
            setIsDetailsDialogOpen(true);
        }
    };

    const handleDownloadPdf = () => {
        const input = document.getElementById('printable-order-details-main');
        if (!input || !detailedOrder) return;

        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a5');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`detalle-orden-${detailedOrder.customId || detailedOrder.id}.pdf`);
        });
    };

    const masajistasForDetailedOrder = useMemo(() => {
        if (!detailedOrder || !detailedOrder.masajistaIds || !users) return [];
        return users.filter(u => detailedOrder.masajistaIds!.includes(u.id));
    }, [detailedOrder, users]);

    if (isLoadingOrders || isLoadingUsers) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            S/ {totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Total de ventas del turno actual.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Total de pedidos del turno actual.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalTransactions}</div>
                        <p className="text-xs text-muted-foreground">Pagos individuales registrados.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{activeCustomers}</div>
                        <p className="text-xs text-muted-foreground">Clientes únicos en el turno.</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
                <div className="xl:col-span-2 grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Transacciones Recientes</CardTitle>
                                <CardDescription>Últimos pagos registrados en el turno.</CardDescription>
                            </div>
                            <Button size="sm" className="ml-auto gap-1" onClick={() => setIsAllTransactionsOpen(true)}>
                                Ver Todo
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="hidden xl:table-column">Método</TableHead>
                                        <TableHead className="hidden xl:table-column">Estado</TableHead>
                                        <TableHead className="hidden xl:table-column">Fecha</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.length > 0 ? (
                                        recentTransactions.map((tx, index) => (
                                            <TableRow key={`${tx.timestamp}-${index}`} className={tx.status === 'Anulado' ? 'bg-destructive/5' : tx.status === 'Editado' ? 'bg-orange-500/5' : ''}>
                                                <TableCell>
                                                    <div className={`font-medium ${tx.status === 'Anulado' ? 'text-destructive' : tx.status === 'Editado' ? 'text-orange-600' : ''}`}>{tx.customer}</div>
                                                    <div className={`hidden text-sm md:inline font-mono ${tx.status === 'Anulado' ? 'text-destructive/70' : tx.status === 'Editado' ? 'text-orange-600/70' : 'text-muted-foreground'}`}>{tx.orderDisplayId}</div>
                                                </TableCell>
                                                <TableCell className="hidden xl:table-column">
                                                    <Badge variant={tx.status === 'Anulado' ? 'destructive' : tx.status === 'Editado' ? 'secondary' : 'outline'} className={`text-xs ${tx.status === 'Editado' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}>{tx.method}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden xl:table-column">
                                                    <Badge variant={tx.status === 'Anulado' ? 'destructive' : tx.status === 'Editado' ? 'secondary' : 'outline'} className={`text-xs ${tx.status === 'Editado' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}>{tx.status}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell lg:hidden xl:table-column">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                                                <TableCell className={`text-right ${tx.status === 'Anulado' ? 'text-destructive line-through font-bold' : tx.status === 'Editado' ? 'text-orange-600 font-bold' : ''}`}>S/ {tx.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenDetails(tx.orderId)}>Ver Detalles</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">No hay transacciones todavía.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <SalesReport />
            </div>

            <AllTransactionsDialog
                isOpen={isAllTransactionsOpen}
                onOpenChange={setIsAllTransactionsOpen}
                users={users || []}
                onOpenCalendar={() => {
                    setIsAllTransactionsOpen(false);
                    setIsCalendarAuditOpen(true);
                }}
            />

            <CalendarAuditDialog
                isOpen={isCalendarAuditOpen}
                onOpenChange={setIsCalendarAuditOpen}
                users={users || []}
            />

            {detailedOrder && (
                <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                    <DialogContent>
                        <div id="printable-order-details-main" className="p-6">
                            <DialogHeader>
                                <DialogTitle>Detalle del Pedido: {detailedOrder.customId || detailedOrder.id}</DialogTitle>
                                <DialogDescription>Pedido para <strong>{detailedOrder.customer}</strong>. Atendido por: <strong>{typeof detailedOrder.waiter === 'object' ? (detailedOrder.waiter as any).name : detailedOrder.waiter}</strong>.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Productos Consumidos</h4>
                                    <ul className="grid gap-3 rounded-md border p-4">
                                        {(detailedOrder.products || []).map((product: Product) => (
                                            <li key={product.id} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{product.name} x <span className="font-bold">{product.quantity}</span></span>
                                                <div className="flex items-center gap-2"><span>S/ {(product.price * product.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {masajistasForDetailedOrder.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">{config.masajistaRoleNamePlural} Asignados</h4>
                                        <ul className="grid gap-2 rounded-md border p-4">
                                            {masajistasForDetailedOrder.map((masajista) => (
                                                <li key={masajista.id} className="flex items-center gap-2 text-sm"><UserIcon className="h-4 w-4 text-muted-foreground" /><span>{masajista.name}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-md"><span>Total de la Orden</span><span>S/ {(detailedOrder.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-between gap-2 p-6 pt-0">
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
                                <Button variant="ghost" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" />Descargar PDF</Button>
                            </div>
                            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
