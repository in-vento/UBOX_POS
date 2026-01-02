import { Check } from 'lucide-react';
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

export default function PricingPage() {
  return (
    <div className="container mx-auto">
      <PageHeader
        title="Planes y Suscripciones"
        description="Elige el plan que mejor se adapte a las necesidades de tu negocio."
      />
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
              <Button className="w-full" variant={plan.isFeatured ? 'default' : 'outline'}>
                Elegir Plan
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12">
            <h3 className="text-2xl font-semibold mb-2">Prueba Gratuita</h3>
            <p className="text-muted-foreground mb-4">
                Prueba todas las funciones del Plan Básico durante 30 días, sin compromiso.
            </p>
            <Button size="lg">Comenzar Prueba Gratuita</Button>
        </div>
    </div>
  );
}
