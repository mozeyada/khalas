import {getTranslations} from 'next-intl/server';
import {SiteShell} from '@/components/site-shell';
import {SearchForm} from '@/components/search-form';
import {apiBaseUrl} from '@/lib/api';
import {Link} from '@/i18n/navigation';
import {MapPin} from 'lucide-react';

type VenueResult = {
  _id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  category: string;
  governorate: string;
  area: string;
  address_ar: string;
  address_en: string;
  description_ar?: string;
  description_en?: string;
};

type SearchPageProps = {
  params: {
    locale: string;
  };
  searchParams: {
    q?: string;
    governorate?: string;
    category?: string;
  };
};

// Per-category visual treatment
const CATEGORY_BADGE: Record<string, {bg: string; text: string; dot: string}> = {
  clinic:        {bg: 'bg-teal/10',        text: 'text-teal',        dot: 'bg-teal'},
  dental:        {bg: 'bg-blue-500/10',    text: 'text-blue-700',    dot: 'bg-blue-500'},
  beauty:        {bg: 'bg-rose-500/10',    text: 'text-rose-600',    dot: 'bg-rose-500'},
  fitness:       {bg: 'bg-amber-400/10',   text: 'text-amber-700',   dot: 'bg-amber-400'},
  physiotherapy: {bg: 'bg-violet-500/10',  text: 'text-violet-700',  dot: 'bg-violet-500'},
  legal:         {bg: 'bg-slate-400/10',   text: 'text-slate-700',   dot: 'bg-slate-500'},
};

const DEFAULT_BADGE = {bg: 'bg-teal/10', text: 'text-teal', dot: 'bg-teal'};

async function getSearchResults(searchParams: SearchPageProps['searchParams']): Promise<VenueResult[]> {
  const params = new URLSearchParams();
  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.governorate) params.set('governorate', searchParams.governorate);
  if (searchParams.category) params.set('category', searchParams.category);

  try {
    const res = await fetch(`${apiBaseUrl}/api/v1/search?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as {data: VenueResult[]};
    return payload.data;
  } catch {
    return [];
  }
}

export default async function SearchPage({params, searchParams}: SearchPageProps) {
  const locale = params.locale;
  const [t, results] = await Promise.all([
    getTranslations({locale, namespace: 'SearchPage'}),
    getSearchResults(searchParams),
  ]);

  const hasSearched = Object.keys(searchParams).length > 0;

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <SearchForm
        initialQuery={searchParams.q}
        initialGovernorate={searchParams.governorate}
        initialCategory={searchParams.category}
      />

      {hasSearched && results.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] px-8 py-20 text-center shadow-card backdrop-blur">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/8">
            <MapPin className="h-8 w-8 text-teal/40" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--text-1)]">{t('noResults')}</h2>
          <p className="max-w-xs text-sm text-[var(--text-3)]">
            {locale === 'ar' ? 'جرّب تغيير الفلاتر أو البحث بكلمة مختلفة' : 'Try adjusting your filters or searching with a different term'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((venue) => {
            const badge = CATEGORY_BADGE[venue.category] ?? DEFAULT_BADGE;
            const name = locale === 'ar' ? venue.name_ar : venue.name_en;
            const area = locale === 'ar' ? venue.governorate : venue.area;
            const address = locale === 'ar' ? venue.address_ar : venue.address_en;
            const description = locale === 'ar' ? venue.description_ar : venue.description_en;

            return (
              <article
                key={venue._id}
                className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card backdrop-blur transition-all duration-base hover:-translate-y-1 hover:border-[var(--border-accent)] hover:shadow-float"
              >
                <div>
                  {/* Category badge */}
                  <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badge.bg} ${badge.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                    {(t as any)(`categories.${venue.category}`)}
                  </div>

                  {/* Name */}
                  <h2 className="mb-1 text-lg font-bold text-[var(--text-1)] leading-snug">
                    {name}
                  </h2>

                  {/* Location */}
                  <div className="mb-3 flex items-center gap-1.5 text-sm text-[var(--text-3)]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{area} · {address}</span>
                  </div>

                  {/* Description */}
                  {description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-2)]">
                      {description}
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/${venue.slug}`}
                  locale={locale}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-3 text-sm font-bold text-white transition-all duration-fast hover:bg-teal/90 hover:shadow-teal-sm group-hover:shadow-teal-sm"
                >
                  {t('viewVenue')}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-fast group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </SiteShell>
  );
}
