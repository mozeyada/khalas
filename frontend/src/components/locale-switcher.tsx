'use client';

import {useLocale, useTranslations} from 'next-intl';

import {Link, usePathname} from '@/i18n/navigation';

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('HomePage.language');

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 p-1 text-sm shadow-soft backdrop-blur">
      <span className="px-3 text-ink/65">{t('label')}</span>
      <Link
        href={pathname}
        locale="ar"
        className={`rounded-full px-3 py-2 transition ${
          locale === 'ar' ? 'bg-brand text-white' : 'text-ink/70 hover:bg-black/5'
        }`}
      >
        {t('arabic')}
      </Link>
      <Link
        href={pathname}
        locale="en"
        className={`rounded-full px-3 py-2 transition ${
          locale === 'en' ? 'bg-brand text-white' : 'text-ink/70 hover:bg-black/5'
        }`}
      >
        {t('english')}
      </Link>
    </div>
  );
}

