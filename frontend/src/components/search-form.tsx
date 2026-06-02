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
  clinic:          'bg-teal/10 text-teal border-teal/20 hover:bg-teal/20',
  dental:          'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20',
  beauty:          'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20',
  fitness:         'bg-amber-400/10 text-amber-700 border-amber-400/20 hover:bg-amber-400/20',
  physiotherapy:   'bg-violet-500/10 text-violet-700 border-violet-500/20 hover:bg-violet-500/20',
  legal:           'bg-slate-400/10 text-slate-700 border-slate-400/20 hover:bg-slate-400/20',
};

const CATEGORY_COLORS_ACTIVE: Record<string, string> = {
  clinic:          'bg-teal text-white border-teal shadow-teal-sm',
  dental:          'bg-blue-600 text-white border-blue-600',
  beauty:          'bg-rose-500 text-white border-rose-500',
  fitness:         'bg-amber-500 text-white border-amber-500',
  physiotherapy:   'bg-violet-600 text-white border-violet-600',
  legal:           'bg-slate-600 text-white border-slate-600',
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
      className="mb-8 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] shadow-float backdrop-blur-md"
    >
      {/* Main search row */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
        <Search className="h-5 w-5 shrink-0 text-[var(--text-3)]" />
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="min-w-0 flex-1 bg-transparent text-base text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-white transition-all duration-fast hover:scale-105 hover:bg-teal/90 hover:shadow-teal-sm disabled:opacity-60"
        >
          {isPending ? t('loading') : t('searchButton')}
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-5">
        {/* Governorate select */}
        <label className="flex shrink-0 items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--text-3)]" />
          <select
            id="search-governorate"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="border-0 bg-transparent text-sm font-medium text-[var(--text-2)] outline-none focus:text-[var(--text-1)] cursor-pointer"
          >
            <option value="">{t('allGovernorates')}</option>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{locale === 'ar' ? g : (t as any)(`governorates.${g}`)}</option>
            ))}
          </select>
        </label>

        <div className="h-px bg-[var(--border)] sm:h-6 sm:w-px" />

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Stethoscope className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-fast ${
              category === ''
                ? 'bg-[var(--text-1)] text-white border-[var(--text-1)]'
                : 'bg-transparent text-[var(--text-2)] border-[var(--border-strong)] hover:bg-black/5'
            }`}
          >
            {t('allCategories')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c === category ? '' : c)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-fast ${
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
