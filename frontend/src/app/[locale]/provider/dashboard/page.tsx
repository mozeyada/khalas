'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';

type Venue = {
  _id: string; slug: string; name_ar: string; name_en: string;
  category: string; governorate: string; area: string;
  address_ar: string; address_en: string; phone: string;
  is_approved: boolean; subscription_status: string;
};
type Staff = {
  _id: string; venue_id: string; name_ar: string; name_en: string;
  title_ar?: string; title_en?: string; is_active: boolean; is_bookable: boolean;
};
type Service = {
  _id: string; staff_id: string; venue_id: string; name_ar: string; name_en: string;
  duration_minutes: number; price: number; is_active: boolean;
};

async function bffGet<T>(path: string): Promise<T> {
  const proxyPath = path.replace(/^\/api\/v1\//, '');
  const res = await fetch(`/api/proxy/${proxyPath}`, {cache: 'no-store'});
  if (!res.ok) {
    const body = (await res.json()) as {error?: string};
    throw new ApiError(body.error ?? 'Request failed.', res.status);
  }
  const data = (await res.json()) as {data: T};
  return data.data;
}

async function bffPost<T>(path: string, body: unknown): Promise<T> {
  const proxyPath = path.replace(/^\/api\/v1\//, '');
  const res = await fetch(`/api/proxy/${proxyPath}`, {
    method: 'POST', cache: 'no-store',
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

type Tab = 'venues' | 'staff' | 'services';

export default function ProviderDashboardPage() {
  const t = useTranslations('ProviderDashboardPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const [tab, setTab] = useState<Tab>('venues');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New venue form
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState({
    slug: '', name_ar: '', name_en: '', category: 'clinic',
    governorate: 'القاهرة', area: '', address_ar: '', address_en: '', phone: '',
  });

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== 'provider') {
      router.push(`/${locale}/auth/login`);
      return;
    }
    void bffGet<Venue[]>('/api/v1/provider/venues')
      .then(setVenues)
      .catch((e) => setError(e instanceof ApiError ? e.message : t('genericError')))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, isReady, locale, router, t, user?.role]);

  async function loadStaff(venueId: string) {
    setSelectedVenueId(venueId);
    setStaff([]);
    try {
      const allStaff = await bffGet<Staff[]>(`/api/v1/provider/venues/${venueId}/staff` as `/api/v1/provider/venues/${string}/staff`);
      setStaff(allStaff);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('genericError'));
    }
  }

  async function loadServices(staffId: string) {
    setSelectedStaffId(staffId);
    setServices([]);
    try {
      const svc = await bffGet<Service[]>(`/api/v1/staff/${staffId}/services` as `/api/v1/staff/${string}/services`);
      setServices(svc);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('genericError'));
    }
  }

  async function handleCreateVenue(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await bffPost<Venue>('/api/v1/provider/venues', venueForm);
      setVenues((prev) => [...prev, created]);
      setShowVenueForm(false);
      setVenueForm({slug: '', name_ar: '', name_en: '', category: 'clinic', governorate: 'القاهرة', area: '', address_ar: '', address_en: '', phone: ''});
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
    {id: 'staff', label: t('tabStaff')},
    {id: 'services', label: t('tabServices')},
  ];

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      {error ? (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-black/10 bg-white/60 p-1.5">
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
          </button>
        ))}
      </div>

      {/* Venues tab */}
      {tab === 'venues' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowVenueForm(true)}
              className="rounded-2xl bg-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-teal/90"
            >
              + {t('createVenue')}
            </button>
          </div>

          {showVenueForm && (
            <form
              onSubmit={handleCreateVenue}
              className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {key: 'slug', label: 'Slug (URL)', placeholder: 'my-clinic'},
                  {key: 'name_ar', label: 'الاسم بالعربية', placeholder: 'عيادة النور'},
                  {key: 'name_en', label: 'Name (English)', placeholder: 'Al Noor Clinic'},
                  {key: 'area', label: 'Area / منطقة', placeholder: 'Nasr City'},
                  {key: 'address_ar', label: 'العنوان بالعربية', placeholder: ''},
                  {key: 'address_en', label: 'Address (English)', placeholder: ''},
                  {key: 'phone', label: 'Phone / الهاتف', placeholder: '+201000000000'},
                ].map(({key, label, placeholder}) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
                    <input
                      required
                      value={(venueForm as Record<string, string>)[key]}
                      onChange={(e) => setVenueForm((prev) => ({...prev, [key]: e.target.value}))}
                      placeholder={placeholder}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink/70">Category</span>
                  <select
                    value={venueForm.category}
                    onChange={(e) => setVenueForm((prev) => ({...prev, category: e.target.value}))}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
                  >
                    {['clinic', 'beauty', 'fitness', 'physiotherapy', 'legal', 'dental'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="submit" className="rounded-2xl bg-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-teal/90">
                  {t('save')}
                </button>
                <button type="button" onClick={() => setShowVenueForm(false)} className="rounded-2xl border border-black/10 px-5 py-2.5 text-sm font-medium text-ink hover:bg-black/5">
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}

          {venues.length === 0 ? (
            <p className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 text-sm text-ink/60 shadow-soft">
              {t('noVenues')}
            </p>
          ) : (
            venues.map((venue) => (
              <article key={venue._id} className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{venue.category}</p>
                    <h2 className="mt-1 text-lg font-semibold text-ink">
                      {locale === 'ar' ? venue.name_ar : venue.name_en}
                    </h2>
                    <p className="text-sm text-ink/60">{venue.governorate} · {venue.area}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${venue.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {venue.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {venue.subscription_status}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTab('staff'); void loadStaff(venue._id); }}
                    className="shrink-0 rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
                  >
                    {t('tabStaff')} →
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Staff tab */}
      {tab === 'staff' && (
        <div className="space-y-4">
          {!selectedVenueId ? (
            <p className="text-sm text-ink/60">Select a venue from the Venues tab to view staff.</p>
          ) : staff.length === 0 ? (
            <p className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 text-sm text-ink/60 shadow-soft">
              {t('noStaff')}
            </p>
          ) : (
            staff.map((member) => (
              <article key={member._id} className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-ink">{locale === 'ar' ? member.name_ar : member.name_en}</h2>
                    <p className="text-sm text-ink/60">{locale === 'ar' ? member.title_ar : member.title_en}</p>
                    <div className="mt-1 flex gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${member.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${member.is_bookable ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                        {member.is_bookable ? 'Bookable' : 'Not bookable'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTab('services'); void loadServices(member._id); }}
                    className="shrink-0 rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
                  >
                    {t('tabServices')} →
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <div className="space-y-4">
          {!selectedStaffId ? (
            <p className="text-sm text-ink/60">Select a staff member from the Staff tab to view services.</p>
          ) : services.length === 0 ? (
            <p className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 text-sm text-ink/60 shadow-soft">
              {t('noServices')}
            </p>
          ) : (
            services.map((service) => (
              <article key={service._id} className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft">
                <h2 className="font-semibold text-ink">{locale === 'ar' ? service.name_ar : service.name_en}</h2>
                <p className="mt-1 text-sm text-ink/60">
                  {service.duration_minutes} min · {(service.price / 100).toFixed(2)} EGP
                </p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${service.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </span>
              </article>
            ))
          )}
        </div>
      )}
    </SiteShell>
  );
}
