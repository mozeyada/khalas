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
        <section className="mt-4 sm:mt-12 bg-gradient-to-b from-brand-light/50 to-transparent pt-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Link
            href="/search"
            locale={params.locale}
            className="group relative flex min-h-[56px] items-center gap-4 rounded-full border border-slate-200/80 bg-white p-2 pr-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-brand-border active:scale-[0.98]"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 shadow-inner group-hover:bg-brand-light transition-colors duration-300">
              <Search className="h-5 w-5 text-slate-500 group-hover:text-brand transition-colors duration-300" />
            </div>
            <div className="relative flex-1">
              <p className="text-base font-bold text-slate-800 tracking-tight leading-none">{t('ctaSearch')}</p>
              <p className="text-xs font-medium text-slate-500 mt-1 leading-none">{t('searchHint')}</p>
            </div>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 group-hover:bg-brand text-slate-400 group-hover:text-white transition-all duration-300">
               <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </div>
          </Link>
        </section>

        {/* ── Category Pills (Tactile & Sleek) ──────────────────────────────────── */}
        <section className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          <h2 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">
            {t('categoriesTitle')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat, idx) => (
              <Link
                key={cat.key}
                href={`/search?category=${cat.key}`}
                locale={params.locale}
                style={{ animationDelay: `${150 + idx * 50}ms` }}
                className="group flex min-h-[48px] shrink-0 items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-border hover:bg-brand-light hover:text-brand hover:shadow-md active:translate-y-0"
              >
                <span className="text-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                <span>{t(`categories.${cat.key}`)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="mt-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">
            {t('ctaDemo')}
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { num: 1, title: t('steps.searchTitle'), body: t('steps.searchBody') },
              { num: 2, title: t('steps.bookTitle'), body: t('steps.bookBody') },
              { num: 3, title: t('steps.confirmTitle'), body: t('steps.confirmBody') },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand text-lg font-black shadow-sm transition-all duration-300">
                  {step.num}
                </div>
                <div className="pt-1.5">
                  <p className="font-bold text-slate-800 text-base tracking-tight leading-none">{step.title}</p>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value Props — Glassy dynamic cards ─────────────────────── */}
        <section className="mt-10 flex flex-col gap-4 sm:grid sm:grid-cols-3 mb-10">
          {[
            { icon: CheckCircle2, title: t('cards.verifiedTitle'), body: t('cards.verifiedBody'), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', delay: 'delay-[400ms]' },
            { icon: CalendarDays, title: t('cards.bookingTitle'), body: t('cards.bookingBody'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', delay: 'delay-[500ms]' },
            { icon: BellRing, title: t('cards.remindersTitle'), body: t('cards.remindersBody'), color: 'text-brand', bg: 'bg-brand-light', border: 'border-brand-border', delay: 'delay-[600ms]' },
          ].map((card, idx) => (
            <article key={idx} className={`group relative flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both overflow-hidden ${card.delay}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${card.bg} ${card.color} shadow-inner transition-transform duration-300 group-hover:scale-110 relative z-10`}>
                <card.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="relative z-10">
                <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">{card.title}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1.5 leading-snug">{card.body}</p>
              </div>
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${card.bg} opacity-50 blur-[20px] transition-all duration-500 group-hover:opacity-100`} />
            </article>
          ))}
        </section>
      </SiteShell>
    </main>
  );
}
