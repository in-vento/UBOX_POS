'use client';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { KeypadInput } from '@/components/keypad-input';

type AdjustStockDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: (Omit<Product, 'quantity'> & { stock?: number }) | null;
    onConfirm: (productId: string, newStock: number) => Promise<void>;
};

export default function AdjustStockDialog({
    isOpen,
    onOpenChange,
    product,
    onConfirm,
}: AdjustStockDialogProps) {
    const [newStock, setNewStock] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (product) {
            setNewStock(product.stock || 0);
        }
    }, [product, isOpen]);

    const handleSubmit = async () => {
        if (!product) return;

        setIsSubmitting(true);
        await onConfirm(product.id, newStock);
        setIsSubmitting(false);
        onOpenChange(false);
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajustar Stock Manualmente</DialogTitle>
                    <DialogDescription>
                        Establece la cantidad exacta actual para <strong>{product.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="stock-input">Cantidad Física Actual</Label>
                        <KeypadInput
                            value={newStock}
                            onChange={setNewStock}
                            placeholder="0"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        El stock actual es {product.stock || 0}. Se cambiará a {newStock}.
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Guardar Ajuste
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
