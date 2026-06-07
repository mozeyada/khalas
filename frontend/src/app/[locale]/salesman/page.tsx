'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';
import {Building2, Plus, Sparkles} from 'lucide-react';

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

export default function SalesmanPage() {
  const nav = useTranslations('Navigation');
  const t = useTranslations('SalesmanPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();

  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for My Created Clinics
  const [myClinics, setMyClinics] = useState<any[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);

  // Fetch clinics when ready
  const loadClinics = async () => {
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
  };

  if (!isReady) {
    return (
      <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      </SiteShell>
    );
  }

  // Load clinics if salesman
  if (isReady && isAuthenticated && (user?.role === 'salesman' || user?.role === 'admin') && isLoadingClinics) {
    void loadClinics();
  }

  if (!isAuthenticated || (user?.role !== 'salesman' && user?.role !== 'admin')) {
    router.push(`/${locale}/auth/login`);
    return null;
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  async function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const slug = generateSlug(clinicName) + '-' + Math.floor(1000 + Math.random() * 9000);

    const normalizedPhone = normalizePhone(doctorPhone);

    try {
      const res = await fetch(`/api/proxy/salesman/demo-clinic`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          clinic_name: clinicName,
          slug,
          specialty,
          governorate,
          doctor_phone: normalizedPhone
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as {error?: string};
        throw new Error(body.error ?? 'Failed to setup demo clinic');
      }

      // Reload clinics
      await loadClinics();
      
      // Reset form
      setClinicName('');
      setSpecialty('');
      setGovernorate('');
      setDoctorPhone('');
      
      // Optionally redirect
      // const data = await res.json();
      // router.push(`/${locale}/${data.data.slug}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        
        {/* Left Column: Form */}
        <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8 h-fit">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">{t('formTitle')}</h2>
              <p className="text-sm text-ink/60">{t('formSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">{t('fields.clinicName')}</span>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                placeholder={t('placeholders.clinicName')}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">{t('fields.specialty')}</span>
                <input
                  list="specialties-list"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                  placeholder={t('placeholders.specialty')}
                />
                <datalist id="specialties-list">
                  <option value="Cardiology" />
                  <option value="Dentistry" />
                  <option value="Dermatology" />
                  <option value="Orthopedics" />
                  <option value="Pediatrics" />
                  <option value="Internal Medicine" />
                  <option value="Ophthalmology" />
                  <option value="Neurology" />
                  <option value="Psychiatry" />
                  <option value="General Surgery" />
                </datalist>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">{t('fields.governorate')}</span>
                <input
                  list="governorates-list"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                  placeholder={t('placeholders.governorate')}
                />
                <datalist id="governorates-list">
                  <option value="Cairo" />
                  <option value="Giza" />
                  <option value="Alexandria" />
                  <option value="Dakahlia" />
                  <option value="Red Sea" />
                  <option value="Beheira" />
                  <option value="Fayoum" />
                  <option value="Gharbia" />
                  <option value="Ismailia" />
                  <option value="Menofia" />
                  <option value="Minya" />
                  <option value="Qalyubia" />
                  <option value="New Valley" />
                  <option value="Suez" />
                  <option value="Aswan" />
                  <option value="Assiut" />
                  <option value="Beni Suef" />
                  <option value="Port Said" />
                  <option value="Damietta" />
                  <option value="Sharkia" />
                  <option value="South Sinai" />
                  <option value="Kafr El Sheikh" />
                  <option value="Matrouh" />
                  <option value="Luxor" />
                  <option value="Qena" />
                  <option value="North Sinai" />
                  <option value="Sohag" />
                </datalist>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">{t('fields.doctorPhone')}</span>
              <input
                dir="ltr"
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                required
                className={`w-full rounded-2xl border bg-white/50 px-4 py-3 text-sm text-left outline-none transition-all focus:bg-white
                  ${doctorPhone.length > 0
                    ? isValidPhone(doctorPhone)
                      ? 'border-emerald-500 text-emerald-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                      : 'border-rose-500 text-rose-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-white/40 text-ink focus:border-teal focus:ring-4 focus:ring-teal/10'
                  }`}
                placeholder={t('placeholders.doctorPhone')}
              />
              <p className="mt-1 text-xs text-ink/50">{t('fields.doctorPhoneHelper')}</p>
            </label>

            {error && (
               <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? t('actions.loading') : t('actions.submit')}
            </button>
          </form>
        </section>

        {/* Right Column: List of created clinics */}
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/70 bg-[var(--surface-1)] p-6 shadow-soft sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'العيادات التي أنشأتها' : 'My Created Clinics'}
            </h3>
            
            {isLoadingClinics ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
              </div>
            ) : myClinics.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.06] bg-white py-10 px-4 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.03]">
                  <Building2 className="h-6 w-6 text-black/20" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-1)]">
                  {locale === 'ar' ? 'لم تنشئ أي عيادات بعد' : 'No clinics created yet'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {myClinics.map((clinic: any) => (
                  <article key={clinic._id} className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:border-teal/20">
                    <div>
                      <h4 className="font-semibold text-ink">{locale === 'ar' ? clinic.name_ar : clinic.name_en}</h4>
                      <p className="text-xs text-ink/60">{clinic.category} · {clinic.governorate}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          clinic.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {clinic.is_approved ? 'Approved' : 'Pending'}
                        </span>
                        <span className="text-xs font-mono text-ink/50" dir="ltr">{clinic.phone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/${clinic.slug}`)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.03] text-teal hover:bg-teal hover:text-white transition"
                      title={locale === 'ar' ? 'عرض العيادة' : 'View Clinic'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Instructions moved below */}
          <section className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8">
            <h3 className="mb-4 text-sm font-semibold text-emerald-300">{t('instructionsTitle')}</h3>
            <ul className="space-y-3 text-xs leading-relaxed text-slate-300">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white">1</span>
                <div>
                  <strong className="block text-white">{t('steps.step1Title')}</strong>
                  <p>{t('steps.step1Body')}</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white">2</span>
                <div>
                  <strong className="block text-white">{t('steps.step2Title')}</strong>
                  <p>{t('steps.step2Body')}</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white">3</span>
                <div>
                  <strong className="block text-white">{t('steps.step3Title')}</strong>
                  <p>{t('steps.step3Body')}</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white">4</span>
                <div>
                  <strong className="block text-white">{t('steps.step4Title')}</strong>
                  <p>{t('steps.step4Body')}</p>
                </div>
              </li>
            </ul>
          </section>
        </div>

      </div>
    </SiteShell>
  );
}
