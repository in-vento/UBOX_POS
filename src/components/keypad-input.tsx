'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverAnchor,
} from "@/components/ui/popover";

interface KeypadInputProps {
    value: number;
    onChange: (value: number) => void;
    displayValue?: string;
    placeholder?: string;
    className?: string;
}

export function KeypadInput({ value, onChange, displayValue, placeholder, className }: KeypadInputProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleKeypadClick = (num: string) => {
        const currentStr = value === 0 ? '' : value.toString();
        const newStr = currentStr + num;
        onChange(Number(newStr));
    };

    const handleKeypadBackspace = () => {
        const currentStr = value.toString();
        if (currentStr.length <= 1) {
            onChange(0);
        } else {
            onChange(Number(currentStr.slice(0, -1)));
        }
    };

    const handleClear = () => {
        onChange(0);
    };

    return (
        <div className={cn("relative", className)}>
            <Popover open={isOpen} modal={false}>
                <PopoverAnchor asChild>
                    <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={displayValue !== undefined ? displayValue : (value === 0 ? '' : value)}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            onChange(val ? Number(val) : 0);
                        }}
                        onFocus={(e) => {
                            e.target.select();
                            if (!isOpen) setIsOpen(true);
                        }}
                        onClick={() => {
                            if (!isOpen) setIsOpen(true);
                        }}
                        placeholder={placeholder}
                        className="text-lg font-medium"
                        autoComplete="off"
                    />
                </PopoverAnchor>
                <PopoverContent
                    className="w-auto p-3"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="grid grid-cols-3 gap-2 w-[220px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <Button
                                key={num}
                                type="button"
                                variant="outline"
                                className="h-12 text-xl font-bold"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleKeypadClick(num.toString())}
                            >
                                {num}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 text-xl font-bold text-destructive"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleClear}
                        >
                            C
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 text-xl font-bold"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleKeypadClick("0")}
                        >
                            0
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 text-xl font-bold"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleKeypadBackspace}
                        >
                            <Delete className="h-6 w-6" />
                        </Button>
                        <Button
                            type="button"
                            className="col-span-3 mt-2 h-10"
                            onClick={() => setIsOpen(false)}
                        >
                            Listo
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
