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
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

import {Link, usePathname} from '@/i18n/navigation';
import {useSession} from '@/components/session-provider';

/* ─── Constants ─────────────────────────────────────────────── */
const HEADER_H = 56;
const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 64;

/* ─── Types ─────────────────────────────────────────────────── */
type TabItem = {
  href: string;
  icon: typeof Home;
  labelKey: string;
  matchPaths?: string[];
};

/* ─── Role-based navigation ─────────────────────────────────── */
function getNavItems(role: string | undefined, t: (key: string) => string): TabItem[] {
  switch (role) {
    case 'provider':
      return [
        {href: '/provider/dashboard', icon: LayoutDashboard, labelKey: 'dashboard', matchPaths: ['/provider/dashboard']},
        {href: '/provider/appointments', icon: CalendarCheck, labelKey: 'appointments', matchPaths: ['/provider/appointments']},
        {href: '/provider/settings', icon: Settings, labelKey: 'settings', matchPaths: ['/provider/settings']},
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
    default:
      return [
        {href: '/', icon: Home, labelKey: 'home', matchPaths: ['/']},
        {href: '/search', icon: Search, labelKey: 'search', matchPaths: ['/search']},
        {href: '/auth/login', icon: LogIn, labelKey: 'login', matchPaths: ['/auth/login']},
        {href: '/auth/register', icon: UserPlus, labelKey: 'register', matchPaths: ['/auth/register']},
      ];
  }
}

/* ─── Role label ────────────────────────────────────────────── */
function getRoleLabel(role: string | undefined, locale: string): string {
  const labels: Record<string, {en: string; ar: string}> = {
    provider: {en: 'Clinic', ar: 'عيادة'},
    salesman: {en: 'Sales', ar: 'مبيعات'},
    admin: {en: 'Admin', ar: 'مدير'},
    patient: {en: 'Patient', ar: 'مريض'},
  };
  const entry = labels[role ?? ''];
  if (!entry) return '';
  return locale === 'ar' ? entry.ar : entry.en;
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [impersonatingName, setImpersonatingName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('khalas_impersonating');
    if (name) setImpersonatingName(name);
  }, []);

  // Restore sidebar collapse preference
  useEffect(() => {
    const stored = localStorage.getItem('khalas_sidebar_collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMenuOpen(false); setMobileSidebarOpen(false); }
    }
    if (menuOpen || mobileSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, mobileSidebarOpen]);

  const getUserInitials = () => {
    const name = locale === 'ar' ? user?.name_ar : user?.name_en;
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, Math.min(parts[0].length, 2));
    return parts[0][0] + parts[parts.length - 1][0];
  };

  const navItems = getNavItems(
    isReady && isAuthenticated ? user?.role : undefined,
    t,
  );

  const isNavActive = (item: TabItem) => {
    if (item.matchPaths) return item.matchPaths.includes(pathname);
    return pathname === item.href;
  };

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
  const isRTL = locale === 'ar';

  /* ── Sidebar Content ── */
  const SidebarContent = ({mobile = false}: {mobile?: boolean}) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 ${sidebarCollapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--text-1)] text-white text-xs font-black shadow-sm">
          خ
        </div>
        {(!sidebarCollapsed || mobile) && (
          <span className="text-base font-black text-[var(--text-1)]">Khalas</span>
        )}
      </div>

      {/* User info */}
      {isReady && isAuthenticated && user && (!sidebarCollapsed || mobile) && (
        <div className="mx-3 mb-4 rounded-2xl bg-[var(--surface-0)] border border-[var(--border)] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--text-1)] text-white text-xs font-bold">
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
        </div>
      )}

      {/* Collapsed avatar */}
      {isReady && isAuthenticated && user && sidebarCollapsed && !mobile && (
        <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--text-1)] text-white text-xs font-bold">
          {getUserInitials()}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(item => {
          const active = isNavActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              onClick={() => setMobileSidebarOpen(false)}
              title={sidebarCollapsed && !mobile ? t(item.labelKey) : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                active
                  ? 'bg-[var(--text-1)] text-white shadow-sm'
                  : 'text-[var(--text-2)] hover:bg-[var(--surface-0)] hover:text-[var(--text-1)]'
              } ${sidebarCollapsed && !mobile ? 'justify-center px-0' : ''}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-[var(--text-3)]'}`} strokeWidth={active ? 2.5 : 1.8} />
              {(!sidebarCollapsed || mobile) && (
                <span>{t(item.labelKey)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 px-2 pb-4">
        {/* Language toggle */}
        <div className={`flex items-center gap-1 rounded-xl border border-[var(--border)] p-1 ${sidebarCollapsed && !mobile ? 'justify-center flex-col' : ''}`}>
          <Link
            href={pathname}
            locale="ar"
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-all ${locale === 'ar' ? 'bg-[var(--text-1)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}
          >
            ع
          </Link>
          <Link
            href={pathname}
            locale="en"
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-all ${locale === 'en' ? 'bg-[var(--text-1)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}
          >
            En
          </Link>
        </div>

        {isReady && isAuthenticated ? (
          <button
            onClick={() => void logout()}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 ${sidebarCollapsed && !mobile ? 'justify-center px-0' : ''}`}
            title={sidebarCollapsed && !mobile ? (locale === 'ar' ? 'خروج' : 'Logout') : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(!sidebarCollapsed || mobile) && (locale === 'ar' ? 'خروج' : 'Logout')}
          </button>
        ) : isReady && !isAuthenticated ? (
          <Link
            href="/auth/login"
            locale={locale}
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex w-full items-center gap-2.5 rounded-xl bg-[var(--text-1)] px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 ${sidebarCollapsed && !mobile ? 'justify-center px-0' : ''}`}
          >
            <LogIn className="h-5 w-5 shrink-0" />
            {(!sidebarCollapsed || mobile) && t('login')}
          </Link>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-full bg-[var(--surface-0)] ${isRTL ? 'direction-rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Impersonation Banner ──────────────────────────────────── */}
      {impersonatingName && (
        <div className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-4 bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md">
          <span>{locale === 'ar' ? 'أنت تستخدم النظام كـ' : 'Impersonating'}: {impersonatingName}</span>
          <button
            onClick={handleExitImpersonation}
            className="rounded-full bg-white/20 px-3 py-1 text-xs hover:bg-white/30 transition-colors"
          >
            {locale === 'ar' ? 'خروج' : 'Exit'}
          </button>
        </div>
      )}

      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarWidth,
          top: impersonatingName ? 36 : 0,
        }}
        className={`fixed bottom-0 z-40 hidden flex-col border-e border-[var(--border)] bg-white transition-all duration-300 md:flex ${isRTL ? 'right-0 border-s border-e-0' : 'left-0'}`}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={`absolute top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-sm text-[var(--text-3)] hover:text-[var(--text-1)] transition-all ${isRTL ? '-left-3' : '-right-3'}`}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {isRTL
            ? (sidebarCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
            : (sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />)
          }
        </button>
      </aside>

      {/* ── Mobile Top Header ─────────────────────────────────────── */}
      <header
        style={{height: HEADER_H, marginTop: impersonatingName ? 36 : 0}}
        className="fixed inset-x-0 z-50 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-[var(--border)] px-4 md:hidden"
      >
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] hover:bg-[var(--surface-0)] transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          locale={locale}
          className="flex items-center gap-2 text-base font-black text-[var(--text-1)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--text-1)] text-white text-xs font-black shadow-sm">خ</div>
          <span>Khalas</span>
        </Link>

        {/* Language */}
        <div className="flex items-center rounded-full border border-[var(--border)] p-0.5 text-[11px] font-semibold">
          <Link href={pathname} locale="ar" className={`rounded-full px-2 py-0.5 transition-all ${locale === 'ar' ? 'bg-[var(--text-1)] text-white' : 'text-[var(--text-3)]'}`}>ع</Link>
          <Link href={pathname} locale="en" className={`rounded-full px-2 py-0.5 transition-all ${locale === 'en' ? 'bg-[var(--text-1)] text-white' : 'text-[var(--text-3)]'}`}>En</Link>
        </div>
      </header>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────── */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside
            className={`fixed top-0 bottom-0 z-50 w-72 flex flex-col bg-white shadow-overlay md:hidden transition-transform duration-300 ${isRTL ? 'right-0' : 'left-0'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--text-1)] text-white text-xs font-black">خ</div>
                <span className="font-black text-[var(--text-1)]">Khalas</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-3)] hover:bg-[var(--surface-0)] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent mobile />
            </div>
          </aside>
        </>
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main
        style={{
          paddingTop: impersonatingName ? HEADER_H + 36 : HEADER_H,
          paddingBottom: '80px', // mobile bottom tabs
        }}
        className={`min-h-screen w-full transition-all duration-300 md:pt-0 md:pb-0 ${
          isRTL
            ? `md:pe-[${sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W}px]`
            : ''
        }`}
        // Inline style for desktop sidebar offset (dynamic value can't be in Tailwind class)
        ref={el => {
          if (el) {
            if (window.matchMedia('(min-width: 768px)').matches) {
              if (isRTL) {
                el.style.paddingRight = `${sidebarWidth}px`;
                el.style.paddingLeft = '0';
              } else {
                el.style.paddingLeft = `${sidebarWidth}px`;
                el.style.paddingRight = '0';
              }
              el.style.paddingTop = impersonatingName ? '36px' : '0';
              el.style.paddingBottom = '0';
            } else {
              el.style.paddingLeft = '';
              el.style.paddingRight = '';
              el.style.paddingTop = `${impersonatingName ? HEADER_H + 36 : HEADER_H}px`;
              el.style.paddingBottom = '80px';
            }
          }
        }}
      >
        {/* Desktop: page title bar */}
        {(title || subtitle) && (
          <div className="hidden md:block border-b border-[var(--border)] bg-white px-8 py-5 sticky top-0 z-10">
            {title && <h1 className="text-xl font-black text-[var(--text-1)]">{title}</h1>}
            {subtitle && <p className="mt-0.5 text-sm text-[var(--text-3)]">{subtitle}</p>}
          </div>
        )}

        {/* Mobile: page title below header */}
        {(title || subtitle) && (
          <div className="px-4 pt-4 pb-2 md:hidden">
            {title && <h1 className="text-xl font-bold text-[var(--text-1)]">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-[var(--text-3)]">{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 max-w-5xl md:max-w-none xl:max-w-5xl mx-auto md:mx-0">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-[var(--border)] md:hidden">
        <div className="flex items-end justify-around pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
          {navItems.map(item => {
            const active = isNavActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-colors active:scale-95 ${
                  active ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? 'text-[var(--text-1)]' : ''}`} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--text-1)]" />
                  )}
                </div>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
