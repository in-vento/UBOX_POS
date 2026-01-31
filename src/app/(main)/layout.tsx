'use client';

import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Beer,
  CreditCard,
  LayoutGrid,
  LogOut,
  Package,
  Users,
  Utensils,
  Monitor,
  Briefcase,
  User,
  Menu,
  Loader2,
  Shield,
  FileText,
  Cloud,
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/logo';
import { NotificationProvider } from '@/contexts/notification-context';
import { NotificationDropdown } from '@/components/notification-dropdown';
import type { User as UserType } from '@/lib/types';
import { useState, useMemo } from 'react';

const allNavItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard', roles: ['admin', 'boss'] },
  { href: '/cashier', icon: Monitor, label: 'Caja', roles: ['cajero', 'admin'] },
  { href: '/waiter', icon: Utensils, label: 'Mozos', roles: ['mozo', 'admin'] },
  { href: '/orders', icon: Package, label: 'Catálogo de productos', roles: ['admin', 'cajero', 'boss'] },
  { href: '/bar', icon: Beer, label: 'Inventario', roles: ['barman', 'admin'] },
  { href: '/staff', icon: Users, label: 'Personal', roles: ['admin', 'boss'] },
  { href: '/sunat/documents', icon: FileText, label: 'Documentos SUNAT', roles: ['admin', 'boss'] },
  { href: '/settings/sunat', icon: FileText, label: 'Configuración SUNAT', roles: ['admin', 'boss'] },
  { href: '/devices', icon: Shield, label: 'Dispositivos', roles: ['admin', 'boss'] },
  { href: '/pricing', icon: CreditCard, label: 'Planes', roles: ['admin', 'boss'] },
  { href: '/logs', icon: Briefcase, label: 'Registros', roles: ['admin', 'boss'] },
];

const getHomeLinkForRole = (role: string) => {
  switch (role) {
    case 'mozo':
      return '/waiter';
    case 'barman':
      return '/bar';
    case 'cajero':
      return '/cashier';
    case 'boss':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'admin';
  const userName = searchParams.get('name') || null;
  const displayRoleParam = searchParams.get('displayRole');
  const userId = searchParams.get('id');
  const homeLink = getHomeLinkForRole(role);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const getLinkWithParams = (baseHref: string) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (userName) params.set('name', userName);
    if (displayRoleParam) params.set('displayRole', displayRoleParam);
    if (userId) params.set('id', userId);
    const queryString = params.toString();
    return queryString ? `${baseHref}?${queryString}` : baseHref;
  };

  const currentUser = useMemo(() => {
    const roleNames: Record<string, string> = {
      'admin': 'Super Admin',
      'boss': 'Jefe',
      'cajero': 'Cajero',
      'mozo': 'Mozo',
      'barman': 'Barman',
      'masajista': 'Masajista'
    };
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
    let cloudEmail = `${role}@ubox.com`;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) cloudEmail = parsed.email;
      } catch (e) { }
    }

    return {
      name: userName || displayRoleParam || roleNames[role] || 'Usuario',
      displayRole: displayRoleParam || roleNames[role] || 'Usuario',
      email: cloudEmail,
      avatarUrl: undefined
    };
  }, [role, userName, displayRoleParam]);

  const navItems = allNavItems.filter(item => {
    if (role === 'boss') return true;
    return item.roles.includes(role);
  });

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const UserAvatar = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="rounded-full flex items-center gap-2 pl-2 pr-4 py-2 h-auto">
          <Avatar>
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>{currentUser?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{currentUser?.name}</span>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{currentUser?.name}</DropdownMenuLabel>
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          {currentUser?.displayRole}
        </div>
        <DropdownMenuSeparator />
        {(role === 'admin' || role === 'boss') && <DropdownMenuItem asChild><Link href={getLinkWithParams('/settings')}>Settings</Link></DropdownMenuItem>}
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={role === 'mozo' ? '/waiter-selection' : '/'} className="w-full text-left flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión Local</span>
          </Link>
        </DropdownMenuItem>
        {(role === 'admin' || role === 'boss') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('business_id');
                localStorage.removeItem('user_info');
                window.location.href = '/login';
              }}
            >
              <Cloud className="mr-2 h-4 w-4" />
              <span>Desvincular Cuenta Cloud</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const NavigationMenu = () => (
    <nav className="grid gap-2 text-lg font-medium px-4">
      <Link href={getLinkWithParams(homeLink)} className="flex items-center gap-2 text-lg font-semibold mb-6 mt-2">
        <Logo />
        <span className="sr-only">Ubox POS</span>
      </Link>
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={getLinkWithParams(href)}
          onClick={handleLinkClick}
          className={`flex items-center gap-4 rounded-xl px-3 py-2.5 hover:text-foreground transition-colors ${pathname.startsWith(href)
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground'
            }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
      <div className="mt-auto flex-grow" />
      {(role === 'admin' || role === 'boss') && (
        <div className="mt-auto pb-4">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock all features and get unlimited access to our support team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" asChild>
                <Link href={getLinkWithParams('/pricing')} onClick={handleLinkClick}>Upgrade</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </nav>
  );

  if (role === 'mozo' || role === 'barman') {
    return (
      <NotificationProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Link href={getLinkWithParams(homeLink)} className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                className="font-bold gap-2 shadow-lg hover:scale-105 transition-transform"
                asChild
              >
                <Link href={role === 'mozo' ? '/waiter-selection' : '/'}>
                  <LogOut className="h-5 w-5" />
                  SALIR
                </Link>
              </Button>
              <UserAvatar />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-2 p-2 lg:gap-4 lg:p-4 bg-background overflow-y-auto">
            {children}
          </main>
        </div>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col sm:hidden">
              <NavigationMenu />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
          </div>
          <div className="flex items-center gap-4">
            {(role === 'admin' || role === 'boss') && <NotificationDropdown />}
            <UserAvatar />
          </div>
        </header>
        <div className="flex">
          <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
            <NavigationMenu />
          </aside>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
