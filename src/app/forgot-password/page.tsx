'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');

    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setIsSubmitted(true);
            toast({
                title: "Correo Enviado",
                description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo enviar el correo.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md shadow-2xl border-primary/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">¡Correo Enviado!</CardTitle>
                        <CardDescription>
                            Hemos enviado las instrucciones a <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        <p>Si no recibes el correo en unos minutos, revisa tu carpeta de spam.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Inicio de Sesión
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-2xl border-primary/20">
                <CardHeader className="space-y-1 text-center">
                    <Logo className="mx-auto h-10 w-auto mb-4" />
                    <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Enlace de Recuperación'
                            )}
                        </Button>

                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Inicio de Sesión
                            </Link>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
