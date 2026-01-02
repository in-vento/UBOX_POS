'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, FileWarning } from 'lucide-react';
import type { Order } from '@/lib/types';

type HandoverDialogProps = {
    isOpen: boolean;
    pendingOrders: Order[];
    onAccept: () => void;
    onReport: (reason: string) => void;
};

export default function HandoverDialog({
    isOpen,
    pendingOrders,
    onAccept,
    onReport,
}: HandoverDialogProps) {
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const handleReportSubmit = () => {
        if (reportReason.trim()) {
            onReport(reportReason);
            setIsReporting(false);
            setReportReason('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Recepción de Turno con Pendientes
                    </DialogTitle>
                    <DialogDescription>
                        El turno anterior cerró con <strong>{pendingOrders.length} cuentas pendientes</strong>.
                        Debes revisar y aceptar estas cuentas para iniciar tu turno.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <h4 className="mb-2 text-sm font-medium">Cuentas por recibir:</h4>
                    <ScrollArea className="h-48 rounded-md border p-2 bg-muted/50">
                        <div className="space-y-2">
                            {pendingOrders.map((order) => (
                                <div key={order.id} className="flex justify-between items-center text-sm p-2 bg-background rounded border">
                                    <div>
                                        <div className="font-medium">{order.customer}</div>
                                        <div className="text-xs text-muted-foreground">{order.customId || order.id.slice(-6)}</div>
                                    </div>
                                    <div className="font-semibold">
                                        S/ {(order.totalAmount - (order.paidAmount || 0)).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {isReporting ? (
                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium">
                            Detalle del Reporte / Inconformidad:
                        </label>
                        <Textarea
                            id="reason"
                            placeholder="Describe el problema (ej. faltan datos, monto incorrecto...)"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsReporting(false)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleReportSubmit} disabled={!reportReason.trim()}>
                                Enviar Reporte
                            </Button>
                        </div>
                    </div>
                ) : (
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsReporting(true)}>
                            <FileWarning className="mr-2 h-4 w-4" />
                            Reportar
                        </Button>
                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={onAccept}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Recibir Conforme
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
