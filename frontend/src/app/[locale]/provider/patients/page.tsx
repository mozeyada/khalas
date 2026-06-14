'use client';

import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import {useRouter} from 'next/navigation';
import {
  Users, Search, Calendar, Clock, ChevronRight,
  Loader2, UserCircle2, TrendingUp, Activity
} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {SiteShell} from '@/components/site-shell';
import {getProviderPatients, PatientRecord} from '@/lib/api';

export default function ProviderPatientsPage() {
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const isAr = locale === 'ar';

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== 'provider') {
      router.push(`/${locale}/auth/login`);
      return;
    }
    getProviderPatients()
      .then(data => { setPatients(data); setError(null); })
      .catch(() => setError(isAr ? 'تعذّر تحميل قائمة المرضى.' : 'Could not load patient registry.'))
      .finally(() => setIsLoading(false));
  }, [isReady, isAuthenticated, user, locale, router]);

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.patient_name?.toLowerCase().includes(q) ||
      p.patient_phone_masked?.includes(q)
    );
  });

  const totalPatients = patients.length;
  const withUpcoming = patients.filter(p => p.has_upcoming).length;
  const multiVisit = patients.filter(p => p.total_appointments > 1).length;

  if (!isReady || isLoading) {
    return (
      <SiteShell title={isAr ? 'سجل المرضى' : 'Patient Registry'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell title={isAr ? 'سجل المرضى' : 'Patient Registry'}>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-[var(--text-1)]">
            {isAr ? '🧑‍⚕️ سجل مرضاك' : '🧑‍⚕️ Your Patient Registry'}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            {isAr
              ? 'قائمة شاملة بكل المرضى الذين حجزوا معك — تاريخهم، وزياراتهم، وقادماتهم.'
              : 'A complete record of every patient who has booked with you — history, visits, and upcoming.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-sm text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
                <Users className="h-4 w-4 text-brand" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-1)]">{totalPatients}</p>
            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest mt-0.5">
              {isAr ? 'إجمالي المرضى' : 'Total Patients'}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-sm text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-1)]">{withUpcoming}</p>
            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest mt-0.5">
              {isAr ? 'مواعيد قادمة' : 'Upcoming'}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-sm text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-1)]">{multiVisit}</p>
            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest mt-0.5">
              {isAr ? 'زيارات متكررة' : 'Returning'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-4 my-auto h-4 w-4 text-[var(--text-3)] rtl:left-auto rtl:right-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث باسم المريض أو رقم الهاتف...' : 'Search by patient name or phone...'}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] py-3.5 pl-11 pr-4 text-sm text-[var(--text-1)] outline-none transition focus:bg-[var(--surface-0)] focus:border-brand/50 rtl:pl-4 rtl:pr-11"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Patient List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--border)] py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-1)]">
              <UserCircle2 className="h-8 w-8 text-[var(--text-3)]" />
            </div>
            <p className="font-bold text-[var(--text-1)]">
              {search
                ? (isAr ? 'لا توجد نتائج' : 'No results found')
                : (isAr ? 'لا يوجد مرضى بعد' : 'No patients yet')}
            </p>
            <p className="mt-1 text-sm text-[var(--text-3)]">
              {!search && (isAr
                ? 'حجوزاتك ستظهر هنا بمجرد أن يحجز مرضاك معك.'
                : 'Your patients will appear here once they book with you.')}
            </p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] shadow-card overflow-hidden">
            {filtered.map((patient, i) => {
              const lastVisit = patient.last_appointment_at
                ? new Intl.DateTimeFormat(locale, {dateStyle: 'medium'}).format(new Date(patient.last_appointment_at))
                : null;

              return (
                <div
                  key={patient.patient_id}
                  className={`flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-0)] ${
                    i < filtered.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-sm">
                    {patient.patient_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold text-[var(--text-1)] text-sm">
                      {patient.patient_name || (isAr ? 'مريض مجهول' : 'Unknown Patient')}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {patient.patient_phone_masked && (
                        <span className="text-xs text-[var(--text-3)] font-mono">
                          {patient.patient_phone_masked}
                        </span>
                      )}
                      {lastVisit && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                          <Clock className="h-3 w-3" />
                          {lastVisit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-end">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        patient.has_upcoming
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          patient.has_upcoming ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                        }`} />
                        {patient.total_appointments} {isAr ? 'زيارة' : 'visits'}
                      </span>
                    </div>
                    <Activity className="h-4 w-4 text-[var(--text-3)]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
