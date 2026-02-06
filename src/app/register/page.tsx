'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/logo';
import { Loader2, Building, User, Mail, Phone, MapPin, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api-config';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    ruc: '',
    address: '',
    description: ''
  });

  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            business_name: formData.businessName,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.session) {
        toast({
          title: "Verifica tu correo",
          description: "Te hemos enviado un enlace de confirmación.",
        });
        return;
      }

      // 2. Onboard with Backend
      const response = await fetch(`${API_BASE_URL}/api/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseToken: authData.session.access_token,
          email: formData.email,
          name: formData.name,
          businessName: formData.businessName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Error al registrar en el servidor");
      }

      // Get the businessId from the backend onboarding response
      const serverBusiness = result.data.user.businesses?.[0]?.business;
      const businessId = serverBusiness?.id;

      // 3. Register with Local Internal Onboard to save SystemConfig
      const localResponse = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseToken: authData.session.access_token,
          email: formData.email,
          name: formData.name,
          businessId: businessId,
        }),
      });

      if (localResponse.ok) {
        toast({
          title: "Registro Exitoso",
          description: "Tu cuenta ha sido creada correctamente.",
        });

        // Store auth data
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_info', JSON.stringify(result.data.user));

        // Store selected business
        if (businessId) {
          localStorage.setItem('current_business_id', businessId);
          localStorage.setItem('current_business_name', serverBusiness?.name || formData.businessName);
        }

        // Redirect to plans
        router.push('/plans');
      } else {
        throw new Error("Error al sincronizar configuración local");
      }
    } catch (error: any) {
      toast({
        title: "Error de Registro",
        description: error.message || "No se pudo completar el registro.",
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
      <Card className="w-full max-w-2xl shadow-2xl border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <Logo className="mx-auto h-12 w-auto mb-4" />
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Registro de Negocio
          </CardTitle>
          <CardDescription className="text-lg">
            Crea tu cuenta de Ubox POS y comienza a gestionar tu negocio inteligentemente
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre Completo
                </Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@tu-negocio.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  placeholder="+51 987 654 321"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Nombre del Negocio
                </Label>
                <Input
                  id="businessName"
                  placeholder="Restaurante El Sabor"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruc" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  RUC (Opcional)
                </Label>
                <Input
                  id="ruc"
                  placeholder="20123456789"
                  value={formData.ruc}
                  onChange={(e) => handleInputChange('ruc', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección (Opcional)
                </Label>
                <Input
                  id="address"
                  placeholder="Av. Principal 123, Lima"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Negocio (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente tu negocio, tipo de comida, servicios, etc..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando Cuenta...
                </>
              ) : (
                'Crear Cuenta y Continuar'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Inicia Sesión
              </Link>
            </div>

            <div className="text-center text-xs text-muted-foreground border-t pt-4">
              Al registrarte, aceptas nuestros términos y condiciones.
              <br />
              Prueba gratuita de 30 días en todos los planes.
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}