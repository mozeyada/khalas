import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {ReactNode} from 'react';

import {routing} from '@/i18n/routing';

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
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>{children}</div>
    </NextIntlClientProvider>
  );
}
