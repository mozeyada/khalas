'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';
import {Building2, Users, AlertCircle, Search} from 'lucide-react';

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

export default function AdminPage() {
  const t = useTranslations('AdminPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const [tab, setTab] = useState<Tab>('venues');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

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
      const updated = await bffPatch<Venue>(`/api/v1/admin/venues/${venue._id}/approve`, {
        is_approved: !venue.is_approved,
      });
      setVenues((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('genericError'));
    }
  }

  async function deactivateUser(userId: string) {
    try {
      const updated = await bffPatch<User>(`/api/v1/admin/users/${userId}/deactivate`, {});
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('genericError'));
    }
  }

  async function impersonateUser(userId: string, userName: string) {
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId}),
      });
      if (!res.ok) {
        const body = (await res.json()) as {error?: string};
        throw new Error(body.error ?? 'Impersonation failed.');
      }
      localStorage.setItem('khalas_impersonating', userName);
      window.location.href = `/${locale}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('genericError'));
    }
  }

  async function updateRole(userId: string, newRole: string, providerType?: string | null) {
    try {
      const updated = await bffPatch<User>(`/api/v1/admin/users/${userId}/role`, {
        role: newRole,
        provider_type: providerType || null
      });
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('genericError'));
    }
  }

  async function handleSeedTestUsers() {
    if (!confirm('Are you sure? This will wipe all other users and venues, and seed the test accounts.')) return;
    try {
      const res = await fetch('/api/proxy/admin/seed-test-users', {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json()) as {error?: string};
        throw new Error(body.error ?? 'Failed to seed users.');
      }
      alert('Database seeded successfully! Please refresh the page.');
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('genericError'));
    }
  }

  if (!isReady || isLoading) {
    return (
      <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      </SiteShell>
    );
  }

  const tabs: {id: Tab; label: string}[] = [
    {id: 'venues', label: t('tabVenues')},
    {id: 'users', label: t('tabUsers')},
  ];

  const pendingApprovalsCount = venues.filter((v) => !v.is_approved).length;

  const filteredVenues = venues.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (v.name_ar?.toLowerCase().includes(q) || v.name_en?.toLowerCase().includes(q) || v.phone?.includes(q) || v.governorate?.toLowerCase().includes(q));
  });

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name_ar?.toLowerCase().includes(q) || u.name_en?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q));
  });

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      {error && (
        <div className="mb-6 animate-in fade-in rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {/* ── Stats Strip ────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Building2 className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">{venues.length}</p>
          <p className="text-xs font-medium text-[var(--text-3)]">{locale === 'ar' ? 'إجمالي العيادات' : 'Total Clinics'}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm relative overflow-hidden">
          {pendingApprovalsCount > 0 && (
            <div className="absolute top-0 right-0 h-full w-1 bg-amber-400" />
          )}
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">
            {pendingApprovalsCount}
          </p>
          <p className="text-xs font-medium text-[var(--text-3)]">{locale === 'ar' ? 'بانتظار الموافقة' : 'Pending Approvals'}</p>
        </div>
        <div className="hidden sm:block rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <Users className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">{users.length}</p>
          <p className="text-xs font-medium text-[var(--text-3)]">{locale === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 rounded-full border border-black/[0.06] bg-white p-1.5 shadow-sm">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setTab(tabItem.id)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  tab === tabItem.id 
                    ? 'bg-teal text-white shadow-sm' 
                    : 'text-[var(--text-2)] hover:bg-black/5'
                }`}
              >
                {tabItem.label}
                {tabItem.id === 'venues' && pendingApprovalsCount > 0 && (
                  <span className="ms-2 inline-flex items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleSeedTestUsers}
            className="rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 text-sm font-semibold transition-all shadow-sm"
          >
            {locale === 'ar' ? 'تهيئة الحسابات التجريبية' : 'Seed Test Accounts'}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث بالاسم، الهاتف...' : 'Search by name, phone...'}
            className="w-full sm:w-64 rounded-full border border-black/[0.06] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/10 shadow-sm"
          />
        </div>
      </div>

      {/* Venues */}
      {tab === 'venues' && (
        <div className="space-y-3">
          {filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.06] bg-white py-12 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.03]">
                <Building2 className="h-8 w-8 text-black/20" />
              </div>
              <p className="text-base font-semibold text-[var(--text-1)]">{locale === 'ar' ? 'لا توجد عيادات' : 'No clinics found'}</p>
            </div>
          ) : (
            filteredVenues.map((venue) => (
              <article key={venue._id} className="relative overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white p-5 shadow-sm transition hover:border-teal/20">
                {!venue.is_approved && (
                  <div className="absolute top-0 right-0 h-full w-1 bg-amber-400" />
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${venue.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {venue.is_approved ? t('approved') : t('pending')}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">{venue.category}</span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-bold text-[var(--text-1)]">
                      {locale === 'ar' ? venue.name_ar : venue.name_en}
                    </h2>
                    <p className="text-sm text-[var(--text-2)]">{venue.governorate}</p>
                    <p className="mt-1 text-xs text-[var(--text-3)]">Subscription: {venue.subscription_status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleApproval(venue)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                        venue.is_approved
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {venue.is_approved ? t('unapprove') : t('approve')}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.06] bg-white py-12 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.03]">
                <Users className="h-8 w-8 text-black/20" />
              </div>
              <p className="text-base font-semibold text-[var(--text-1)]">{locale === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <article key={u._id} className="relative overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white p-5 shadow-sm transition hover:border-teal/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-1)]">{locale === 'ar' ? u.name_ar : u.name_en}</h2>
                    <p className="mt-0.5 text-sm text-[var(--text-2)] flex items-center gap-1.5 flex-wrap" dir="ltr">
                      <span>{u.phone}</span>
                      {u.email && (
                        <>
                          <span className="text-black/10">•</span>
                          <span className="text-[var(--text-3)]">{u.email}</span>
                        </>
                      )}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        value={u.role === 'provider' ? `provider:${u.provider_type || 'clinic'}` : u.role}
                        onChange={(e) => {
                          const [r, pt] = e.target.value.split(':');
                          void updateRole(u._id, r, pt);
                        }}
                        disabled={!u.is_active}
                        className="rounded-lg border border-black/10 bg-[var(--surface-0)] px-2 py-1 text-xs font-medium text-[var(--text-1)] outline-none transition hover:border-teal focus:border-teal"
                      >
                        <option value="patient">{locale === 'ar' ? 'عميل' : 'Patient'}</option>
                        <option value="provider:doctor">{locale === 'ar' ? 'طبيب (مقدم)' : 'Doctor (Individual)'}</option>
                        <option value="provider:clinic">{locale === 'ar' ? 'عيادة / مركز طبي' : 'Clinic / Dr. Office'}</option>
                        <option value="salesman">{locale === 'ar' ? 'مبيعات' : 'Salesman'}</option>
                        <option value="admin">{locale === 'ar' ? 'مدير' : 'Admin'}</option>
                      </select>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {u.is_active && u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => void impersonateUser(u._id, u.name_en)}
                        className="rounded-full bg-teal/10 text-teal hover:bg-teal hover:text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        {locale === 'ar' ? 'دخول كـ' : 'Login As'}
                      </button>
                    )}
                    {u.is_active ? (
                      <button
                        type="button"
                        onClick={() => void deactivateUser(u._id)}
                        className="rounded-full bg-rose-50 text-rose-600 px-5 py-2.5 text-sm font-semibold hover:bg-rose-500 hover:text-white transition"
                      >
                        {t('deactivate')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </SiteShell>
  );
}
