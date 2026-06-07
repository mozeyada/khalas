'use client';

import {useState, useEffect, useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  Home,
  Search,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  UserCircle,
  Sparkles,
  ChevronDown,
  Settings,
  Globe,
} from 'lucide-react';

import {Link, usePathname} from '@/i18n/navigation';
import {useSession} from '@/components/session-provider';

/* ─── Constants ─────────────────────────────────────────────── */
const HEADER_H = 56; // Compact — apps use 48-56px headers, not 72

/* ─── Role-based bottom tab configuration ───────────────────── */
type TabItem = {
  href: string;
  icon: typeof Home;
  labelKey: string;
  matchPaths?: string[];
};

function getBottomTabs(role: string | undefined, t: (key: string) => string): TabItem[] {
  switch (role) {
    case 'provider':
      return [
        {href: '/provider/dashboard', icon: LayoutDashboard, labelKey: 'dashboard', matchPaths: ['/provider/dashboard']},
        {href: '/provider/appointments', icon: CalendarCheck, labelKey: 'appointments', matchPaths: ['/provider/appointments']},
        {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
      ];
    case 'salesman':
      return [
        {href: '/salesman', icon: Sparkles, labelKey: 'sales', matchPaths: ['/salesman']},
        {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
        {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
      ];
    case 'admin':
      return [
        {href: '/admin', icon: Shield, labelKey: 'admin', matchPaths: ['/admin']},
        {href: '/salesman', icon: Sparkles, labelKey: 'sales', matchPaths: ['/salesman']},
        {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
        {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
      ];
    case 'patient':
      return [
        {href: '/', icon: Home, labelKey: 'home', matchPaths: ['/']},
        {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
        {href: '/dashboard', icon: CalendarCheck, labelKey: 'bookings', matchPaths: ['/dashboard']},
        {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
      ];
    default: // Guest
      return [
        {href: '/', icon: Home, labelKey: 'home', matchPaths: ['/']},
        {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
        {href: '/auth/login', icon: LogIn, labelKey: 'login', matchPaths: ['/auth/login']},
        {href: '/auth/register', icon: UserPlus, labelKey: 'register', matchPaths: ['/auth/register']},
      ];
  }
}

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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const getUserInitials = () => {
    const name = locale === 'ar' ? user?.name_ar : user?.name_en;
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, Math.min(parts[0].length, 2));
    return parts[0][0] + parts[parts.length - 1][0];
  };

  const tabs = getBottomTabs(
    isReady && isAuthenticated ? user?.role : undefined,
    t,
  );

  const isTabActive = (tab: TabItem) => {
    if (tab.matchPaths) return tab.matchPaths.includes(pathname);
    return pathname === tab.href;
  };

  return (
    <div className="min-h-screen w-full bg-[var(--surface-0)]">

      {/* ── Compact App Header ─────────────────────────────────── */}
      <header
        style={{height: HEADER_H}}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white border-b border-black/[0.06] px-4 sm:px-6"
      >
        {/* Logo — minimal */}
        <Link
          href="/"
          locale={locale}
          className="flex items-center gap-2 text-base font-bold text-[var(--text-1)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal text-white text-xs font-black">
            خ
          </div>
          <span className="hidden sm:inline">Khalas</span>
        </Link>

        {/* Right side — avatar or login */}
        <div className="flex items-center gap-2">
          {/* Language toggle — tiny pill */}
          <div className="flex items-center rounded-full border border-black/[0.08] bg-[var(--surface-1)] p-0.5 text-[11px] font-semibold">
            <Link
              href={pathname}
              locale="ar"
              className={`rounded-full px-2 py-0.5 transition-all ${
                locale === 'ar'
                  ? 'bg-[var(--text-1)] text-white'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              ع
            </Link>
            <Link
              href={pathname}
              locale="en"
              className={`rounded-full px-2 py-0.5 transition-all ${
                locale === 'en'
                  ? 'bg-[var(--text-1)] text-white'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              En
            </Link>
          </div>

          {isReady && isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-white text-xs font-bold transition-transform active:scale-95"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                {getUserInitials()}
              </button>

              {menuOpen && (
                <div
                  className={`absolute ${
                    locale === 'ar' ? 'left-0' : 'right-0'
                  } mt-2 w-64 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-lg z-50`}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 border-b border-black/[0.05] pb-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-white text-sm font-bold">
                      {getUserInitials()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-1)] truncate">
                        {locale === 'ar' ? user.name_ar : user.name_en}
                      </p>
                      <p className="text-xs text-[var(--text-3)] truncate">
                        {user.phone}
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <Link
                    href="/profile"
                    locale={locale}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-2)] transition hover:bg-black/[0.03]"
                  >
                    <Settings className="h-4 w-4" />
                    {t('profile')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : isReady && !isAuthenticated ? (
            <Link
              href="/auth/login"
              locale={locale}
              className="rounded-full bg-[var(--text-1)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--text-1)]/90 hidden sm:inline-flex"
            >
              {t('login')}
            </Link>
          ) : null}
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────── */}
      <div
        style={{paddingTop: HEADER_H}}
        className="mx-auto w-full max-w-6xl pb-24 md:pb-8"
      >
        {/* Page title — shown on mobile below header */}
        {(title || subtitle) && (
          <div className="px-4 pt-4 pb-2 sm:px-6 md:hidden">
            {title && <h1 className="text-xl font-bold text-[var(--text-1)]">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-[var(--text-3)]">{subtitle}</p>}
          </div>
        )}

        {/* Desktop page title */}
        {(title || subtitle) && (
          <div className="hidden md:block px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            {title && <h1 className="text-2xl font-bold text-[var(--text-1)]">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-[var(--text-3)]">{subtitle}</p>}
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>

      {/* ── Bottom Tab Bar (mobile) ────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
        {/* Top border line */}
        <div className="h-px bg-black/[0.08]" />
        <div className="flex items-end justify-around bg-white pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                locale={locale}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-colors ${
                  active
                    ? 'text-teal'
                    : 'text-[var(--text-3)]'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? 'text-teal' : ''}`} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal" />
                  )}
                </div>
                <span>{t(tab.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
