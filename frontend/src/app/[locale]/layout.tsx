import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {ReactNode} from 'react';
import {IBM_Plex_Sans_Arabic} from 'next/font/google';

import {SessionProvider} from '@/components/session-provider';
import {routing} from '@/i18n/routing';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: {
    locale: string;
  };
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = params;
  const isValidLocale = routing.locales.includes(locale as (typeof routing.locales)[number]);

  if (!isValidLocale) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className={ibmPlexSansArabic.className}>
          {children}
        </div>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
