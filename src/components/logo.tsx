import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Package className="h-6 w-6 text-primary" />
      <span className="text-lg font-semibold">Ubox POS</span>
    </div>
  );
}
