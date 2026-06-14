'use client';

import {useEffect, useState, useCallback, useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';
import {
  Building2, Plus, Sparkles, TrendingUp, Users, Calendar,
  CheckCircle2, Clock, ArrowRight, ExternalLink, Copy, Phone,
  BarChart3, Zap, AlertCircle, ChevronRight, LayoutDashboard,
  Presentation, MoreVertical, Send, ShieldCheck, Check, User
} from 'lucide-react';

import {GOVERNORATES, SPECIALTIES} from '@/lib/constants';

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (cleaned.startsWith('+201') && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith('01') && cleaned.length === 11) return '+2' + cleaned;
  return cleaned;
}

function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) return true;
  return /^\+\d{10,15}$/.test(cleaned);
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// ─── hook for outside click ──────────────────────────────────────────────────
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, handler]);
}

// ─── component ───────────────────────────────────────────────────────────────

type Tab = 'overview' | 'demo' | 'portfolio';

export default function SalesmanPage() {
  const t = useTranslations('SalesmanPage');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isReady, user } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [myClinics, setMyClinics] = useState<any[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  
  // Demo Hub State
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newlyCreatedClinic, setNewlyCreatedClinic] = useState<any | null>(null);

  // Portfolio State
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  // Welcome Modal State
  const [welcomeModalClinic, setWelcomeModalClinic] = useState<any>(null);
  const [welcomeLang, setWelcomeLang] = useState<'ar' | 'en'>('ar');
  const [welcomePassword, setWelcomePassword] = useState('');
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);

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
      const newClinic = (await res.json()).data;
      setNewlyCreatedClinic(newClinic);
      await loadClinics();
      setClinicName(''); setSpecialty(''); setGovernorate(''); setDoctorPhone('');
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
    setActiveDropdown(null);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  async function handleSendWelcome() {
    if (!welcomeModalClinic) return;
    setIsSendingWelcome(true);
    try {
      const res = await fetch(`/api/proxy/salesman/clinics/${welcomeModalClinic._id}/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: welcomeLang, password: welcomePassword || null }),
      });
      if (!res.ok) {
        const body = (await res.json()) as {error?: string};
        throw new Error(body.error ?? 'Failed to send welcome message');
      }
      alert(locale === 'ar' ? 'تم إرسال رسالة الترحيب بنجاح' : 'Welcome message sent successfully');
      setWelcomeModalClinic(null);
      setWelcomePassword('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSendingWelcome(false);
    }
  }

  async function handleImpersonateClinic(venueId: string) {
    if (isImpersonating) return;
    setIsImpersonating(true);
    try {
      const res = await fetch(`/api/proxy/salesman/clinics/${venueId}/impersonate`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json()) as {error?: string};
        throw new Error(body.error ?? 'Failed to impersonate clinic');
      }
      const data = (await res.json()).data;
      // We need to reload to apply the new tokens. Standard impersonation pattern.
      // Easiest is to set cookies and redirect, but the proxy sets the cookies.
      window.location.href = `/${locale}/provider/appointments`;
    } catch (e: any) {
      alert(e.message);
      setIsImpersonating(false);
    }
  }

  async function handleImpersonatePatient() {
    if (isImpersonating) return;
    setIsImpersonating(true);
    try {
      const res = await fetch(`/api/proxy/salesman/impersonate-patient`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json()) as {error?: string};
        throw new Error(body.error ?? 'Failed to create patient account');
      }
      window.location.href = `/${locale}`; // Go to home page to book
    } catch (e: any) {
      alert(e.message);
      setIsImpersonating(false);
    }
  }

  if (!isReady || isLoadingClinics) {
    return (
      <SiteShell>
        <div className="space-y-4">
          <div className="h-44 rounded-3xl skeleton" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!isAuthenticated || (user?.role !== 'salesman' && user?.role !== 'admin')) return null;

  const hour = new Date().getHours();
  const greeting = locale === 'ar'
    ? (hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور')
    : (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

  const approvedClinics = myClinics.filter(c => c.is_approved);
  const pendingClinics = myClinics.filter(c => !c.is_approved);

  return (
    <SiteShell>
      <div data-theme="salesman" className="space-y-6">

      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl px-6 py-8 text-white" style={{background: 'var(--grad-salesman)'}}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-indigo-500/20" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            {locale === 'ar' ? 'مركز القيادة — خلاص' : 'Khalas Sales Command Center'}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {greeting}{user?.name_ar || user?.name_en ? `, ${locale === 'ar' ? user.name_ar : user.name_en}` : ''}
          </h1>
          <p className="mt-1 max-w-lg text-sm text-white/60">
            {locale === 'ar'
              ? 'كل عميل تضيفه هو حجز، وكل حجز هو قيمة. دير الدفة وأغلق.'
              : 'Every clinic you add is a booking engine. Every booking is value delivered. Close the deal.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={handleImpersonatePatient} disabled={isImpersonating}
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95">
              <User className="h-4 w-4" />
              {locale === 'ar' ? 'اختبر كمريض' : 'Test as Patient'}
            </button>
            <button onClick={() => setActiveTab('demo')}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-900 transition hover:scale-105 active:scale-95 shadow-lg">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              {locale === 'ar' ? 'عرض تجريبي جديد' : 'New Demo'}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {icon: Building2, v: myClinics.length, label_en: 'Total Clinics', label_ar: 'إجمالي العيادات', c: 'bg-slate-50 text-slate-700', delay: 'stagger-1'},
          {icon: CheckCircle2, v: approvedClinics.length, label_en: 'Active Partners', label_ar: 'شركاء نشطون', c: 'bg-emerald-50 text-emerald-700', delay: 'stagger-2'},
          {icon: Clock, v: pendingClinics.length, label_en: 'Pending', label_ar: 'في الانتظار', c: 'bg-amber-50 text-amber-700', delay: 'stagger-3'},
          {icon: Zap, v: myClinics.reduce((s: number, c: any) => s + (c.appointment_count || 0), 0), label_en: 'Total Bookings', label_ar: 'إجمالي الحجوزات', c: 'bg-indigo-50 text-indigo-700', delay: 'stagger-4'},
        ].map(k => (
          <div key={k.label_en} className={`card-lift animate-fade-in-up ${k.delay} rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm`}>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${k.c}`}>
              <k.icon className="h-4 w-4" />
            </div>
            <p className="stat-num text-3xl font-black text-[var(--text-1)]">{k.v}</p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--text-3)]">{locale === 'ar' ? k.label_ar : k.label_en}</p>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-1">
        {[
          { id: 'overview', icon: LayoutDashboard, label_ar: 'نظرة عامة', label_en: 'Overview' },
          { id: 'demo', icon: Presentation, label_ar: 'عرض تجريبي', label_en: 'Demo Hub' },
          { id: 'portfolio', icon: Building2, label_ar: 'محفظة العيادات', label_en: 'Portfolio' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}>
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{locale === 'ar' ? tab.label_ar : tab.label_en}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in-up space-y-4">
          {/* Quick Action Prompt */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm sm:flex-row sm:px-8">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-1)]">
                {locale === 'ar' ? 'هل أنت في اجتماع مع عميل الآن؟' : 'In a meeting with a prospect?'}
              </h3>
              <p className="text-sm text-[var(--text-3)]">
                {locale === 'ar' ? 'أنشئ عيادة تجريبية في ثوانٍ وأبهر العميل بالتجربة.' : 'Generate an instant demo clinic and wow them on the spot.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={handleImpersonatePatient}
                disabled={isImpersonating}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-bold text-[var(--text-1)] shadow-sm transition-transform hover:bg-[var(--surface-0)] active:scale-95"
              >
                <User className="h-4 w-4" />
                {locale === 'ar' ? 'تجربة حجز كمريض' : 'Test as Patient'}
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className="flex items-center gap-2 rounded-full bg-[var(--text-1)] px-6 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                {locale === 'ar' ? 'بدء تجربة جديدة' : 'Start New Demo'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── DEMO HUB TAB ────────────────────────────────────────── */}
      {activeTab === 'demo' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {!newlyCreatedClinic ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Form Side */}
              <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <div className="mb-3 inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    {locale === 'ar' ? 'منشئ العروض' : 'Demo Generator'}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-[var(--text-1)]">
                    {locale === 'ar' ? 'إعداد عيادة العميل' : 'Setup Prospect Clinic'}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-3)]">
                    {locale === 'ar' ? 'أدخل بيانات العميل الأساسية وسنقوم بتجهيز كل شيء فوراً.' : 'Enter the basic details and we will spin up a fully functional booking platform instantly.'}
                  </p>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                      {locale === 'ar' ? 'اسم العيادة' : 'Clinic Name'}
                    </label>
                    <input
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      placeholder={locale === 'ar' ? 'مثال: عيادة النور' : 'e.g. Al Nour Clinic'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                        {locale === 'ar' ? 'التخصص' : 'Specialty'}
                      </label>
                      <select
                        value={specialty}
                        onChange={e => setSpecialty(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                      >
                        <option value="" disabled>{locale === 'ar' ? 'اختر التخصص' : 'Select Specialty'}</option>
                        {SPECIALTIES.map(s => <option key={s.en} value={s.en}>{locale === 'ar' ? s.ar : s.en}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                        {locale === 'ar' ? 'المحافظة' : 'Governorate'}
                      </label>
                      <select
                        value={governorate}
                        onChange={e => setGovernorate(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                      >
                        <option value="" disabled>{locale === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                        {GOVERNORATES.map(g => <option key={g.en} value={g.en}>{locale === 'ar' ? g.ar : g.en}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                      {locale === 'ar' ? 'رقم هاتف العميل (للتسجيل)' : "Prospect's Phone Number"}
                    </label>
                    <input
                      type="tel"
                      dir="auto"
                      value={doctorPhone}
                      onChange={e => setDoctorPhone(e.target.value)}
                      required
                      className={`w-full rounded-2xl border px-4 py-3 text-sm text-left outline-none transition focus:ring-4 ${
                        doctorPhone.length > 0
                          ? isValidPhone(doctorPhone)
                            ? 'border-emerald-400 bg-emerald-50/30 focus:bg-white focus:ring-emerald-500/10'
                            : 'border-rose-400 bg-rose-50/30 focus:bg-white focus:ring-rose-500/10'
                          : 'border-[var(--border)] bg-[var(--surface-0)] focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10'
                      }`}
                      placeholder={locale === 'ar' ? '01xxxxxxxxx' : "01xxxxxxxxx"}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--text-1)] py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        {locale === 'ar' ? 'توليد العرض التجريبي' : 'Generate Demo Now'}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Instructions Side */}
              <div className="hidden flex-col justify-center rounded-[2rem] bg-[var(--surface-0)] p-8 lg:flex">
                <h3 className="mb-6 text-xl font-black tracking-tight text-[var(--text-1)]">
                  {locale === 'ar' ? 'خطوات العرض المثالي' : 'The Perfect Pitch Playbook'}
                </h3>
                <div className="space-y-6">
                  {[
                    { n: '01', title: locale === 'ar' ? 'استلم الرابط' : 'Get the Link', body: locale === 'ar' ? 'املأ النموذج وسنقوم فوراً بإنشاء صفحة حجز متكاملة للعميل.' : 'Fill out the form and we will instantly spin up a full booking page.' },
                    { n: '02', title: locale === 'ar' ? 'اعرض تجربة المريض' : 'Show the Patient Flow', body: locale === 'ar' ? 'افتح الرابط أمام العميل ودعه يرى مدى سهولة حجز موعد.' : 'Open the link in front of the prospect and let them see how easy it is to book.' },
                    { n: '03', title: locale === 'ar' ? 'أرسل رسالة الترحيب' : 'Send the Welcome Packet', body: locale === 'ar' ? 'من محفظتك، اضغط على زر الترحيب لترسل للعميل بيانات دخوله كطبيب على الواتساب.' : 'From your portfolio, hit the Welcome button to send them their doctor login via WhatsApp.' }
                  ].map(step => (
                    <div key={step.n} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <span className="text-sm font-black text-indigo-600">{step.n}</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[var(--text-1)]">{step.title}</p>
                        <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-[var(--border)] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h2 className="mb-2 text-3xl font-black text-[var(--text-1)]">
                {locale === 'ar' ? 'تم تجهيز العيادة بنجاح! 🎉' : 'Demo Clinic is Ready! 🎉'}
              </h2>
              <p className="mb-8 text-[var(--text-2)]">
                {locale === 'ar' 
                  ? `عيادة ${newlyCreatedClinic.name_ar} جاهزة الآن لاستقبال الحجوزات.` 
                  : `${newlyCreatedClinic.name_en} is now live and ready for bookings.`}
              </p>

              <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => window.open(`/${locale}/${newlyCreatedClinic.slug}`, '_blank')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--text-1)] py-4 font-bold text-white shadow-float transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <ExternalLink className="h-5 w-5" />
                  {locale === 'ar' ? 'عرض صفحة المريض' : 'Open Patient View'}
                </button>
                <button
                  onClick={() => handleCopyLink(newlyCreatedClinic.slug)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white py-4 font-bold text-[var(--text-1)] shadow-sm transition hover:bg-[var(--surface-0)]"
                >
                  {copiedSlug === newlyCreatedClinic.slug ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                  {copiedSlug === newlyCreatedClinic.slug 
                    ? (locale === 'ar' ? 'تم النسخ!' : 'Copied!') 
                    : (locale === 'ar' ? 'نسخ الرابط' : 'Copy Link')}
                </button>
              </div>

              <div className="rounded-2xl bg-[var(--surface-0)] p-4 text-sm text-[var(--text-3)] border border-[var(--border)] border-dashed">
                <p>
                  {locale === 'ar' 
                    ? 'الخطوة التالية: اذهب إلى "محفظة العيادات" لإرسال رسالة الترحيب للطبيب ليتمكن من الدخول إلى حسابه.'
                    : 'Next step: Head to your "Portfolio" tab to send the welcome message so the doctor can log into their dashboard.'}
                </p>
              </div>

              <button
                onClick={() => { setNewlyCreatedClinic(null); setActiveTab('portfolio'); }}
                className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {locale === 'ar' ? 'الذهاب لمحفظة العيادات ←' : 'Go to Portfolio ←'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PORTFOLIO TAB ───────────────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-[var(--text-1)]">
              {locale === 'ar' ? 'إدارة المحفظة' : 'Portfolio Management'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--surface-0)] border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--text-2)]">
                {myClinics.length} {locale === 'ar' ? 'عيادة' : 'Clinics'}
              </span>
            </div>
          </div>

          {myClinics.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[var(--border)] bg-white py-20 px-6 text-center shadow-sm">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-0)]">
                <Building2 className="h-10 w-10 text-[var(--text-3)]" />
              </div>
              <p className="text-xl font-black text-[var(--text-1)]">
                {locale === 'ar' ? 'المحفظة فارغة' : 'Empty Portfolio'}
              </p>
              <p className="mt-2 text-sm text-[var(--text-3)] max-w-sm">
                {locale === 'ar' ? 'ابدأ في تكوين محفظتك عن طريق إنشاء عرض تجريبي لأول عميل لك من محطة العروض.' : 'Start building your portfolio by generating your first demo clinic in the Demo Hub.'}
              </p>
              <button
                onClick={() => setActiveTab('demo')}
                className="mt-6 rounded-full bg-[var(--text-1)] px-8 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                {locale === 'ar' ? 'الذهاب لمحطة العروض' : 'Go to Demo Hub'}
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myClinics.map((clinic: any) => (
                <div key={clinic._id} className="group relative flex flex-col justify-between rounded-[1.75rem] border border-[var(--border)] bg-white p-5 shadow-sm transition hover:border-[var(--text-3)] hover:shadow-md">
                  
                  {/* Status & Menu Row */}
                  <div className="mb-4 flex items-start justify-between">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                      clinic.is_approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {clinic.is_approved ? (locale === 'ar' ? 'معتمدة' : 'Approved') : (locale === 'ar' ? 'انتظار' : 'Pending')}
                    </span>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === clinic._id ? null : clinic._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-3)] transition hover:bg-[var(--surface-0)] hover:text-[var(--text-1)]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {activeDropdown === clinic._id && (
                        <div className="absolute right-0 top-full mt-1 w-48 z-10 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-xl animate-in zoom-in-95">
                          <button
                            onClick={() => { setWelcomeModalClinic(clinic); setActiveDropdown(null); }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                          >
                            <Send className="h-4 w-4" />
                            {locale === 'ar' ? 'إرسال رسالة ترحيب' : 'Send Welcome'}
                          </button>
                          <button
                            onClick={() => handleCopyLink(clinic.slug)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)] hover:text-[var(--text-1)]"
                          >
                            <Copy className="h-4 w-4" />
                            {locale === 'ar' ? 'نسخ رابط العيادة' : 'Copy Clinic Link'}
                          </button>
                          <div className="my-1 border-t border-[var(--border)]" />
                          <button
                            onClick={() => { handleImpersonateClinic(clinic._id); setActiveDropdown(null); }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)] hover:text-[var(--text-1)]"
                          >
                            <User className="h-4 w-4" />
                            {locale === 'ar' ? 'دخول لحساب العيادة' : 'Login as Clinic'}
                          </button>
                          <button
                            onClick={() => window.open(`/${locale}/${clinic.slug}`, '_blank')}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-0)] hover:text-[var(--text-1)]"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {locale === 'ar' ? 'عرض صفحة المريض' : 'View Patient Portal'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-black leading-tight text-[var(--text-1)] line-clamp-1">
                      {locale === 'ar' ? clinic.name_ar : clinic.name_en}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-3)] line-clamp-1 flex items-center gap-1.5">
                      {clinic.category} <span className="text-[10px] opacity-50">•</span> {clinic.governorate}
                    </p>
                    <p className="mt-2 text-xs font-mono text-[var(--text-3)] flex items-center gap-1" dir="ltr">
                      <Phone className="h-3 w-3" /> {clinic.phone}
                    </p>
                  </div>
                  
                  {/* Bottom Stats */}
                  <div className="mt-5 border-t border-[var(--border)] pt-4 flex items-center justify-between">
                    <div className="text-start">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">
                        {locale === 'ar' ? 'الحجوزات' : 'Bookings'}
                      </p>
                      <p className="text-base font-black text-[var(--text-1)]">
                        {clinic.appointment_count || 0}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">
                        {locale === 'ar' ? 'الخطة' : 'Plan'}
                      </p>
                      <p className="text-base font-black text-[var(--text-1)] capitalize">
                        {clinic.subscription_status}
                      </p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Welcome Modal Overlay ─────────────────────────────────────── */}
      {welcomeModalClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-[2.5rem] bg-white p-8 shadow-2xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
              <Send className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-black text-[var(--text-1)]">
              {locale === 'ar' ? `ترحيب لـ ${welcomeModalClinic.name_ar}` : `Welcome for ${welcomeModalClinic.name_en}`}
            </h3>
            <p className="mb-6 text-sm text-[var(--text-3)]">
              {locale === 'ar' 
                ? 'سيتم إرسال رسالة واتساب للطبيب توضح تفاصيل الحساب ورابط الدخول.' 
                : 'A WhatsApp message with account details and login link will be sent to the doctor.'}
            </p>
            
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                  {locale === 'ar' ? 'لغة الرسالة' : 'Message Language'}
                </label>
                <div className="flex gap-2 rounded-2xl border border-[var(--border)] p-1.5 bg-[var(--surface-0)]">
                  <button
                    onClick={() => setWelcomeLang('ar')}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition shadow-sm ${welcomeLang === 'ar' ? 'bg-white text-[var(--text-1)]' : 'text-[var(--text-2)] hover:bg-black/5'}`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => setWelcomeLang('en')}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition shadow-sm ${welcomeLang === 'en' ? 'bg-white text-[var(--text-1)]' : 'text-[var(--text-2)] hover:bg-black/5'}`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                  {locale === 'ar' ? 'كلمة المرور المؤقتة (اختياري)' : 'Temporary Password (Optional)'}
                </label>
                <input
                  type="text"
                  value={welcomePassword}
                  onChange={(e) => setWelcomePassword(e.target.value)}
                  placeholder={locale === 'ar' ? 'إذا تركته فارغاً، سيفعل الحساب بـ OTP' : 'If left empty, OTP will be required'}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 text-sm text-[var(--text-1)] outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setWelcomeModalClinic(null)}
                className="flex-1 rounded-full border border-[var(--border)] py-4 text-sm font-bold text-[var(--text-2)] transition hover:bg-[var(--surface-0)]"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSendWelcome}
                disabled={isSendingWelcome}
                className="flex-1 rounded-full bg-[var(--text-1)] py-4 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSendingWelcome ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (locale === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SiteShell>
  );
}
