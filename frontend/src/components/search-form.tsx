'use client';

import {FormEvent, useState, useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية',
  'البحيرة', 'المنيا', 'الغربية', 'المنوفية', 'القليوبية',
  'الفيوم', 'بني سويف', 'سوهاج', 'أسيوط', 'الأقصر', 'أسوان',
  'كفر الشيخ', 'دمياط', 'الإسماعيلية', 'بورسعيد', 'السويس',
  'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'مطروح', 'الوادي الجديد',
];

const CATEGORIES = ['clinic', 'beauty', 'fitness', 'physiotherapy', 'legal', 'dental'];

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
            <option key={g} value={g}>{(t as any)(`governorates.${g}`)}</option>
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
            <option key={c} value={c}>{(t as any)(`categories.${c}`)}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-teal px-6 py-3 text-sm font-medium text-white transition hover:bg-teal/90 disabled:opacity-60 minimum-w-[120px]"
        >
          {isPending ? t('loading') : t('searchButton')}
        </button>
      </div>
    </form>
  );
}
