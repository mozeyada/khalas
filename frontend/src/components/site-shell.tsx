'use client';

import {useState, useEffect, useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  Home, Search, CalendarCheck, LayoutDashboard, LogOut, LogIn,
  UserPlus, Shield, UserCircle, Sparkles, Settings, ChevronLeft,
  ChevronRight, Menu, X,
} from 'lucide-react';

import {Link, usePathname} from '@/i18n/navigation';
import {useSession} from '@/components/session-provider';

/* ─── Constants ─────────────────────────────────────────────── */
const MOBILE_HEADER_H = 56;

/* ─── Types ─────────────────────────────────────────────────── */
type NavItem = {href: string; icon: typeof Home; labelKey: string; matchPaths?: string[]};

/* ─── Role-based navigation ─────────────────────────────────── */
function getNavItems(role: string | undefined, t: (k: string) => string): NavItem[] {
  switch (role) {
    case 'provider': return [
      {href: '/provider/dashboard', icon: LayoutDashboard, labelKey: 'dashboard', matchPaths: ['/provider/dashboard']},
      {href: '/provider/appointments', icon: CalendarCheck, labelKey: 'appointments', matchPaths: ['/provider/appointments']},
      {href: '/provider/settings', icon: Settings, labelKey: 'settings', matchPaths: ['/provider/settings']},
      {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
    ];
    case 'salesman': return [
      {href: '/salesman', icon: Sparkles, labelKey: 'sales', matchPaths: ['/salesman']},
      {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
      {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
    ];
    case 'admin': return [
      {href: '/admin', icon: Shield, labelKey: 'admin', matchPaths: ['/admin']},
      {href: '/salesman', icon: Sparkles, labelKey: 'sales', matchPaths: ['/salesman']},
      {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
      {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
    ];
    case 'patient': return [
      {href: '/', icon: Home, labelKey: 'home', matchPaths: ['/']},
      {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
      {href: '/dashboard', icon: CalendarCheck, labelKey: 'bookings', matchPaths: ['/dashboard']},
      {href: '/profile', icon: UserCircle, labelKey: 'profile', matchPaths: ['/profile']},
    ];
    default: return [
      {href: '/', icon: Home, labelKey: 'home', matchPaths: ['/']},
      {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
      {href: '/auth/login', icon: LogIn, labelKey: 'login', matchPaths: ['/auth/login']},
      {href: '/auth/register', icon: UserPlus, labelKey: 'register', matchPaths: ['/auth/register']},
    ];
  }
}

function getRoleLabel(role: string | undefined, locale: string): string {
  const map: Record<string, {en: string; ar: string}> = {
    provider: {en: 'Clinic', ar: 'عيادة'},
    salesman: {en: 'Sales', ar: 'مبيعات'},
    admin: {en: 'Admin', ar: 'مدير'},
    patient: {en: 'Patient', ar: 'مريض'},
  };
  const e = map[role ?? ''];
  return e ? (locale === 'ar' ? e.ar : e.en) : '';
}

/* ─── SiteShell ─────────────────────────────────────────────── */
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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [impersonatingName, setImpersonatingName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('khalas_impersonating');
    if (name) setImpersonatingName(name);
    const stored = localStorage.getItem('khalas_sidebar_collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

  const toggleCollapse = () => {
    setSidebarCollapsed(v => {
      localStorage.setItem('khalas_sidebar_collapsed', String(!v));
      return !v;
    });
  };

  const handleExitImpersonation = async () => {
    try {
      await logout();
      localStorage.removeItem('khalas_impersonating');
      window.location.href = `/${locale}/auth/login`;
    } catch (err) { console.error(err); }
  };

  const getUserInitials = () => {
    const name = locale === 'ar' ? user?.name_ar : user?.name_en;
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].substring(0, 2)
      : parts[0][0] + parts[parts.length - 1][0];
  };

  const navItems = getNavItems(isReady && isAuthenticated ? user?.role : undefined, t);
  const isActive = (item: NavItem) =>
    item.matchPaths ? item.matchPaths.includes(pathname) : pathname === item.href;

  const isRTL = locale === 'ar';

  /* ── Sidebar inner content (shared between desktop + mobile drawer) ── */
  const SidebarNav = ({collapsed = false, onClose}: {collapsed?: boolean; onClose?: () => void}) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--text-1)] text-white text-xs font-black">
          خ
        </div>
        {!collapsed && <span className="text-base font-black text-[var(--text-1)]">Khalas</span>}
      </div>

      {/* User chip */}
      {isReady && isAuthenticated && user && (
        <div className={`mx-3 mb-4 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink text-white text-xs font-bold">
              {getUserInitials()}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-1 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink text-white text-xs font-bold">
                {getUserInitials()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-1)]">
                  {locale === 'ar' ? user.name_ar : user.name_en}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">
                  {getRoleLabel(user.role, locale)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              onClick={onClose}
              title={collapsed ? t(item.labelKey) : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                active
                  ? 'border-l-2 border-ink text-ink bg-zinc-50 rounded-r-md'
                  : 'border-l-2 border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-ink rounded-r-md'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? 'text-ink' : 'text-zinc-400'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 px-2 pb-4 pt-2 border-t border-zinc-200 mt-2">
        {/* Language toggle */}
        <div className={`mb-2 flex rounded-md border border-zinc-200 p-0.5 ${collapsed ? 'flex-col gap-0.5' : ''}`}>
          <Link href={pathname} locale="ar" className={`flex-1 rounded-sm py-1.5 text-center text-xs font-bold transition-all ${locale === 'ar' ? 'bg-ink text-white' : 'text-zinc-500 hover:text-ink'}`}>ع</Link>
          <Link href={pathname} locale="en" className={`flex-1 rounded-sm py-1.5 text-center text-xs font-bold transition-all ${locale === 'en' ? 'bg-ink text-white' : 'text-zinc-500 hover:text-ink'}`}>En</Link>
        </div>

        {isReady && isAuthenticated ? (
          <button
            onClick={() => void logout()}
            title={collapsed ? (locale === 'ar' ? 'خروج' : 'Logout') : undefined}
            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && (locale === 'ar' ? 'خروج' : 'Logout')}
          </button>
        ) : isReady && !isAuthenticated ? (
          <Link
            href="/auth/login"
            locale={locale}
            onClick={onClose}
            className={`flex w-full items-center gap-2.5 rounded-md bg-ink px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogIn className="h-5 w-5 shrink-0" />
            {!collapsed && t('login')}
          </Link>
        ) : null}
      </div>
    </div>
  );

  const sidebarW = sidebarCollapsed ? 64 : 220;

  return (
    <div className="min-h-screen bg-[var(--surface-0)]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Impersonation Banner ─────────────────────────── */}
      {impersonatingName && (
        <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-4 bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
          <span>{locale === 'ar' ? 'تستخدم النظام كـ' : 'Impersonating'}: {impersonatingName}</span>
          <button onClick={handleExitImpersonation} className="rounded-full bg-white/20 px-3 py-1 text-xs hover:bg-white/30 transition">
            {locale === 'ar' ? 'خروج' : 'Exit'}
          </button>
        </div>
      )}

      {/* ── DESKTOP LAYOUT: flex row ──────────────────────── */}
      {/* Sidebar + Main sit as siblings, sidebar is sticky full height */}
      <div
        className="hidden md:flex min-h-screen"
        style={{paddingTop: impersonatingName ? 36 : 0}}
      >
        {/* Desktop sidebar */}
        <aside
          style={{width: sidebarW}}
          className={`relative flex shrink-0 flex-col border-e border-zinc-200 bg-white transition-all duration-300 ${isRTL ? 'border-s border-e-0' : ''}`}
        >
          {/* Sticky inner */}
          <div className="sticky top-0 h-screen overflow-hidden">
            <SidebarNav collapsed={sidebarCollapsed} />
          </div>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className={`absolute top-6 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-sm text-[var(--text-3)] hover:text-[var(--text-1)] transition z-10 ${isRTL ? '-left-3' : '-right-3'}`}
          >
            {isRTL
              ? (sidebarCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
              : (sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />)
            }
          </button>
        </aside>

        {/* Desktop main content — fills remaining space */}
        <main className="flex-1 min-w-0">
          {(title || subtitle) && (
            <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-8 py-4">
              {title && <h1 className="text-xl font-black text-ink tracking-tight">{title}</h1>}
              {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
            </div>
          )}
          <div className="px-8 py-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── MOBILE LAYOUT ────────────────────────────────── */}
      <div className="md:hidden">
        {/* Mobile top header */}
        <header
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white border-b border-zinc-200 px-4"
          style={{
            height: MOBILE_HEADER_H,
            top: impersonatingName ? 36 : 0,
          }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-50 transition"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" locale={locale} className="flex items-center gap-2 font-black text-ink tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink text-white text-xs font-black">خ</div>
            <span>Khalas</span>
          </Link>

          {/* Language */}
          <div className="flex items-center rounded-full border border-[var(--border)] p-0.5 text-[11px] font-semibold">
            <Link href={pathname} locale="ar" className={`rounded-full px-2 py-0.5 transition-all ${locale === 'ar' ? 'bg-[var(--text-1)] text-white' : 'text-[var(--text-3)]'}`}>ع</Link>
            <Link href={pathname} locale="en" className={`rounded-full px-2 py-0.5 transition-all ${locale === 'en' ? 'bg-[var(--text-1)] text-white' : 'text-[var(--text-3)]'}`}>En</Link>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside
              className={`fixed top-0 bottom-0 z-50 w-72 bg-white shadow-float flex flex-col ${isRTL ? 'right-0' : 'left-0'}`}
              style={{paddingTop: impersonatingName ? 36 : 0}}
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink text-white text-xs font-black">خ</div>
                  <span className="font-black text-ink tracking-tight">Khalas</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-3)] hover:bg-[var(--surface-0)] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav onClose={() => setMobileSidebarOpen(false)} />
              </div>
            </aside>
          </>
        )}

        {/* Mobile main content */}
        <main
          style={{
            paddingTop: impersonatingName
              ? MOBILE_HEADER_H + 36
              : MOBILE_HEADER_H,
            paddingBottom: 80, // bottom tab bar height
          }}
        >
          {(title || subtitle) && (
            <div className="px-4 pt-4 pb-2">
              {title && <h1 className="text-xl font-bold text-[var(--text-1)]">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-[var(--text-3)]">{subtitle}</p>}
            </div>
          )}
          <div className="px-4">
            {children}
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-zinc-200 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-end justify-around">
            {navItems.map(item => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  className={`flex flex-col flex-1 items-center gap-1 pt-3 pb-2 text-[10px] font-semibold transition-colors ${
                    active ? 'text-ink border-t-2 border-ink -mt-[2px]' : 'text-zinc-400 border-t-2 border-transparent -mt-[2px]'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
