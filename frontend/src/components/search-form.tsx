'use client';

import {FormEvent, useState, useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Search, MapPin, Stethoscope} from 'lucide-react';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية',
  'البحيرة', 'المنيا', 'الغربية', 'المنوفية', 'القليوبية',
  'الفيوم', 'بني سويف', 'سوهاج', 'أسيوط', 'الأقصر', 'أسوان',
  'كفر الشيخ', 'دمياط', 'الإسماعيلية', 'بورسعيد', 'السويس',
  'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'مطروح', 'الوادي الجديد',
];

const CATEGORIES = ['clinic', 'dental', 'beauty', 'fitness', 'physiotherapy', 'legal'];

// Category colour map for chips
const CATEGORY_COLORS: Record<string, string> = {
  clinic:          'bg-zinc-50 text-ink border-zinc-200 hover:bg-zinc-100',
  dental:          'bg-zinc-50 text-blue-700 border-zinc-200 hover:bg-blue-50',
  beauty:          'bg-zinc-50 text-rose-600 border-zinc-200 hover:bg-rose-50',
  fitness:         'bg-zinc-50 text-amber-700 border-zinc-200 hover:bg-amber-50',
  physiotherapy:   'bg-zinc-50 text-violet-700 border-zinc-200 hover:bg-violet-50',
  legal:           'bg-zinc-50 text-slate-700 border-zinc-200 hover:bg-slate-100',
};

const CATEGORY_COLORS_ACTIVE: Record<string, string> = {
  clinic:          'bg-brand text-white border-brand',
  dental:          'bg-blue-600 text-white border-blue-600',
  beauty:          'bg-rose-600 text-white border-rose-600',
  fitness:         'bg-amber-600 text-white border-amber-600',
  physiotherapy:   'bg-violet-600 text-white border-violet-600',
  legal:           'bg-slate-700 text-white border-slate-700',
};

type SearchFormProps = {
  initialQuery?: string;
  initialGovernorate?: string;
  initialCategory?: string;
};

export function SearchForm({
  initialQuery = '',
  initialGovernorate = '',
  initialCategory = '',
}: SearchFormProps) {
  const t = useTranslations('SearchPage');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [governorate, setGovernorate] = useState(initialGovernorate);
  const [category, setCategory] = useState(initialCategory);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (governorate) params.set('governorate', governorate);
    if (category) params.set('category', category);

    startTransition(() => {
      router.push(`/${locale}/search?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mb-8 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
    >
      {/* Main search row */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4">
        <Search className="h-5 w-5 shrink-0 text-zinc-400" />
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all duration-fast hover:bg-brand-hover active:scale-95 disabled:opacity-60"
        >
          {isPending ? t('loading') : t('searchButton')}
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
        {/* Governorate select */}
        <label className="flex shrink-0 items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-400" />
          <select
            id="search-governorate"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="border-0 bg-transparent text-sm font-semibold text-zinc-600 outline-none focus:text-ink cursor-pointer"
          >
            <option value="">{t('allGovernorates')}</option>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{locale === 'ar' ? g : (t as any)(`governorates.${g}`)}</option>
            ))}
          </select>
        </label>

        <div className="h-px bg-zinc-200 sm:h-6 sm:w-px" />

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Stethoscope className="h-4 w-4 shrink-0 text-zinc-400" />
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-all duration-fast ${
              category === ''
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-ink'
            }`}
          >
            {t('allCategories')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c === category ? '' : c)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-all duration-fast ${
                category === c
                  ? CATEGORY_COLORS_ACTIVE[c]
                  : CATEGORY_COLORS[c]
              }`}
            >
              {(t as any)(`categories.${c}`)}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
