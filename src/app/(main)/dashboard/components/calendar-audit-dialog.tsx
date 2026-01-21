'use client';

import { useState, useEffect, useMemo } from 'react';
import { useConfig } from '@/contexts/config-context';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { Search, Loader2, User as UserIcon, Calendar as CalendarIcon, Download, Printer } from 'lucide-react';
import type { Order, User } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type CalendarAuditDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    users: User[];
};

type DateData = {
    date: string;
    orderCount: number;
    totalAmount: number;
    totalCommission: number;
    orders: Order[];
};

export default function CalendarAuditDialog({
    isOpen,
    onOpenChange,
    users,
}: CalendarAuditDialogProps) {
    const { config } = useConfig();
    const [userType, setUserType] = useState<'mozo' | 'masajista' | 'cliente'>('mozo');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [userSearchTerm, setUserSearchTerm] = useState<string>('');
    const [customerName, setCustomerName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [calendarData, setCalendarData] = useState<DateData[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDateData, setSelectedDateData] = useState<DateData | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

    // Filter users by type (include inactive for audit)
    const filteredUsers = useMemo(() => {
        if (userType === 'mozo') {
            return users.filter(u => u.role.toLowerCase() === 'mozo');
        } else if (userType === 'masajista') {
            return users.filter(u => u.role.toLowerCase() === 'masajista');
        }
        return [];
    }, [users, userType]);

    // Filter users based on search term
    const suggestedUsers = useMemo(() => {
        if (!userSearchTerm.trim()) return filteredUsers;
        const searchLower = userSearchTerm.toLowerCase();
        return filteredUsers.filter(u => u.name.toLowerCase().includes(searchLower));
    }, [filteredUsers, userSearchTerm]);

    // Reset selections when user type changes
    useEffect(() => {
        setSelectedUserId('');
        setUserSearchTerm('');
        setCustomerName('');
        setCalendarData([]);
        setSelectedDate(null);
        setSelectedDateData(null);
        setShowUserSuggestions(false);
    }, [userType]);

    // Handle user selection from suggestions
    const handleUserSelect = (user: User) => {
        setSelectedUserId(user.id);
        setUserSearchTerm(user.name);
        setShowUserSuggestions(false);
    };

    // Fetch calendar data
    const handleSearch = async () => {
        if (userType !== 'cliente' && !selectedUserId) {
            alert('Por favor selecciona un usuario');
            return;
        }
        if (userType === 'cliente' && !customerName.trim()) {
            alert('Por favor ingresa el nombre del cliente');
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                userType,
                ...(userType === 'cliente' ? { customerName } : { userId: selectedUserId })
            });

            const res = await fetch(`/api/audit/calendar?${params}`);
            if (res.ok) {
                const data = await res.json();
                setCalendarData(data.dates || []);
            } else {
                console.error('Failed to fetch calendar data');
                setCalendarData([]);
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            setCalendarData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Get dates with activity
    const activeDates = useMemo(() => {
        return calendarData.map(d => d.date);
    }, [calendarData]);

    // Custom tile content to mark active dates
    const tileClassName = ({ date, view }: any) => {
        if (view === 'month') {
            const dateStr = date.toISOString().split('T')[0];
            if (activeDates.includes(dateStr)) {
                return 'active-date';
            }
        }
        return null;
    };

    // Handle date click
    const handleDateClick = (value: any) => {
        // Handle only single date selection (not range or null)
        if (!value || Array.isArray(value)) return;

        const dateStr = value.toISOString().split('T')[0];
        const dateData = calendarData.find(d => d.date === dateStr);

        if (dateData) {
            setSelectedDate(value);
            setSelectedDateData(dateData);
            setIsDetailsOpen(true);
        }
    };

    // Get selected user name
    const selectedUserName = useMemo(() => {
        if (userType === 'cliente') return customerName;
        const user = users.find(u => u.id === selectedUserId);
        return user?.name || '';
    }, [userType, selectedUserId, customerName, users]);

    // Calculate commission for a specific masajista
    const calculateMasajistaCommission = (order: Order) => {
        if (!order.products) return 0;

        const totalCommission = order.products.reduce((sum, p) => {
            if (p.isCommissionable) {
                const productPercentage = p.commissionPercentage || 0;
                const user = users.find(u => u.id === selectedUserId);
                const defaultPercentage = user?.commission || 32;
                const effectivePercentage = productPercentage > 0 ? productPercentage : defaultPercentage;
                return sum + (p.price * (effectivePercentage / 100) * p.quantity);
            }
            return sum;
        }, 0);

        // Divide by number of masajistas
        const masajistasCount = order.masajistaIds?.length || 1;
        return totalCommission / masajistasCount;
    };

    const handleDownloadPdf = () => {
        const input = document.getElementById('calendar-details-printable');
        if (!input || !selectedDateData) return;

        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`auditoria-${selectedUserName}-${selectedDateData.date}.pdf`);
        });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Auditoría por Calendario</DialogTitle>
                        <DialogDescription>
                            Selecciona el tipo de usuario y busca para ver su actividad en el calendario.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Filters */}
                    <div className="grid gap-4 pb-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="userType">Tipo de Usuario</Label>
                                <Select value={userType} onValueChange={(value: any) => setUserType(value)}>
                                    <SelectTrigger id="userType">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mozo">Mozo</SelectItem>
                                        <SelectItem value="masajista">{config.masajistaRoleName}</SelectItem>
                                        <SelectItem value="cliente">Cliente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {userType !== 'cliente' ? (
                                <div className="space-y-2 relative">
                                    <Label htmlFor="user">Buscar {userType === 'mozo' ? 'Mozo' : config.masajistaRoleName}</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="user"
                                            type="text"
                                            placeholder={`Escribe el nombre del ${userType === 'masajista' ? config.masajistaRoleName.toLowerCase() : userType}...`}
                                            className="pl-8"
                                            value={userSearchTerm}
                                            onChange={e => {
                                                setUserSearchTerm(e.target.value);
                                                setShowUserSuggestions(true);
                                                if (!e.target.value.trim()) {
                                                    setSelectedUserId('');
                                                }
                                            }}
                                            onFocus={() => setShowUserSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                    {showUserSuggestions && suggestedUsers.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {suggestedUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                                    onClick={() => handleUserSelect(user)}
                                                >
                                                    <span>{user.name}</span>
                                                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                                                        {user.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showUserSuggestions && userSearchTerm && suggestedUsers.length === 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                                            No se encontraron resultados
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">Nombre del Cliente</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="customerName"
                                            type="text"
                                            placeholder="Buscar cliente..."
                                            className="pl-8"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-end">
                                <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Cargando...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" />
                                            Buscar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <ScrollArea className="flex-grow">
                        {calendarData.length > 0 ? (
                            <div className="flex flex-col items-center gap-4 p-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando actividad de: <strong>{selectedUserName}</strong>
                                </div>
                                <style jsx global>{`
                  .active-date {
                    background-color: #22c55e !important;
                    color: white !important;
                    font-weight: bold;
                    border-radius: 4px;
                  }
                  .active-date:hover {
                    background-color: #16a34a !important;
                  }
                  .react-calendar {
                    width: 100%;
                    max-width: 100%;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                    font-family: inherit;
                  }
                  .react-calendar__tile {
                    padding: 16px 8px;
                    cursor: pointer;
                    font-size: 14px;
                  }
                  .react-calendar__tile:enabled:hover {
                    background-color: #f3f4f6;
                  }
                  .react-calendar__navigation button {
                    font-size: 16px;
                    font-weight: 600;
                  }
                `}</style>
                                <Calendar
                                    onChange={handleDateClick}
                                    value={selectedDate}
                                    tileClassName={tileClassName}
                                    locale="es-ES"
                                />
                                <div className="text-xs text-muted-foreground mt-2">
                                    <Badge variant="outline" className="bg-green-500 text-white">
                                        Verde
                                    </Badge>
                                    {' '}= Días con actividad (haz clic para ver detalles)
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                                <p>Selecciona un usuario y presiona "Buscar" para ver su actividad</p>
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            {selectedDateData && (
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                        <div id="calendar-details-printable" className="p-6">
                            <DialogHeader>
                                <DialogTitle>
                                    Detalle de Actividad - {new Date(selectedDateData.date).toLocaleDateString('es-PE', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </DialogTitle>
                                <DialogDescription>
                                    {userType === 'mozo' && `Mozo: ${selectedUserName}`}
                                    {userType === 'masajista' && `${config.masajistaRoleName}: ${selectedUserName}`}
                                    {userType === 'cliente' && `Cliente: ${selectedUserName}`}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-lg border p-4">
                                        <div className="text-sm text-muted-foreground">Total de Pedidos</div>
                                        <div className="text-2xl font-bold">{selectedDateData.orderCount}</div>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <div className="text-sm text-muted-foreground">Total en Ventas</div>
                                        <div className="text-2xl font-bold">
                                            S/ {selectedDateData.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    {userType === 'masajista' && (
                                        <div className="rounded-lg border p-4 bg-green-50">
                                            <div className="text-sm text-muted-foreground">Total en Comisiones</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                S/ {selectedDateData.totalCommission.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Orders List */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Pedidos del Día</h4>
                                    <ScrollArea className="h-[400px] rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID Pedido</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Hora</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    {userType === 'masajista' && <TableHead className="text-right">Comisión</TableHead>}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedDateData.orders.map((order) => (
                                                    <TableRow
                                                        key={order.id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => {
                                                            setSelectedOrderForDetails(order);
                                                            setIsOrderDetailsOpen(true);
                                                        }}
                                                    >
                                                        <TableCell className="font-mono text-sm">
                                                            {order.customId || order.id.slice(-6)}
                                                        </TableCell>
                                                        <TableCell>{order.customer}</TableCell>
                                                        <TableCell>{order.time}</TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            S/ {order.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        {userType === 'masajista' && (
                                                            <TableCell className="text-right font-medium text-green-600">
                                                                S/ {calculateMasajistaCommission(order).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>

                                {/* Products Detail for Masajista */}
                                {userType === 'masajista' && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Desglose de Productos Comisionables</h4>
                                            <ScrollArea className="h-[300px] rounded-md border p-4">
                                                {selectedDateData.orders.map((order) => (
                                                    <div key={order.id} className="mb-4 pb-4 border-b last:border-b-0">
                                                        <div className="font-medium text-sm mb-2">
                                                            Pedido: {order.customId || order.id.slice(-6)} - {order.customer}
                                                        </div>
                                                        <ul className="space-y-1 text-sm">
                                                            {order.products?.filter(p => p.isCommissionable).map((product) => {
                                                                const user = users.find(u => u.id === selectedUserId);
                                                                const productPercentage = product.commissionPercentage || 0;
                                                                const defaultPercentage = user?.commission || 32;
                                                                const effectivePercentage = productPercentage > 0 ? productPercentage : defaultPercentage;
                                                                const commission = (product.price * (effectivePercentage / 100) * product.quantity) / (order.masajistaIds?.length || 1);

                                                                return (
                                                                    <li key={product.id} className="flex justify-between items-center">
                                                                        <span className="text-muted-foreground">
                                                                            {product.name} x{product.quantity} ({effectivePercentage}%)
                                                                        </span>
                                                                        <span className="font-medium text-green-600">
                                                                            S/ {commission.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                                        </span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </ScrollArea>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="sm:justify-between gap-2 p-6 pt-0">
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimir
                                </Button>
                                <Button variant="ghost" onClick={handleDownloadPdf}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar PDF
                                </Button>
                            </div>
                            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Order Details Dialog */}
            {selectedOrderForDetails && (
                <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Detalle del Pedido: {selectedOrderForDetails.customId || selectedOrderForDetails.id}</DialogTitle>
                            <DialogDescription>
                                Pedido para <strong>{selectedOrderForDetails.customer}</strong>.
                                Atendido por: <strong>{typeof selectedOrderForDetails.waiter === 'object' ? (selectedOrderForDetails.waiter as any).name : selectedOrderForDetails.waiter}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Products */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Productos Consumidos</h4>
                                <ul className="grid gap-3 rounded-md border p-4">
                                    {(selectedOrderForDetails.products || []).map((product: any) => (
                                        <li key={product.id} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {product.name} x <span className="font-bold">{product.quantity}</span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span>S/ {(product.price * product.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Masajistas */}
                            {selectedOrderForDetails.masajistaIds && selectedOrderForDetails.masajistaIds.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">{config.masajistaRoleNamePlural} Asignados</h4>
                                    <ul className="grid gap-2 rounded-md border p-4">
                                        {users.filter(u => selectedOrderForDetails.masajistaIds?.includes(u.id)).map((masajista) => (
                                            <li key={masajista.id} className="flex items-center gap-2 text-sm">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                <span>{masajista.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Payments */}
                            {selectedOrderForDetails.payments && selectedOrderForDetails.payments.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Métodos de Pago</h4>
                                    <ul className="grid gap-2 rounded-md border p-4 bg-muted/30">
                                        {selectedOrderForDetails.payments.map((payment: any, idx: number) => (
                                            <li key={idx} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{payment.method}</span>
                                                <span className="font-medium">S/ {payment.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Separator />
                            <div className="flex justify-between font-bold text-md">
                                <span>Total de la Orden</span>
                                <span>S/ {(selectedOrderForDetails.totalAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
