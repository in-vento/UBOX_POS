import { useState, useMemo, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
    id: string;
    name: string;
    stock: number;
    unit: string;
}

interface InventoryDiscrepancy {
    productId: string;
    productName: string;
    reported: number;
    actual: number;
    difference: number;
}

interface ReceiveShiftDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    reportedInventory: InventoryItem[];
    onConfirm: (discrepancies: InventoryDiscrepancy[], actualInventory: Record<string, number>) => Promise<void>;
}

export default function ReceiveShiftDialog({
    isOpen,
    onOpenChange,
    reportedInventory,
    onConfirm
}: ReceiveShiftDialogProps) {
    const { toast } = useToast();
    const [actualCounts, setActualCounts] = useState<Record<string, number>>({});
    const [hasReportedDiscrepancies, setHasReportedDiscrepancies] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [printerIp, setPrinterIp] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedIp = localStorage.getItem('printerIp');
            if (savedIp) setPrinterIp(savedIp);
        }
    }, []);

    // Calculate discrepancies
    const discrepancies = useMemo(() => {
        const result: InventoryDiscrepancy[] = [];

        reportedInventory.forEach(item => {
            const actual = actualCounts[item.id] ?? item.stock;
            const difference = actual - item.stock;

            if (difference !== 0) {
                result.push({
                    productId: item.id,
                    productName: item.name,
                    reported: item.stock,
                    actual,
                    difference
                });
            }
        });

        return result;
    }, [reportedInventory, actualCounts]);

    const hasDiscrepancies = discrepancies.length > 0;

    const handleActualCountChange = (productId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setActualCounts(prev => ({
            ...prev,
            [productId]: numValue
        }));
    };

    const handleReportDiscrepancies = async () => {
        setIsReporting(true);
        try {
            // Create log entry for discrepancies
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'INVENTORY_DISCREPANCY',
                    details: JSON.stringify({
                        discrepancies,
                        timestamp: new Date().toISOString()
                    })
                })
            });

            toast({
                title: 'Discrepancias Reportadas',
                description: 'Las diferencias de inventario han sido registradas para auditoría.'
            });

            setHasReportedDiscrepancies(true);
        } catch (error) {
            console.error('Error reporting discrepancies:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron reportar las discrepancias.',
                variant: 'destructive'
            });
        } finally {
            setIsReporting(false);
        }
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            // Build actual inventory object
            const actualInventory: Record<string, number> = {};
            reportedInventory.forEach(item => {
                actualInventory[item.id] = actualCounts[item.id] ?? item.stock;
            });

            await onConfirm(discrepancies, actualInventory);

            // Reset state
            setActualCounts({});
            setHasReportedDiscrepancies(false);
            onOpenChange(false);
        } catch (error) {
            console.error('Error confirming shift:', error);
        } finally {
            setIsConfirming(false);
        }
    };

    const handlePrint = async () => {
        try {
            // Build actual inventory array for printing
            const actualInventoryArray = reportedInventory.map(item => ({
                ...item,
                stock: actualCounts[item.id] ?? item.stock
            }));

            const res = await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'shift-report',
                    printerIp: printerIp || undefined,
                    reportData: {
                        type: 'RECEIVE',
                        inventory: actualInventoryArray,
                        discrepancies,
                        barmanName: 'Barman'
                    }
                })
            });

            if (!res.ok) throw new Error('Error al imprimir');
        } catch (error) {
            console.error('Error printing receive shift report:', error);
            alert('Error al imprimir el reporte. Verifique la conexión con la impresora.');
        }
    };

    const canConfirm = !hasDiscrepancies || hasReportedDiscrepancies;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Recibir Turno - Verificación de Inventario</DialogTitle>
                    <DialogDescription>
                        Verifica el inventario reportado por el turno anterior e ingresa las cantidades reales que encuentras.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Inventory Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Reportado</TableHead>
                                <TableHead className="text-center">Cantidad Real</TableHead>
                                <TableHead className="text-center">Diferencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportedInventory.map(item => {
                                const actual = actualCounts[item.id] ?? item.stock;
                                const difference = actual - item.stock;

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">{item.stock} {item.unit}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={actualCounts[item.id] ?? item.stock}
                                                onChange={(e) => handleActualCountChange(item.id, e.target.value)}
                                                className="w-24 mx-auto text-center"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {difference !== 0 && (
                                                <Badge variant={difference < 0 ? 'destructive' : 'default'}>
                                                    {difference > 0 ? '+' : ''}{difference}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Discrepancies Summary */}
                    {hasDiscrepancies && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-semibold mb-2">
                                    Se encontraron {discrepancies.length} diferencia(s) en el inventario:
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {discrepancies.map(d => (
                                        <li key={d.productId}>
                                            <strong>{d.productName}</strong>: Reportado {d.reported}, Real {d.actual}
                                            ({d.difference > 0 ? '+' : ''}{d.difference})
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success message after reporting */}
                    {hasReportedDiscrepancies && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Las discrepancias han sido reportadas y registradas. Ahora puedes confirmar la recepción del turno.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming || isReporting}>
                        Cancelar
                    </Button>

                    {hasDiscrepancies && !hasReportedDiscrepancies && (
                        <Button
                            variant="destructive"
                            onClick={handleReportDiscrepancies}
                            disabled={isReporting}
                        >
                            {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reportar Discrepancias
                        </Button>
                    )}

                    <Button
                        onClick={handleConfirm}
                        disabled={!canConfirm || isConfirming}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {hasDiscrepancies ? 'Confirmar y Ajustar Inventario' : 'Confirmar Recepción'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
