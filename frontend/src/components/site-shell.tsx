'use client';

import {useState, useEffect, useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Home, Search, LayoutDashboard, LogOut, LogIn, UserPlus, Shield, UserCircle, Sparkles, ChevronDown} from 'lucide-react';

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const getUserInitials = () => {
    const name = locale === 'ar' ? user?.name_ar : user?.name_en;
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, Math.min(parts[0].length, 2));
    return parts[0][0] + parts[parts.length - 1][0];
  };

  // If user is admin, we default their "user" dashboard to the patient dashboard.
  const dashboardHref = user?.role === 'provider' ? '/provider/dashboard' : '/dashboard';

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-6">
      {/* Floating Portal Navbar (Desktop) & Top Branding (Mobile) */}
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

          <div className="hidden md:flex flex-wrap items-center gap-2">
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

            {isReady && isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm font-medium transition-all hover:bg-slate-50 hover:shadow-sm focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-teal to-teal-400 text-white font-bold text-xs">
                    {getUserInitials()}
                  </div>
                  <span className="hidden sm:inline text-ink max-w-[120px] truncate">
                    {locale === 'ar' ? user.name_ar : user.name_en}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-ink/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div
                    className={`absolute ${
                      locale === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
                    } mt-2 w-72 rounded-[2rem] border border-white/60 bg-white/95 p-4 shadow-xl shadow-teal/5 backdrop-blur-md transition-all z-50`}
                  >
                    {/* User profile details header */}
                    <div className="flex items-center gap-3 border-b border-ink/5 pb-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-teal to-teal-400 text-white font-bold text-base shadow-sm">
                        {getUserInitials()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-ink truncate leading-tight">
                          {locale === 'ar' ? user.name_ar : user.name_en}
                        </span>
                        <span className="text-xs text-ink/60 truncate leading-normal">
                          {user.email || user.phone}
                        </span>
                        <div className="mt-1 flex">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                              user.role === 'admin'
                                ? 'bg-amber-400/10 text-amber-600 border-amber-400/20'
                                : user.role === 'salesman'
                                  ? 'bg-indigo-400/10 text-indigo-600 border-indigo-400/20'
                                  : user.role === 'provider'
                                    ? 'bg-teal/10 text-teal border-teal/20'
                                    : 'bg-emerald-400/10 text-emerald-600 border-emerald-400/20'
                            }`}
                          >
                            {user.role === 'admin'
                              ? (locale === 'ar' ? 'مشرف النظام' : 'Administrator')
                              : user.role === 'salesman'
                                ? (locale === 'ar' ? 'ممثل مبيعات' : 'Sales Representative')
                                : user.role === 'provider'
                                  ? (locale === 'ar' ? 'مقدم خدمة' : 'Healthcare Provider')
                                  : (locale === 'ar' ? 'مريض' : 'Patient')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Links inside dropdown */}
                    <div className="space-y-1">
                      {user.role === 'provider' || user.role === 'patient' || user.role === 'admin' ? (
                        <Link
                          href={dashboardHref}
                          locale={locale}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-all ${
                            pathname === dashboardHref
                              ? 'bg-teal/10 text-teal'
                              : 'text-ink/70 hover:bg-black/5 hover:text-ink'
                          }`}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>{user.role === 'provider' ? t('providerDashboard') : t('dashboard')}</span>
                        </Link>
                      ) : null}

                      {user.role === 'admin' ? (
                        <Link
                          href="/admin"
                          locale={locale}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-all ${
                            pathname === '/admin'
                              ? 'bg-amber-400/10 text-amber-700'
                              : 'text-ink/70 hover:bg-black/5 hover:text-ink'
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                          <span>{t('admin')}</span>
                        </Link>
                      ) : null}

                      {user.role === 'admin' || user.role === 'salesman' ? (
                        <Link
                          href="/salesman"
                          locale={locale}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-all ${
                            pathname === '/salesman'
                              ? 'bg-indigo-400/10 text-indigo-700'
                              : 'text-ink/70 hover:bg-black/5 hover:text-ink'
                          }`}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{t('sales')}</span>
                        </Link>
                      ) : null}

                      <Link
                        href="/profile"
                        locale={locale}
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-all ${
                          pathname === '/profile'
                            ? 'bg-teal/10 text-teal'
                            : 'text-ink/70 hover:bg-black/5 hover:text-ink'
                        }`}
                      >
                        <UserCircle className="h-4 w-4" />
                        <span>{t('profile')}</span>
                      </Link>

                      <div className="h-px bg-ink/5 my-2" />

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          void logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isReady && !isAuthenticated ? (
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
            ) : null}
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

      {/* Fixed Bottom Navigation Bar (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-ink/10 bg-white/90 pb-[env(safe-area-inset-bottom,16px)] pt-2 backdrop-blur-lg md:hidden">
        <Link
          href="/"
          locale={locale}
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all ${
            pathname === '/' ? 'text-teal' : 'text-ink/50'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>{t('home')}</span>
        </Link>
        <Link
          href="/search"
          locale={locale}
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all ${
            pathname === '/search' ? 'text-teal' : 'text-ink/50'
          }`}
        >
          <Search className="h-5 w-5" />
          <span>{t('search')}</span>
        </Link>

        {isReady && isAuthenticated ? (
          <>
            {(user?.role === 'provider' || user?.role === 'patient' || user?.role === 'admin') && (
              <Link
                href={dashboardHref}
                locale={locale}
                className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all ${
                  pathname === dashboardHref ? 'text-teal' : 'text-ink/50'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>{user?.role === 'provider' ? t('providerDashboard') : t('dashboard')}</span>
              </Link>
            )}
            
            {(user?.role === 'admin' || user?.role === 'salesman') && (
              <Link
                href="/salesman"
                locale={locale}
                className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all ${
                  pathname === '/salesman' ? 'text-indigo-600' : 'text-ink/50'
                }`}
              >
                <Sparkles className="h-5 w-5" />
                <span>{t('sales')}</span>
              </Link>
            )}
            
            <Link
              href="/profile"
              locale={locale}
              className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all ${
                pathname === '/profile' ? 'text-teal' : 'text-ink/50'
              }`}
            >
              <UserCircle className="h-5 w-5" />
              <span>{t('profile')}</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              locale={locale}
              className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all ${
                pathname === '/auth/login' ? 'text-teal' : 'text-ink/50'
              }`}
            >
              <LogIn className="h-5 w-5" />
              <span>{t('login')}</span>
            </Link>
          </>
        )}
      </nav>
    </main>
  );
}
