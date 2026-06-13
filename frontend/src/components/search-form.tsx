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
  clinic:          'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100',
  dental:          'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
  beauty:          'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100',
  fitness:         'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
  physiotherapy:   'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100',
  legal:           'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
};

const CATEGORY_COLORS_ACTIVE: Record<string, string> = {
  clinic:          'bg-brand text-white border-brand shadow-sm',
  dental:          'bg-blue-600 text-white border-blue-600 shadow-sm',
  beauty:          'bg-rose-600 text-white border-rose-600 shadow-sm',
  fitness:         'bg-amber-600 text-white border-amber-600 shadow-sm',
  physiotherapy:   'bg-violet-600 text-white border-violet-600 shadow-sm',
  legal:           'bg-slate-700 text-white border-slate-700 shadow-sm',
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
      className="mb-8 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Main search row */}
      <div className="flex items-center gap-3 border-b border-zinc-200/80 px-6 py-5">
        <Search className="h-6 w-6 shrink-0 text-brand" />
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="min-w-0 flex-1 bg-transparent text-lg font-bold text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-hover hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          {isPending ? t('loading') : t('searchButton')}
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-6 bg-white/50">
        {/* Governorate select */}
        <label className="flex shrink-0 items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 border border-zinc-200/80 transition-colors hover:bg-zinc-100">
          <MapPin className="h-4 w-4 text-brand" />
          <select
            id="search-governorate"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="border-0 bg-transparent text-sm font-bold text-zinc-700 outline-none focus:text-ink cursor-pointer"
          >
            <option value="">{t('allGovernorates')}</option>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{locale === 'ar' ? g : (t as any)(`governorates.${g}`)}</option>
            ))}
          </select>
        </label>

        <div className="hidden h-8 w-px bg-zinc-200/80 sm:block" />

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Stethoscope className="h-4 w-4 shrink-0 text-zinc-400 mr-2" />
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300 ${
              category === ''
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {t('allCategories')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c === category ? '' : c)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300 ${
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
