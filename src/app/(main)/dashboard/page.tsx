
'use client';
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  ShieldAlert,
  Download,
  Printer,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import DashboardContent from '@/components/dashboard-content';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Order, Payment, Product, User } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AllTransactionsDialog from './components/all-transactions-dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';



export default function DashboardPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'admin';
  const isAdminOrBoss = role === 'admin' || role === 'boss';

  if (!isAdminOrBoss) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Esta página solo está disponible para administradores y supervisores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayRole = searchParams.get('displayRole');
  const userName = searchParams.get('name');

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Bienvenido, ${displayRole || userName || (role === 'admin' ? 'Super Admin' : 'Jefe')}.`}
      />
      <DashboardContent />
    </>
  );
}
