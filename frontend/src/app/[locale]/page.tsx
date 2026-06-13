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
        <section className="mt-8 sm:mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Link
            href="/search"
            locale={params.locale}
            className="group relative flex items-center gap-4 rounded-3xl border border-zinc-200/60 bg-white/80 p-5 backdrop-blur-2xl shadow-xl shadow-zinc-200/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-300/50 active:scale-[0.98]"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-brand-light to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-50" />
            
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 shadow-inner group-hover:bg-brand-light transition-colors duration-300">
              <Search className="h-6 w-6 text-zinc-700 group-hover:text-brand transition-colors duration-300" />
            </div>
            <div className="relative flex-1">
              <p className="text-xl font-black text-zinc-900 tracking-tight">{t('ctaSearch')}</p>
              <p className="text-sm font-medium text-zinc-500 mt-0.5">{t('searchHint')}</p>
            </div>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 group-hover:bg-brand text-zinc-400 group-hover:text-white transition-all duration-300">
               <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </div>
          </Link>
        </section>

        {/* ── Category Pills (Tactile & Sleek) ──────────────────────────────────── */}
        <section className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          <h2 className="mb-5 text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-1">
            {t('categoriesTitle')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
            {categories.map((cat, idx) => (
              <Link
                key={cat.key}
                href={`/search?category=${cat.key}`}
                locale={params.locale}
                style={{ animationDelay: `${150 + idx * 50}ms` }}
                className="group flex shrink-0 items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white px-5 py-3 text-sm font-bold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-border hover:bg-brand-light hover:text-brand hover:shadow-md active:translate-y-0"
              >
                <span className="text-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                <span>{t(`categories.${cat.key}`)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works (Deep Sleek Gradient) ────────────────────────────────────── */}
        <section className="mt-12 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 sm:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both border border-zinc-800">
          {/* Subtle glowing orbs in background */}
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-blue-500/30 blur-[60px]" />
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-500/30 blur-[60px]" />

          <h2 className="relative text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-8">
            {t('ctaDemo')}
          </h2>
          
          <div className="relative grid gap-8 sm:grid-cols-3">
            {[
              { num: 1, title: t('steps.searchTitle'), body: t('steps.searchBody') },
              { num: 2, title: t('steps.bookTitle'), body: t('steps.bookBody') },
              { num: 3, title: t('steps.confirmTitle'), body: t('steps.confirmBody') },
            ].map((step) => (
              <div key={step.num} className="group flex flex-col gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/10 text-white text-lg font-black shadow-inner backdrop-blur-md transition-all duration-300 group-hover:bg-brand group-hover:scale-110 group-hover:border-brand-light">
                  {step.num}
                </div>
                <div>
                  <p className="font-bold text-white text-base tracking-tight">{step.title}</p>
                  <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value Props — Glassy dynamic cards ─────────────────────── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3 mb-10">
          {[
            { icon: CheckCircle2, title: t('cards.verifiedTitle'), body: t('cards.verifiedBody'), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', delay: 'delay-[400ms]' },
            { icon: CalendarDays, title: t('cards.bookingTitle'), body: t('cards.bookingBody'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', delay: 'delay-[500ms]' },
            { icon: BellRing, title: t('cards.remindersTitle'), body: t('cards.remindersBody'), color: 'text-brand', bg: 'bg-brand-light', border: 'border-brand-border', delay: 'delay-[600ms]' },
          ].map((card, idx) => (
            <article key={idx} className={`group flex items-start gap-4 rounded-3xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both ${card.delay}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.bg} ${card.border} ${card.color} shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                <card.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 tracking-tight">{card.title}</h3>
                <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">{card.body}</p>
              </div>
            </article>
          ))}
        </section>
      </SiteShell>
    </main>
  );
}
