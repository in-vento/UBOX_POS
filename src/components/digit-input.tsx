'use client';

import { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverAnchor,
} from "@/components/ui/popover";

interface DigitInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function DigitInput({ length = 8, value, onChange, className }: DigitInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState<string[]>(new Array(length).fill(''));
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Sync internal state with external value
    useEffect(() => {
        const newDigits = value.split('').slice(0, length);
        while (newDigits.length < length) {
            newDigits.push('');
        }
        setDigits(newDigits);
    }, [value, length]);

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length > 1) {
            // Handle paste or multiple characters (though maxLength should prevent this)
            return;
        }

        const newDigits = [...digits];
        newDigits[index] = val;
        setDigits(newDigits);
        onChange(newDigits.join(''));

        // Move to next input if value is entered
        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9a-zA-Z]/g, '').slice(0, length);
        if (pastedData) {
            const newDigits = pastedData.split('');
            while (newDigits.length < length) {
                newDigits.push('');
            }
            setDigits(newDigits);
            onChange(newDigits.join(''));

            // Focus the last filled box or the next empty one
            const lastIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    const handleKeypadClick = (num: string) => {
        const index = focusedIndex !== null ? focusedIndex : digits.findIndex(d => !d);
        const targetIndex = index === -1 ? length - 1 : index;

        const newDigits = [...digits];
        newDigits[targetIndex] = num;
        setDigits(newDigits);
        onChange(newDigits.join(''));

        if (targetIndex < length - 1) {
            setFocusedIndex(targetIndex + 1);
            inputRefs.current[targetIndex + 1]?.focus();
        }
    };

    const handleKeypadBackspace = () => {
        const index = focusedIndex !== null ? focusedIndex : digits.findLastIndex(d => d);
        const targetIndex = index === -1 ? 0 : index;

        if (!digits[targetIndex] && targetIndex > 0) {
            const prevIndex = targetIndex - 1;
            const newDigits = [...digits];
            newDigits[prevIndex] = '';
            setDigits(newDigits);
            onChange(newDigits.join(''));
            setFocusedIndex(prevIndex);
            inputRefs.current[prevIndex]?.focus();
        } else {
            const newDigits = [...digits];
            newDigits[targetIndex] = '';
            setDigits(newDigits);
            onChange(newDigits.join(''));
            setFocusedIndex(targetIndex);
            inputRefs.current[targetIndex]?.focus();
        }
    };

    return (
        <div className={cn("relative", className)}>
            <Popover open={focusedIndex !== null} modal={false}>
                <PopoverAnchor asChild>
                    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                        {digits.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onFocus={(e) => {
                                    e.target.select();
                                    if (focusedIndex !== index) setFocusedIndex(index);
                                }}
                                onClick={() => {
                                    if (focusedIndex !== index) setFocusedIndex(index);
                                }}
                                className={cn(
                                    "w-full h-12 text-center text-lg font-bold uppercase",
                                    focusedIndex === index && "ring-2 ring-primary"
                                )}
                                autoComplete="off"
                            />
                        ))}
                    </div>
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
                                onMouseDown={(e) => e.preventDefault()} // Prevent blur
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
                            onClick={() => {
                                setDigits(new Array(length).fill(''));
                                onChange('');
                                setFocusedIndex(0);
                                inputRefs.current[0]?.focus();
                            }}
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
                            onClick={() => setFocusedIndex(null)}
                        >
                            Listo
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
