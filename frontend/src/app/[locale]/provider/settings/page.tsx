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
type UserProfile = {
  _id: string; phone: string; name_ar: string; name_en: string; role: string;
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

type Tab = 'venues' | 'staff' | 'services' | 'team';

export default function ProviderSettingsPage() {
  const t = useTranslations('ProviderDashboardPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const [tab, setTab] = useState<Tab>('venues');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
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

  const [invitePhone, setInvitePhone] = useState('');
  const [isInviting, setIsInviting] = useState(false);

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

  async function loadTeam(venueId: string) {
    setSelectedVenueId(venueId);
    setTeam([]);
    try {
      const allTeam = await bffGet<UserProfile[]>(`/api/v1/provider/venues/${venueId}/team` as `/api/v1/provider/venues/${string}/team`);
      setTeam(allTeam);
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

  async function handleInviteTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVenueId) return;
    setIsInviting(true);
    setError(null);
    try {
      const updatedTeam = await bffPost<UserProfile[]>(
        `/api/v1/provider/venues/${selectedVenueId}/team`,
        { phone: invitePhone }
      );
      setTeam(updatedTeam);
      setInvitePhone('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('genericError'));
    } finally {
      setIsInviting(false);
    }
  }

  if (!isReady || isLoading) {
    return (
      <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
          <p className="text-sm font-medium text-[var(--text-3)]">{t('loading')}</p>
        </div>
      </SiteShell>
    );
  }

  const tabs: {id: Tab; label: string; short: string}[] = [
    {id: 'venues',   label: t('tabVenues'),   short: locale === 'ar' ? 'العيادات' : 'Venues'},
    {id: 'staff',    label: t('tabStaff'),    short: locale === 'ar' ? 'الأطباء' : 'Doctors'},
    {id: 'services', label: t('tabServices'), short: locale === 'ar' ? 'الخدمات' : 'Services'},
    {id: 'team',     label: t('tabTeam'),     short: locale === 'ar' ? 'الفريق' : 'Team'},
  ];

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      {error ? (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Tabs — short labels on mobile, full labels on sm+ */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-sm backdrop-blur-md scrollbar-hide">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`whitespace-nowrap rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-fast sm:px-5 ${
              tab === tabItem.id
                ? 'bg-teal/10 text-teal'
                : 'text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <span className="sm:hidden">{tabItem.short}</span>
            <span className="hidden sm:inline">{tabItem.label}</span>
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
              className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-float backdrop-blur-md"
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
            <p className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-3)] shadow-sm backdrop-blur-md">
              {t('noVenues')}
            </p>
          ) : (
            venues.map((venue) => (
              <article key={venue._id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-float hover:border-[var(--border-accent)]">
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setTab('staff'); void loadStaff(venue._id); }}
                      className="shrink-0 rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
                    >
                      {t('tabStaff')} →
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab('team'); void loadTeam(venue._id); }}
                      className="shrink-0 rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
                    >
                      Team →
                    </button>
                  </div>
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
            <p className="text-sm text-[var(--text-3)]">{t('selectVenueForStaff')}</p>
          ) : staff.length === 0 ? (
            <p className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-3)] shadow-sm backdrop-blur-md">
              {t('noStaff')}
            </p>
          ) : (
            staff.map((member) => (
              <article key={member._id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-float hover:border-[var(--border-accent)]">
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
            <p className="text-sm text-[var(--text-3)]">{t('selectStaffForServices')}</p>
          ) : services.length === 0 ? (
            <p className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-3)] shadow-sm backdrop-blur-md">
              {t('noServices')}
            </p>
          ) : (
            services.map((service) => (
              <article key={service._id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-float hover:border-[var(--border-accent)]">
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

      {/* Team tab */}
      {tab === 'team' && (
        <div className="space-y-4">
          {!selectedVenueId ? (
            <p className="text-sm text-[var(--text-3)]">{t('selectVenueForTeam')}</p>
          ) : (
            <>
              <form onSubmit={handleInviteTeam} className="flex gap-2">
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder={t('invitePhonePlaceholder')}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-left outline-none focus:border-teal"
                />
                <button
                  type="submit"
                  disabled={isInviting}
                  className="rounded-2xl bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal/90 disabled:opacity-50 transition-all"
                >
                  {t('inviteButton')}
                </button>
              </form>

              {team.length === 0 ? (
                <p className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-3)] shadow-sm backdrop-blur-md">
                  {t('noTeam')}
                </p>
              ) : (
                team.map((userObj) => (
                  <article key={userObj._id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-float hover:border-[var(--border-accent)]">
                    <h2 className="font-semibold text-ink">{locale === 'ar' ? userObj.name_ar : userObj.name_en}</h2>
                    <p className="mt-1 text-sm text-ink/60" dir="ltr" style={{textAlign: locale === 'ar' ? 'right' : 'left'}}>
                      {userObj.phone}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {userObj.role}
                    </span>
                  </article>
                ))
              )}
            </>
          )}
        </div>
      )}
    </SiteShell>
  );
}
