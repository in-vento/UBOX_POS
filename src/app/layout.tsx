import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';


export const metadata: Metadata = {
  title: 'Ubox POS',
  description: 'POS system for Restaurants, Bars, and Nightclubs',
};

import LicenseGuard from '@/components/license-guard';

import { UpdateNotifier } from '@/components/update-notifier';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <LicenseGuard>
          {children}
        </LicenseGuard>
        <UpdateNotifier />
        <Toaster />
      </body>
    </html>
  );
}
