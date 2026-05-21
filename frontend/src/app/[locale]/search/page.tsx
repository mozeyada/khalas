'use client';

import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {ApiError} from '@/lib/api';
import {SiteShell} from '@/components/site-shell';

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

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية',
  'البحيرة', 'المنيا', 'الغربية', 'المنوفية', 'القليوبية',
  'الفيوم', 'بني سويف', 'سوهاج', 'أسيوط', 'الأقصر', 'أسوان',
  'كفر الشيخ', 'دمياط', 'الإسماعيلية', 'بورسعيد', 'السويس',
  'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'مطروح', 'الوادي الجديد',
];

const CATEGORIES = ['clinic', 'beauty', 'fitness', 'physiotherapy', 'legal', 'dental'];

export default function SearchPage() {
  const t = useTranslations('SearchPage');
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<VenueResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSearched(false);

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (governorate) params.set('governorate', governorate);
    if (category) params.set('category', category);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/v1/search?${params}`, {cache: 'no-store'});
      if (!res.ok) throw new ApiError('Search failed.', res.status);
      const data = (await res.json()) as {data: VenueResult[]};
      setResults(data.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  }

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="mb-8 rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto]">
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
          />
          <select
            id="search-governorate"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
          >
            <option value="">{t('allGovernorates')}</option>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            id="search-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
          >
            <option value="">{t('allCategories')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-2xl bg-teal px-6 py-3 text-sm font-medium text-white transition hover:bg-teal/90 disabled:opacity-60"
          >
            {isLoading ? t('loading') : t('searchButton')}
          </button>
        </div>
      </form>

      {/* Error */}
      {error ? (
        <p className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Results */}
      {searched && results.length === 0 ? (
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
                  {venue.category}
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
              <button
                type="button"
                onClick={() => router.push(`/${locale}/${venue.slug}`)}
                className="mt-5 w-full rounded-2xl bg-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal/90"
              >
                {t('viewVenue')}
              </button>
            </article>
          ))}
        </div>
      )}
    </SiteShell>
  );
}
