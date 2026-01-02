'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Package } from 'lucide-react';
import type { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Beverage = Omit<Product, 'quantity'> & {
  stock: number;
  unit: 'bottles' | 'liters' | 'units';
};


type EndOfShiftReportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inventory: Beverage[];
  onConfirm: (inventory: Beverage[]) => void;
};

export default function EndOfShiftReportDialog({
  isOpen,
  onOpenChange,
  inventory,
  onConfirm,
}: EndOfShiftReportDialogProps) {
  const [printerIp, setPrinterIp] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIp = localStorage.getItem('printerIp');
      if (savedIp) setPrinterIp(savedIp);
    }
  }, []);

  const handleDownloadPdf = () => {
    const input = document.getElementById('printable-shift-report');
    if (!input) return;

    // Clone and expand (similar to handlePrint)
    const clone = input.cloneNode(true) as HTMLElement;

    // Reset styles on the clone root
    clone.style.height = 'auto';
    clone.style.width = '600px'; // Fixed width for better PDF layout
    clone.style.overflow = 'visible';
    clone.style.maxHeight = 'none';
    clone.style.color = 'black';
    clone.style.backgroundColor = 'white';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';

    // Expand scrollable container
    const scrollContainer = clone.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      const el = scrollContainer as HTMLElement;
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
      el.style.overflow = 'visible';
      el.classList.remove('overflow-y-auto', 'max-h-[50vh]');
    }

    document.body.appendChild(clone);

    html2canvas(clone, {
      scale: 2,
      useCORS: true,
      windowWidth: 800
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // If content is very long, we might need multiple pages, but for now fitting to one or splitting image
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      } else {
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      }

      pdf.save(`reporte-inventario-bar.pdf`);

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
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shift-report',
          printerIp: printerIp || undefined,
          reportData: {
            type: 'CLOSE',
            inventory,
            barmanName: 'Barman' // Could be passed as prop if needed
          }
        })
      });

      if (!res.ok) throw new Error('Error al imprimir');
    } catch (error) {
      console.error('Error printing shift report:', error);
      alert('Error al imprimir el reporte. Verifique la conexión con la impresora.');
    }
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div id="printable-shift-report" className="p-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Reporte de Cierre de Turno (Bar)
            </DialogTitle>
            <DialogDescription>
              Resumen del inventario al momento del cierre. Verifica las cantidades antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="max-h-[50vh] overflow-y-auto p-1 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bebida</TableHead>
                    <TableHead className="text-right">Stock Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((beverage) => (
                    <TableRow key={beverage.id}>
                      <TableCell className="font-medium">{beverage.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={(beverage.stock || 0) < 10 ? 'destructive' : 'outline'}>
                          {beverage.stock || 0} {beverage.unit || 'unidades'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:col-start-2">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(inventory)}>
            Confirmar Cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
