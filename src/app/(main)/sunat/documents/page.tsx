'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    FileText,
    Printer,
    Download,
    ExternalLink,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SunatDocumentsPage() {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/sunat/documents');
            if (res.ok) {
                const data = await res.json();
                setDocuments(Array.isArray(data) ? data : []);
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Error al cargar documentos');
            }
        } catch (error: any) {
            console.error('Error fetching documents:', error);
            setError(error.message);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los documentos SUNAT',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = useMemo(() => {
        if (!Array.isArray(documents)) return [];

        return documents.filter(doc => {
            if (!doc) return false;

            const fullNumber = doc.fullNumber || '';
            const razonSocial = doc.client?.razonSocial || '';
            const numDoc = doc.client?.numDoc || '';

            const matchesSearch =
                fullNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                numDoc.includes(searchTerm);

            const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
            const matchesType = typeFilter === 'ALL' || doc.documentType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [documents, searchTerm, statusFilter, typeFilter]);

    const getStatusBadge = (status: string) => {
        if (!status) return <Badge variant="outline">N/A</Badge>;

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

    const handlePrint = async (docId: string) => {
        if (!docId) return;
        try {
            const res = await fetch('/api/print/electronic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId })
            });

            if (res.ok) {
                toast({
                    title: 'Impresión enviada',
                    description: 'El comprobante se ha enviado a la impresora'
                });
            } else {
                throw new Error('Error al imprimir');
            }
        } catch (error: any) {
            toast({
                title: 'Error de Impresión',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    const formatDateSafely = (dateStr: string) => {
        if (!dateStr) return 'Fecha no disponible';
        try {
            const date = parseISO(dateStr);
            if (isValid(date)) {
                return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
            }
            return 'Fecha inválida';
        } catch (e) {
            return 'Error de fecha';
        }
    };

    const formatCurrencySafely = (amount: any) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return 'S/ 0.00';
        return `S/ ${num.toFixed(2)}`;
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Documentos SUNAT"
                description="Listado de comprobantes electrónicos emitidos"
            >
                <Button onClick={fetchDocuments} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por número o cliente..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                                    <SelectItem value="01">Factura</SelectItem>
                                    <SelectItem value="03">Boleta</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los estados</SelectItem>
                                    <SelectItem value="ACEPTADO">Aceptados</SelectItem>
                                    <SelectItem value="RECHAZADO">Rechazados</SelectItem>
                                    <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Número</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                        Cargando documentos...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-destructive">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p className="font-semibold">Error al cargar documentos</p>
                                        <p className="text-sm opacity-80 mb-4">{error}</p>
                                        <Button onClick={fetchDocuments} variant="outline" size="sm">
                                            Reintentar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : filteredDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No se encontraron documentos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            {formatDateSafely(doc.fechaEmision)}
                                        </TableCell>
                                        <TableCell className="font-mono font-medium">
                                            {doc.fullNumber || 'S/N'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{doc.client?.razonSocial || 'Cliente Desconocido'}</span>
                                                <span className="text-xs text-muted-foreground">{doc.client?.numDoc || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {formatCurrencySafely(doc.total)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(doc.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Imprimir"
                                                    onClick={() => handlePrint(doc.id)}
                                                    disabled={!doc.id}
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                {doc.pdfUrl && !doc.pdfUrl.startsWith('mock://') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Ver PDF"
                                                        onClick={() => window.open(doc.pdfUrl, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
