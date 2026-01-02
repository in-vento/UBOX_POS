import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User as UserIcon, ClipboardList, DollarSign, Clock, Eye, Trash2, AlertTriangle } from 'lucide-react';
import type { Order, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { KeypadInput } from '@/components/keypad-input';

interface StaffWaiterSupervisionProps {
    users: User[];
    orders: Order[];
    adminName?: string;
    adminId?: string;
}

export default function StaffWaiterSupervision({ users, orders, adminName, adminId }: StaffWaiterSupervisionProps) {
    const { toast } = useToast();
    const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    const [editedItems, setEditedItems] = useState<any[]>([]);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Filter active waiters
    const activeWaiters = useMemo(() => {
        const waiters = users.filter(u => u.role?.toLowerCase() === 'mozo' && u.status === 'Active');
        console.log('🔍 Active Waiters:', waiters.map(w => ({ id: w.id, name: w.name })));
        return waiters;
    }, [users]);

    // Calculate stats per waiter
    const waiterStats = useMemo(() => {
        const stats: Record<string, { pendingCount: number; pendingAmount: number }> = {};

        activeWaiters.forEach(w => {
            stats[w.id] = { pendingCount: 0, pendingAmount: 0 };
        });

        console.log('📦 Total Orders:', orders.length);
        console.log('📦 Pending Orders:', orders.filter(o => o.status === 'Pending').map(o => ({
            id: o.id.slice(-6),
            customer: o.customer,
            waiterId: o.waiterId,
            waiter: typeof o.waiter === 'object' ? { id: o.waiter?.id, name: o.waiter?.name } : o.waiter,
            status: o.status
        })));

        orders.forEach(order => {
            if (order.status === 'Pending') {
                // Check waiterId first (direct field)
                let targetId = order.waiterId;

                // Fallback to waiter object if waiterId is not present
                if (!targetId && order.waiter) {
                    targetId = typeof order.waiter === 'object' ? order.waiter?.id : undefined;
                }

                // Last resort: match by name
                if (!targetId && order.waiter) {
                    const waiterName = typeof order.waiter === 'object' ? order.waiter?.name : order.waiter;
                    const found = activeWaiters.find(u => u.name === waiterName);
                    if (found) targetId = found.id;
                }

                console.log(`🔗 Order ${order.id.slice(-6)}: targetId=${targetId}, found in stats=${!!stats[targetId || '']}`);

                if (targetId && stats[targetId]) {
                    stats[targetId].pendingCount += 1;
                    stats[targetId].pendingAmount += (order.totalAmount || 0) - (order.paidAmount || 0);
                }
            }
        });

        console.log('📊 Final Stats:', stats);
        return stats;
    }, [activeWaiters, orders]);

    // Get orders for selected waiter
    const selectedWaiterOrders = useMemo(() => {
        if (!selectedWaiterId) return [];
        const waiter = users.find(u => u.id === selectedWaiterId);
        if (!waiter) return [];

        return orders.filter(order => {
            if (order.status !== 'Pending') return false;

            // Check waiterId first (direct field)
            if (order.waiterId === selectedWaiterId) return true;

            // Check waiter object
            const wId = typeof order.waiter === 'object' ? order.waiter?.id : null;
            if (wId === selectedWaiterId) return true;

            // Fallback: match by name
            const wName = typeof order.waiter === 'object' ? order.waiter?.name : order.waiter;
            if (wName === waiter.name) return true;

            return false;
        });
    }, [selectedWaiterId, orders, users]);

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/orders/${orderToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: deleteReason,
                    userId: adminId || users.find(u => u.status === 'Active' && ['admin', 'super administrador', 'administrador'].includes(u.role.toLowerCase()))?.id,
                    adminName: adminName || 'Admin'
                })
            });

            if (!res.ok) throw new Error('Failed to delete order');

            toast({
                title: "Pedido Eliminado",
                description: "El pedido ha sido eliminado correctamente y registrado en auditoría."
            });
            setOrderToDelete(null);
            setDeleteReason('');
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                title: "Error",
                description: "No se pudo eliminar el pedido.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStartEdit = () => {
        if (!viewOrder) return;
        setEditedItems(viewOrder.items.map(item => ({
            ...item,
            productId: item.productId,
            quantity: item.quantity
        })));
        setIsEditingOrder(true);
    };

    const handleRemoveItem = (productId: string) => {
        setEditedItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleSaveEdit = async () => {
        if (!viewOrder) return;
        if (editedItems.length === 0) {
            toast({
                title: "Error",
                description: "Un pedido no puede quedarse sin productos. Si deseas anularlo, usa la opción Eliminar.",
                variant: "destructive"
            });
            return;
        }

        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/orders/${viewOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: editedItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    userId: adminId || users.find(u => u.status === 'Active' && ['admin', 'super administrador', 'administrador'].includes(u.role.toLowerCase()))?.id,
                    editedBy: adminName || 'Admin'
                })
            });

            if (!res.ok) throw new Error('Failed to update order');

            toast({
                title: "Pedido Actualizado",
                description: "Los cambios han sido guardados y registrados en auditoría."
            });
            setIsEditingOrder(false);
            setViewOrder(null);
        } catch (error) {
            console.error("Error updating order:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el pedido.",
                variant: "destructive"
            });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const selectedWaiter = users.find(u => u.id === selectedWaiterId);

    if (selectedWaiterId && selectedWaiter) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setSelectedWaiterId(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedWaiter.avatarUrl} />
                                <AvatarFallback>{selectedWaiter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {selectedWaiter.name}
                        </h2>
                        <p className="text-muted-foreground">Supervisión de Pedidos Pendientes</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                S/ {waiterStats[selectedWaiterId]?.pendingAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Pedidos Activos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {waiterStats[selectedWaiterId]?.pendingCount}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            {selectedWaiterOrders.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    No hay pedidos pendientes para este mozo.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Mesa / Cliente</TableHead>
                                            <TableHead>Hora</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Pagado</TableHead>
                                            <TableHead className="text-right">Saldo</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedWaiterOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-sm font-bold">{order.customId || order.id.slice(-6)}</TableCell>
                                                <TableCell className="font-medium">{order.customer}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="text-right">S/ {(order.totalAmount || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">S/ {(order.paidAmount || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    S/ {((order.totalAmount || 0) - (order.paidAmount || 0)).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => setViewOrder(order)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setOrderToDelete(order)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Dialog open={!!viewOrder} onOpenChange={(open) => {
                    if (!open) {
                        setViewOrder(null);
                        setIsEditingOrder(false);
                    }
                }}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex justify-between items-center">
                                <span>Detalle del Pedido</span>
                                {!isEditingOrder && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleStartEdit}>
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => {
                                            setOrderToDelete(viewOrder);
                                            setViewOrder(null);
                                        }}>
                                            Eliminar
                                        </Button>
                                    </div>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                ID: {viewOrder?.customId || viewOrder?.id.slice(-6)} • {viewOrder?.customer}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                        {isEditingOrder && <TableHead className="w-[50px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(isEditingOrder ? editedItems : viewOrder?.items)?.map((item: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.product?.name || 'Producto'}</TableCell>
                                            <TableCell className="text-right">
                                                {isEditingOrder ? (
                                                    <KeypadInput
                                                        value={item.quantity}
                                                        onChange={(newQty) => {
                                                            setEditedItems(prev => prev.map((i, index) =>
                                                                index === idx ? { ...i, quantity: newQty } : i
                                                            ));
                                                        }}
                                                        className="w-20 ml-auto"
                                                    />
                                                ) : (
                                                    item.quantity
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">S/ {item.price?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">S/ {(item.price * item.quantity).toFixed(2)}</TableCell>
                                            {isEditingOrder && (
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => handleRemoveItem(item.productId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-between items-center mt-4 font-bold text-lg">
                                <span>Total: S/ {(isEditingOrder
                                    ? editedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0)
                                    : (viewOrder?.totalAmount || 0)).toFixed(2)}</span>
                                {isEditingOrder && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsEditingOrder(false)}>
                                            Cancelar
                                        </Button>
                                        <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit}>
                                            {isSavingEdit ? "Guardando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" /> Eliminar Pedido
                            </DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas eliminar el pedido de <strong>{orderToDelete?.customer}</strong>?
                                <br />
                                Esta acción no se puede deshacer y quedará registrada en auditoría.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-2">
                            <label className="text-sm font-medium">Motivo de la eliminación</label>
                            <Input
                                placeholder="Ej: Error en digitación, pedido cancelado por cliente..."
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOrderToDelete(null)}>Cancelar</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteOrder}
                                disabled={isDeleting || !deleteReason.trim()}
                            >
                                {isDeleting ? "Eliminando..." : "Eliminar Pedido"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeWaiters.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No hay mozos activos en este momento.
                    </div>
                ) : (
                    activeWaiters.map(waiter => {
                        const stats = waiterStats[waiter.id];
                        return (
                            <Card
                                key={waiter.id}
                                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                                onClick={() => setSelectedWaiterId(waiter.id)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={waiter.avatarUrl} />
                                        <AvatarFallback>{waiter.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base">{waiter.name}</CardTitle>
                                        <CardDescription className="text-xs flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Activo
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <ClipboardList className="h-3 w-3" /> Pedidos
                                            </span>
                                            <span className="text-xl font-bold">{stats.pendingCount}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" /> Por Cobrar
                                            </span>
                                            <span className="text-xl font-bold text-primary">
                                                S/ {stats.pendingAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
