import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ArrowRight, Users, ShoppingCart, TrendingUp, Shield, Cloud, Monitor, CheckCircle, Lock, Building } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Logo className="mx-auto h-20 w-auto mb-8" />
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Ubox POS
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistema de Punto de Venta inteligente con licenciamiento por dispositivo y aprobación administrativa
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/register">
                Crear Cuenta Nueva
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8">
              <Link href="/login">
                Iniciar Sesión
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center p-6">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Gestión de Personal</CardTitle>
            <CardDescription>
              Administra roles, turnos y comisiones de tu equipo
            </CardDescription>
          </Card>
          
          <Card className="text-center p-6">
            <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Control de Ventas</CardTitle>
            <CardDescription>
              Registro rápido de órdenes y múltiples métodos de pago
            </CardDescription>
          </Card>
          
          <Card className="text-center p-6">
            <Cloud className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle>Sincronización Cloud</CardTitle>
            <CardDescription>
              Sincronización en tiempo real entre dispositivos
            </CardDescription>
          </Card>
          
          <Card className="text-center p-6">
            <Lock className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle>Licenciamiento Seguro</CardTitle>
            <CardDescription>
              Control total de dispositivos con aprobación administrativa
            </CardDescription>
          </Card>
        </div>

        {/* Process Flow */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Cómo Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Registra tu Negocio</h3>
              <p className="text-sm text-gray-600">Crea tu cuenta y registra tu información comercial</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Elige un Plan</h3>
              <p className="text-sm text-gray-600">Selecciona el plan que mejor se adapte a tu negocio</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Instala Dispositivos</h3>
              <p className="text-sm text-gray-600">Descarga la app desktop en tus dispositivos POS</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">4. Aprueba y Opera</h3>
              <p className="text-sm text-gray-600">Aprueba dispositivos desde el dashboard web</p>
            </div>
          </div>
        </div>

        {/* License System Benefits */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Sistema de Licenciamiento Avanzado</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Seguridad por Dispositivo</h3>
              <p className="text-sm text-gray-600">Cada dispositivo requiere licencia única y aprobación</p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Control Administrativo</h3>
              <p className="text-sm text-gray-600">Aprueba o rechaza dispositivos desde el panel web</p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Escalabilidad</h3>
              <p className="text-sm text-gray-600">Planes flexibles según el tamaño de tu negocio</p>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Planes Adaptados a tu Negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl">Básico</CardTitle>
                <div className="text-3xl font-bold text-blue-600">S/99/mes</div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-left space-y-2">
                  <li>✓ 3 Usuarios</li>
                  <li>✓ 500 Ventas/mes</li>
                  <li>✓ Control de Stock</li>
                  <li>✓ Soporte por Email</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 border-purple-200 ring-2 ring-purple-500">
              <CardHeader>
                <CardTitle className="text-xl">Profesional</CardTitle>
                <div className="text-3xl font-bold text-purple-600">S/199/mes</div>
                <div className="bg-purple-100 text-purple-700 text-sm font-semibold rounded-full px-3 py-1 inline-block mt-2">
                  MÁS POPULAR
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-left space-y-2">
                  <li>✓ 10 Usuarios</li>
                  <li>✓ Ventas Ilimitadas</li>
                  <li>✓ Reportes Avanzados</li>
                  <li>✓ Integración SUNAT</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 border-orange-200">
              <CardHeader>
                <CardTitle className="text-xl">Business</CardTitle>
                <div className="text-3xl font-bold text-orange-600">S/349/mes</div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-left space-y-2">
                  <li>✓ Usuarios Ilimitados</li>
                  <li>✓ Soporte 24/7</li>
                  <li>✓ Modo Offline</li>
                  <li>✓ API Access</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 shadow-xl text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Regístrate hoy y obtén 30 días de prueba gratuita en cualquier plan
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/login">
                Ya tengo cuenta
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}