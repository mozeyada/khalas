'use client';

import {useLocale, useTranslations} from 'next-intl';
import {Home, Search, LayoutDashboard, LogOut, LogIn, UserPlus, Shield, UserCircle, Sparkles} from 'lucide-react';

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

  // If user is admin, we default their "user" dashboard to the patient dashboard.
  const dashboardHref = user?.role === 'provider' ? '/provider/dashboard' : '/dashboard';

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Floating Portal Navbar */}
      <header className="sticky top-4 z-50 mb-8 rounded-[2rem] border border-white/60 bg-white/70 p-3 shadow-lg shadow-teal/5 backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-xl hover:shadow-teal/10 sm:p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" locale={locale} className="group flex items-center gap-2 rounded-full border border-teal/10 bg-gradient-to-r from-teal/10 to-transparent px-4 py-2 text-sm font-bold text-teal transition-all hover:border-teal/30 hover:scale-105">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-40"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal"></span>
              </span>
              {t('brand')}
            </Link>
            
            {title && (
              <div className="hidden md:block pl-2 border-l border-ink/10">
                <h1 className="text-sm font-semibold text-ink">{title}</h1>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LocaleSwitcher />
            
            <Link
              href="/"
              locale={locale}
              className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                pathname === '/' ? 'bg-ink text-white shadow-md' : 'bg-transparent text-ink/70 hover:bg-black/5 hover:text-ink'
              }`}
            >
              <Home className={`h-4 w-4 transition-transform group-hover:scale-110 ${pathname === '/' ? 'text-white' : 'text-ink/50'}`} />
              <span className="hidden sm:inline">{t('home')}</span>
            </Link>
            
            <Link
              href="/search"
              locale={locale}
              className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                pathname === '/search' ? 'bg-ink text-white shadow-md' : 'bg-transparent text-ink/70 hover:bg-black/5 hover:text-ink'
              }`}
            >
              <Search className={`h-4 w-4 transition-transform group-hover:scale-110 ${pathname === '/search' ? 'text-white' : 'text-ink/50'}`} />
              <span className="hidden sm:inline">{t('search')}</span>
            </Link>

            {isReady && isAuthenticated ? (
              <>
                {user?.role === 'provider' || user?.role === 'patient' || user?.role === 'admin' ? (
                  <Link
                    href={dashboardHref}
                    locale={locale}
                    className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      pathname === dashboardHref
                        ? 'bg-teal text-white shadow-sm'
                        : 'bg-transparent text-ink/70 hover:bg-black/5 hover:text-ink'
                    }`}
                  >
                    <LayoutDashboard className={`h-4 w-4 transition-transform ${pathname !== dashboardHref && 'group-hover:scale-110'}`} />
                    <span className="hidden sm:inline">
                      {user?.role === 'provider' ? t('providerDashboard') : t('dashboard')}
                    </span>
                  </Link>
                ) : null}
                
                {user?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    locale={locale}
                    className="group flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 transition-all hover:bg-amber-300 hover:shadow-md"
                  >
                    <Shield className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="hidden sm:inline">{t('admin')}</span>
                  </Link>
                ) : null}
                
                {user?.role === 'admin' || user?.role === 'salesman' ? (
                  <Link
                    href="/salesman"
                    locale={locale}
                    className="group flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100 hover:shadow-md"
                  >
                    <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="hidden sm:inline">{t('sales')}</span>
                  </Link>
                ) : null}
                
                <Link
                  href="/profile"
                  locale={locale}
                  className="group flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-ink/70 transition-all hover:bg-black/5 hover:text-ink"
                >
                  <UserCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">{t('profile')}</span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="group flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-ink/70 transition-all hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </>
            ) : (
              <>
                <div className="h-4 w-px bg-ink/10 mx-1 hidden sm:block"></div>
                <Link 
                  href="/auth/login" 
                  locale={locale} 
                  className="group flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-ink/70 transition-all hover:bg-black/5 hover:text-ink"
                >
                  <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span className="hidden sm:inline">{t('login')}</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  locale={locale} 
                  className="group flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-all hover:bg-ink/90 hover:shadow-md"
                >
                  <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">{t('register')}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Header (If not hidden inside floating navbar) */}
      {(title || subtitle) && (
        <div className="mb-8 px-4 sm:px-6 md:hidden">
          {title ? <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1> : null}
          {subtitle ? <p className="mt-2 text-sm leading-6 text-ink/70">{subtitle}</p> : null}
        </div>
      )}

      {children}
    </main>
  );
}
