
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useConfig } from '@/contexts/config-context';
import { startOfWeek, startOfMonth, isWithinInterval, subDays, subYears, type Interval } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Printer, MoreHorizontal, User as UserIcon, Download, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import type { Order, Payment, Product, User } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';


type AllTransactionsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  users: User[];
  onOpenCalendar?: () => void;
};

type Transaction = Payment & {
  id: string;
  orderId: string;
  customer: string;
  orderDisplayId: string;
  status: string;
  cashier: string;
  method: string;
};

type FilterType = 'today' | 'week' | 'month' | 'year' | 'all';

export default function AllTransactionsDialog({
  isOpen,
  onOpenChange,
  users,
  onOpenCalendar,
}: AllTransactionsDialogProps) {

  const { config } = useConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para IP de impresora (local)
  const [printerIp, setPrinterIp] = useState<string>('192.168.18.137');

  // Cargar IP al montar
  useState(() => {
    if (typeof window !== 'undefined') {
      const savedIp = localStorage.getItem('printerIp');
      if (savedIp) setPrinterIp(savedIp);
    }
  });

  useEffect(() => {
    if (isOpen) {
      const fetchAllOrders = async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/orders?all=true');
          if (res.ok) {
            const data = await res.json();
            // Transform items to products and map fields to match frontend expectations
            const transformedOrders = data.map((order: any) => ({
              ...order,
              amount: order.totalAmount || 0,
              date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'),
              time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
              color: '#3b82f6',
              masajistaIds: (() => {
                try {
                  if (Array.isArray(order.masajistaIds)) return order.masajistaIds;
                  if (!order.masajistaIds) return [];
                  // Handle potential double stringification or already parsed object
                  if (typeof order.masajistaIds === 'object') return order.masajistaIds;
                  return JSON.parse(order.masajistaIds);
                } catch (e) {
                  console.warn('Failed to parse masajistaIds for order', order.id, order.masajistaIds, e);
                  return [];
                }
              })(),
              products: (order.items || []).map((item: any) => ({
                id: item.product?.id || item.productId,
                name: item.product?.name || 'Producto',
                quantity: item.quantity,
                price: item.price,
                category: item.product?.category,
                isCommissionable: item.product?.isCommissionable,
                commissionPercentage: item.product?.commissionPercentage
              }))
            }));
            setAllOrders(transformedOrders);
          }
        } catch (error) {
          console.error("Failed to fetch all orders history", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllOrders();
    }
  }, [isOpen]);

  const allTransactions = useMemo(() => {
    const transactions: Transaction[] = [];
    // Logic replicated from cashier/page.tsx to ensure consistency
    const activeCashierUser = (users || []).find(u => u.role.toLowerCase() === 'cajero' && u.status === 'Active') ||
      (users || []).find(u => ['administrador', 'admin', 'super administrador', 'boss'].includes(u.role.toLowerCase()) && u.status === 'Active' && u.email !== 'admin@ubox.com');

    const cashierName = activeCashierUser?.name || 'Caja';
    const cashiers = [cashierName];

    allOrders.forEach(order => {
      // Include Cancelled orders for audit
      if (order.status === 'Cancelled') {
        transactions.push({
          id: `cancel-${order.id}`,
          amount: order.totalAmount,
          timestamp: order.updatedAt,
          method: 'Anulado',
          orderId: order.id,
          customer: order.customer,
          orderDisplayId: order.customId || order.id.slice(-6),
          status: 'Anulado',
          cashier: order.editedBy || 'Admin'
        } as any);
      }

      order.payments?.forEach((payment, index) => {
        // Use stored cashier name if available, otherwise fallback to logic (for old records)
        // Use stored cashier name if available, otherwise fallback to 'Caja' for old records
        const transactionCashier = payment.cashier || 'Caja';

        transactions.push({
          ...payment,
          id: `${order.id}-${index}-${payment.timestamp}`,
          orderId: order.id,
          customer: order.customer,
          orderDisplayId: order.customId || order.id.slice(-6),
          status: order.status !== 'Cancelled' && order.editedBy ? 'Editado' : 'Aprobado',
          cashier: transactionCashier
        } as any);
      });
    });
    return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allOrders, users]);


  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let interval: Interval;

    switch (activeFilter) {
      case 'today':
        interval = { start: subDays(now, 1), end: now };
        break;
      case 'week':
        interval = { start: startOfWeek(now), end: now };
        break;
      case 'month':
        interval = { start: startOfMonth(now), end: now };
        break;
      case 'year':
        interval = { start: subYears(now, 1), end: now };
        break;
      case 'all':
        interval = { start: new Date(0), end: now }; // From epoch to now
        break;
    }

    return allTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const isInDateRange = isWithinInterval(txDate, interval);

      if (!isInDateRange) return false;

      if (!searchTerm) return true;

      const lowercasedFilter = searchTerm.toLowerCase();
      const formattedDate = txDate.toLocaleString('es-PE').toLowerCase();

      return (
        tx.customer.toLowerCase().includes(lowercasedFilter) ||
        tx.orderDisplayId.toLowerCase().includes(lowercasedFilter) ||
        tx.method.toLowerCase().includes(lowercasedFilter) ||
        formattedDate.includes(lowercasedFilter)
      );
    });
  }, [allTransactions, searchTerm, activeFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map(tx => tx.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectOne = (txId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, txId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== txId));
    }
  };

  const handleOpenDetails = (orderId: string) => {
    const orderToShow = allOrders.find(o => o.id === orderId);
    if (orderToShow) {
      setDetailedOrder(orderToShow);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleDownloadPdf = () => {
    const input = document.getElementById('printable-order-details');
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
    if (!detailedOrder || !detailedOrder.masajistaIds) return [];
    console.log('Matching masajistas. Order IDs:', detailedOrder.masajistaIds);
    console.log('Available Users count:', users?.length);
    if (!users) return [];

    const matched = users.filter(u => detailedOrder.masajistaIds!.includes(u.id));
    console.log('Matched Masajistas:', matched.map(m => m.name));
    return matched;
  }, [detailedOrder, users]);

  const detailedOrderCashier = useMemo(() => {
    if (!detailedOrder) return 'N/A';
    const transaction = allTransactions.find(t => t.orderId === detailedOrder.id);
    return transaction?.cashier || 'N/A';
  }, [detailedOrder, allTransactions]);

  const handlePrintAuditTicket = async () => {
    if (!detailedOrder) return;

    // Calculate total commission for the order using product-level percentages or fallback
    const totalOrderCommission = (detailedOrder.products || []).reduce((sum, p) => {
      if (p.isCommissionable) {
        const productPercentage = p.commissionPercentage || 0;
        // For audit ticket, we'll use the product percentage if > 0, 
        // otherwise fallback to the first masajista's commission or 32%
        const masajistaDefaultPercentage = masajistasForDetailedOrder.length > 0
          ? (masajistasForDetailedOrder[0].commission || 32)
          : 32;

        const effectivePercentage = productPercentage > 0 ? productPercentage : masajistaDefaultPercentage;
        return sum + (p.price * (effectivePercentage / 100) * p.quantity);
      }
      return sum;
    }, 0);

    const commissionPerMasseuse = masajistasForDetailedOrder.length > 0
      ? totalOrderCommission / masajistasForDetailedOrder.length
      : 0;

    const payload = {
      order: {
        ...detailedOrder,
        // Ensure these fields are passed correctly for the printer
        date: detailedOrder.date,
        time: detailedOrder.time,
        products: detailedOrder.products,
        amount: detailedOrder.amount,
        masajistas: masajistasForDetailedOrder.map(m => ({
          name: m.name,
          commission: commissionPerMasseuse
        })),
        payments: detailedOrder.payments,
        rawMasajistaIds: detailedOrder.masajistaIds
      },
      printerIp,
      type: 'audit-ticket',
      cashierName: detailedOrderCashier
    };

    console.log('Printing Audit Ticket Payload:', JSON.stringify(payload, null, 2));

    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al imprimir ticket de auditoría');
      }
    } catch (error) {
      console.error("Error printing audit ticket:", error);
      alert("Error al imprimir. Verifique la conexión con la impresora.");
    }
  };

  if (!isOpen) return null;

  const isAllSelected = filteredTransactions.length > 0 && selectedTransactions.length === filteredTransactions.length;


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Auditoría de Transacciones</DialogTitle>
                <DialogDescription>
                  Busca y filtra todas las transacciones registradas en el sistema.
                </DialogDescription>
              </div>
              {onOpenCalendar && (
                <Button
                  variant="default"
                  size="lg"
                  onClick={onOpenCalendar}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  CALENDARIO
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, ID orden, método, fecha, hora..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => setActiveFilter('today')}>Hoy</Button>
              <Button variant={activeFilter === 'week' ? 'default' : 'outline'} onClick={() => setActiveFilter('week')}>Semana</Button>
              <Button variant={activeFilter === 'month' ? 'default' : 'outline'} onClick={() => setActiveFilter('month')}>Mes</Button>
              <Button variant={activeFilter === 'year' ? 'default' : 'outline'} onClick={() => setActiveFilter('year')}>Año</Button>
              <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => setActiveFilter('all')}>Todos</Button>
            </div>
          </div>
          <ScrollArea className="flex-grow rounded-md border" id="printable-area">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="hidden sm:table-cell">Cajero</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-[50px] text-right">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        data-state={selectedTransactions.includes(tx.id) ? 'checked' : 'unchecked'}
                        className={tx.status === 'Anulado' ? 'bg-destructive/5' : tx.status === 'Editado' ? 'bg-orange-500/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedTransactions.includes(tx.id)}
                            onCheckedChange={(checked) => handleSelectOne(tx.id, Boolean(checked))}
                            aria-label={`Seleccionar transacción ${tx.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${tx.status === 'Anulado' ? 'text-destructive' : tx.status === 'Editado' ? 'text-orange-600' : ''}`}>{tx.customer}</div>
                          <div className={`text-sm font-mono ${tx.status === 'Anulado' ? 'text-destructive/70' : tx.status === 'Editado' ? 'text-orange-600/70' : 'text-muted-foreground'}`}>
                            {tx.orderDisplayId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tx.status === 'Anulado' ? 'destructive' : tx.status === 'Editado' ? 'secondary' : 'outline'}
                            className={tx.status === 'Editado' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
                          >
                            {tx.method}
                          </Badge>
                        </TableCell>
                        <TableCell className={`hidden sm:table-cell ${tx.status === 'Anulado' ? 'text-destructive' : tx.status === 'Editado' ? 'text-orange-600' : ''}`}>{tx.cashier}</TableCell>
                        <TableCell className={`hidden md:table-cell ${tx.status === 'Anulado' ? 'text-destructive' : tx.status === 'Editado' ? 'text-orange-600' : ''}`}>
                          {new Date(tx.timestamp).toLocaleString('es-PE')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.status === 'Anulado' ? 'text-destructive line-through font-bold' : tx.status === 'Editado' ? 'text-orange-600 font-bold' : ''}`}>
                          S/ {tx.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDetails(tx.orderId)}>
                                Ver Detalle de Orden
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No se encontraron transacciones con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => window.print()} disabled={selectedTransactions.length === 0}>
              <Printer className="mr-2 h-4 w-4" />
              {selectedTransactions.length > 0 ? `Imprimir ${selectedTransactions.length} seleccionados` : 'Imprimir / Exportar PDF'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {detailedOrder && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent>
            <div id="printable-order-details" className="p-6">
              <DialogHeader>
                <DialogTitle>Detalle del Pedido: {detailedOrder.customId || detailedOrder.id}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-col gap-1 mt-2">
                    <span>Pedido para <strong>{detailedOrder.customer}</strong>. Atendido por: <strong>{typeof detailedOrder.waiter === 'object' ? (detailedOrder.waiter as any).name : detailedOrder.waiter}</strong>.</span>
                    <span>Cajero: <strong>{detailedOrderCashier}</strong> &bull; Fecha: <strong>{detailedOrder.date} {detailedOrder.time}</strong></span>
                    {detailedOrder.editedBy && (
                      <span className="text-destructive font-bold">
                        * Este pedido fue {detailedOrder.status === 'Cancelled' ? 'anulado' : 'editado'} por: {detailedOrder.editedBy}
                      </span>
                    )}
                    {detailedOrder.cancelReason && (
                      <span className="text-destructive font-bold italic">
                        Motivo: {detailedOrder.cancelReason}
                      </span>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Productos Consumidos</h4>
                  <ul className="grid gap-3 rounded-md border p-4">
                    {(detailedOrder.products || []).map((product: Product) => (
                      <li key={product.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{product.name} x <span className="font-bold">{product.quantity}</span></span>
                        <div className="flex items-center gap-2">
                          <span>S/ {(product.price * product.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {masajistasForDetailedOrder.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{config.masajistaRoleNamePlural} Asignados</h4>
                    <ul className="grid gap-2 rounded-md border p-4">
                      {masajistasForDetailedOrder.map((masajista) => (
                        <li key={masajista.id} className="flex items-center gap-2 text-sm">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{masajista.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detailedOrder.payments && detailedOrder.payments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Métodos de Pago</h4>
                    <ul className="grid gap-2 rounded-md border p-4 bg-muted/30">
                      {detailedOrder.payments.map((payment: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{payment.method}</span>
                          <span className="font-medium">S/ {payment.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-md">
                  <span>Total de la Orden</span>
                  <span>S/ {(detailedOrder.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-between gap-2 p-6 pt-0">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handlePrintAuditTicket}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button variant="ghost" onClick={handleDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              </div>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
