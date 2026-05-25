'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';

type Venue = {
  _id: string; name_ar: string; name_en: string; category: string;
  governorate: string; is_approved: boolean; subscription_status: string;
  owner_id: string;
};
type User = {
  _id: string; name_ar: string; name_en: string; phone: string;
  role: string; provider_type?: string | null; is_active: boolean; created_at: string;
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

  if (!isReady || isLoading) {
    return (
      <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
        <p className="text-sm text-ink/60">{t('loading')}</p>
      </SiteShell>
    );
  }

  const tabs: {id: Tab; label: string}[] = [
    {id: 'venues', label: t('tabVenues')},
    {id: 'users', label: t('tabUsers')},
  ];

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      {error ? (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-2xl border border-black/10 bg-white/60 p-1.5">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
              tab === tabItem.id ? 'bg-teal text-white shadow-sm' : 'text-ink hover:bg-black/5'
            }`}
          >
            {tabItem.label}
            {tabItem.id === 'venues' && (
              <span className="ms-2 inline-block rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                {venues.filter((v) => !v.is_approved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Venues */}
      {tab === 'venues' && (
        <div className="space-y-4">
          {venues.length === 0 ? (
            <p className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 text-sm text-ink/60 shadow-soft">
              {t('noVenues')}
            </p>
          ) : (
            venues.map((venue) => (
              <article key={venue._id} className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${venue.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {venue.is_approved ? t('approved') : t('pending')}
                      </span>
                      <span className="text-xs text-ink/50">{venue.category}</span>
                    </div>
                    <h2 className="mt-1 font-semibold text-ink">
                      {locale === 'ar' ? venue.name_ar : venue.name_en}
                    </h2>
                    <p className="text-sm text-ink/60">{venue.governorate}</p>
                    <p className="mt-1 text-xs text-ink/50">Subscription: {venue.subscription_status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleApproval(venue)}
                      className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                        venue.is_approved
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
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
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 text-sm text-ink/60 shadow-soft">
              {t('noUsers')}
            </p>
          ) : (
            users.map((u) => (
              <article key={u._id} className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-ink">{locale === 'ar' ? u.name_ar : u.name_en}</h2>
                    <p className="text-sm text-ink/60">{u.phone}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={u.role === 'provider' ? `provider:${u.provider_type || 'clinic'}` : u.role}
                        onChange={(e) => {
                          const [r, pt] = e.target.value.split(':');
                          void updateRole(u._id, r, pt);
                        }}
                        disabled={!u.is_active}
                        className="rounded-lg border border-black/10 bg-white/50 px-2 py-1 text-xs text-ink outline-none transition hover:bg-white"
                      >
                        <option value="patient">{locale === 'ar' ? 'عميل' : 'Patient'}</option>
                        <option value="provider:doctor">{locale === 'ar' ? 'طبيب (مقدم)' : 'Doctor (Individual)'}</option>
                        <option value="provider:clinic">{locale === 'ar' ? 'عيادة / مركز طبي' : 'Clinic / Dr. Office'}</option>
                        <option value="salesman">{locale === 'ar' ? 'مبيعات' : 'Salesman'}</option>
                        <option value="admin">{locale === 'ar' ? 'مدير' : 'Admin'}</option>
                      </select>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                  </div>
                  {u.is_active ? (
                    <button
                      type="button"
                      onClick={() => void deactivateUser(u._id)}
                      className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                    >
                      {t('deactivate')}
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </SiteShell>
  );
}
