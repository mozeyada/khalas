'use client';

import {useEffect, useState, useCallback} from 'react';
import {useLocale} from 'next-intl';
import {useRouter} from 'next/navigation';
import {
  Building2, Stethoscope, Scissors, Plus, ChevronDown, ChevronRight,
  CheckCircle2, Clock, ExternalLink, Copy, Users, AlertCircle, Loader2,
} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';

// ─── Types ───────────────────────────────────────────────────────────────────

type Venue = {
  _id: string; slug: string; name_ar: string; name_en: string;
  category: string; governorate: string; area: string;
  address_ar: string; address_en: string; phone: string;
  is_approved: boolean; subscription_status: string;
};
type Staff = {
  _id: string; venue_id: string; name_ar: string; name_en: string;
  title_ar?: string; title_en?: string; specialty_ar?: string; specialty_en?: string;
  is_active: boolean; is_bookable: boolean;
};
type Service = {
  _id: string; staff_id: string; venue_id: string; name_ar: string; name_en: string;
  duration_minutes: number; price: number; is_active: boolean;
};
type UserProfile = {
  _id: string; phone: string; name_ar: string; name_en: string; role: string;
};

// ─── BFF helpers ─────────────────────────────────────────────────────────────

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

// ─── Inline form components ───────────────────────────────────────────────────

function AddStaffForm({venueId, onDone}: {venueId: string; onDone: (staff: Staff) => void}) {
  const locale = useLocale();
  const [f, setF] = useState({name_ar: '', name_en: '', title_ar: '', title_en: '', specialty_en: ''});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const staff = await bffPost<Staff>(`/api/v1/provider/venues/${venueId}/staff`, f);
      onDone(staff);
    } catch (ex: any) { setErr(ex.message); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">
        {locale === 'ar' ? 'إضافة طبيب / موظف' : 'Add Doctor / Staff'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input required value={f.name_en} onChange={e => setF(p => ({...p, name_en: e.target.value}))} placeholder={locale === 'ar' ? 'الاسم بالإنجليزية' : 'Name (EN)'} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--text-1)]" />
        <input required value={f.name_ar} onChange={e => setF(p => ({...p, name_ar: e.target.value}))} placeholder={locale === 'ar' ? 'الاسم بالعربية' : 'Name (AR)'} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--text-1)]" dir="rtl" />
        <input value={f.title_en} onChange={e => setF(p => ({...p, title_en: e.target.value}))} placeholder={locale === 'ar' ? 'اللقب (إنجليزي)' : 'Title (EN) e.g. Cardiologist'} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--text-1)]" />
        <input value={f.title_ar} onChange={e => setF(p => ({...p, title_ar: e.target.value}))} placeholder={locale === 'ar' ? 'اللقب (عربي)' : 'Title (AR)'} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--text-1)]" dir="rtl" />
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}
      <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[var(--text-1)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50">
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        {locale === 'ar' ? 'حفظ' : 'Save Doctor'}
      </button>
    </form>
  );
}

