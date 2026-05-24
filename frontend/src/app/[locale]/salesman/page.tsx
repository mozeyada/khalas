'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';
import {Building2, Plus, Sparkles} from 'lucide-react';

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('01') && cleaned.length === 11) return '+2' + cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 10) return '+20' + cleaned;
  if (cleaned.startsWith('201') && cleaned.length === 12) return '+' + cleaned;
  return cleaned;
}

export default function SalesmanPage() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();

  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isReady) {
    return (
      <SiteShell title="Salesman Dashboard" subtitle="Loading...">
        <p className="text-sm text-ink/60">Loading...</p>
      </SiteShell>
    );
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

      const data = await res.json();
      // Redirect to the created venue page so the salesman can show the doctor!
      router.push(`/${locale}/${data.data.slug}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteShell title="Sales Workspace" subtitle="Setup instant demos for clinics in 3 minutes.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        
        {/* Left Column: Form */}
        <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">New Clinic Demo</h2>
              <p className="text-sm text-ink/60">Instantly generate a working clinic page.</p>
            </div>
          </div>

          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Clinic Name (Public)</span>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                placeholder="e.g., Dr. Ahmed Cardiology"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Specialty</span>
                <input
                  list="specialties-list"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                  placeholder="e.g., Cardiology"
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
                <span className="mb-2 block text-sm font-medium text-ink">Governorate</span>
                <input
                  list="governorates-list"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                  placeholder="e.g., Cairo"
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
              <span className="mb-2 block text-sm font-medium text-ink">Doctor's WhatsApp / Phone</span>
              <input
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-ink outline-none transition-all focus:border-teal focus:bg-white"
                placeholder="+2010..."
              />
              <p className="mt-1 text-xs text-ink/50">Used to send the live notification during demo.</p>
            </label>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Building Clinic...' : 'Generate Live Demo'}
            </button>
          </form>
        </section>

        {/* Right Column: Instructions */}
        <section className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8">
          <h3 className="mb-4 text-lg font-semibold text-emerald-300">How to do the perfect demo</h3>
          <ul className="space-y-4 text-sm leading-relaxed text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">1</span>
              <div>
                <strong className="block text-white">Fill out this quick form.</strong>
                <p>Takes 15 seconds. Use the doctor's real phone number.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">2</span>
              <div>
                <strong className="block text-white">Hand them the device.</strong>
                <p>The app will instantly redirect to their new clinic page. Let them click around.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">3</span>
              <div>
                <strong className="block text-white">Book a test appointment.</strong>
                <p>Book a slot right in front of them so they can see the QR code system.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">4</span>
              <div>
                <strong className="block text-white">Show the notification.</strong>
                <p>Their phone will buzz with a WhatsApp confirmation message instantly.</p>
              </div>
            </li>
          </ul>
        </section>

      </div>
    </SiteShell>
  );
}
