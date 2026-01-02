'use client';
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
  MoreHorizontal,
  PlusCircle,
  User,
  LogOut,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User as UserType, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import EndOfShiftReportDialog from './components/end-of-shift-report-dialog';
import AddStockDialog from './components/add-stock-dialog';
import ReceiveShiftDialog from './components/receive-shift-dialog';

type Beverage = Omit<Product, 'quantity'> & {
  stock: number;
  unit: 'bottles' | 'liters' | 'units';
};

export default function BarPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const isAdminOrBoss = role === 'admin' || role === 'boss';

  const [inventory, setInventory] = useState<Beverage[]>([]);
  const [activeBarmen, setActiveBarmen] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [barmanInCharge, setBarmanInCharge] = useState<Partial<UserType>>({
    name: 'N/A',
  });
  const [shiftState, setShiftState] = useState<'active' | 'closing'>('active');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [isReceiveShiftDialogOpen, setIsReceiveShiftDialogOpen] = useState(false);
  const [reportedInventory, setReportedInventory] = useState<Beverage[]>([]);
  const { toast } = useToast();

  const checkShiftStatus = useCallback(async () => {
    try {
      // Get the last shift close log
      const res = await fetch('/api/logs?action=SHIFT_CLOSE_BAR&limit=1');
      if (res.ok) {
        const logs = await res.json();
        if (logs.length > 0) {
          const lastCloseLog = logs[0];
          // Check if there's a corresponding receive log after this close
          const receiveRes = await fetch(`/api/logs?action=SHIFT_RECEIVE_BAR&after=${lastCloseLog.timestamp}`);
          if (receiveRes.ok) {
            const receiveLogs = await receiveRes.json();
            if (receiveLogs.length === 0) {
              // No receive log found, shift is still closing
              setShiftState('closing');
              // Parse and set reported inventory
              try {
                const details = JSON.parse(lastCloseLog.details);
                if (details.inventory) {
                  setReportedInventory(details.inventory);
                }
              } catch (e) {
                console.error('Error parsing shift close details:', e);
              }
            } else {
              setShiftState('active');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking shift status:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        fetch('/api/products?category=Bebida'),
        fetch('/api/users?status=Active'), // Fetch all active users to filter client-side
        checkShiftStatus() // Check shift status from logs
      ]);

      if (productsRes.ok) setInventory(await productsRes.json());
      if (usersRes.ok) setActiveBarmen(await usersRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  }, [checkShiftStatus]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (activeBarmen && activeBarmen.length > 0) {
      // Priority: Barman -> Administrador -> Admin (excluding Super Admin)
      const barman = activeBarmen.find(user => user.role.toLowerCase() === 'barman') ||
        activeBarmen.find(user => ['administrador', 'admin'].includes(user.role.toLowerCase()) && user.email !== 'admin@ubox.com');

      setBarmanInCharge(barman || { name: 'N/A' });
    } else {
      setBarmanInCharge({ name: 'N/A' });
    }
  }, [activeBarmen]);

  const handleConfirmClose = async (closingInventory: Beverage[]) => {
    try {
      // Create log entry with inventory snapshot
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SHIFT_CLOSE_BAR',
          details: JSON.stringify({
            inventory: closingInventory,
            timestamp: new Date().toISOString()
          })
        })
      });

      toast({
        title: 'Turno Cerrado para Auditoría',
        description:
          'El inventario ha sido registrado. Esperando recepción del siguiente turno.',
      });
      setShiftState('closing');
      setReportedInventory(closingInventory);
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error('Error closing shift:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar el turno correctamente.',
        variant: 'destructive'
      });
    }
  };

  const handleReceiveShift = () => {
    // Open the receive shift dialog for inventory verification
    setIsReceiveShiftDialogOpen(true);
  };

  const handleConfirmReceiveShift = async (discrepancies: any[], actualInventory: Record<string, number>) => {
    try {
      // Create log entry for shift receive
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SHIFT_RECEIVE_BAR',
          details: JSON.stringify({
            discrepancies,
            timestamp: new Date().toISOString()
          })
        })
      });

      // Update inventory with actual counts
      const updatePromises = Object.entries(actualInventory).map(([productId, stock]) =>
        fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock })
        })
      );

      await Promise.all(updatePromises);

      toast({
        title: '¡Turno Recibido!',
        description: `El nuevo turno ha comenzado. ${discrepancies.length > 0 ? 'Se ajustó el inventario según las cantidades reales.' : ''}`,
      });

      setShiftState('active');
      setIsReceiveShiftDialogOpen(false);
      fetchData(); // Refresh inventory
    } catch (error) {
      console.error('Error receiving shift:', error);
      toast({
        title: 'Error',
        description: 'No se pudo recibir el turno correctamente.',
        variant: 'destructive'
      });
    }
  };

  const handleAddStock = async (productId: string, quantity: number) => {
    try {
      const product = inventory.find(p => p.id === productId);
      if (!product) return;

      const newStock = (product.stock || 0) + quantity;

      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });

      toast({
        title: 'Stock Actualizado',
        description: `Se añadieron ${quantity} unidades al inventario.`,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el stock del producto.',
        variant: 'destructive',
      });
    }
  };

  const displayInventory = useMemo(() => inventory || [], [inventory]);

  return (
    <>
      <PageHeader
        title="Inventario de Bar"
        description="Gestiona el stock de bebidas y los cambios de turno."
      >
        {isAdminOrBoss && (
          <Badge
            variant="outline"
            className="flex items-center gap-2 text-md"
          >
            <User className="h-4 w-4" />
            Barman a cargo: {barmanInCharge.name}
          </Badge>
        )}
      </PageHeader>

      <div className="grid gap-6">
        <Card>
          <div id="printable-bar-inventory">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Inventario de Bebidas</CardTitle>
                  <CardDescription>
                    Control de stock de licores, cervezas y más.
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setIsAddStockDialogOpen(true)}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:whitespace-nowrap md:hidden lg:inline">
                      Añadir/Recibir Stock
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 gap-1"
                    onClick={() => setIsReportDialogOpen(true)}
                    disabled={shiftState === 'closing'}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:whitespace-nowrap md:hidden lg:inline">
                      Cerrar Turno
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-1 bg-green-600 text-white hover:bg-green-700"
                    onClick={handleReceiveShift}
                    disabled={shiftState === 'active'}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:whitespace-nowrap md:hidden lg:inline">
                      Recibir Turno
                    </span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bebida</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={(item.stock || 0) < 10 ? 'destructive' : 'outline'}
                          >
                            {item.stock || 0} {item.unit || 'unidades'}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                              <DropdownMenuItem>
                                Ajustar Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Ver Historial
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
      <EndOfShiftReportDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        inventory={displayInventory}
        onConfirm={handleConfirmClose}
      />
      <AddStockDialog
        isOpen={isAddStockDialogOpen}
        onOpenChange={setIsAddStockDialogOpen}
        products={displayInventory}
        onConfirm={handleAddStock}
      />
      <ReceiveShiftDialog
        isOpen={isReceiveShiftDialogOpen}
        onOpenChange={setIsReceiveShiftDialogOpen}
        reportedInventory={reportedInventory}
        onConfirm={handleConfirmReceiveShift}
      />
    </>
  );
}
