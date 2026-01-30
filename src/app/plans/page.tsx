'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Check, CreditCard, Download, Sparkles, Loader2, Shield, Clock, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pricingPlans } from '@/lib/data';
import { LicenseType } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-config';

const planFeatures = {
  basic: {
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    popular: false
  },
  professional: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    popular: true
  },
  business: {
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    popular: false
  }
};

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<LicenseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [licenseGenerated, setLicenseGenerated] = useState<string | null>(null);
  const [showLicense, setShowLicense] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('registration_data');
    if (data) {
      setRegistrationData(JSON.parse(data));
    } else {
      // If no registration data, redirect to register
      router.push('/register');
    }
  }, [router]);

  const handlePlanSelect = async (planType: LicenseType) => {
    setSelectedPlan(planType);
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/license/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Add auth token
        },
        body: JSON.stringify({
          businessId: registrationData?.id,
          planType,
          // businessName and email are not needed by backend but kept if useful
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLicenseGenerated(result.data.licenseKey);
        setShowLicense(true);
        toast({
          title: "¡Licencia Generada!",
          description: `Tu licencia ${planType.toUpperCase()} ha sido creada exitosamente.`,
        });
      } else {
        toast({
          title: "Error en el Proceso",
          description: result.error?.message || "No se pudo generar la licencia.",
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
      setIsProcessing(false);
    }
  };

  const handleDownloadDesktop = () => {
    // Simulate download - in production, this would be the actual download link
    toast({
      title: "Descarga Iniciada",
      description: "El instalador de Ubox POS Desktop se está descargando.",
    });

    // Simulate download after a short delay
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#'; // This would be the actual download URL
      link.download = 'Ubox-POS-Desktop-Setup.exe';
      link.click();
    }, 1000);
  };

  const copyLicenseToClipboard = () => {
    if (licenseGenerated) {
      navigator.clipboard.writeText(licenseGenerated);
      toast({
        title: "Licencia Copiada",
        description: "La clave de licencia ha sido copiada al portapapeles.",
      });
    }
  };

  if (showLicense && licenseGenerated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg shadow-2xl border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <Logo className="mx-auto h-12 w-auto mb-4" />
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Licencia Generada!</CardTitle>
            <CardDescription>
              Tu negocio está listo para operar con Ubox POS
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Tu Clave de Licencia:</div>
              <div className="font-mono text-lg font-bold text-center p-3 bg-background rounded border break-all">
                {licenseGenerated}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={copyLicenseToClipboard}
              >
                Copiar al Portapapeles
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="font-bold capitalize">{selectedPlan}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Negocio</div>
                <div className="font-bold">{registrationData?.businessName}</div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleDownloadDesktop} className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Descargar App Desktop
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Siguientes pasos:</p>
              <ol className="text-xs space-y-1 text-left">
                <li>1. Descarga e instala la aplicación Desktop</li>
                <li>2. Inicia la aplicación y usa esta licencia</li>
                <li>3. Configura tus productos y personal</li>
                <li>4. ¡Comienza a vender!</li>
              </ol>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Ir al Dashboard Web
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <Logo className="mx-auto h-16 w-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">Elige tu Plan Perfecto</h1>
        <p className="text-xl text-muted-foreground mb-2">
          ¡Felicidades {registrationData?.name}! Tu negocio "{registrationData?.businessName}" está listo para comenzar.
        </p>
        <p className="text-lg text-muted-foreground">
          Selecciona el plan que mejor se adapte a tus necesidades y genera tu licencia al instante.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingPlans.slice(1).map((plan, index) => {
          const planType = plan.name.toLowerCase() as LicenseType;
          const planConfig = planFeatures[planType] || planFeatures.basic;
          const Icon = planConfig.icon;

          return (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${planConfig.borderColor} ${planConfig.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
            >
              {planConfig.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                    MÁS POPULAR
                  </div>
                </div>
              )}

              <CardHeader className={`text-center pb-4 ${planConfig.bgColor}`}>
                <div className={`mx-auto w-12 h-12 ${planConfig.bgColor} rounded-full flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${planConfig.color}`} />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.priceFrequency.replace('/', '')}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow pt-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  className={`w-full ${planConfig.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={planConfig.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handlePlanSelect(planType)}
                  disabled={isProcessing || selectedPlan !== null}
                >
                  {isProcessing && selectedPlan === planType ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando Licencia...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Obtener Licencia {plan.name}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            30 Días de Prueba Gratuita
          </h3>
          <p className="text-muted-foreground mb-4">
            Todos los planes incluyen 30 días gratis. Sin compromiso, sin tarjeta de crédito requerida.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Acceso completo a funciones</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Soporte técnico incluido</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/register" className="text-sm text-muted-foreground hover:text-primary">
          ← Volver al registro
        </Link>
      </div>
    </div>
  );
}