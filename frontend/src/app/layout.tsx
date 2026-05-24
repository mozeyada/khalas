import type {Metadata, Viewport} from 'next';
import {ReactNode} from 'react';

import '@/app/globals.css';
import {ServiceWorkerRegistration} from '@/components/service-worker-registration';

export const metadata: Metadata = {
  title: 'خلاص | Khalas',
  description: 'Khalas appointment booking platform scaffold',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({children}: RootLayoutProps) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}

