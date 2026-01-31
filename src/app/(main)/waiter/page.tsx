'use client';

import { useState, useEffect, useMemo } from 'react';
import { useConfig } from '@/contexts/config-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus, Trash2, ShoppingCart, Utensils, Coffee, Beer, User, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Product, Order, User as UserType } from '@/lib/types';

// Tipos locales para el carrito
interface CartItem {
    product: Product;
    quantity: number;
}

import { useSearchParams } from 'next/navigation';

import StaffWaiterSupervision from '../staff/components/staff-waiter-supervision';

export default function WaiterPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const waiterId = searchParams.get('id');
    const role = searchParams.get('role');
    const userNameParam = searchParams.get('name');

    // Estados de datos
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);

    // Estados de carga
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados de UI
    const [activeCategory, setActiveCategory] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [selectedMasajistas, setSelectedMasajistas] = useState<string[]>([]);
    const { config } = useConfig();
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [manualWaiterId, setManualWaiterId] = useState<string>('');

    // Cargar datos iniciales
    useEffect(() => {
        fetchProducts();
        fetchUsersAndCurrentUser();
    }, []);

    // Fetch orders depends on currentUser role, so we call it after user is loaded or inside the effect
    useEffect(() => {
        // Admin can fetch orders immediately
        if (role === 'admin') {
            fetchOrders();
        } else if (currentUser) {
            fetchOrders();
        } else if (waiterId) {
            // Fallback if currentUser not yet loaded but we have ID
            fetchOrders();
        }
    }, [currentUser, waiterId, role]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
                // Extraer categorías únicas
                const cats = Array.from(new Set(data.map((p: Product) => p.category))).filter(Boolean) as string[];
                setCategories(['Todos', ...cats]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const fetchUsersAndCurrentUser = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data);

                if (waiterId) {
                    const found = data.find((u: UserType) => u.id === waiterId);
                    setCurrentUser(found || null);
                } else if (userNameParam) {
                    const found = data.find((u: UserType) => u.name === userNameParam);
                    setCurrentUser(found || null);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchOrders = async () => {
        try {
            setIsLoadingOrders(true);
            let url = '/api/orders';

            // If NOT admin, filter by waiterId
            const isAdmin = role === 'admin';

            if (isAdmin) {
                // Admin sees all orders regardless of shift close
                url += '?all=true';
            } else if (waiterId) {
                url += `?waiterId=${waiterId}`;
            }

            // console.log('🌐 Fetching orders from:', url);
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // console.log('📥 Received orders:', data.length, 'orders');
                // console.log('📥 All orders:', data.map((o: Order) => ({
                //     id: o.id.slice(-6),
                //     customer: o.customer,
                //     status: o.status,
                //     waiterId: o.waiterId,
                //     waiter: o.waiter
                // })));
                const pending = data.filter((o: Order) => o.status === 'Pending');
                // console.log('✅ Pending orders:', pending.length);
                setMyOrders(pending);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    // Derived state for masajistas
    const masajistas = useMemo(() => {
        return allUsers.filter(u => u.role === 'Masajista' && u.status === 'Active');
    }, [allUsers]);

    // Lógica del Carrito
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            });
        });
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    }, [cart]);

    // Filtrado de productos
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchTerm]);

    // Estado para IP de impresora
    const [printerIp, setPrinterIp] = useState<string>('');

    useEffect(() => {
        const savedIp = localStorage.getItem('printerIp');
        if (savedIp) {
            setPrinterIp(savedIp);
        }
    }, []);

    // Función para imprimir ticket de barra
    const printBarTicket = async (order: any, items: CartItem[]) => {
        try {
            toast({
                title: "Imprimiendo...",
                description: "Enviando orden a cocina/barra...",
            });

            // Prepare order object for printer
            // The printer API expects an Order object. We might need to adapt the structure if 'order' here is different.
            // 'order' coming from handleCreateOrder is the response from /api/orders, which should be the full Order object.

            const res = await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order,
                    printerIp: printerIp || undefined,
                    cashierName: currentUser?.name || 'Mozo',
                    waiterName: currentUser?.name || 'Mozo',
                    type: 'bar-ticket'
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al imprimir');
            }

            toast({
                title: "Éxito",
                description: "Ticket enviado a cocina/barra.",
            });

        } catch (error: any) {
            console.error("Error printing:", error);
            toast({
                title: "Error de Impresión",
                description: "No se pudo conectar con la impresora. Verifique la IP.",
                variant: "destructive"
            });
        }
    };

    // Crear Pedido
    const handleCreateOrder = async () => {
        if (!customerName.trim()) {
            toast({ title: 'Falta información', description: 'Por favor ingrese el nombre del cliente o número de mesa.', variant: 'destructive' });
            return;
        }
        if (cart.length === 0) {
            toast({ title: 'Carrito vacío', description: 'Agregue productos antes de crear el pedido.', variant: 'destructive' });
            return;
        }

        const finalWaiterId = waiterId || manualWaiterId;

        if (!finalWaiterId) {
            toast({
                title: 'Mozo no asignado',
                description: 'Por favor, selecciona un mozo antes de crear el pedido.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                customer: customerName,
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                })),
                masajistaIds: selectedMasajistas,
                waiterId: finalWaiterId
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create order');
            }

            const newOrder = await res.json();

            toast({ title: 'Pedido Creado', description: `Orden para ${customerName} registrada exitosamente.` });

            // Imprimir Ticket Automáticamente
            printBarTicket(newOrder, cart);

            // Limpiar estado
            setCart([]);
            setCustomerName('');
            setSelectedMasajistas([]);
            setIsConfirmDialogOpen(false);

            // Actualizar lista
            fetchOrders();

        } catch (error) {
            console.error("Error creating order:", error);
            toast({ title: 'Error', description: error instanceof Error ? error.message : 'No se pudo crear el pedido. Intente nuevamente.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAdmin = role === 'admin';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 flex-shrink-0">
                <div className="grid gap-0">
                    <h1 className="font-bold text-xl">{currentUser ? `Panel: ${currentUser.name}` : "Panel de Mozo"}</h1>
                </div>
                <div className="flex gap-2 items-center w-full sm:w-auto">
                    <div className="w-32">
                        <Input
                            className="h-8 text-xs"
                            placeholder="IP (Opcional)"
                            value={printerIp}
                            onChange={(e) => {
                                setPrinterIp(e.target.value);
                                localStorage.setItem('printerIp', e.target.value);
                            }}
                        />
                    </div>
                    {!currentUser && (
                        <div className="w-full sm:w-48">
                            <Select value={manualWaiterId} onValueChange={setManualWaiterId}>
                                <SelectTrigger id="waiter-select" className="h-8 text-xs">
                                    <SelectValue placeholder="Mozo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allUsers
                                        .filter(u => ['Mozo', 'Admin', 'Administrador', 'Jefe'].includes(u.role) && u.status === 'Active')
                                        .map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            <Tabs defaultValue="new-order" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 max-w-[240px] h-8 flex-shrink-0">
                    <TabsTrigger value="new-order" className="text-[11px]">Nuevo Pedido</TabsTrigger>
                    <TabsTrigger value="my-orders" className="text-[11px]">{isAdmin ? 'Mozos' : 'Pendientes'}</TabsTrigger>
                </TabsList>

                {/* Pestaña: Nuevo Pedido */}
                <TabsContent value="new-order" className="flex-1 min-h-0 mt-1 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full overflow-hidden">

                        {/* Columna Izquierda: Productos */}
                        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
                            {/* Filtros */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar..."
                                        className="pl-7 h-9 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="w-full sm:w-auto whitespace-nowrap">
                                    <div className="flex gap-1.5">
                                        {categories.map(cat => (
                                            <Button
                                                key={cat}
                                                variant={activeCategory === cat ? "default" : "outline"}
                                                size="sm"
                                                className="h-8 px-3 text-xs"
                                                onClick={() => setActiveCategory(cat)}
                                            >
                                                {cat}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Grid de Productos */}
                            <ScrollArea className="flex-1 border rounded-md p-2 bg-muted/20">
                                {isLoadingProducts ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        No se encontraron productos.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {filteredProducts.map(product => (
                                            <Card
                                                key={product.id}
                                                className="cursor-pointer hover:shadow-sm transition-shadow active:scale-95"
                                                onClick={() => addToCart(product)}
                                            >
                                                <CardContent className="p-2 flex flex-col items-center text-center gap-1">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        {product.category === 'Bebida' ? <Beer className="h-4 w-4" /> :
                                                            product.category === 'Comida' ? <Utensils className="h-4 w-4" /> :
                                                                <Coffee className="h-4 w-4" />}
                                                    </div>
                                                    <div className="font-medium text-[11px] leading-tight line-clamp-2 h-7 flex items-center justify-center">{product.name}</div>
                                                    <div className="font-bold text-primary text-xs">S/ {product.price.toFixed(2)}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Columna Derecha: Carrito */}
                        <div className="lg:col-span-1 h-full">
                            <Card className="h-full flex flex-col border-2 border-primary/20">
                                <CardHeader className="p-3 pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ShoppingCart className="h-4 w-4" />
                                        Orden Actual
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-hidden flex flex-col gap-2 p-3 pt-0">

                                    {/* Datos del Cliente */}
                                    <div className="space-y-1">
                                        <Label htmlFor="customer" className="text-xs">Mesa / Cliente</Label>
                                        <Input
                                            id="customer"
                                            placeholder="Mesa o Cliente"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    {/* Lista de Items */}
                                    <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                                        <div className="bg-muted/50 p-1.5 text-[10px] font-medium grid grid-cols-12 gap-1 text-center">
                                            <div className="col-span-5 text-left pl-1">Producto</div>
                                            <div className="col-span-3">Cant.</div>
                                            <div className="col-span-3">Total</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        <ScrollArea className="flex-1">
                                            {cart.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center text-sm">
                                                    <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                                                    Agrega productos del menú
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {cart.map(item => (
                                                        <div key={item.product.id} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b last:border-0">
                                                            <div className="col-span-5 font-medium leading-tight">
                                                                {item.product.name}
                                                                <div className="text-[10px] text-muted-foreground">S/ {item.product.price.toFixed(2)}</div>
                                                            </div>
                                                            <div className="col-span-3 flex items-center justify-center gap-1">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="w-4 text-center">{item.quantity}</span>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="col-span-3 text-right font-medium pr-2">
                                                                S/ {(item.product.price * item.quantity).toFixed(2)}
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => removeFromCart(item.product.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>

                                    {/* Selección de Masajistas (Opcional) */}
                                    {masajistas.length > 0 && (
                                        <div className="space-y-1">
                                            <Label className="text-xs">{config.masajistaRoleNamePlural} (Opcional)</Label>
                                            <Select
                                                onValueChange={(val) => {
                                                    if (!selectedMasajistas.includes(val)) {
                                                        setSelectedMasajistas([...selectedMasajistas, val]);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder={`Agregar ${config.masajistaRoleName.toLowerCase()}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {masajistas.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedMasajistas.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedMasajistas.map(id => {
                                                        const m = masajistas.find(u => u.id === id);
                                                        return (
                                                            <Badge key={id} variant="secondary" className="text-[10px] h-5 gap-1">
                                                                {m?.name}
                                                                <span
                                                                    className="cursor-pointer hover:text-destructive"
                                                                    onClick={() => setSelectedMasajistas(prev => prev.filter(pid => pid !== id))}
                                                                >×</span>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </CardContent>
                                <CardFooter className="flex-col gap-2 bg-muted/20 p-3">
                                    <div className="flex justify-between w-full text-base font-bold">
                                        <span>Total</span>
                                        <span>S/ {cartTotal.toFixed(2)}</span>
                                    </div>
                                    <Button
                                        className="w-full h-10 text-base"
                                        size="sm"
                                        disabled={cart.length === 0 || !customerName.trim()}
                                        onClick={() => setIsConfirmDialogOpen(true)}
                                    >
                                        Confirmar Pedido
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Pestaña: Mis Pedidos */}
                <TabsContent value="my-orders" className="flex-1 min-h-0 mt-1 overflow-hidden">
                    {isAdmin ? (
                        <StaffWaiterSupervision users={allUsers} orders={myOrders} adminName={currentUser?.name} adminId={currentUser?.id} />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pedidos Pendientes</CardTitle>
                                <CardDescription>Órdenes activas que aún no han sido pagadas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingOrders ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : myOrders.length === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground">
                                        No hay pedidos pendientes.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {myOrders.map(order => (
                                            <Card key={order.id} className="overflow-hidden">
                                                <div className="bg-muted/50 p-3 flex justify-between items-center border-b">
                                                    <span className="font-bold">{order.customer}</span>
                                                    <Badge variant="outline">{order.status}</Badge>
                                                </div>
                                                <CardContent className="p-4 space-y-2">
                                                    <div className="text-xs text-muted-foreground flex justify-between">
                                                        <span>ID: {order.customId || order.id.slice(-6)}</span>
                                                        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {order.items?.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span>{item.quantity}x {item.product?.name || 'Producto'}</span>
                                                                <span className="text-muted-foreground">S/ {item.price?.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2 border-t flex justify-between font-bold">
                                                        <span>Total</span>
                                                        <span>S/ {order.totalAmount.toFixed(2)}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Diálogo de Confirmación */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Pedido</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de enviar este pedido a cocina/barra?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <div className="font-medium">Cliente: {customerName}</div>
                        <div className="text-sm text-muted-foreground">
                            {cart.length} productos • Total: S/ {cartTotal.toFixed(2)}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateOrder} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Pedido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
