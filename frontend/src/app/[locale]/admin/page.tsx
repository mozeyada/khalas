'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';
import {
  Building2, Users, AlertCircle, Search, Shield, CheckCircle2,
  XCircle, UserCog, Send, MessageSquare, Loader2, ChevronRight,
  Activity, TrendingUp, Zap, Clock
} from 'lucide-react';

type Venue = {
  _id: string; name_ar: string; name_en: string; category: string;
  governorate: string; is_approved: boolean; subscription_status: string;
  owner_id: string; phone?: string;
};
type User = {
  _id: string; name_ar: string; name_en: string; phone: string;
  email?: string | null; role: string; provider_type?: string | null; is_active: boolean; created_at: string;
};

async function bffPatch<T>(path: string, body: unknown): Promise<T> {
  const proxyPath = path.replace(/^\/api\/v1\//, '');
  const res = await fetch(`/api/proxy/${proxyPath}`, {
    method: 'PATCH', cache: 'no-store',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = (await res.json()) as {error?: string};
    throw new ApiError(errBody.error ?? 'Request failed.', res.status);
  }
  const data = (await res.json()) as {data: T};
  return data.data;
}

async function bffGet<T>(path: string): Promise<T> {
  const proxyPath = path.replace(/^\/api\/v1\//, '');
  const res = await fetch(`/api/proxy/${proxyPath}`, {cache: 'no-store'});
  if (!res.ok) {
    const errBody = (await res.json()) as {error?: string};
    throw new ApiError(errBody.error ?? 'Request failed.', res.status);
  }
  const data = (await res.json()) as {data: T};
  return data.data;
}

type Tab = 'venues' | 'users';

const ROLE_CHIP: Record<string, {label_en: string; label_ar: string; color: string}> = {
  admin:    {label_en: 'Admin',    label_ar: 'مدير',    color: 'bg-violet-100 text-violet-700'},
  salesman: {label_en: 'Sales',    label_ar: 'مبيعات',  color: 'bg-indigo-100 text-indigo-700'},
  provider: {label_en: 'Provider', label_ar: 'مقدم',    color: 'bg-emerald-100 text-emerald-700'},
  patient:  {label_en: 'Patient',  label_ar: 'مريض',    color: 'bg-sky-100 text-sky-700'},
};

export default function AdminPage() {
  const t = useTranslations('AdminPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const isAr = locale === 'ar';
  const [tab, setTab] = useState<Tab>('venues');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [welcomeModalUser, setWelcomeModalUser] = useState<User | null>(null);
  const [welcomeLang, setWelcomeLang] = useState<'ar' | 'en'>('ar');
  const [welcomePassword, setWelcomePassword] = useState('');
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  const [customMsgModalUser, setCustomMsgModalUser] = useState<User | null>(null);
  const [customMsgText, setCustomMsgText] = useState('');
  const [isSendingCustomMsg, setIsSendingCustomMsg] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push(`/${locale}/auth/login`);
      return;
    }
    Promise.all([
      bffGet<Venue[]>('/api/v1/admin/venues'),
      bffGet<User[]>('/api/v1/admin/users'),
    ])
      .then(([v, u]) => { setVenues(v); setUsers(u); })
      .catch((e) => setError(e instanceof ApiError ? e.message : t('genericError')))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, isReady, locale, router, t, user?.role]);

  async function toggleApproval(venue: Venue) {
    try {
      const updated = await bffPatch<Venue>(`/api/v1/admin/venues/${venue._id}/approve`, {is_approved: !venue.is_approved});
      setVenues((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    } catch (e) { setError(e instanceof ApiError ? e.message : t('genericError')); }
  }

  async function deactivateUser(userId: string) {
    try {
      const updated = await bffPatch<User>(`/api/v1/admin/users/${userId}/deactivate`, {});
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (e) { setError(e instanceof ApiError ? e.message : t('genericError')); }
  }

  async function impersonateUser(userId: string, userName: string) {
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({userId}),
      });
      if (!res.ok) { const body = (await res.json()) as {error?: string}; throw new Error(body.error ?? 'Impersonation failed.'); }
      localStorage.setItem('khalas_impersonating', userName);
      window.location.href = `/${locale}`;
    } catch (e) { setError(e instanceof Error ? e.message : t('genericError')); }
  }

  async function updateRole(userId: string, newRole: string, providerType?: string | null) {
    try {
      const updated = await bffPatch<User>(`/api/v1/admin/users/${userId}/role`, {role: newRole, provider_type: providerType || null});
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (e) { setError(e instanceof ApiError ? e.message : t('genericError')); }
  }

  async function handleSeedTestUsers() {
    if (!confirm('Are you sure? This will wipe all other users and venues, and seed the test accounts.')) return;
    try {
      const res = await fetch('/api/proxy/admin/seed-test-users', {method: 'POST'});
      if (!res.ok) { const body = (await res.json()) as {error?: string}; throw new Error(body.error ?? 'Failed to seed users.'); }
      alert('Database seeded successfully! Please refresh the page.');
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : t('genericError')); }
  }

  async function handleSendWelcome() {
    if (!welcomeModalUser) return;
    setIsSendingWelcome(true);
    try {
      const res = await fetch(`/api/proxy/admin/users/${welcomeModalUser._id}/send-welcome`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({language: welcomeLang, password: welcomePassword || null}),
      });
      if (!res.ok) { const body = (await res.json()) as {error?: string}; throw new Error(body.error ?? 'Failed.'); }
      alert(isAr ? 'تم إرسال رسالة الترحيب بنجاح' : 'Welcome message sent successfully');
      setWelcomeModalUser(null); setWelcomePassword('');
    } catch (e) { setError(e instanceof Error ? e.message : t('genericError')); }
    finally { setIsSendingWelcome(false); }
  }

  async function handleSendCustomMsg() {
    if (!customMsgModalUser || !customMsgText.trim()) return;
    setIsSendingCustomMsg(true);
    try {
      const res = await fetch(`/api/proxy/admin/users/${customMsgModalUser._id}/send-custom-message`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: customMsgText}),
      });
      if (!res.ok) { const body = (await res.json()) as {error?: string}; throw new Error(body.error ?? 'Failed.'); }
      alert(isAr ? 'تم إرسال الرسالة بنجاح' : 'Message sent successfully');
      setCustomMsgModalUser(null); setCustomMsgText('');
    } catch (e) { setError(e instanceof Error ? e.message : t('genericError')); }
    finally { setIsSendingCustomMsg(false); }
  }

  const pendingCount = venues.filter((v) => !v.is_approved).length;
  const activeVenues = venues.filter(v => v.is_approved).length;
  const totalPatients = users.filter(u => u.role === 'patient').length;
  const totalProviders = users.filter(u => u.role === 'provider').length;

  const filteredVenues = venues.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.name_ar?.toLowerCase().includes(q) || v.name_en?.toLowerCase().includes(q) || v.phone?.includes(q) || v.governorate?.toLowerCase().includes(q);
  });

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name_ar?.toLowerCase().includes(q) || u.name_en?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q);
  });

  const isGlobalAdmin = user?.email?.includes('m.zeyada91') || user?.phone === '+201000000000';

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (!isReady || isLoading) {
    return (
      <SiteShell>
        <div className="space-y-6">
          {/* Hero Skeleton */}
          <div className="h-40 rounded-3xl skeleton" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
          </div>
          <div className="h-64 rounded-3xl skeleton" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div data-theme="admin" className="space-y-6">

        {/* ── Hero Banner ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{background: 'var(--grad-admin)'}}>
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-in-up">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                <Shield className="h-3 w-3" />
                {isAr ? 'لوحة التحكم الرئيسية' : 'Admin Command Center'}
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                {isAr ? `مرحباً، ${user?.name_ar || 'المدير'}` : `Welcome back, ${user?.name_en || 'Admin'}`}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {isAr ? 'إدارة كاملة للمنصة — عيادات، مستخدمون، موافقات.' : 'Full platform control — clinics, users, approvals.'}
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="animate-scale-in flex items-center gap-3 rounded-2xl bg-amber-400/20 border border-amber-300/30 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20">
                  <AlertCircle className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-200">{pendingCount}</p>
                  <p className="text-xs text-amber-300/80">{isAr ? 'بانتظار موافقتك' : 'pending approval'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {icon: Building2, label_en: 'Total Clinics', label_ar: 'إجمالي العيادات', value: venues.length, color: 'bg-blue-50 text-blue-600', delay: 'stagger-1'},
            {icon: CheckCircle2, label_en: 'Active Clinics', label_ar: 'عيادات نشطة', value: activeVenues, color: 'bg-emerald-50 text-emerald-600', delay: 'stagger-2'},
            {icon: Users, label_en: 'Total Users', label_ar: 'المستخدمون', value: users.length, color: 'bg-violet-50 text-violet-600', delay: 'stagger-3'},
            {icon: Activity, label_en: 'Providers', label_ar: 'مقدمي الخدمة', value: totalProviders, color: 'bg-amber-50 text-amber-600', delay: 'stagger-4'},
          ].map(card => (
            <div key={card.label_en} className={`card-lift animate-fade-in-up ${card.delay} rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm`}>
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <p className="stat-num text-3xl font-black text-[var(--text-1)]">{card.value}</p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--text-3)]">
                {isAr ? card.label_ar : card.label_en}
              </p>
            </div>
          ))}
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tab Pills */}
          <div className="flex items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-1">
            {(['venues', 'users'] as Tab[]).map(id => (
              <button
                key={id}
                onClick={() => { setTab(id); setSearchQuery(''); }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  tab === id ? 'bg-white shadow-sm text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}
              >
                {id === 'venues' ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {isAr ? (id === 'venues' ? 'العيادات' : 'المستخدمون') : (id === 'venues' ? 'Clinics' : 'Users')}
                {id === 'venues' && pendingCount > 0 && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-white">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-60 sm:flex-none">
              <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-[var(--text-3)] rtl:left-auto rtl:right-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث...' : 'Search...'}
                className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-brand rtl:pl-4 rtl:pr-9"
              />
            </div>
            {isGlobalAdmin && (
              <button
                onClick={handleSeedTestUsers}
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-xs font-bold text-[var(--text-2)] transition hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
              >
                <Zap className="inline h-3.5 w-3.5 mb-0.5 me-1" />
                {isAr ? 'تهيئة تجريبية' : 'Seed DB'}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
            <XCircle className="inline h-4 w-4 mb-0.5 me-1" />{error}
          </div>
        )}

        {/* ── Venues Tab ─────────────────────────────────────────────────── */}
        {tab === 'venues' && (
          <div className="space-y-3">
            {filteredVenues.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] py-20 text-center">
                <Building2 className="mb-4 h-12 w-12 text-[var(--text-3)]/30" />
                <p className="font-bold text-[var(--text-3)]">{isAr ? 'لا توجد عيادات' : 'No clinics found'}</p>
              </div>
            ) : filteredVenues.map((venue, i) => (
              <div
                key={venue._id}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)} card-lift group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm ${
                  !venue.is_approved ? 'border-amber-200' : 'border-[var(--border)]'
                }`}
              >
                {/* Status stripe */}
                <div className={`absolute inset-y-0 start-0 w-1 rounded-s-2xl ${venue.is_approved ? 'bg-emerald-400' : 'bg-amber-400'}`} />

                <div className="flex flex-col gap-4 ps-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${venue.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {venue.is_approved ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق' : 'Pending')}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 uppercase">{venue.category}</span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">{venue.subscription_status}</span>
                    </div>
                    <h3 className="truncate text-base font-bold text-[var(--text-1)]">{isAr ? venue.name_ar : venue.name_en}</h3>
                    <p className="text-sm text-[var(--text-3)]">{venue.governorate}</p>
                  </div>
                  <button
                    onClick={() => void toggleApproval(venue)}
                    className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                      venue.is_approved
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {venue.is_approved ? (isAr ? 'إلغاء الموافقة' : 'Revoke') : (isAr ? 'موافقة' : 'Approve')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Users Tab ──────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="mb-4 h-12 w-12 text-[var(--text-3)]/30" />
                <p className="font-bold text-[var(--text-3)]">{isAr ? 'لا يوجد مستخدمون' : 'No users found'}</p>
              </div>
            ) : filteredUsers.map((u, i) => {
              const chip = ROLE_CHIP[u.role];
              return (
                <div
                  key={u._id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-[var(--surface-0)] ${
                    i < filteredUsers.length - 1 ? 'border-b border-[var(--border)]' : ''
                  } ${!u.is_active ? 'opacity-50' : ''}`}
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${
                      u.role === 'admin' ? 'bg-violet-600' : u.role === 'salesman' ? 'bg-indigo-600' : u.role === 'provider' ? 'bg-emerald-600' : 'bg-sky-500'
                    }`}>
                      {(isAr ? u.name_ar : u.name_en).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-[var(--text-1)]">{isAr ? u.name_ar : u.name_en}</p>
                        {chip && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${chip.color}`}>
                            {isAr ? chip.label_ar : chip.label_en}
                            {u.role === 'provider' && u.provider_type && ` · ${u.provider_type}`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-3)]" dir="ltr">{u.phone} {u.email && `· ${u.email}`}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 ps-13 sm:ps-0">
                    {/* Role change */}
                    <select
                      value={u.role === 'provider' ? `provider:${u.provider_type || 'clinic'}` : u.role}
                      onChange={e => { const [r, pt] = e.target.value.split(':'); void updateRole(u._id, r, pt); }}
                      disabled={!u.is_active}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-xs font-semibold outline-none transition hover:border-brand focus:border-brand"
                    >
                      <option value="patient">{isAr ? 'مريض' : 'Patient'}</option>
                      <option value="provider:doctor">{isAr ? 'طبيب' : 'Doctor'}</option>
                      <option value="provider:clinic">{isAr ? 'عيادة' : 'Clinic'}</option>
                      <option value="salesman">{isAr ? 'مبيعات' : 'Salesman'}</option>
                      <option value="admin">{isAr ? 'مدير' : 'Admin'}</option>
                    </select>

                    {u.is_active && u.role !== 'admin' && (
                      <button onClick={() => void impersonateUser(u._id, u.name_en)}
                        className="rounded-lg bg-[var(--surface-0)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-brand hover:text-white hover:border-brand">
                        {isAr ? 'دخول كـ' : 'Login As'}
                      </button>
                    )}
                    {isGlobalAdmin && u.is_active && (u.role === 'salesman' || u.role === 'provider') && (
                      <button onClick={() => setWelcomeModalUser(u)}
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white">
                        <Send className="inline h-3 w-3 mb-0.5 me-1" />{isAr ? 'ترحيب' : 'Welcome'}
                      </button>
                    )}
                    {isGlobalAdmin && u.is_active && (
                      <button onClick={() => setCustomMsgModalUser(u)}
                        className="rounded-lg bg-[var(--surface-0)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--text-1)] hover:text-white hover:border-[var(--text-1)]">
                        <MessageSquare className="inline h-3 w-3 mb-0.5 me-1" />{isAr ? 'رسالة' : 'Message'}
                      </button>
                    )}
                    {u.is_active && (
                      <button onClick={() => void deactivateUser(u._id)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white">
                        {isAr ? 'تعطيل' : 'Disable'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Welcome Modal ──────────────────────────────────────────────── */}
        {welcomeModalUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md animate-scale-in rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100">
                  <Send className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-1)]">{isAr ? 'رسالة ترحيب' : 'Send Welcome'}</h3>
                  <p className="text-xs text-[var(--text-3)]">{isAr ? welcomeModalUser.name_ar : welcomeModalUser.name_en}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-1">
                  {(['ar', 'en'] as const).map(l => (
                    <button key={l} onClick={() => setWelcomeLang(l)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${welcomeLang === l ? 'bg-white shadow-sm text-[var(--text-1)]' : 'text-[var(--text-3)]'}`}>
                      {l === 'ar' ? 'العربية' : 'English'}
                    </button>
                  ))}
                </div>
                <input type="text" value={welcomePassword} onChange={e => setWelcomePassword(e.target.value)}
                  placeholder={isAr ? 'كلمة مرور مؤقتة (اختياري)' : 'Temp password (optional)'}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-4 py-3 text-sm outline-none transition focus:border-brand" />
              </div>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setWelcomeModalUser(null)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--surface-0)] transition">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleSendWelcome} disabled={isSendingWelcome}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                  {isSendingWelcome ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : (isAr ? 'إرسال' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Custom Message Modal ────────────────────────────────────────── */}
        {customMsgModalUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md animate-scale-in rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100">
                  <MessageSquare className="h-5 w-5 text-zinc-700" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-1)]">{isAr ? 'رسالة مخصصة' : 'Custom Message'}</h3>
                  <p className="text-xs text-[var(--text-3)]">{isAr ? customMsgModalUser.name_ar : customMsgModalUser.name_en}</p>
                </div>
              </div>
              <textarea value={customMsgText} onChange={e => setCustomMsgText(e.target.value)} rows={5}
                placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-4 py-3 text-sm outline-none transition focus:border-brand resize-none" />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setCustomMsgModalUser(null)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--surface-0)] transition">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleSendCustomMsg} disabled={isSendingCustomMsg || !customMsgText.trim()}
                  className="flex-1 rounded-xl bg-[var(--text-1)] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
                  {isSendingCustomMsg ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : (isAr ? 'إرسال' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