function AddServiceForm({staffId, venueId, onDone}: {staffId: string; venueId: string; onDone: (svc: Service) => void}) {
  const locale = useLocale();
  const [f, setF] = useState({name_ar: '', name_en: '', duration_minutes: 30, price: 30000});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const svc = await bffPost<Service>(`/api/v1/provider/staff/${staffId}/services`, f);
      onDone(svc);
    } catch (ex: any) { setErr(ex.message); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="mt-2 rounded-xl border border-[var(--border)] bg-white p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">
        {locale === 'ar' ? 'إضافة خدمة' : 'Add Service'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input required value={f.name_en} onChange={e => setF(p => ({...p, name_en: e.target.value}))} placeholder={locale === 'ar' ? 'الخدمة (إنجليزي)' : 'Service name (EN)'} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--text-1)]" />
        <input required value={f.name_ar} onChange={e => setF(p => ({...p, name_ar: e.target.value}))} placeholder={locale === 'ar' ? 'الخدمة (عربي)' : 'Service name (AR)'} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--text-1)]" dir="rtl" />
        <label className="block">
          <span className="text-[10px] text-[var(--text-3)]">{locale === 'ar' ? 'المدة (دقيقة)' : 'Duration (min)'}</span>
          <input type="number" min={5} max={480} value={f.duration_minutes} onChange={e => setF(p => ({...p, duration_minutes: Number(e.target.value)}))} className="w-full rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs outline-none focus:border-[var(--text-1)]" />
        </label>
        <label className="block">
          <span className="text-[10px] text-[var(--text-3)]">{locale === 'ar' ? 'السعر (قرش)' : 'Price (piasters)'}</span>
          <input type="number" min={0} value={f.price} onChange={e => setF(p => ({...p, price: Number(e.target.value)}))} className="w-full rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs outline-none focus:border-[var(--text-1)]" />
        </label>
      </div>
      {err && <p className="text-[10px] text-rose-600">{err}</p>}
      <button type="submit" disabled={loading} className="flex items-center gap-1.5 rounded-xl bg-[var(--text-1)] px-3 py-1.5 text-[10px] font-bold text-white hover:opacity-90 disabled:opacity-50">
        {loading && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
        {locale === 'ar' ? 'حفظ' : 'Save'}
      </button>
    </form>
  );
}

// ─── Staff row with its services ──────────────────────────────────────────────

