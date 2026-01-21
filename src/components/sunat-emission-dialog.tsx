/**
 * SUNAT Document Emission Dialog
 * 
 * This component handles the UI for emitting electronic documents (Facturas/Boletas)
 * after an order is completed and paid.
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SunatEmissionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    orderTotal: number;
    onSuccess?: () => void;
}

export function SunatEmissionDialog({
    isOpen,
    onOpenChange,
    orderId,
    orderTotal,
    onSuccess
}: SunatEmissionDialogProps) {
    const { toast } = useToast();
    const [documentType, setDocumentType] = useState<'01' | '03'>('03'); // 01=Factura, 03=Boleta
    const [tipoDoc, setTipoDoc] = useState<'DNI' | 'RUC'>('DNI');
    const [numDoc, setNumDoc] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [direccion, setDireccion] = useState('');
    const [email, setEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [emitting, setEmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setDocumentType('03');
            setTipoDoc('DNI');
            setNumDoc('');
            setRazonSocial('');
            setDireccion('');
            setEmail('');
            setResult(null);
        }
    }, [isOpen]);

    // Auto-switch to Factura if RUC is selected
    useEffect(() => {
        if (tipoDoc === 'RUC') {
            setDocumentType('01');
        }
    }, [tipoDoc]);

    const handleSearch = async () => {
        if (!numDoc) return;

        setSearching(true);
        try {
            // TODO: Implement actual lookup service
            // For now, just simulate
            await new Promise(resolve => setTimeout(resolve, 500));

            if (tipoDoc === 'DNI') {
                setRazonSocial(`Cliente ${numDoc}`);
                setDireccion('');
            } else {
                setRazonSocial(`Empresa ${numDoc} S.A.C.`);
                setDireccion('Av. Ejemplo 123, Lima');
            }

            toast({
                title: 'Datos Encontrados',
                description: 'Se encontró información del cliente'
            });
        } catch (error) {
            toast({
                title: 'No Encontrado',
                description: 'Ingrese los datos manualmente',
                variant: 'default'
            });
        } finally {
            setSearching(false);
        }
    };

    const handleEmit = async () => {
        if (!numDoc || !razonSocial) {
            toast({
                title: 'Datos Incompletos',
                description: 'Complete todos los campos requeridos',
                variant: 'destructive'
            });
            return;
        }

        setEmitting(true);
        try {
            const res = await fetch('/api/billing/emit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    documentType,
                    clientData: {
                        tipoDoc,
                        numDoc,
                        razonSocial,
                        direccion,
                        email
                    }
                })
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
                toast({
                    title: 'Comprobante Emitido',
                    description: `${documentType === '01' ? 'Factura' : 'Boleta'} ${data.document.fullNumber} - ${data.result.status}`
                });

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                throw new Error(data.error || 'Error al emitir');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setEmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACEPTADO':
                return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" /> Aceptado</Badge>;
            case 'RECHAZADO':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rechazado</Badge>;
            case 'PENDIENTE':
                return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pendiente</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Emitir Comprobante Electrónico</DialogTitle>
                    <DialogDescription>
                        Complete los datos del cliente para generar el comprobante SUNAT
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="grid gap-4 py-4">
                        {/* Document Type */}
                        <div className="grid gap-2">
                            <Label>Tipo de Comprobante</Label>
                            <RadioGroup value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="03" id="boleta" />
                                    <Label htmlFor="boleta" className="font-normal">Boleta de Venta</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="01" id="factura" />
                                    <Label htmlFor="factura" className="font-normal">Factura Electrónica</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Client Document Type */}
                        <div className="grid gap-2">
                            <Label>Tipo de Documento del Cliente</Label>
                            <Select value={tipoDoc} onValueChange={(value: any) => setTipoDoc(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DNI">DNI</SelectItem>
                                    <SelectItem value="RUC">RUC</SelectItem>
                                    <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Document Number with Search */}
                        <div className="grid gap-2">
                            <Label htmlFor="numDoc">Número de Documento</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="numDoc"
                                    value={numDoc}
                                    onChange={(e) => setNumDoc(e.target.value)}
                                    placeholder={tipoDoc === 'DNI' ? '12345678' : '20123456789'}
                                    maxLength={tipoDoc === 'DNI' ? 8 : 11}
                                />
                                <Button onClick={handleSearch} disabled={searching || !numDoc} variant="outline" size="icon">
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Client Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="razonSocial">{tipoDoc === 'RUC' ? 'Razón Social' : 'Nombre Completo'}</Label>
                            <Input
                                id="razonSocial"
                                value={razonSocial}
                                onChange={(e) => setRazonSocial(e.target.value)}
                                placeholder={tipoDoc === 'RUC' ? 'MI EMPRESA S.A.C.' : 'Juan Pérez'}
                            />
                        </div>

                        {/* Address (optional) */}
                        <div className="grid gap-2">
                            <Label htmlFor="direccion">Dirección (Opcional)</Label>
                            <Input
                                id="direccion"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                placeholder="Av. Principal 123"
                            />
                        </div>

                        {/* Email (optional) */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email (Opcional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="cliente@example.com"
                            />
                        </div>

                        {/* Total */}
                        <div className="rounded-lg border bg-muted p-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Total a Facturar:</span>
                                <span className="text-2xl font-bold">S/ {orderTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        {/* Success Result */}
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Estado:</span>
                                {getStatusBadge(result.result.status)}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Número:</span>
                                <span className="font-mono">{result.document.fullNumber}</span>
                            </div>
                            {result.result.hash && (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Hash:</span>
                                    <span className="font-mono text-xs">{result.result.hash.slice(0, 20)}...</span>
                                </div>
                            )}
                            {result.result.message && (
                                <div className="text-sm text-muted-foreground">
                                    {result.result.message}
                                </div>
                            )}
                        </div>

                        {/* Print Button */}
                        <Button
                            variant="default"
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/print/electronic', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            documentId: result.document.id
                                        })
                                    });

                                    if (res.ok) {
                                        toast({
                                            title: 'Comprobante Impreso',
                                            description: 'El comprobante electrónico se ha enviado a la impresora'
                                        });
                                    } else {
                                        throw new Error('Error al imprimir');
                                    }
                                } catch (error: any) {
                                    toast({
                                        title: 'Error de Impresión',
                                        description: error.message || 'No se pudo imprimir el comprobante',
                                        variant: 'destructive'
                                    });
                                }
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Imprimir Comprobante Electrónico
                        </Button>

                        {/* PDF Download - Only show for real providers (not mock) */}
                        {result.result.pdfUrl && !result.result.pdfUrl.startsWith('mock://') && (
                            <Button variant="outline" onClick={() => window.open(result.result.pdfUrl, '_blank')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </Button>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleEmit} disabled={emitting}>
                                {emitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Emitiendo...</>
                                ) : (
                                    'Emitir Comprobante'
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
