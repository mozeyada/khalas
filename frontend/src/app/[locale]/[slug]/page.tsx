import {getTranslations} from 'next-intl/server';

import {Link} from '@/i18n/navigation';
import {getPublicVenue, getVenueStaff} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';

type VenuePageProps = {
  params: {
    locale: string;
    slug: string;
  };
};

export default async function VenuePage({params}: VenuePageProps) {
  const [t, venue, staff] = await Promise.all([
    getTranslations({locale: params.locale, namespace: 'VenuePage'}),
    getPublicVenue(params.slug),
    getVenueStaff(params.slug)
  ]);

  return (
    <SiteShell
      title={params.locale === 'ar' ? venue.name_ar : venue.name_en}
      subtitle={params.locale === 'ar' ? venue.description_ar ?? t('emptyDescription') : venue.description_en ?? t('emptyDescription')}
    >
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/search"
          locale={params.locale}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-2)] shadow-sm backdrop-blur transition-all hover:border-[var(--border-accent)] hover:text-teal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {params.locale === 'ar' ? 'العودة للبحث' : 'Back to search'}
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{t('venueEyebrow')}</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{params.locale === 'ar' ? venue.name_ar : venue.name_en}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-3xl border border-black/10 bg-white/75 p-4">
              <p className="text-sm text-ink/60">{t('locationLabel')}</p>
              <p className="mt-2 text-sm font-medium text-ink">
                {params.locale === 'ar' ? venue.address_ar : venue.address_en}
              </p>
            </article>
            <article className="rounded-3xl border border-black/10 bg-white/75 p-4">
              <p className="text-sm text-ink/60">{t('phoneLabel')}</p>
              <p className="mt-2 text-sm font-medium text-ink">{venue.phone}</p>
            </article>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{t('staffEyebrow')}</p>
          <div className="grid gap-3">
            {staff.map((member) => (
              <Link
                key={member._id}
                href={`/${params.slug}/${member._id}`}
                locale={params.locale}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <p className="font-medium">{params.locale === 'ar' ? member.name_ar : member.name_en}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {params.locale === 'ar' ? member.specialty_ar ?? t('emptySpecialty') : member.specialty_en ?? t('emptySpecialty')}
                </p>
              </Link>
            ))}
            {staff.length === 0 ? <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{t('emptyStaff')}</p> : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