function StaffRow({member, venueId, locale}: {member: Staff; venueId: string; locale: string}) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addingService, setAddingService] = useState(false);

  const loadServices = async () => {
    if (loaded) { setOpen(o => !o); return; }
    try {
      const svc = await bffGet<Service[]>(`/api/v1/staff/${member._id}/services`);
      setServices(svc);
      setLoaded(true);
      setOpen(true);
    } catch { setOpen(o => !o); }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <button
        type="button"
        onClick={loadServices}
        className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-[var(--surface-0)] transition"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-0)] text-[var(--text-2)]">
          <Stethoscope className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-1)] truncate">
            {locale === 'ar' ? member.name_ar : member.name_en}
          </p>
          <p className="text-xs text-[var(--text-3)]">
            {locale === 'ar' ? member.title_ar : member.title_en}
            {member.is_bookable && <span className="ms-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">{locale === 'ar' ? 'قابل للحجز' : 'Bookable'}</span>}
          </p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-0)] px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">
              {locale === 'ar' ? 'الخدمات' : 'Services'} ({services.length})
            </p>
            <button
              onClick={() => setAddingService(a => !a)}
              className="flex items-center gap-1 rounded-lg bg-[var(--text-1)] px-2.5 py-1 text-[10px] font-bold text-white hover:opacity-90 transition"
            >
              <Plus className="h-2.5 w-2.5" />
              {locale === 'ar' ? 'خدمة جديدة' : 'Add Service'}
            </button>
          </div>

          {addingService && (
            <AddServiceForm
              staffId={member._id}
              venueId={venueId}
              onDone={svc => { setServices(p => [...p, svc]); setAddingService(false); }}
            />
          )}

          {services.length === 0 ? (
            <p className="text-xs text-[var(--text-3)] py-2">{locale === 'ar' ? 'لا توجد خدمات بعد' : 'No services yet'}</p>
          ) : (
            <div className="space-y-1.5">
              {services.map(svc => (
                <div key={svc._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-1)]">{locale === 'ar' ? svc.name_ar : svc.name_en}</p>
                    <p className="text-[10px] text-[var(--text-3)]">{svc.duration_minutes} min · {(svc.price / 100).toFixed(0)} EGP</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${svc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {svc.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Venue card with its staff tree ──────────────────────────────────────────

function VenueCard({venue, locale}: {venue: Venue; locale: string}) {
  const [expanded, setExpanded] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStaff = async () => {
    if (!loaded) {
      try {
        const all = await bffGet<Staff[]>(`/api/v1/provider/venues/${venue._id}/staff`);
        setStaff(all); setLoaded(true);
      } catch { /* silent */ }
    }
    setExpanded(e => !e);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${locale}/${venue.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] shadow-card transition-all hover:shadow-float">
      {/* Venue header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${venue.is_approved ? 'bg-[var(--text-1)] text-white' : 'bg-amber-100 text-amber-700'}`}>
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-[var(--text-1)]">
                {locale === 'ar' ? venue.name_ar : venue.name_en}
              </h2>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${venue.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                {venue.is_approved ? (locale === 'ar' ? 'معتمد' : 'Approved') : (locale === 'ar' ? 'قيد المراجعة' : 'Pending')}
              </span>
              <span className="rounded-full bg-[var(--surface-0)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-3)]">
                {venue.subscription_status}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-[var(--text-3)]">{venue.category} · {venue.governorate}{venue.area ? ` · ${venue.area}` : ''}</p>
            <p className="mt-0.5 text-xs text-[var(--text-3)] font-mono" dir="ltr">{venue.phone}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={loadStaff}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)] hover:text-[var(--text-1)]"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            {locale === 'ar' ? 'الأطباء' : 'Doctors'}
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)]"
          >
            {copied
              ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{locale === 'ar' ? 'تم النسخ!' : 'Copied!'}</>
              : <><Copy className="h-3.5 w-3.5" />{locale === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</>
            }
          </button>
          <a
            href={`/${locale}/${venue.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {locale === 'ar' ? 'معاينة الصفحة' : 'Preview'}
          </a>
        </div>
      </div>

      {/* Expandable doctors tree */}
      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-0)] px-5 py-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">
              {locale === 'ar' ? `الأطباء (${staff.length})` : `Doctors (${staff.length})`}
            </p>
            <button
              onClick={() => setAddingStaff(a => !a)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--text-1)] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              <Plus className="h-3 w-3" />
              {locale === 'ar' ? 'طبيب جديد' : 'Add Doctor'}
            </button>
          </div>

          {addingStaff && (
            <AddStaffForm
              venueId={venue._id}
              onDone={member => { setStaff(p => [...p, member]); setAddingStaff(false); }}
            />
          )}

          {staff.length === 0 ? (
            <p className="text-sm text-[var(--text-3)] py-2">
              {locale === 'ar' ? 'لا يوجد أطباء بعد. أضف طبيباً لتمكين الحجز.' : 'No doctors yet. Add one to enable bookings.'}
            </p>
          ) : (
            staff.map(member => (
              <StaffRow key={member._id} member={member} venueId={venue._id} locale={locale} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Venue form ───────────────────────────────────────────────────────────

function AddVenueForm({onDone}: {onDone: (v: Venue) => void}) {
  const locale = useLocale();
  const [f, setF] = useState({slug: '', name_ar: '', name_en: '', category: 'clinic', governorate: 'Cairo', area: '', address_ar: '', address_en: '', phone: ''});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') +
    '-' + Math.floor(1000 + Math.random() * 9000);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const payload = {...f, slug: f.slug || autoSlug(f.name_en)};
    try {
      const venue = await bffPost<Venue>('/api/v1/provider/venues', payload);
      onDone(venue);
    } catch (ex: any) { setErr(ex.message); } finally { setLoading(false); }
  };

  return (
    <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card animate-in fade-in slide-in-from-top-2 duration-200">
      <h3 className="mb-4 text-base font-black text-[var(--text-1)]">
        {locale === 'ar' ? 'إضافة موقع جديد' : 'Add New Location'}
      </h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input required value={f.name_en} onChange={e => setF(p => ({...p, name_en: e.target.value}))} placeholder={locale === 'ar' ? 'الاسم (إنجليزي)' : 'Clinic name (EN)'} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]" />
          <input required value={f.name_ar} onChange={e => setF(p => ({...p, name_ar: e.target.value}))} placeholder={locale === 'ar' ? 'الاسم (عربي)' : 'اسم العيادة (AR)'} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]" dir="rtl" />
          <input value={f.slug} onChange={e => setF(p => ({...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')}))} placeholder={locale === 'ar' ? 'الرابط (اختياري - يُولّد تلقائياً)' : 'URL slug (auto-generated if empty)'} className="col-span-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-mono outline-none focus:border-[var(--text-1)]" dir="ltr" />
          <select value={f.category} onChange={e => setF(p => ({...p, category: e.target.value}))} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]">
            {['clinic','beauty','fitness','physiotherapy','dental','legal'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input list="govs" required value={f.governorate} onChange={e => setF(p => ({...p, governorate: e.target.value}))} placeholder="Governorate" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]" />
          <datalist id="govs">{['Cairo','Giza','Alexandria','Dakahlia','Beheira','Fayoum','Gharbia','Ismailia','Menofia','Minya','Qalyubia','Suez','Aswan'].map(g => <option key={g} value={g} />)}</datalist>
          <input value={f.area} onChange={e => setF(p => ({...p, area: e.target.value}))} placeholder={locale === 'ar' ? 'المنطقة' : 'Area / District'} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]" />
          <input required value={f.address_en} onChange={e => setF(p => ({...p, address_en: e.target.value}))} placeholder="Address (EN)" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]" />
          <input required value={f.address_ar} onChange={e => setF(p => ({...p, address_ar: e.target.value}))} placeholder="العنوان (AR)" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--text-1)]" dir="rtl" />
          <input required value={f.phone} onChange={e => setF(p => ({...p, phone: e.target.value}))} placeholder="+201XXXXXXXXX" className="col-span-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-mono outline-none focus:border-[var(--text-1)]" dir="ltr" />
        </div>
        {err && <p className="flex items-center gap-2 text-sm text-rose-600"><AlertCircle className="h-4 w-4" />{err}</p>}
        <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-full bg-[var(--text-1)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {locale === 'ar' ? 'إضافة الموقع' : 'Create Location'}
        </button>
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProviderSettingsPage() {
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingVenue, setAddingVenue] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== 'provider') {
      router.push(`/${locale}/auth/login`);
      return;
    }
    bffGet<Venue[]>('/api/v1/provider/venues')
      .then(setVenues)
      .catch(e => setError(e instanceof ApiError ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, isReady, locale, router, user?.role]);

  if (!isReady || isLoading) {
    return (
      <SiteShell title={locale === 'ar' ? 'إعدادات العيادة' : 'Clinic Settings'}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-3)]" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell title={locale === 'ar' ? 'إعدادات العيادة' : 'Clinic Settings'}>
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Header action */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">
            {locale === 'ar' ? 'إجمالي المواقع' : 'Total Locations'}
          </p>
          <p className="text-3xl font-black text-[var(--text-1)]">{venues.length}</p>
        </div>
        <button
          onClick={() => setAddingVenue(v => !v)}
          className="flex items-center gap-2 rounded-full bg-[var(--text-1)] px-5 py-3 text-sm font-bold text-white shadow-float transition hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {locale === 'ar' ? 'موقع جديد' : 'Add Location'}
        </button>
      </div>

      {/* Add venue form */}
      {addingVenue && (
        <div className="mb-6">
          <AddVenueForm onDone={v => { setVenues(p => [...p, v]); setAddingVenue(false); }} />
        </div>
      )}

      {/* Venues tree */}
      {venues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[var(--border)] py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-1)]">
            <Building2 className="h-8 w-8 text-[var(--text-3)]" />
          </div>
          <p className="text-base font-bold text-[var(--text-1)]">
            {locale === 'ar' ? 'لا توجد مواقع بعد' : 'No locations yet'}
          </p>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            {locale === 'ar' ? 'أضف موقعك الأول باستخدام الزر أعلاه' : 'Add your first location using the button above'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {venues.map(venue => (
            <VenueCard key={venue._id} venue={venue} locale={locale} />
          ))}
        </div>
      )}
    </SiteShell>
  );
}
