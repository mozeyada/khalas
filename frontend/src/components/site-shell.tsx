'use client';

import {useLocale, useTranslations} from 'next-intl';

import {Link, usePathname} from '@/i18n/navigation';
import {useSession} from '@/components/session-provider';
import {LocaleSwitcher} from '@/components/locale-switcher';

export function SiteShell({
  children,
  title,
  subtitle
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  const {isAuthenticated, logout, user, isReady} = useSession();

  const dashboardHref = user?.role === 'provider' ? '/provider/dashboard' : '/dashboard';

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] border border-white/60 bg-white/70 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-ink/10 bg-sand px-3 py-1 text-sm font-semibold text-ink">
              {t('brand')}
            </div>
            {title ? <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1> : null}
            {subtitle ? <p className="max-w-2xl text-sm leading-6 text-ink/70">{subtitle}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LocaleSwitcher />
            <Link
              href="/"
              locale={locale}
              className={`rounded-full px-4 py-2 text-sm transition ${
                pathname === '/' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-black/5'
              }`}
            >
              {t('home')}
            </Link>
            <Link
              href="/search"
              locale={locale}
              className={`rounded-full px-4 py-2 text-sm transition ${
                pathname === '/search' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-black/5'
              }`}
            >
              {t('search')}
            </Link>
            {isReady && isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  locale={locale}
                  className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-teal/90"
                >
                  {user?.role === 'provider' ? t('providerDashboard') : t('dashboard')}
                </Link>
                {user?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    locale={locale}
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-amber-300"
                  >
                    {t('admin')}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-white px-4 py-2 text-sm text-ink transition hover:bg-black/5"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" locale={locale} className="rounded-full bg-white px-4 py-2 text-sm text-ink transition hover:bg-black/5">
                  {t('login')}
                </Link>
                <Link href="/auth/register" locale={locale} className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-teal/90">
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
