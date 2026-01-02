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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { KeypadInput } from '@/components/keypad-input';

type AddStockDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  products: (Omit<Product, 'quantity'> & { stock?: number })[];
  onConfirm: (productId: string, quantity: number) => Promise<void>;
};

export default function AddStockDialog({
  isOpen,
  onOpenChange,
  products,
  onConfirm,
}: AddStockDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedProductId || quantity <= 0) {
      // Maybe show a toast here in the future
      return;
    }
    setIsSubmitting(true);
    await onConfirm(selectedProductId, quantity);
    setIsSubmitting(false);
    onOpenChange(false);
    // Reset form
    setSelectedProductId(null);
    setQuantity(0);
  };

  const currentStock =
    products.find((p) => p.id === selectedProductId)?.stock || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir o Recibir Stock</DialogTitle>
          <DialogDescription>
            Selecciona un producto y la cantidad para añadir al inventario.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="product-select">Producto</Label>
            <Select
              value={selectedProductId || ''}
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger id="product-select">
                <SelectValue placeholder="Seleccionar un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity-input">Cantidad a Añadir</Label>
            <KeypadInput
              value={quantity}
              onChange={setQuantity}
              placeholder="0"
            />
          </div>
          {selectedProductId && (
            <div className="text-sm text-muted-foreground">
              Stock actual: {currentStock}. Nuevo stock será:{' '}
              {currentStock + quantity}.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedProductId || quantity <= 0 || isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar Entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
