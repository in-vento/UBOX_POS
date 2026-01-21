'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2, LogIn, UserPlus, Shield, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Inicio de Sesión Exitoso",
          description: "Bienvenido de vuelta a Ubox POS.",
        });

        // Store auth data
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_info', JSON.stringify(result.data.user));

        // Redirect to dashboard
        router.push('/dashboard?role=admin&name=' + encodeURIComponent(result.data.user.name));
      } else {
        toast({
          title: "Error de Inicio de Sesión",
          description: result.error?.message || "Credenciales inválidas.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="shadow-2xl border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <Logo className="mx-auto h-12 w-auto mb-4" />
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <LogIn className="h-8 w-8 text-primary" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-lg">
              Accede a tu dashboard de gestión
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@tu-negocio.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando Sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Features Section */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Gestiona tu Negocio Inteligentemente</h2>
            <p className="text-muted-foreground">
              Ubox POS es el sistema completo para la gestión de restaurantes, bares y servicios.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Gestión Completa</h3>
                <p className="text-sm text-muted-foreground">
                  Controla ventas, inventario, personal y más desde una plataforma centralizada.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Seguridad y Licencias</h3>
                <p className="text-sm text-muted-foreground">
                  Sistema de licenciamiento por dispositivo con aprobación administrativa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Fácil de Usar</h3>
                <p className="text-sm text-muted-foreground">
                  Interfaz intuitiva diseñada para todo tipo de negocios y personal.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium mb-2">¿Eres nuevo en Ubox POS?</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Nueva Cuenta
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}