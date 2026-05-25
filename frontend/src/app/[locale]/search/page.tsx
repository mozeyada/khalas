import {getTranslations} from 'next-intl/server';
import {SiteShell} from '@/components/site-shell';
import {SearchForm} from '@/components/search-form';
import {apiBaseUrl} from '@/lib/api';
import {Link} from '@/i18n/navigation';

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
        <div className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-8 text-center shadow-soft">
          <p className="text-sm text-ink/60">{t('noResults')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((venue) => (
            <article
              key={venue._id}
              className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur"
            >
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                  {t(`categories.${venue.category}`)}
                </p>
                <h2 className="text-lg font-semibold text-ink">
                  {locale === 'ar' ? venue.name_ar : venue.name_en}
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  {locale === 'ar' ? venue.governorate : venue.area} ·{' '}
                  {locale === 'ar' ? venue.address_ar : venue.address_en}
                </p>
                {(locale === 'ar' ? venue.description_ar : venue.description_en) ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/70">
                    {locale === 'ar' ? venue.description_ar : venue.description_en}
                  </p>
                ) : null}
              </div>
              <Link
                href={`/${venue.slug}`}
                locale={locale}
                className="mt-5 block w-full rounded-2xl bg-teal px-4 py-2.5 text-sm font-medium text-white text-center transition hover:bg-teal/90"
              >
                {t('viewVenue')}
              </Link>
            </article>
          ))}
        </div>
      )}
    </SiteShell>
  );
}
