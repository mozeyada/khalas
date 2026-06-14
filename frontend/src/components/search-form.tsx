'use client';

import {FormEvent, useState, useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Search, MapPin, Stethoscope} from 'lucide-react';
import {GOVERNORATES, SPECIALTIES} from '@/lib/constants';

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

  function triggerSearch(newQuery: string, newGov: string, newCat: string) {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newGov) params.set('governorate', newGov);
    if (newCat) params.set('category', newCat);

    startTransition(() => {
      router.push(`/${locale}/search?${params.toString()}`);
    });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    triggerSearch(query, governorate, category);
  }

  function handleGovChange(val: string) {
    setGovernorate(val);
    triggerSearch(query, val, category);
  }

  function handleCatChange(val: string) {
    setCategory(val);
    triggerSearch(query, governorate, val);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-100 bg-white p-4 shadow-sm mb-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 rtl:left-auto rtl:right-0 rtl:pr-4">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث عن اسم طبيب، عيادة...' : 'Search for a doctor, clinic...'}
            className="w-full rounded-xl bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none border-none transition-all placeholder:font-medium placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-brand/20 rtl:pl-4 rtl:pr-12"
          />
        </div>

        <div className="hidden h-10 w-px bg-slate-200 lg:block mx-3" />

        <div className="grid grid-cols-2 gap-3 mt-3 lg:mt-0 lg:flex lg:w-[450px] lg:shrink-0 lg:gap-3">
          {/* Governorate Select */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 rtl:left-auto rtl:right-0 rtl:pr-3">
              <MapPin className="h-4 w-4 text-brand" />
            </div>
            <select
              id="search-governorate"
              value={governorate}
              onChange={(e) => handleGovChange(e.target.value)}
              className="w-full appearance-none rounded-xl bg-slate-50 py-3 pl-9 pr-8 text-sm font-bold text-slate-700 outline-none border-none transition-all focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer rtl:pl-8 rtl:pr-9"
            >
              <option value="">{locale === 'ar' ? 'كل المحافظات' : 'All Governorates'}</option>
              {GOVERNORATES.map((g) => (
                <option key={g.en} value={g.en}>{locale === 'ar' ? g.ar : g.en}</option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 rtl:right-auto rtl:left-0 rtl:pl-3">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Specialty Select */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 rtl:left-auto rtl:right-0 rtl:pr-3">
              <Stethoscope className="h-4 w-4 text-brand" />
            </div>
            <select
              id="search-specialty"
              value={category}
              onChange={(e) => handleCatChange(e.target.value)}
              className="w-full appearance-none rounded-xl bg-slate-50 py-3 pl-9 pr-8 text-sm font-bold text-slate-700 outline-none border-none transition-all focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer rtl:pl-8 rtl:pr-9"
            >
              <option value="">{locale === 'ar' ? 'كل التخصصات' : 'All Specialties'}</option>
              {SPECIALTIES.map((s) => (
                <option key={s.en} value={s.en}>{locale === 'ar' ? s.ar : s.en}</option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 rtl:right-auto rtl:left-0 rtl:pl-3">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 lg:mt-0 lg:w-auto lg:shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 lg:px-8 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          {isPending ? t('loading') : t('searchButton')}
        </button>
      </div>
    </form>
  );
}
