import {getTranslations} from 'next-intl/server';
import {SiteShell} from '@/components/site-shell';
import {SearchForm} from '@/components/search-form';
import {apiBaseUrl} from '@/lib/api';
import {Link} from '@/i18n/navigation';
import {MapPin, Star, ArrowRight} from 'lucide-react';

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
  clinic:        {bg: 'bg-brand-light',   text: 'text-brand',       dot: 'bg-brand'},
  dental:        {bg: 'bg-blue-50',       text: 'text-blue-700',    dot: 'bg-blue-500'},
  beauty:        {bg: 'bg-rose-50',       text: 'text-rose-600',    dot: 'bg-rose-500'},
  fitness:       {bg: 'bg-amber-50',      text: 'text-amber-700',   dot: 'bg-amber-500'},
  physiotherapy: {bg: 'bg-violet-50',     text: 'text-violet-700',  dot: 'bg-violet-500'},
  legal:         {bg: 'bg-slate-100',     text: 'text-slate-700',   dot: 'bg-slate-500'},
};

const DEFAULT_BADGE = {bg: 'bg-brand-light', text: 'text-brand', dot: 'bg-brand'};

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
      <div className="relative z-10">
        <SearchForm
          initialQuery={searchParams.q}
          initialGovernorate={searchParams.governorate}
          initialCategory={searchParams.category}
        />

        {hasSearched && results.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-zinc-200/80 bg-white/80 px-8 py-20 text-center shadow-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 shadow-inner">
              <MapPin className="h-8 w-8 text-zinc-400" />
            </div>
            <h2 className="mb-2 text-lg font-black text-zinc-900 tracking-tight">{t('noResults')}</h2>
            <p className="max-w-xs text-sm font-medium text-zinc-500">
              {locale === 'ar' ? 'جرّب تغيير الفلاتر أو البحث بكلمة مختلفة' : 'Try adjusting your filters or searching with a different term'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {results.map((venue, idx) => {
              const badge = CATEGORY_BADGE[venue.category] ?? DEFAULT_BADGE;
              const name = locale === 'ar' ? venue.name_ar : venue.name_en;
              const area = locale === 'ar' ? venue.governorate : venue.area;
              const address = locale === 'ar' ? venue.address_ar : venue.address_en;
              const description = locale === 'ar' ? venue.description_ar : venue.description_en;

              return (
                <Link
                  key={venue._id}
                  href={`/${venue.slug}`}
                  locale={locale}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-zinc-200/50 hover:border-brand/30 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                >
                  {/* Hero Image Area */}
                  <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100 group-hover:scale-105 transition-transform duration-700 ease-out" />
                    
                    {/* Subtle placeholder pattern */}
                    <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1" fill="currentColor" className="text-zinc-400" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Rating Badge floating top-right */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-black text-zinc-800 shadow-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>4.8</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    {/* Category badge */}
                    <div className={`mb-3 inline-flex self-start items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                      {(t as any)(`categories.${venue.category}`)}
                    </div>

                    {/* Name */}
                    <h2 className="mb-1 text-xl font-black text-zinc-900 tracking-tight leading-snug group-hover:text-brand transition-colors duration-300">
                      {name}
                    </h2>

                    {/* Location */}
                    <div className="mb-3 flex items-start gap-1.5 text-sm font-medium text-zinc-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="leading-relaxed">{area} · {address}</span>
                    </div>

                    {/* Description */}
                    {description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500 mb-4">
                        {description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-zinc-100">
                      {/* CTA */}
                      <div className="flex w-full items-center justify-between rounded-2xl bg-zinc-50 group-hover:bg-brand px-4 py-3 text-sm font-bold text-zinc-700 group-hover:text-white transition-all duration-300">
                        <span>{t('viewVenue')}</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
