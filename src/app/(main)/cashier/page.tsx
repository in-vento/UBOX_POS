
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Printer, Search, User, WalletCards, CreditCard, Loader2, Save, Users as UsersIcon, FileText } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Order, Payment, PaymentMethod, User as UserType, UserRole } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CashierDashboard from './components/cashier-dashboard';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EndOfDayReportDialog from './components/end-of-day-report';
import HandoverDialog from './components/handover-dialog';
import { Switch } from '@/components/ui/switch';
import { DigitInput } from '@/components/digit-input';
import { KeypadInput } from '@/components/keypad-input';
import { SunatEmissionDialog } from '@/components/sunat-emission-dialog';



const paymentMethodIcons: { [key: string]: React.ReactElement } = {
    'Efectivo': <DollarSign className="h-4 w-4" />,
    'Yape / Plin': <WalletCards className="h-4 w-4" />,
    'Tarjeta': <CreditCard className="h-4 w-4" />,
};

const AttendanceDialog = ({
    isOpen,
    onOpenChange,
    allUsers,
    onUserUpdate
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    allUsers: UserType[],
    onUserUpdate: () => void;
}) => {
    const { toast } = useToast();

    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [roleToAdd, setRoleToAdd] = useState<UserRole | null>(null);

    // Confirmation Dialog State
    const [confirmDialogState, setConfirmDialogState] = useState<{
        isOpen: boolean;
        user: UserType | null;
        newStatus: 'Active' | 'Inactive' | null;
        newRole: UserRole | null;
    }>({ isOpen: false, user: null, newStatus: null, newRole: null });

    const handleStatusChange = async (user: UserType, newStatus: 'Active' | 'Inactive', newRole?: UserRole) => {
        try {
            const updateData: any = { status: newStatus };
            if (newRole) {
                updateData.role = newRole;
            }

            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!res.ok) throw new Error('Failed to update status');

            const roleChangeMsg = newRole && newRole !== user.role ? ` con rol ${newRole}` : '';
            toast({
                title: `Personal ${newStatus === 'Active' ? 'Activado' : 'Desactivado'}`,
                description: `${user.name} ha sido marcado como ${newStatus === 'Active' ? 'activo' : 'inactivo'}${roleChangeMsg}.`
            });
            onUserUpdate();
        } catch (error) {
            console.error("Error updating user status:", error);
            toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
        }
    }

    const initiateStatusChange = (user: UserType, newStatus: 'Active' | 'Inactive') => {
        // Only ask for confirmation if enabling (Active) or disabling (Inactive)
        // Ideally always ask to prevent mistakes
        setConfirmDialogState({
            isOpen: true,
            user,
            newStatus,
            newRole: user.role // Initialize with current role
        });
    };

    const confirmStatusChange = async () => {
        if (confirmDialogState.user && confirmDialogState.newStatus) {
            await handleStatusChange(
                confirmDialogState.user,
                confirmDialogState.newStatus,
                confirmDialogState.newRole || undefined
            );
        }
        setConfirmDialogState({ isOpen: false, user: null, newStatus: null, newRole: null });
    };

    const openAddUserDialog = (role: UserRole) => {
        setRoleToAdd(role);
        setIsAddUserDialogOpen(true);
    };

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!roleToAdd) return;

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const pin = formData.get('pin') as string;
        const commission = roleToAdd === 'Masajista' ? Number(formData.get('commission')) : undefined;

        if (name) {
            try {
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        phone,
                        role: roleToAdd,
                        pin: pin || '1234',
                        commission,
                        email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
                    })
                });

                if (!res.ok) throw new Error('Failed to create user');

                toast({
                    title: `${roleToAdd} Añadido y Activado`,
                    description: `${name} ha sido añadido al sistema.`
                });
                onUserUpdate();
                setIsAddUserDialogOpen(false);
                setRoleToAdd(null);
            } catch (error) {
                console.error("Error adding user:", error);
                toast({ title: 'Error', description: 'No se pudo añadir el usuario.', variant: 'destructive' });
            }
        }
    };


    const renderUserList = (roles: string[]) => {
        const usersOfRole = allUsers.filter(u =>
            roles.map(r => r.toLowerCase()).includes(u.role.toLowerCase()) &&
            u.email !== 'admin@ubox.com'
        );
        return (
            <div className="space-y-4">
                <div className="flex justify-end gap-2">
                    {roles.includes('Mozo') && <Button size="sm" onClick={() => openAddUserDialog('Mozo')}>Añadir Mozo</Button>}
                    {roles.includes('Barman') && <Button size="sm" onClick={() => openAddUserDialog('Barman')}>Añadir Barman</Button>}
                    {roles.includes('Masajista') && <Button size="sm" onClick={() => openAddUserDialog('Masajista')}>Añadir Masajista</Button>}
                </div>
                <ScrollArea className="h-72 rounded-md border">
                    <div className="p-4 space-y-4">
                        {usersOfRole.map(user => (
                            <div key={user.id} className="flex items-center justify-between">
                                <Label htmlFor={`switch-${user.id}`} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span>{user.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-5">{user.role}</Badge>
                                    </div>
                                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                                        Último acceso: {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : 'N/A'}
                                    </span>
                                </Label>
                                <Switch
                                    id={`switch-${user.id}`}
                                    checked={user.status === 'Active'}
                                    onCheckedChange={(checked) => initiateStatusChange(user, checked ? 'Active' : 'Inactive')}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Control de Asistencia</DialogTitle>
                        <DialogDescription>
                            Activa o desactiva al personal para el turno actual.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="staff" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="staff">Personal (Mozos/Bar/Admin)</TabsTrigger>
                            <TabsTrigger value="masajistas">Masajistas</TabsTrigger>
                        </TabsList>
                        <TabsContent value="staff">
                            {renderUserList(['Mozo', 'Barman', 'Administrador', 'admin'])}
                        </TabsContent>
                        <TabsContent value="masajistas">
                            {renderUserList(['Masajista'])}
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogState.isOpen} onOpenChange={(open) => !open && setConfirmDialogState(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
                        <DialogDescription>
                            {confirmDialogState.newStatus === 'Active'
                                ? `Estás habilitando a ${confirmDialogState.user?.name} para el turno actual.`
                                : `¿Estás seguro de que deseas deshabilitar a ${confirmDialogState.user?.name}?`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {/* Only show role selector when ACTIVATING a user AND they are NOT a Masajista */}
                    {confirmDialogState.newStatus === 'Active' && confirmDialogState.user && confirmDialogState.user.role !== 'Masajista' && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="role-select">Rol para este turno</Label>
                                <Select
                                    value={confirmDialogState.newRole || confirmDialogState.user.role}
                                    onValueChange={(value) => setConfirmDialogState(prev => ({ ...prev, newRole: value as UserRole }))}
                                >
                                    <SelectTrigger id="role-select">
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mozo">Mozo</SelectItem>
                                        <SelectItem value="Barman">Barman</SelectItem>
                                        <SelectItem value="Cajero">Cajero</SelectItem>
                                        <SelectItem value="Administrador">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Show alert if role is being changed */}
                            {confirmDialogState.newRole && confirmDialogState.newRole !== confirmDialogState.user.role && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-sm text-amber-800">
                                        <strong>Cambio de rol:</strong> {confirmDialogState.user.role} → {confirmDialogState.newRole}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="sm:justify-end">
                        <Button variant="outline" onClick={() => setConfirmDialogState(prev => ({ ...prev, isOpen: false }))}>
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmDialogState.newStatus === 'Active' ? 'default' : 'destructive'}
                            onClick={confirmStatusChange}
                        >
                            {confirmDialogState.newStatus === 'Active' ? 'Confirmar y Habilitar' : 'Deshabilitar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleAddUser}>
                        <DialogHeader>
                            <DialogTitle>Añadir Nuevo {roleToAdd}</DialogTitle>
                            <DialogDescription>
                                Complete los detalles para añadir un nuevo miembro al personal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-name">Nombre</Label>
                                <Input id="add-name" name="name" placeholder="Nombre completo" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-phone">Teléfono</Label>
                                <Input id="add-phone" name="phone" type="tel" placeholder="987 654 321" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-pin">PIN (4 dígitos)</Label>
                                <Input id="add-pin" name="pin" type="password" placeholder="****" maxLength={4} />
                            </div>
                            {roleToAdd === 'Masajista' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="add-commission">Comisión (%)</Label>
                                    <Input id="add-commission" name="commission" type="number" placeholder="32" />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Añadir y Activar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};


function BillingContent({ orders, onDataChange, allUsers, cashierName, sunatEmissionDialogOpen, setSunatEmissionDialogOpen, orderForEmission, setOrderForEmission }: {
    orders: Order[],
    onDataChange: () => void,
    allUsers: UserType[],
    cashierName: string,
    sunatEmissionDialogOpen: boolean,
    setSunatEmissionDialogOpen: (open: boolean) => void,
    orderForEmission: Order | null,
    setOrderForEmission: (order: Order | null) => void
}) {
    const searchParams = useSearchParams();

    // const cashierName = searchParams.get('name') || 'Cajero'; // Now passed as prop

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const [paymentCents, setPaymentCents] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod['method'] | ''>('');
    const [operationCode, setOperationCode] = useState('');

    // Change Dialog State
    const [changeDialogState, setChangeDialogState] = useState<{
        isOpen: boolean;
        total: number;
        tendered: number;
        change: number;
        orderId: string;
    }>({ isOpen: false, total: 0, tendered: 0, change: 0, orderId: '' });

    const [printerIp, setPrinterIp] = useState<string>('');

    useEffect(() => {
        const savedIp = localStorage.getItem('printerIp');
        if (savedIp) {
            setPrinterIp(savedIp);
        }
    }, []);

    const handlePrintTicket = async (order: Order, tendered: number, change: number, operationCode?: string) => {
        try {
            toast({
                title: "Imprimiendo...",
                description: "Enviando orden a la impresora...",
            });

            // Resolve waiter name
            let resolvedWaiterName = 'Caja';
            if (order.waiter && typeof order.waiter === 'object' && order.waiter.name) {
                resolvedWaiterName = order.waiter.name;
            } else if (order.waiterId) {
                const foundWaiter = allUsers.find(u => u.id === order.waiterId);
                if (foundWaiter) {
                    resolvedWaiterName = foundWaiter.name;
                }
            }

            const res = await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order,
                    printerIp: printerIp || undefined,
                    cashierName,
                    waiterName: resolvedWaiterName,
                    paymentDetails: {
                        tendered,
                        change,
                        operationCode
                    }
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al imprimir');
            }

            toast({
                title: "Éxito",
                description: "Ticket impreso y cortado correctamente.",
            });

        } catch (error: any) {
            console.error("Error printing:", error);
            toast({
                title: "Error de Impresión",
                description: "No se pudo conectar con la impresora. Verifique la IP y conexión.",
                variant: "destructive"
            });

            // Fallback to browser print if server print fails? 
            // For now, let's just show the error as requested to fix the cut issue.
        }
    };

    const confirmCashPayment = async () => {
        if (!selectedOrder) return;

        const { tendered, change } = changeDialogState;
        const amountToRegister = changeDialogState.total; // Register the exact balance amount

        try {
            // Construct the structured method string
            const methodString = `Efectivo|Recibido:${tendered.toFixed(2)}|Vuelto:${change.toFixed(2)}`;

            const res = await fetch(`/api/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment: {
                        amount: amountToRegister,
                        method: methodString, // Send the structured string
                        cashier: cashierName
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to process payment');

            const updatedOrder = await res.json();

            toast({
                title: "Pago Registrado",
                description: `Se registró el pago correctamente.`,
            });

            // DO NOT Print Ticket Automatically
            // handlePrintTicket(selectedOrder, tendered, change);

            setSelectedOrder(updatedOrder);
            setPaymentCents(0);
            setPaymentMethod('');
            setChangeDialogState({ isOpen: false, total: 0, tendered: 0, change: 0, orderId: '' });
            onDataChange();
        } catch (error) {
            console.error("Error processing payment: ", error);
            toast({
                title: "Error",
                description: `No se pudo procesar el pago.`,
                variant: 'destructive'
            });
        }
    };

    const { toast } = useToast();


    const pendingOrders = useMemo(() => {
        const allPending = (orders || []).filter(
            (order) => order.status === 'Pending'
        );
        if (!searchTerm) {
            return allPending;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return allPending.filter(
            (order) =>
                order.customer.toLowerCase().includes(lowercasedFilter) ||
                (order.waiter && (typeof order.waiter === 'object' ? order.waiter.name : order.waiter).toLowerCase().includes(lowercasedFilter)) ||
                (order.customId && order.customId.toLowerCase().includes(lowercasedFilter)) ||
                order.id.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, orders]);

    const handleOpenDetails = (order: Order) => {
        setIsProcessingPayment(true);
        // Find the latest version of the order from the main list
        const currentOrder = orders.find(o => o.id === order.id);
        setSelectedOrder(currentOrder || order);
        setPaymentCents(0);
        setPaymentMethod('');
        setOperationCode('');
    };

    const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^0-9]/g, '');
        setPaymentCents(Number(digits));
    };


    const processPaymentLogic = async (): Promise<boolean> => {
        if (!selectedOrder || !paymentMethod || paymentCents <= 0) {
            toast({
                title: "Datos incompletos",
                description: "Por favor, ingrese un monto y seleccione un método de pago.",
                variant: "destructive",
            });
            return false;
        }

        if (paymentMethod === 'Yape / Plin' && !operationCode) {
            toast({
                title: "Falta Código de Operación",
                description: "Por favor, ingrese el código de operación para pagos con Yape / Plin.",
                variant: "destructive",
            });
            return false;
        }
        const numericAmount = paymentCents / 100;

        const remainingBalance = selectedOrder.totalAmount - (selectedOrder.paidAmount || 0);

        // Validation logic
        if (numericAmount > remainingBalance + 0.001) {
            // If NOT cash, block the payment
            if (paymentMethod !== 'Efectivo') {
                toast({
                    title: "Monto excede el saldo",
                    description: `El monto ingresado es mayor al saldo pendiente de S/ ${remainingBalance.toFixed(2)}.`,
                    variant: "destructive",
                });
                return false;
            }

            // If Cash and exceeds balance, OPEN CHANGE DIALOG
            if (paymentMethod === 'Efectivo') {
                const change = numericAmount - remainingBalance;
                setChangeDialogState({
                    isOpen: true,
                    total: remainingBalance,
                    tendered: numericAmount,
                    change: change,
                    orderId: selectedOrder.id
                });
                return false; // Stop here, wait for confirmation in dialog
            }
        }

        // Normal flow for exact payments or partial payments (or non-cash excess which is blocked above)
        const amountToRegister = numericAmount;

        try {
            let methodString: string = paymentMethod;
            if (paymentMethod === 'Yape / Plin') {
                methodString = `Yape / Plin|Operacion:${operationCode}`;
            }

            const res = await fetch(`/api/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment: {
                        amount: amountToRegister,
                        method: methodString,
                        cashier: cashierName
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to process payment');

            const updatedOrder = await res.json();

            toast({
                title: "Pago Registrado",
                description: `Se registró un pago de S/ ${amountToRegister.toFixed(2)} para la orden ${selectedOrder.customId || selectedOrder.id.slice(-6)}.`,
            });

            setSelectedOrder(updatedOrder);
            setPaymentCents(0);
            setPaymentMethod('');
            setOperationCode('');
            onDataChange();
            return true;
        } catch (error) {
            console.error("Error processing payment: ", error);
            toast({
                title: "Error",
                description: `No se pudo procesar el pago.`,
                variant: 'destructive'
            });
            return false;
        }
    }

    const handleProcessAndKeepOpen = async () => {
        const success = await processPaymentLogic();
        if (success && selectedOrder?.status === 'Completed') {
            setTimeout(() => {
                closeDialog();
            }, 1500);
        }
    };

    const handleProcessAndClose = async () => {
        const success = await processPaymentLogic();
        if (success) {
            closeDialog();
        }
    }

    const closeDialog = () => {
        setSelectedOrder(null);
        setIsProcessingPayment(false);
    }

    const remainingBalance = selectedOrder ? selectedOrder.totalAmount - (selectedOrder.paidAmount || 0) : 0;
    const enteredAmount = paymentCents / 100;
    const isPartialPayment = enteredAmount > 0 && enteredAmount < remainingBalance;

    const paymentDisplayValue = useMemo(() => {
        if (paymentCents === 0) return '';
        const soles = Math.floor(paymentCents / 100);
        const cents = paymentCents % 100;
        return `${soles.toLocaleString('es-PE')}.${cents.toString().padStart(2, '0')}`;
    }, [paymentCents]);


    return (
        <>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <CardTitle>Cuentas Abiertas</CardTitle>
                                    <CardDescription>
                                        Listado de pedidos pendientes de pago.
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Buscar por mesa, mozo, orden..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ScrollArea className="h-[300px]">
                                {!orders ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mesa / Cliente</TableHead>
                                                <TableHead className="hidden sm:table-cell">Mozo</TableHead>
                                                <TableHead className="text-right">Saldo Pendiente</TableHead>
                                                <TableHead className="text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingOrders.length > 0 ? (
                                                pendingOrders.map((order) => {
                                                    const pendingAmount = order.totalAmount - (order.paidAmount || 0);
                                                    return (
                                                        <TableRow key={order.id}>
                                                            <TableCell>
                                                                <div className="font-medium">{order.customer}</div>
                                                                <div className="text-sm text-muted-foreground font-mono font-semibold">
                                                                    {order.customId || order.id.slice(-6)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <Badge variant="secondary">{typeof order.waiter === 'object' ? order.waiter?.name : order.waiter}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="font-semibold">
                                                                    S/ {pendingAmount.toLocaleString('es-PE', {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </div>
                                                                {(order.paidAmount || 0) > 0 && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        de S/ {order.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button size="sm" variant="outline" onClick={() => handleOpenDetails(order)}>
                                                                    Ver Detalles
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24">
                                                        No se encontraron cuentas abiertas.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Control de Asistencia</CardTitle>
                            <CardDescription>Activa el personal para el turno actual.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full h-16 text-lg" onClick={() => (window as any).openAttendanceDialog()}>
                                <UsersIcon className="mr-4 h-8 w-8" /> Gestionar Personal de Turno
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones de Caja</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <div className="mb-4">
                                <Label htmlFor="printer-ip">IP Impresora</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="printer-ip"
                                        value={printerIp}
                                        onChange={(e) => {
                                            setPrinterIp(e.target.value);
                                            localStorage.setItem('printerIp', e.target.value);
                                        }}
                                        placeholder="IP (Opcional)"
                                    />
                                </div>
                            </div>
                            <Button className="w-full justify-start gap-2 h-auto py-3 whitespace-normal text-left">
                                <Printer className="shrink-0 h-4 w-4" /> <span>Imprimir Reporte X</span>
                            </Button>
                            <Button className="w-full justify-start gap-2 h-auto py-3 whitespace-normal text-left">
                                <Printer className="shrink-0 h-4 w-4" /> <span>Imprimir Reporte Z</span>
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full justify-start gap-2 mt-4 h-auto py-3 whitespace-normal text-left"
                                onClick={() => (window as any).openEndOfDayDialog()}
                            >
                                <DollarSign className="shrink-0 h-4 w-4" /> <span>Cierre de Caja</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div >
            </div >
            {selectedOrder && (
                <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
                    <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Cobrar Pedido: {selectedOrder.customId || selectedOrder.id.slice(-6)}</DialogTitle>
                            <DialogDescription>Cliente: {selectedOrder.customer}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Total and Balance */}
                            <div className="space-y-2 rounded-lg border bg-background p-4">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Total de la Orden</span>
                                    <span>S/ {(selectedOrder.totalAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Monto Pagado</span>
                                    <span>S/ {(selectedOrder.paidAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Saldo Restante</span>
                                    <span>S/ {remainingBalance.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Payment History */}
                            {(selectedOrder.payments && selectedOrder.payments.length > 0) && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Historial de Pagos</h4>
                                    <ScrollArea className="h-20 rounded-md border">
                                        <div className="p-2 text-sm">
                                            {selectedOrder.payments.map((p, index) => {
                                                const parts = p.method.split('|');
                                                const mainMethod = parts[0];
                                                const details = parts.slice(1).join(' | ');

                                                return (
                                                    <div key={index} className="flex justify-between items-center py-1">
                                                        <div className="flex flex-col">
                                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                                {paymentMethodIcons[mainMethod] || <DollarSign className="h-4 w-4" />} {mainMethod}
                                                            </span>
                                                            {details && (
                                                                <span className="text-xs text-muted-foreground ml-6">
                                                                    {details}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-medium">
                                                            S/ {p.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}


                            {/* Payment Form */}
                            {selectedOrder.status === 'Pending' && (
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="payment-amount">Monto a Pagar</Label>
                                            <KeypadInput
                                                value={paymentCents}
                                                onChange={(val) => setPaymentCents(val)}
                                                displayValue={paymentDisplayValue}
                                                placeholder={(remainingBalance).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="payment-method">Método</Label>
                                            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod['method'])}>
                                                <SelectTrigger id="payment-method">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Efectivo"><span>Efectivo</span></SelectItem>
                                                    <SelectItem value="Yape / Plin"><span>Yape / Plin</span></SelectItem>
                                                    <SelectItem value="Tarjeta"><span>Tarjeta</span></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {paymentMethod === 'Yape / Plin' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="operation-code">Código de Operación</Label>
                                            <DigitInput
                                                value={operationCode}
                                                onChange={setOperationCode}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button onClick={handleProcessAndKeepOpen} disabled={!paymentCents || !paymentMethod || isPartialPayment} className="w-full">
                                            <DollarSign className="mr-2 h-4 w-4" /> Registrar Pago
                                        </Button>
                                        {isPartialPayment && (
                                            <Button onClick={handleProcessAndClose} className="w-full">
                                                <Save className="mr-2 h-4 w-4" /> Guardar y Mantener Saldo
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Completed Order View */}
                            {selectedOrder.status === 'Completed' && (
                                <div className="flex flex-col gap-4">
                                    <div className="text-center text-green-600 font-bold p-4 bg-green-50 rounded-lg">
                                        ¡Esta orden ha sido pagada en su totalidad!
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            // Try to find change info from the last payment
                                            let tendered = selectedOrder.totalAmount;
                                            let change = 0;
                                            let opCode = '';

                                            const lastPayment = selectedOrder.payments?.[selectedOrder.payments.length - 1];
                                            if (lastPayment && lastPayment.method.includes('|')) {
                                                const parts = lastPayment.method.split('|');
                                                const receivedPart = parts.find(p => p.startsWith('Recibido:'));
                                                const changePart = parts.find(p => p.startsWith('Vuelto:'));
                                                const opPart = parts.find(p => p.startsWith('Operacion:'));

                                                if (receivedPart) tendered = parseFloat(receivedPart.split(':')[1]);
                                                if (changePart) change = parseFloat(changePart.split(':')[1]);
                                                if (opPart) opCode = opPart.split(':')[1];
                                            }

                                            handlePrintTicket(selectedOrder, tendered, change, opCode);
                                        }}
                                    >
                                        <Printer className="mr-2 h-4 w-4" /> Imprimir Ticket
                                    </Button>

                                    <Button
                                        variant="default"
                                        className="w-full"
                                        onClick={() => {
                                            setOrderForEmission(selectedOrder);
                                            setSunatEmissionDialogOpen(true);
                                        }}
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> Emitir Comprobante Electrónico
                                    </Button>
                                </div>
                            )}

                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cerrar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )
            }

            {/* Change Confirmation Dialog */}
            <Dialog open={changeDialogState.isOpen} onOpenChange={(open) => !open && setChangeDialogState(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Vuelto</DialogTitle>
                        <DialogDescription>
                            El monto ingresado excede el saldo pendiente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center text-lg">
                            <span>Total a Pagar:</span>
                            <span className="font-bold">S/ {changeDialogState.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg">
                            <span>Efectivo Recibido:</span>
                            <span className="font-bold">S/ {changeDialogState.tendered.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-xl font-bold text-green-600">
                            <span>Vuelto a Entregar:</span>
                            <span>S/ {changeDialogState.change.toFixed(2)}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 flex gap-2 items-start">
                            <Printer className="h-4 w-4 mt-0.5" />
                            <span>Al confirmar, se registrará el pago. Podrás imprimir el ticket desde la ventana principal.</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChangeDialogState(prev => ({ ...prev, isOpen: false }))}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmCashPayment}>
                            Confirmar y Entregar Vuelto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function CashierPage() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const [cashierInCharge, setCashierInCharge] = useState<Partial<UserType>>({ name: 'N/A' });

    const [orders, setOrders] = useState<Order[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    // SUNAT Emission Dialog State
    const [sunatEmissionDialogOpen, setSunatEmissionDialogOpen] = useState(false);
    const [orderForEmission, setOrderForEmission] = useState<Order | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const ordersData = await res.json();
                // Transform items to products and map fields to match frontend expectations
                const transformedOrders = ordersData.map((order: any) => ({
                    ...order,
                    amount: order.totalAmount || 0,
                    paidAmount: (order.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0),
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
                        category: item.product?.category,
                        isCommissionable: item.product?.isCommissionable
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
                setAllUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const refreshAllData = () => {
        fetchOrders();
        fetchUsers();
    };

    // Initial fetch and polling
    useEffect(() => {
        refreshAllData();
        const interval = setInterval(refreshAllData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const isLoading = isLoadingOrders || isLoadingUsers;

    const [isEndOfDayDialogOpen, setIsEndOfDayDialogOpen] = useState(false);
    const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
    const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false);
    const [pendingOrdersForHandover, setPendingOrdersForHandover] = useState<Order[]>([]);
    const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
    const { toast } = useToast();

    const isAdmin = role === 'admin';
    const isCashier = role === 'cajero';



    useEffect(() => {
        if (allUsers) {
            // Priority: Cajero -> Administrador -> Admin (excluding Super Admin)
            const activeCashier = allUsers.find(user => user.role.toLowerCase() === 'cajero' && user.status === 'Active') ||
                allUsers.find(user => ['administrador', 'admin'].includes(user.role.toLowerCase()) && user.status === 'Active' && user.email !== 'admin@ubox.com') ||
                { name: 'N/A' };
            setCashierInCharge(activeCashier);
        }
    }, [allUsers]);

    useEffect(() => {
        (window as any).openAttendanceDialog = () => setIsAttendanceDialogOpen(true);
        (window as any).openEndOfDayDialog = () => setIsEndOfDayDialogOpen(true);

        return () => {
            delete (window as any).openAttendanceDialog;
            delete (window as any).openEndOfDayDialog;
        };
    }, []);

    // Check for Handover on Mount
    useEffect(() => {
        const checkHandover = async () => {
            try {
                // Fetch specifically for the last close with pending and last acceptance
                const [closeRes, acceptRes] = await Promise.all([
                    fetch('/api/logs?action=SHIFT_CLOSE_WITH_PENDING&limit=1'),
                    fetch('/api/logs?action=HANDOVER_ACCEPTED&limit=1')
                ]);

                if (closeRes.ok) {
                    const closeLogs = await closeRes.json();
                    if (closeLogs && closeLogs.length > 0) {
                        const lastClose = closeLogs[0];
                        const lastCloseTime = new Date(lastClose.timestamp).getTime();

                        let lastAcceptTime = 0;
                        if (acceptRes.ok) {
                            const acceptLogs = await acceptRes.json();
                            if (acceptLogs && acceptLogs.length > 0) {
                                lastAcceptTime = new Date(acceptLogs[0].timestamp).getTime();
                            }
                        }

                        // Also check for reported handovers to avoid showing it again if already reported
                        const reportRes = await fetch('/api/logs?action=HANDOVER_REPORTED&limit=1');
                        if (reportRes.ok) {
                            const reportLogs = await reportRes.json();
                            if (reportLogs && reportLogs.length > 0) {
                                const lastReportTime = new Date(reportLogs[0].timestamp).getTime();
                                // If reported AFTER the last close, consider it handled
                                if (lastReportTime > lastCloseTime) {
                                    lastAcceptTime = Math.max(lastAcceptTime, lastReportTime);
                                }
                            }
                        }

                        // If the last close with pending is NEWER than the last acceptance/report
                        if (lastCloseTime > lastAcceptTime) {
                            // Fetch pending orders to show
                            const ordersRes = await fetch('/api/orders?status=Pending');
                            if (ordersRes.ok) {
                                const pendingOrders = await ordersRes.json();
                                if (pendingOrders.length > 0) {
                                    setPendingOrdersForHandover(pendingOrders);
                                    setIsHandoverDialogOpen(true);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking handover status:", error);
            }
        };
        checkHandover();
    }, []);

    // Fetch Shift Start Time
    useEffect(() => {
        const fetchShiftStart = async () => {
            try {
                console.log('Fetching shift start logs...');
                const res = await fetch('/api/logs?action=SHIFT_CLOSE&limit=1', { cache: 'no-store' });
                const resPending = await fetch('/api/logs?action=SHIFT_CLOSE_WITH_PENDING&limit=1', { cache: 'no-store' });

                let lastCloseTime = null;

                if (res.ok) {
                    const logs = await res.json();
                    console.log('SHIFT_CLOSE logs:', logs);
                    if (logs && logs.length > 0) {
                        lastCloseTime = new Date(logs[0].timestamp);
                    }
                }

                if (resPending.ok) {
                    const logs = await resPending.json();
                    console.log('SHIFT_CLOSE_WITH_PENDING logs:', logs);
                    if (logs && logs.length > 0) {
                        const pendingTime = new Date(logs[0].timestamp);
                        if (!lastCloseTime || pendingTime > lastCloseTime) {
                            lastCloseTime = pendingTime;
                        }
                    }
                }

                console.log('Calculated shiftStartTime:', lastCloseTime);
                setShiftStartTime(lastCloseTime);
            } catch (error) {
                console.error("Error fetching shift start time:", error);
            }
        };
        fetchShiftStart();
    }, [isEndOfDayDialogOpen]); // Re-fetch when end of day dialog closes (new shift starts)

    const handleHandoverAccept = async () => {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'HANDOVER_ACCEPTED',
                    details: `Caja recibida con ${pendingOrdersForHandover.length} cuentas pendientes.`,
                    userId: cashierInCharge.id || null
                })
            });
            setIsHandoverDialogOpen(false);
            toast({
                title: "Turno Iniciado",
                description: "Has aceptado la caja y las cuentas pendientes.",
            });
        } catch (error) {
            console.error("Error accepting handover:", error);
            toast({ title: 'Error', description: 'No se pudo registrar la recepción.', variant: 'destructive' });
        }
    };

    const handleHandoverReport = async (reason: string) => {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'HANDOVER_REPORTED',
                    details: `Reporte al recibir caja: ${reason}`,
                    userId: cashierInCharge.id || null
                })
            });
            setIsHandoverDialogOpen(false);
            toast({
                title: "Reporte Enviado",
                description: "Se ha registrado tu reporte. Turno iniciado.",
                variant: "destructive"
            });
        } catch (error) {
            console.error("Error reporting handover:", error);
            toast({ title: 'Error', description: 'No se pudo enviar el reporte.', variant: 'destructive' });
        }
    };

    const handleConfirmEndOfDay = async () => {
        if (!allUsers) return;

        try {
            // Deactivate ALL active staff except Super Admin
            const staffToDeactivate = allUsers.filter(u =>
                u.status === 'Active' &&
                u.email !== 'admin@ubox.com'
            );

            await Promise.all(staffToDeactivate.map(user =>
                fetch(`/api/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Inactive' })
                })
            ));



            const hasPendingOrders = orders.some(o => o.status === 'Pending');
            const action = hasPendingOrders ? 'SHIFT_CLOSE_WITH_PENDING' : 'SHIFT_CLOSE';
            const details = hasPendingOrders
                ? `Cierre de caja con ${orders.filter(o => o.status === 'Pending').length} cuentas pendientes.`
                : 'Cierre de caja realizado y personal desactivado.';

            // Log the action
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    details,
                    userId: null // System action
                })
            });

            toast({
                title: "Cierre de Caja Exitoso",
                description: "El turno ha finalizado. El personal ha sido desactivado.",
            });
            setIsEndOfDayDialogOpen(false);
            refreshAllData();
        } catch (error) {
            console.error("Error during end of day:", error);
            toast({ title: 'Error', description: 'No se pudo completar el cierre de caja.', variant: 'destructive' });
        }
    }

    const defaultTab = isCashier ? 'dashboard' : 'billing';

    return (
        <>
            <PageHeader
                title="Facturación y Caja"
                description={'Gestiona pagos, facturación y consulta el rendimiento.'}
            >
                {(isAdmin || isCashier) && (
                    <Badge variant="outline" className="flex items-center gap-2 text-md">
                        <User className="h-4 w-4" />
                        Cajero a cargo: {cashierInCharge.name}
                    </Badge>
                )}
            </PageHeader>
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Tabs defaultValue={defaultTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="billing">Facturación</TabsTrigger>
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    </TabsList>
                    <TabsContent value="billing" className="space-y-4">
                        <BillingContent
                            orders={orders || []}
                            onDataChange={refreshAllData}
                            allUsers={allUsers || []}
                            cashierName={cashierInCharge.name || 'Caja'}
                            sunatEmissionDialogOpen={sunatEmissionDialogOpen}
                            setSunatEmissionDialogOpen={setSunatEmissionDialogOpen}
                            orderForEmission={orderForEmission}
                            setOrderForEmission={setOrderForEmission}
                        />
                    </TabsContent>
                    <TabsContent value="dashboard">
                        <CashierDashboard currentOrders={orders || []} allUsers={allUsers || []} cashierInCharge={cashierInCharge} shiftStartTime={shiftStartTime} />
                    </TabsContent>
                </Tabs>
            )}
            <EndOfDayReportDialog
                isOpen={isEndOfDayDialogOpen}
                onOpenChange={setIsEndOfDayDialogOpen}
                onConfirm={handleConfirmEndOfDay}
                orders={orders || []}
                users={allUsers || []}
                shiftStartTime={shiftStartTime}
            />
            <AttendanceDialog
                isOpen={isAttendanceDialogOpen}
                onOpenChange={setIsAttendanceDialogOpen}
                allUsers={allUsers || []}

                onUserUpdate={refreshAllData}
            />
            <HandoverDialog
                isOpen={isHandoverDialogOpen}
                pendingOrders={pendingOrdersForHandover}
                onAccept={handleHandoverAccept}
                onReport={handleHandoverReport}
            />

            {/* SUNAT Emission Dialog */}
            <SunatEmissionDialog
                isOpen={sunatEmissionDialogOpen}
                onOpenChange={setSunatEmissionDialogOpen}
                orderId={orderForEmission?.id || ''}
                orderTotal={orderForEmission?.totalAmount || 0}
                onSuccess={() => {
                    onDataChange();
                    setOrderForEmission(null);
                }}
            />
        </>
    );
}









