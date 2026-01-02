'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Log = {
    id: string;
    action: string;
    details: string | null;
    timestamp: string;
    user: {
        name: string;
        role: string;
    } | null;
};

export default function LogsPage() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const isSuperAdmin = role === 'Super Administrador' || role === 'admin' || role === 'boss';

    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/logs');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (log.action === 'STOCK_ADJUST') {
                return isSuperAdmin;
            }
            return true;
        });
    }, [logs, isSuperAdmin]);

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Registros del Sistema"
                description="Auditoría de acciones y eventos del sistema."
            >
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && logs.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Detalles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.action}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.user ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{log.user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{log.user.role}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Sistema</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate" title={log.details || ''}>
                                                {log.details || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No hay registros disponibles.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
