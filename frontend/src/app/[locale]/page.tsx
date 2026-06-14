import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {SiteShell} from '@/components/site-shell';
import {Search, CheckCircle2, CalendarDays, BellRing, ChevronRight} from 'lucide-react';

type HomePageProps = {
  params: {
    locale: string;
  };
};

export default async function HomePage({params}: HomePageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'HomePage'});

  const categories = [
    {key: 'dentistry', icon: '🦷'},
    {key: 'dermatology', icon: '🧴'},
    {key: 'cardiology', icon: '❤️'},
    {key: 'eye', icon: '👁️'},
    {key: 'pediatrics', icon: '👶'},
    {key: 'orthopedics', icon: '🦴'},
    {key: 'neurology', icon: '🧠'},
    {key: 'general', icon: '🩺'},
  ];

  return (
    <main>
      <SiteShell>
        {/* ── Premium Hero Search Bar ─────────────── */}
        <section className="mt-4 sm:mt-12 bg-gradient-to-b from-brand-light/50 to-transparent pt-6 pb-2 lg:py-24 -mx-4 px-4 sm:mx-0 sm:px-0 animate-in fade-in slide-in-from-bottom-6 duration-700 lg:rounded-3xl lg:border lg:border-slate-100/50">
          <Link
            href="/search"
            locale={params.locale}
            className="group relative flex min-h-[56px] lg:min-h-[72px] lg:w-2/3 lg:mx-auto items-center gap-4 lg:gap-5 rounded-full border border-slate-200 bg-white px-4 lg:px-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-brand-border active:scale-[0.98]"
          >
            <Search className="h-6 w-6 lg:h-7 lg:w-7 text-brand shrink-0" />
            <div className="flex-1 py-2">
              <p className="text-base lg:text-lg font-bold text-slate-800 tracking-tight leading-none">{t('ctaSearch')}</p>
              <p className="text-xs lg:text-sm font-medium text-slate-500 mt-1 lg:mt-1.5 leading-none">{t('searchHint')}</p>
            </div>
          </Link>
        </section>

        {/* ── Category Pills (Tactile & Sleek) ──────────────────────────────────── */}
        <section className="mt-8 lg:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          <h2 className="mb-4 lg:mb-8 text-xs lg:text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1 lg:text-center">
            {t('categoriesTitle')}
          </h2>
          <div className="flex lg:flex-wrap lg:justify-center gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat, idx) => (
              <Link
                key={cat.key}
                href={`/search?category=${cat.key}`}
                locale={params.locale}
                style={{ animationDelay: `${150 + idx * 50}ms` }}
                className="group flex min-h-[48px] lg:min-h-[56px] shrink-0 items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-5 py-2.5 lg:px-6 text-sm lg:text-base font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-border hover:bg-brand-light hover:text-brand hover:shadow-md active:translate-y-0 cursor-pointer"
              >
                <span className="text-xl lg:text-2xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                <span>{t(`categories.${cat.key}`)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="mt-10 lg:mt-20 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both bg-slate-50 rounded-3xl p-6 lg:p-12 shadow-sm border border-slate-100">
          <h2 className="text-xs lg:text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 lg:mb-12 text-center">
            {t('ctaDemo')}
          </h2>
          
          <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-8">
            {[
              { num: 1, title: t('steps.searchTitle'), body: t('steps.searchBody') },
              { num: 2, title: t('steps.bookTitle'), body: t('steps.bookBody') },
              { num: 3, title: t('steps.confirmTitle'), body: t('steps.confirmBody') },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 items-start md:flex-col md:items-center md:text-center md:gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xl font-bold shadow-sm">
                  {step.num}
                </div>
                <div className="pt-2 md:pt-0">
                  <p className="font-bold text-slate-800 text-base lg:text-lg tracking-tight leading-none">{step.title}</p>
                  <p className="text-sm lg:text-base text-slate-500 mt-1.5 lg:mt-3 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value Props — Glassy dynamic cards ─────────────────────── */}
        <section className="mt-10 lg:mt-20 flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-8 mb-10 lg:mb-20">
          {[
            { icon: CheckCircle2, title: t('cards.verifiedTitle'), body: t('cards.verifiedBody'), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', delay: 'delay-[400ms]' },
            { icon: CalendarDays, title: t('cards.bookingTitle'), body: t('cards.bookingBody'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', delay: 'delay-[500ms]' },
            { icon: BellRing, title: t('cards.remindersTitle'), body: t('cards.remindersBody'), color: 'text-brand', bg: 'bg-brand-light', border: 'border-brand-border', delay: 'delay-[600ms]' },
          ].map((card, idx) => (
            <article key={idx} className={`group relative flex items-center md:flex-col md:text-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 lg:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both overflow-hidden ${card.delay}`}>
              <div className={`flex h-12 w-12 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full ${card.bg} ${card.color} shadow-inner transition-transform duration-300 group-hover:scale-110 relative z-10`}>
                <card.icon className="h-6 w-6 lg:h-8 lg:w-8" strokeWidth={2.5} />
              </div>
              <div className="relative z-10 pt-1 lg:pt-2">
                <h3 className="text-base lg:text-lg font-bold text-slate-800 tracking-tight leading-none">{card.title}</h3>
                <p className="text-sm lg:text-base font-medium text-slate-500 mt-1.5 lg:mt-3 leading-snug">{card.body}</p>
              </div>
              <div className={`absolute -right-4 -top-4 h-24 w-24 lg:h-40 lg:w-40 rounded-full ${card.bg} opacity-50 blur-[20px] lg:blur-[40px] transition-all duration-500 group-hover:opacity-100`} />
            </article>
          ))}
        </section>
      </SiteShell>
    </main>
  );
}
