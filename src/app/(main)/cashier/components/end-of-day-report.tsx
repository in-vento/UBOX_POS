
'use client';
import { useMemo, useState, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Order, User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Printer, DollarSign, Wallet, Percent, Users, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type EndOfDayReportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  orders: Order[];
  users: User[];
  shiftStartTime?: Date | null;
};

export default function EndOfDayReportDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  orders,
  users,
  shiftStartTime,
}: EndOfDayReportDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [printerIp, setPrinterIp] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIp = localStorage.getItem('printerIp');
      if (savedIp) setPrinterIp(savedIp);
    }
  }, []);

  const reportData = useMemo(() => {
    if (!orders || !users) return null;

    let totalSales = 0;
    const paymentMethods: Record<string, number> = {
      'Efectivo': 0,
      'Yape / Plin': 0,
      'Tarjeta': 0,
    };

    orders.forEach(order => {
      order.payments?.forEach(p => {
        // Filter payments by shift start time
        if (shiftStartTime && new Date(p.timestamp) <= shiftStartTime) return;

        totalSales += p.amount;
        const method = p.method.split('|')[0];
        if (paymentMethods[method] !== undefined) {
          paymentMethods[method] += p.amount;
        }
      });
    });

    const masajistas = users.filter(u => u.role === 'Masajista' && u.status === 'Active');
    const masajistaCommissions: { name: string; commission: number }[] = [];
    masajistas.forEach(masajista => {
      let salesByMasajista = 0;
      orders.forEach(order => {
        // Filter completed orders by update time (completion time)
        if (shiftStartTime && new Date(order.updatedAt) <= shiftStartTime) return;

        if (order.masajistaIds?.includes(masajista.id) && order.status === 'Completed') {
          const masajistaDefaultPercentage = (masajista.commission || 0) / 100;

          // Calculate commission for this masajista
          const orderCommission = (order.products || []).reduce((sum, product) => {
            if (product.isCommissionable) {
              const productPercentage = product.commissionPercentage || 0;
              const effectivePercentage = productPercentage > 0 ? (productPercentage / 100) : masajistaDefaultPercentage;
              return sum + (product.price * effectivePercentage * (product.quantity || 1));
            }
            return sum;
          }, 0);

          // Divide by number of masajistas assigned to the order
          salesByMasajista += orderCommission / (order.masajistaIds.length);
        }
      });
      const commissionAmount = salesByMasajista;
      if (commissionAmount > 0) {
        masajistaCommissions.push({ name: masajista.name, commission: commissionAmount });
      }
    });

    const activeStaff = users.filter(u =>
      u.status === 'Active' &&
      ['administrador', 'admin', 'mozo', 'cajero', 'barman'].includes(u.role.toLowerCase()) &&
      u.role.toLowerCase() !== 'super administrador'
    );
    const staffCommissionPool = totalSales * 0.10;
    const commissionPerStaff = activeStaff.length > 0 ? staffCommissionPool / activeStaff.length : 0;

    return {
      totalSales,
      paymentMethods,
      masajistaCommissions,
      staffCommissionPool,
      activeStaff,
      commissionPerStaff,
    };
  }, [orders, users, shiftStartTime]);

  const handleDownloadPdf = () => {
    const input = document.getElementById('printable-report');
    if (!input) return;

    // Clone the element to capture full content without scroll
    const clone = input.cloneNode(true) as HTMLElement;

    // Reset styles on the clone root
    clone.style.height = 'auto';
    clone.style.width = '600px'; // Fixed width for better PDF layout
    clone.style.overflow = 'visible';
    clone.style.maxHeight = 'none';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.background = 'white';
    clone.classList.remove('overflow-hidden', 'flex', 'flex-col', 'flex-1');

    // Helper to expand elements
    const expandElement = (el: HTMLElement) => {
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
      el.style.overflow = 'visible';
    };

    // 1. Expand main scrollable container
    const mainScroll = clone.querySelector('.overflow-y-auto');
    if (mainScroll) {
      expandElement(mainScroll as HTMLElement);
      (mainScroll as HTMLElement).classList.remove('overflow-y-auto', 'max-h-[60vh]');
    }

    // 2. Expand nested ScrollAreas (specifically the staff list with h-48)
    // We target both the wrapper class and Radix UI viewport
    const nestedScrolls = clone.querySelectorAll('.h-48, [data-radix-scroll-area-viewport]');
    nestedScrolls.forEach(el => {
      expandElement(el as HTMLElement);
      el.classList.remove('h-48');
    });

    document.body.appendChild(clone);

    html2canvas(clone, {
      scale: 2,
      useCORS: true,
      windowWidth: 800 // Simulate larger window to prevent wrapping issues
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // If content is very long, we might need multiple pages, but for now fitting to one or splitting image
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        // Simple multipage support could be added here, but usually scaling or just letting it span is requested.
        // For now, we'll just add the long image.
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      } else {
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      }

      pdf.save(`reporte-cierre-caja-${new Date().toISOString().split('T')[0]}.pdf`);

      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }).catch(err => {
      console.error("Error generating PDF:", err);
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    });
  };

  const handlePrint = async () => {
    if (!reportData) return;

    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cashier-report',
          printerIp: printerIp || undefined,
          reportData: {
            totalSales: reportData.totalSales,
            paymentMethods: reportData.paymentMethods,
            masajistaCommissions: reportData.masajistaCommissions,
            staffCommissionPool: reportData.staffCommissionPool,
            activeStaff: reportData.activeStaff.map(s => ({ name: s.name, role: s.role })),
            commissionPerStaff: reportData.commissionPerStaff
          }
        })
      });

      if (!res.ok) throw new Error('Error al imprimir');
    } catch (error) {
      console.error('Error printing cashier report:', error);
      alert('Error al imprimir el reporte. Verifique la conexión con la impresora.');
    }
  };

  const handleConfirmClick = () => {
    setIsConfirming(false);
    onConfirm();
  }

  if (!isOpen || !reportData) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsConfirming(false); onOpenChange(false); } else { onOpenChange(true); } }}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <div id="printable-report" className="flex-1 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-0 flex-shrink-0">
              <DialogTitle>Reporte de Cierre de Caja</DialogTitle>
              <DialogDescription>
                Resumen de las operaciones del día. Confirma para finalizar el turno.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] p-1">
              <div className="space-y-4 p-6">
                {/* Total Sales */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Ventas Totales</h3>
                    <span className="text-xl font-bold">
                      S/ {reportData.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Wallet className="h-5 w-5" /> Desglose por Pago</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(reportData.paymentMethods).map(([method, amount]) => (
                      <div key={method} className="flex justify-between">
                        <span className="text-muted-foreground">{method}</span>
                        <span className="font-medium">S/ {amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Masajista Commissions */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Percent className="h-5 w-5" />Comisiones de Masajistas</h3>
                  <div className="space-y-1 text-sm">
                    {reportData.masajistaCommissions.length > 0 ? reportData.masajistaCommissions.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">S/ {item.commission.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No se generaron comisiones.</p>
                    )}
                  </div>
                </div>

                {/* Staff Commissions */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Users className="h-5 w-5" />Comisión de Personal</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fondo de Comisión (10%)</span>
                      <span className="font-medium">S/ {reportData.staffCommissionPool.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto por persona ({reportData.activeStaff.length})</span>
                      <span className="font-medium">S/ {reportData.commissionPerStaff.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <Separator className="my-2" />
                    <ScrollArea className="h-48 rounded-md border p-2">
                      <div className="space-y-3">
                        {reportData.activeStaff.map(staff => (
                          <div key={staff.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                                <AvatarFallback className="bg-primary/10 text-primary">{staff.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">{staff.name}</div>
                                <div className="text-xs text-muted-foreground">{staff.role}</div>
                              </div>
                            </div>
                            <span className="font-semibold text-foreground bg-muted px-2 py-1 rounded">
                              S/ {reportData.commissionPerStaff.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 pb-6">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
            </div>
            <Button variant="destructive" onClick={() => setIsConfirming(true)} className="sm:col-start-3">
              Confirmar y Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción finalizará el turno actual y desactivará a todo el personal operativo (mozos, cajeros, barman, masajistas). Solo un administrador o supervisor podrá iniciar un nuevo turno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClick} className="bg-destructive hover:bg-destructive/90">
              Sí, cerrar caja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
