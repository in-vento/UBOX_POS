'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { pricingPlans } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectPlan = async (plan: any) => {
    try {
      setIsProcessing(plan.name);

      toast({
        title: "Procesando Pago",
        description: `Iniciando pago para el plan ${plan.name}...`,
      });

      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate License Key
      const licenseKey = `UBOX-${Math.random().toString(36).toUpperCase().substr(2, 4)}-${Math.random().toString(36).toUpperCase().substr(2, 4)}-${Math.random().toString(36).toUpperCase().substr(2, 4)}`;

      toast({
        title: "¡Pago Exitoso!",
        description: `Tu licencia para el plan ${plan.name} ha sido generada.`,
      });

      // Use a more robust way to show the key
      alert(`¡Felicidades! Has adquirido el plan ${plan.name}.\n\nTu Llave de Licencia es: ${licenseKey}\n\nGuarda esta llave para activar tus dispositivos.`);
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la selección del plan.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto">
        <PageHeader
          title="Planes y Suscripciones"
          description="Cargando planes..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Planes y Suscripciones"
        description="Elige el plan que mejor se adapte a las necesidades de tu negocio."
      />

      {(!pricingPlans || pricingPlans.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 mt-8">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">No se pudieron cargar los planes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'flex flex-col',
                plan.isFeatured && 'border-primary shadow-lg'
              )}
            >
              {plan.isFeatured && (
                <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1 rounded-t-lg">
                  Más Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.priceFrequency}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.isFeatured ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isProcessing !== null}
                >
                  {isProcessing === plan.name ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Elegir Plan'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <h3 className="text-2xl font-semibold mb-2">Prueba Gratuita</h3>
        <p className="text-muted-foreground mb-4">
          Prueba todas las funciones del Plan Básico durante 30 días, sin compromiso.
        </p>
        <Button size="lg" variant="secondary">Comenzar Prueba Gratuita</Button>
      </div>
    </div>
  );
}
