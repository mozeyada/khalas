'use client';

import {useEffect, useState, useCallback} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';
import {
  Building2, Plus, Sparkles, TrendingUp, Users, Calendar,
  CheckCircle2, Clock, ArrowRight, ExternalLink, Copy, Phone,
  QrCode, BarChart3, Zap, AlertCircle, ChevronRight
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+201') && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith('01') && cleaned.length === 11) return '+2' + cleaned;
  return cleaned;
}

function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  const cleaned = westernised.replace(/[^\d+]/g, '');
  return (cleaned.startsWith('+201') && cleaned.length === 13) ||
    (cleaned.startsWith('01') && cleaned.length === 11);
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// ─── component ───────────────────────────────────────────────────────────────

export default function SalesmanPage() {
  const nav = useTranslations('Navigation');
  const t = useTranslations('SalesmanPage');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isReady, user } = useSession();

  const [myClinics, setMyClinics] = useState<any[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // form state
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClinics = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/salesman/clinics');
      if (res.ok) {
        const body = await res.json();
        setMyClinics(body.data || []);
      }
    } catch (e) {
      console.error('Failed to load clinics', e);
    } finally {
      setIsLoadingClinics(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || (user?.role !== 'salesman' && user?.role !== 'admin')) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    void loadClinics();
  }, [isAuthenticated, isReady, locale, router, user?.role, loadClinics]);

  async function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const slug = generateSlug(clinicName) + '-' + Math.floor(1000 + Math.random() * 9000);
    const normalizedPhone = normalizePhone(doctorPhone);

    try {
      const res = await fetch('/api/proxy/salesman/demo-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_name: clinicName, slug, specialty, governorate, doctor_phone: normalizedPhone }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to setup demo clinic');
      }
      await loadClinics();
      setClinicName(''); setSpecialty(''); setGovernorate(''); setDoctorPhone('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyLink(slug: string) {
    const link = `${window.location.origin}/${locale}/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  if (!isReady || isLoadingClinics) {
    return (
      <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-1)] border-t-transparent" />
        </div>
      </SiteShell>
    );
  }

  if (!isAuthenticated || (user?.role !== 'salesman' && user?.role !== 'admin')) {
    return null;
  }

  const hour = new Date().getHours();
  const greeting = locale === 'ar'
    ? (hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور')
    : (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

  const approvedClinics = myClinics.filter(c => c.is_approved);
  const pendingClinics = myClinics.filter(c => !c.is_approved);

  return (
    <SiteShell title={locale === 'ar' ? 'لوحة التحكم' : 'Command Center'}>
      {/* ── Greeting ────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">
          {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </p>
        <h1 className="mt-1 text-2xl font-black text-[var(--text-1)]">
          {greeting}{user?.name_ar || user?.name_en ? `, ${locale === 'ar' ? user.name_ar : user.name_en}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">
          {locale === 'ar' ? 'هنا ملخص شامل لعملك ومحفظة العيادات التي تديرها.' : 'Here is a full overview of your work and the clinic portfolio you manage.'}
        </p>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: <Building2 className="h-5 w-5" />,
            value: myClinics.length,
            label: locale === 'ar' ? 'إجمالي العيادات' : 'Total Clinics',
            accent: 'bg-black text-white',
            iconBg: 'bg-white/20',
          },
          {
            icon: <CheckCircle2 className="h-5 w-5" />,
            value: approvedClinics.length,
            label: locale === 'ar' ? 'معتمدة' : 'Approved',
            accent: 'bg-emerald-500 text-white',
            iconBg: 'bg-white/20',
          },
          {
            icon: <Clock className="h-5 w-5" />,
            value: pendingClinics.length,
            label: locale === 'ar' ? 'في الانتظار' : 'Pending',
            accent: 'bg-amber-400 text-white',
            iconBg: 'bg-white/20',
          },
          {
            icon: <Zap className="h-5 w-5" />,
            value: myClinics.reduce((sum, c) => sum + (c.appointment_count || 0), 0),
            label: locale === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings',
            accent: 'bg-[var(--surface-1)] text-[var(--text-1)] border border-[var(--border)]',
            iconBg: 'bg-[var(--text-1)]/10',
          },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl p-4 shadow-sm ${stat.accent}`}>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Primary Action ──────────────────────────────────────── */}
      <button
        onClick={() => setShowForm(f => !f)}
        className="mb-6 flex w-full items-center justify-between rounded-[1.75rem] bg-[var(--text-1)] px-6 py-4 text-white shadow-float transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-start">
            <p className="text-base font-bold">{locale === 'ar' ? 'إضافة عيادة جديدة' : 'Onboard New Clinic'}</p>
            <p className="text-xs text-white/60">{locale === 'ar' ? 'إنشاء لينك تجريبي فوري وشرح للعميل' : 'Create an instant demo link and present to client'}</p>
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 transition-transform ${showForm ? 'rotate-90' : ''}`} />
      </button>

      {/* ── Onboarding Form ─────────────────────────────────────── */}
      {showForm && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-200 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--text-3)]" />
            <h2 className="text-sm font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'بيانات العيادة الجديدة' : 'New Clinic Details'}
            </h2>
          </div>

          <form onSubmit={handleDemoSubmit} className="space-y-3">
            <input
              value={clinicName}
              onChange={e => setClinicName(e.target.value)}
              required
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-[var(--text-1)] focus:ring-2 focus:ring-[var(--text-1)]/10"
              placeholder={locale === 'ar' ? 'اسم العيادة' : 'Clinic name (e.g. Nour Medical Center)'}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                list="specialties-list"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-[var(--text-1)]"
                placeholder={locale === 'ar' ? 'التخصص' : 'Specialty'}
              />
              <datalist id="specialties-list">
                {['Cardiology','Dentistry','Dermatology','Orthopedics','Pediatrics','Internal Medicine','Ophthalmology','Neurology','Psychiatry','General Surgery'].map(s => <option key={s} value={s} />)}
              </datalist>

              <input
                list="governorates-list"
                value={governorate}
                onChange={e => setGovernorate(e.target.value)}
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-[var(--text-1)]"
                placeholder={locale === 'ar' ? 'المحافظة' : 'Governorate'}
              />
              <datalist id="governorates-list">
                {['Cairo','Giza','Alexandria','Dakahlia','Beheira','Fayoum','Gharbia','Ismailia','Menofia','Minya','Qalyubia','Suez','Aswan','Assiut','Beni Suef','Port Said','Damietta','Sharkia','Luxor','Qena','Sohag'].map(g => <option key={g} value={g} />)}
              </datalist>
            </div>

            <div>
              <input
                dir="ltr"
                value={doctorPhone}
                onChange={e => setDoctorPhone(e.target.value)}
                required
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-left outline-none transition focus:ring-2 ${
                  doctorPhone.length > 0
                    ? isValidPhone(doctorPhone)
                      ? 'border-emerald-400 bg-emerald-50/50 focus:ring-emerald-500/10'
                      : 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/10'
                    : 'border-[var(--border)] bg-white focus:border-[var(--text-1)] focus:ring-[var(--text-1)]/10'
                }`}
                placeholder={locale === 'ar' ? 'رقم الطبيب (01xxxxxxxxx)' : "Doctor's phone (01xxxxxxxxx)"}
              />
              <p className="mt-1 px-1 text-[11px] text-[var(--text-3)]">
                {locale === 'ar' ? 'سيتلقى الطبيب رسالة واتساب لإعداد حسابه.' : 'The doctor will receive a WhatsApp message to set up their account.'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full border border-[var(--border)] bg-white py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)]"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-[var(--text-1)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? (locale === 'ar' ? 'جاري الإنشاء…' : 'Creating…') : (locale === 'ar' ? 'إنشاء العيادة' : 'Create Clinic')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Portfolio ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-1)]">
            {locale === 'ar' ? 'محفظة العيادات' : 'Clinic Portfolio'}
          </h2>
          {myClinics.length > 0 && (
            <span className="rounded-full bg-[var(--surface-1)] border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--text-2)]">
              {myClinics.length}
            </span>
          )}
        </div>

        {isLoadingClinics ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-1)] border-t-transparent" />
          </div>
        ) : myClinics.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[var(--border)] py-16 px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-1)]">
              <Building2 className="h-8 w-8 text-[var(--text-3)]" />
            </div>
            <p className="text-base font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'لم تُضف أي عيادة بعد' : 'No clinics yet'}
            </p>
            <p className="mt-1 text-sm text-[var(--text-3)]">
              {locale === 'ar' ? 'أضف أول عيادة باستخدام الزر أعلاه' : 'Add your first clinic using the button above'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myClinics.map((clinic: any) => (
              <article
                key={clinic._id}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float"
              >
                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${clinic.is_approved ? 'bg-black text-white' : 'bg-amber-100 text-amber-700'}`}>
                    <Building2 className="h-6 w-6" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-[var(--text-1)]">
                      {locale === 'ar' ? clinic.name_ar : clinic.name_en}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        clinic.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {clinic.is_approved ? (locale === 'ar' ? 'معتمدة' : 'Approved') : (locale === 'ar' ? 'انتظار' : 'Pending')}
                      </span>
                      <span className="text-xs text-[var(--text-3)]">{clinic.category}</span>
                      <span className="text-[var(--text-3)]">·</span>
                      <span className="text-xs text-[var(--text-3)]">{clinic.governorate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(clinic.slug)}
                      title={locale === 'ar' ? 'نسخ الرابط' : 'Copy link'}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--surface-0)] text-[var(--text-3)] hover:text-[var(--text-1)]"
                    >
                      {copiedSlug === clinic.slug
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Copy className="h-4 w-4" />
                      }
                    </button>
                    <button
                      onClick={() => router.push(`/${locale}/${clinic.slug}`)}
                      title={locale === 'ar' ? 'عرض العيادة' : 'View clinic'}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--surface-0)] text-[var(--text-3)] hover:text-[var(--text-1)]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick link preview */}
                {clinic.slug && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--surface-0)] px-3 py-2">
                    <span className="text-[11px] font-mono text-[var(--text-3)] truncate" dir="ltr">
                      khalas.app/{locale}/{clinic.slug}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ── How It Works ────────────────────────────────────────── */}
      {myClinics.length === 0 && (
        <div className="mt-6 rounded-[2rem] bg-[var(--text-1)] p-6 text-white">
          <h3 className="mb-4 text-sm font-bold text-white/60 uppercase tracking-widest">
            {locale === 'ar' ? 'كيف يعمل خلاص؟' : 'How Khalas Works'}
          </h3>
          <div className="space-y-4">
            {[
              { n: '01', title: locale === 'ar' ? 'أنشئ صفحة العيادة' : 'Create the clinic page', body: locale === 'ar' ? 'أدخل بيانات العيادة واحصل على رابط تجريبي فوري.' : 'Enter clinic details and get an instant shareable demo link.' },
              { n: '02', title: locale === 'ar' ? 'أظهر للطبيب النتيجة' : 'Show the doctor live', body: locale === 'ar' ? 'أعرض الصفحة الحية على الطبيب مباشرة من هاتفك.' : 'Present the live booking page directly from your phone.' },
              { n: '03', title: locale === 'ar' ? 'الطبيب يوافق ويُفعّل' : 'Doctor activates', body: locale === 'ar' ? 'يتلقى الطبيب رسالة واتساب ويُكمل إعداد حسابه.' : 'The doctor gets a WhatsApp message and completes setup.' },
              { n: '04', title: locale === 'ar' ? 'المرضى يحجزون' : 'Patients start booking', body: locale === 'ar' ? 'العيادة تظهر في البحث ويبدأ المرضى بالحجز مباشرة.' : 'The clinic appears in search and patients book instantly.' },
            ].map(step => (
              <div key={step.n} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-black text-white/80">{step.n}</span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SiteShell>
  );
}
