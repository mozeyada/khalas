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

import {getSpecialtyName} from '@/lib/constants';

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
      <div className="relative z-10 pb-24">
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
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md hover:border-brand-border animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                >
                  {/* Hero Image Area */}
                  <div className="relative h-40 md:h-48 w-full overflow-hidden bg-slate-50">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-brand/20" />
                    </div>

                    {/* Rating Badge floating bottom-left */}
                    <div className="absolute -bottom-4 left-4 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-800 shadow-md z-10 rtl:left-4 rtl:right-auto">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>4.8</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col items-start text-right p-5 pt-6 relative z-0">
                    {/* Category badge */}
                    <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${DEFAULT_BADGE.bg} ${DEFAULT_BADGE.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${DEFAULT_BADGE.dot}`} />
                      {getSpecialtyName(venue.category, locale)}
                    </div>

                    {/* Name */}
                    <h2 className="mb-1 text-lg font-black text-slate-800 tracking-tight leading-snug group-hover:text-brand transition-colors duration-300">
                      {name}
                    </h2>

                    {/* Location */}
                    <div className="mb-3 flex items-start gap-1.5 text-sm font-medium text-slate-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span className="leading-relaxed text-right">{area} · {address}</span>
                    </div>

                    {/* Description */}
                    {description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 mb-4 text-right">
                        {description}
                      </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between w-full">
                      {/* CTA Right side in RTL (Book Now) */}
                      <span className="font-bold text-brand">{t('viewVenue')}</span>
                      {/* CTA Left side in RTL (Arrow) */}
                      <div className="bg-blue-50 rounded-full p-2 text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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
