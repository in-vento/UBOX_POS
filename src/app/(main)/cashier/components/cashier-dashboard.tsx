
'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  Percent,
  MoreHorizontal,
  User,
  Search,
  Printer,
  Wallet,
  Eye,
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
import StaffSalesChart from '../../dashboard/components/staff-sales-chart';
import PaymentMethodsChart from '../../dashboard/components/payment-methods-chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Order, Payment, User as UserType } from '@/lib/types';
import { useConfig } from '@/contexts/config-context';


type RecentTransaction = {
  customer: string;
  orderDisplayId: string;
  paymentMethod: Payment['method'];
  status: string;
  date: string;
  amount: string;
  cashier: string;
  timestamp: string;
}

export default function CashierDashboard({ currentOrders = [], allUsers = [], cashierInCharge, shiftStartTime }: { currentOrders: Order[], allUsers: UserType[], cashierInCharge?: Partial<UserType>, shiftStartTime?: Date | null }) {
  const [masajistaSearchTerm, setMasajistaSearchTerm] = useState('');
  const [selectedMasajistaForDetails, setSelectedMasajistaForDetails] = useState<UserType | null>(null);
  const [isCommissionDetailsOpen, setIsCommissionDetailsOpen] = useState(false);
  const { config } = useConfig();

  const totalSales = useMemo(() => {
    return (currentOrders || []).reduce((sum, order) => {
      // Only count payments made AFTER the shift start time
      const validPayments = (order.payments || []).filter(p => {
        if (!shiftStartTime) return true;
        return new Date(p.timestamp) > shiftStartTime;
      });
      return sum + validPayments.reduce((pSum, p) => pSum + Number(p.amount), 0);
    }, 0);
  }, [currentOrders, shiftStartTime]);

  const recentTransactions = useMemo(() => {
    const transactions: RecentTransaction[] = [];

    const cashierName = cashierInCharge?.name || 'Caja';

    (currentOrders || [])
      .filter(order => order.payments && order.payments.length > 0)
      .forEach(order => {
        order.payments.forEach((payment, index) => {
          // Filter by shift start time
          if (shiftStartTime && new Date(payment.timestamp) <= shiftStartTime) return;

          transactions.push({
            customer: order.customer,
            orderDisplayId: order.customId || order.id.slice(-6),
            paymentMethod: payment.method,
            status: 'Aprobado',
            date: new Date(payment.timestamp).toLocaleString('es-PE'),
            amount: payment.amount.toFixed(2),
            cashier: cashierName,
            timestamp: payment.timestamp
          });
        });
      });
    return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
  }, [currentOrders, cashierInCharge, shiftStartTime]);


  const masajistas = useMemo(() => (allUsers || []).filter(
    (user) => user.role === 'Masajista' && user.status === 'Active'
  ), [allUsers]);

  const masajistaSales = useMemo(() => {
    const sales: Record<string, number> = {};
    masajistas.forEach(m => sales[m.id] = 0);

    // Only include COMPLETED orders (ventas concretadas)
    const ordersWithMasajistas = (currentOrders || []).filter(o => o.status === 'Completed' && o.masajistaIds && o.masajistaIds.length > 0);

    ordersWithMasajistas.forEach(order => {
      // Calculate total commission for the order
      const totalOrderCommission = (order.products || []).reduce((sum, product) => {
        if (product.isCommissionable) {
          // Use product-level commission percentage if > 0, otherwise fallback to masajista's default
          // We'll calculate the base commissionable amount here and apply the masajista's % later if needed,
          // OR calculate the actual commission here if the product has a specific % set.
          // Let's calculate the actual commission here.
          const productPercentage = product.commissionPercentage || 0;
          if (productPercentage > 0) {
            return sum + (product.price * (productPercentage / 100) * (product.quantity || 1));
          } else {
            // Fallback to masajista's default commission (applied later to the price)
            // For now, we'll just return the price and handle the fallback in the masajista loop
            return sum + (product.price * (product.quantity || 1));
          }
        }
        return sum;
      }, 0);

      // Check if order was completed/paid in this shift
      // For simplicity, we use the last payment timestamp or updatedAt
      const orderTime = new Date(order.updatedAt);
      if (shiftStartTime && orderTime <= shiftStartTime) return;

      order.masajistaIds?.forEach(masajistaId => {
        if (sales[masajistaId] !== undefined) {
          const masajista = masajistas.find(m => m.id === masajistaId);
          const masajistaDefaultPercentage = (masajista?.commission || 0) / 100;

          // Recalculate commission for this masajista specifically to handle fallbacks
          const masajistaCommission = (order.products || []).reduce((sum, product) => {
            if (product.isCommissionable) {
              const productPercentage = product.commissionPercentage || 0;
              const effectivePercentage = productPercentage > 0 ? (productPercentage / 100) : masajistaDefaultPercentage;
              return sum + (product.price * effectivePercentage * (product.quantity || 1));
            }
            return sum;
          }, 0);

          // Divide by number of masajistas assigned to the order
          sales[masajistaId] += masajistaCommission / order.masajistaIds!.length;
        }
      });
    });

    return sales;
  }, [masajistas, currentOrders, shiftStartTime]);

  const filteredMasajistas = masajistas.filter(user => user.name.toLowerCase().includes(masajistaSearchTerm.toLowerCase()));

  const { staffCommissionPool, activeStaff, commissionPerStaff } = useMemo(() => {
    const pool = totalSales * 0.10;

    // Only show the currently logged-in cashier
    const staffForCommission = (allUsers || []).filter(u => {
      if (u.status !== 'Active') return false;
      // Include Mozos, Barmen, and Cajeros for the shared commission pool
      // Also include the cashierInCharge explicitly (in case they are an Admin acting as Cashier)
      if (cashierInCharge?.id && u.id === cashierInCharge.id) return true;
      if (cashierInCharge?.name && u.name === cashierInCharge.name) return true;

      const role = u.role.toLowerCase();
      return ['mozo', 'barman', 'cajero', 'administrador', 'admin'].includes(role);
    });

    // If no cashier matched (shouldn't happen if logged in), fallback to empty to avoid showing everyone
    // Or if we want to show "Caja" as a placeholder if no user is found?
    // For now, strict filtering as requested.

    const perStaff = staffForCommission.length > 0 ? pool / staffForCommission.length : 0;

    return {
      staffCommissionPool: pool,
      activeStaff: staffForCommission,
      commissionPerStaff: perStaff,
    };
  }, [allUsers, totalSales, cashierInCharge]);

  // Estado para IP de impresora (local)
  const [printerIp, setPrinterIp] = useState<string>('192.168.18.137');

  // Cargar IP al montar
  useState(() => {
    if (typeof window !== 'undefined') {
      const savedIp = localStorage.getItem('printerIp');
      if (savedIp) setPrinterIp(savedIp);
    }
  });

  const handlePrintCommission = async (staffName: string, amount: number) => {
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {}, // Dummy order object as it's not needed for commission
          printerIp,
          type: 'commission-ticket',
          staffName,
          amount
        })
      });

      if (!res.ok) {
        throw new Error('Error al imprimir ticket de comisión');
      }
    } catch (error) {
      console.error("Error printing commission ticket:", error);
      alert("Error al imprimir. Verifique la conexión con la impresora.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/
                {totalSales.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                +5.2% desde ayer
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Comisión de Personal (10%)</span>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {staffCommissionPool.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Dividido entre {activeStaff.length} miembros del personal.
              </p>
              <ScrollArea className="h-20 mt-2">
                <div className="space-y-2 text-xs">
                  {activeStaff.map(staff => (
                    <div key={staff.id} className="flex justify-between items-center text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                          <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{staff.name}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        S/ {commissionPerStaff.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>
              Últimos pagos registrados en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-72px)]">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Método Pago
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Cajero</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx, idx) => (
                    <TableRow key={`${tx.orderDisplayId}-${tx.date}-${idx}`}>
                      <TableCell>
                        <div className="font-medium">{tx.customer}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline font-mono">
                          {tx.orderDisplayId}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{tx.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          {tx.cashier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        S/ {parseFloat(tx.amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Detalle</DropdownMenuItem>
                            <DropdownMenuItem>
                              Imprimir Voucher
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Comisión de {config.masajistaRoleNamePlural}
                </CardTitle>
                <CardDescription className="pt-2">Comisión total del día por {config.masajistaRoleName.toLowerCase()} activo.</CardDescription>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Buscar ${config.masajistaRoleName.toLowerCase()}...`}
                className="pl-8"
                value={masajistaSearchTerm}
                onChange={(e) => setMasajistaSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="h-40">
            <ScrollArea className="h-full">
              <div className="space-y-4 text-sm">
                {filteredMasajistas.map((staff) => {
                  const commissionAmount = masajistaSales[staff.id] || 0;

                  return (
                    <div
                      key={staff.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                          <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <p className="font-medium text-muted-foreground">
                            {staff.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{staff.commission || 0}% de comisión</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          S/ {commissionAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedMasajistaForDetails(staff);
                              setIsCommissionDetailsOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintCommission(staff.name, commissionAmount)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir Ticket de Comisión
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="grid gap-6 xl:grid-cols-2">
          <PaymentMethodsChart orders={currentOrders} shiftStartTime={shiftStartTime} />
          <StaffSalesChart orders={currentOrders} users={allUsers} shiftStartTime={shiftStartTime} />
        </div>
      </div>

      {/* Commission Details Dialog */}
      {selectedMasajistaForDetails && (
        <Dialog open={isCommissionDetailsOpen} onOpenChange={setIsCommissionDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Comisión: {selectedMasajistaForDetails.name}</DialogTitle>
              <DialogDescription>
                Pedidos asignados durante el turno actual. Comisión: {selectedMasajistaForDetails.commission || 32}%
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {(() => {
                // Get all completed orders for this masajista in current shift
                const masajistaOrders = currentOrders.filter(order => {
                  if (order.status !== 'Completed') return false;
                  if (!order.masajistaIds?.includes(selectedMasajistaForDetails.id)) return false;
                  if (shiftStartTime && new Date(order.updatedAt) <= shiftStartTime) return false;
                  return true;
                });

                const masajistaDefaultPercentage = (selectedMasajistaForDetails.commission || 32) / 100;

                // Calculate total commission
                let totalCommission = 0;
                masajistaOrders.forEach(order => {
                  const orderCommission = (order.products || []).reduce((sum, product) => {
                    if (product.isCommissionable) {
                      const productPercentage = product.commissionPercentage || 0;
                      const effectivePercentage = productPercentage > 0 ? (productPercentage / 100) : masajistaDefaultPercentage;
                      return sum + (product.price * effectivePercentage * (product.quantity || 1));
                    }
                    return sum;
                  }, 0);
                  totalCommission += orderCommission / (order.masajistaIds?.length || 1);
                });

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">Total de Pedidos</div>
                        <div className="text-2xl font-bold">{masajistaOrders.length}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground">Total en Ventas</div>
                        <div className="text-2xl font-bold">
                          S/ {masajistaOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4 bg-green-50">
                        <div className="text-sm text-muted-foreground">Total en Comisiones</div>
                        <div className="text-2xl font-bold text-green-600">
                          S/ {totalCommission.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Orders List */}
                    {masajistaOrders.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Pedidos del Turno</h4>
                        {masajistaOrders.map(order => {
                          const orderCommission = (order.products || []).reduce((sum, product) => {
                            if (product.isCommissionable) {
                              const productPercentage = product.commissionPercentage || 0;
                              const effectivePercentage = productPercentage > 0 ? (productPercentage / 100) : masajistaDefaultPercentage;
                              return sum + (product.price * effectivePercentage * (product.quantity || 1));
                            }
                            return sum;
                          }, 0) / (order.masajistaIds?.length || 1);

                          return (
                            <div key={order.id} className="rounded-lg border p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">Pedido: {order.customId || order.id.slice(-6)}</div>
                                  <div className="text-sm text-muted-foreground">Cliente: {order.customer}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(order.updatedAt).toLocaleString('es-PE')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">S/ {order.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                                  <div className="text-sm text-green-600 font-medium">
                                    Comisión: S/ {orderCommission.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>

                              {/* Products */}
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Productos Comisionables:</div>
                                {(order.products || []).filter(p => p.isCommissionable).map(product => {
                                  const productPercentage = product.commissionPercentage || 0;
                                  const effectivePercentage = productPercentage > 0 ? productPercentage : (selectedMasajistaForDetails.commission || 32);
                                  const productCommission = (product.price * (effectivePercentage / 100) * (product.quantity || 1)) / (order.masajistaIds?.length || 1);

                                  return (
                                    <div key={product.id} className="flex justify-between text-xs bg-muted/30 p-2 rounded">
                                      <span>{product.name} x{product.quantity} ({effectivePercentage}%)</span>
                                      <span className="font-medium text-green-600">
                                        S/ {productCommission.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  );
                                })}
                                {(order.products || []).filter(p => p.isCommissionable).length === 0 && (
                                  <div className="text-xs text-muted-foreground italic">No hay productos comisionables en este pedido</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay pedidos asignados a esta masajista en el turno actual
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCommissionDetailsOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
