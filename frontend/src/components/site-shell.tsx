'use client';

import {useState, useEffect, useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  Home,
  Search,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  UserCircle,
  Sparkles,
  ChevronDown,
  Globe,
} from 'lucide-react';

import {Link, usePathname} from '@/i18n/navigation';
import {useSession} from '@/components/session-provider';
import {LocaleSwitcher} from '@/components/locale-switcher';

// Height of the fixed header in px — used to offset page body content
const HEADER_H = 72;

export function SiteShell({
  children,
  title,
  subtitle,
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
      if (event.key === 'Escape') setDropdownOpen(false);
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

  const dashboardHref = user?.role === 'provider' ? '/provider/dashboard' : '/dashboard';

  return (
    /* Changed from <main> to <div> — pages supply their own <main> landmark */
    <div className="min-h-screen w-full">

      {/* ── Fixed header ───────────────────────────────────────── */}
      <header
        style={{height: HEADER_H}}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/90 shadow-sm shadow-black/5 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">

          {/* Brand */}
          <Link
            href="/"
            locale={locale}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-teal/15 bg-gradient-to-r from-teal/10 to-transparent px-4 py-2 text-sm font-bold text-teal transition-all hover:border-teal/30 hover:scale-105"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-40" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal" />
            </span>
            {t('brand')}
          </Link>

          {title && (
            <div className="hidden md:block pl-2 border-l border-ink/10">
              <h1 className="text-sm font-semibold text-ink">{title}</h1>
            </div>
          )}

          {/* Mobile: compact language toggle (always visible) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] p-1 text-xs shadow-sm backdrop-blur">
              <Globe className="mx-1 h-3.5 w-3.5 text-[var(--text-3)]" />
              <Link
                href={pathname}
                locale="ar"
                className={`rounded-full px-2.5 py-1 font-bold transition-all duration-fast ${
                  locale === 'ar'
                    ? 'bg-teal text-white shadow-sm'
                    : 'text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]'
                }`}
              >
                عربي
              </Link>
              <Link
                href={pathname}
                locale="en"
                className={`rounded-full px-2.5 py-1 font-bold transition-all duration-fast ${
                  locale === 'en'
                    ? 'bg-teal text-white shadow-sm'
                    : 'text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]'
                }`}
              >
                EN
              </Link>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <LocaleSwitcher />

            <Link
              href="/"
              locale={locale}
              className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'bg-ink text-white shadow-md'
                  : 'bg-transparent text-ink/70 hover:bg-black/5 hover:text-ink'
              }`}
            >
              <Home className={`h-4 w-4 transition-transform group-hover:scale-110 ${pathname === '/' ? 'text-white' : 'text-ink/50'}`} />
              <span>{t('home')}</span>
            </Link>

            <Link
              href="/search"
              locale={locale}
              className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                pathname === '/search'
                  ? 'bg-ink text-white shadow-md'
                  : 'bg-transparent text-ink/70 hover:bg-black/5 hover:text-ink'
              }`}
            >
              <Search className={`h-4 w-4 transition-transform group-hover:scale-110 ${pathname === '/search' ? 'text-white' : 'text-ink/50'}`} />
              <span>{t('search')}</span>
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
                    } mt-2 w-72 rounded-[2rem] border border-white/60 bg-white/95 p-4 shadow-xl shadow-teal/5 backdrop-blur-md z-50`}
                  >
                    {/* User profile header */}
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

                    <div className="space-y-1">
                      {(user.role === 'provider' || user.role === 'patient' || user.role === 'admin') && (
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
                      )}

                      {user.role === 'admin' && (
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
                      )}

                      {(user.role === 'admin' || user.role === 'salesman') && (
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
                      )}

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
                <div className="h-4 w-px bg-ink/10 mx-1 hidden sm:block" />
                <Link
                  href="/auth/login"
                  locale={locale}
                  className="group flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-ink/70 transition-all hover:bg-black/5 hover:text-ink"
                >
                  <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  <span>{t('login')}</span>
                </Link>
                <Link
                  href="/auth/register"
                  locale={locale}
                  className="group flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-all hover:bg-ink/90 hover:shadow-md"
                >
                  <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>{t('register')}</span>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Page content — offset by header height ─────────────── */}
      <div
        style={{
          paddingTop: HEADER_H,
          '--page-gutter': '1rem',
        } as React.CSSProperties}
        className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 md:pb-8 lg:px-8 [--page-gutter:1rem] sm:[--page-gutter:1.5rem] lg:[--page-gutter:2rem]"
      >
        {(title || subtitle) && (
          <div className="mb-8 px-1 md:hidden">
            {title && <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>}
            {subtitle && <p className="mt-2 text-sm leading-6 text-ink/70">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>

      {/* ── Fixed Bottom Navigation Bar (mobile only) ──────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-[var(--border)] bg-white/95 pb-[env(safe-area-inset-bottom,12px)] pt-2 backdrop-blur-xl md:hidden">
        <Link
          href="/"
          locale={locale}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-fast ${
            pathname === '/' ? 'text-teal' : 'text-[var(--text-3)]'
          }`}
        >
          <Home className={`h-5 w-5 ${pathname === '/' ? 'text-teal' : ''}`} />
          <span>{t('home')}</span>
        </Link>

        <Link
          href="/search"
          locale={locale}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-fast ${
            pathname === '/search' ? 'text-teal' : 'text-[var(--text-3)]'
          }`}
        >
          <Search className={`h-5 w-5 ${pathname === '/search' ? 'text-teal' : ''}`} />
          <span>{t('search')}</span>
        </Link>

        {isReady && isAuthenticated ? (
          <>
            {(user?.role === 'provider' || user?.role === 'patient' || user?.role === 'admin') && (
              <Link
                href={dashboardHref}
                locale={locale}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-fast ${
                  pathname === dashboardHref ? 'text-teal' : 'text-[var(--text-3)]'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>{user?.role === 'provider' ? t('provider') : t('dashboard')}</span>
              </Link>
            )}

            {(user?.role === 'admin' || user?.role === 'salesman') && (
              <Link
                href="/salesman"
                locale={locale}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-fast ${
                  pathname === '/salesman' ? 'text-indigo-600' : 'text-[var(--text-3)]'
                }`}
              >
                <Sparkles className="h-5 w-5" />
                <span>{t('sales')}</span>
              </Link>
            )}

            <Link
              href="/profile"
              locale={locale}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-fast ${
                pathname === '/profile' ? 'text-teal' : 'text-[var(--text-3)]'
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
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all duration-fast ${
                pathname === '/auth/login' ? 'text-teal' : 'text-[var(--text-3)]'
              }`}
            >
              <LogIn className="h-5 w-5" />
              <span>{t('login')}</span>
            </Link>
            <Link
              href="/auth/register"
              locale={locale}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-xs font-semibold transition-all duration-fast ${
                pathname === '/auth/register' ? 'text-teal' : 'text-[var(--text-3)]'
              }`}
            >
              <UserPlus className="h-5 w-5" />
              <span>{t('register')}</span>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
