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
        <section className="mt-4 sm:mt-8 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-[32px] pt-12 pb-16 lg:pt-24 lg:pb-32 px-6 lg:px-12 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700 mx-4 sm:mx-0">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 max-w-2xl leading-tight">
              {t('ctaSearch')}
            </h1>
            <p className="text-blue-100 text-sm lg:text-lg mb-10 max-w-xl">
              {t('searchHint')}
            </p>

            <Link
              href="/search"
              locale={params.locale}
              className="group flex w-full max-w-3xl items-center gap-4 rounded-2xl bg-white p-2 lg:p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgb(0,0,0,0.16)] active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Search className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div className="flex-1 text-start">
                <p className="text-base lg:text-lg font-bold text-slate-800 leading-none mb-1">
                  {t('ctaSearch')}
                </p>
                <p className="text-xs lg:text-sm font-medium text-slate-500 leading-none">
                  {t('searchHint')}
                </p>
              </div>
              <div className="flex h-12 w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-transform group-hover:bg-blue-700">
                <ChevronRight className="h-6 w-6 lg:h-7 lg:w-7 rtl:rotate-180" />
              </div>
            </Link>
          </div>
        </section>

        {/* ── Category Grid (Desktop) / Pills (Mobile) ────────────────── */}
        <section className="mt-12 lg:mt-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both px-4 sm:px-0">
          <div className="flex items-center justify-between mb-6 lg:mb-10">
            <h2 className="text-lg lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('categoriesTitle')}
            </h2>
            <Link href="/search" locale={params.locale} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {params.locale === 'ar' ? 'عرض الكل' : 'View all'}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          
          <div className="grid grid-flow-col auto-cols-[85%] sm:grid-flow-row sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0">
            {categories.map((cat, idx) => (
              <Link
                key={cat.key}
                href={`/search?category=${cat.key}`}
                locale={params.locale}
                style={{ animationDelay: `${150 + idx * 50}ms` }}
                className="group flex items-center gap-4 rounded-[20px] bg-white p-4 lg:p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-100 cursor-pointer"
              >
                <div className="flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50/50 text-2xl lg:text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-50">
                  {cat.icon}
                </div>
                <span className="font-bold text-slate-800 lg:text-lg group-hover:text-blue-600 transition-colors">
                  {t(`categories.${cat.key}`)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="mt-12 lg:mt-24 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both bg-slate-50 rounded-[32px] p-8 lg:p-16 shadow-inner mx-4 sm:mx-0">
          <div className="text-center mb-10 lg:mb-16">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-3">
              {t('ctaDemo') || 'SIMPLY YOUR HEALTH'}
            </h2>
            <p className="text-2xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {params.locale === 'ar' ? 'كيف تعمل المنصة؟' : 'How it works'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Optional connecting line for desktop */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-slate-200 border-t border-dashed border-slate-300 z-0" />
            
            {[
              { num: 1, title: t('steps.searchTitle'), body: t('steps.searchBody') },
              { num: 2, title: t('steps.bookTitle'), body: t('steps.bookBody') },
              { num: 3, title: t('steps.confirmTitle'), body: t('steps.confirmBody') },
            ].map((step) => (
              <div key={step.num} className="relative z-10 flex flex-col items-center text-center bg-white md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-black shadow-lg mb-6 ring-8 ring-slate-50 md:ring-slate-50">
                  {step.num}
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg lg:text-xl tracking-tight mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm lg:text-base max-w-xs">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value Props — Premium Cards ─────────────────────── */}
        <section className="mt-12 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-24 px-4 sm:px-0">
          {[
            { icon: CheckCircle2, title: t('cards.verifiedTitle'), body: t('cards.verifiedBody'), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', delay: 'delay-[400ms]' },
            { icon: CalendarDays, title: t('cards.bookingTitle'), body: t('cards.bookingBody'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', delay: 'delay-[500ms]' },
            { icon: BellRing, title: t('cards.remindersTitle'), body: t('cards.remindersBody'), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', delay: 'delay-[600ms]' },
          ].map((card, idx) => (
            <article key={idx} className={`group flex flex-col bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-in fade-in slide-in-from-bottom-8 fill-mode-both ${card.delay}`}>
              <div className={`flex h-16 w-16 mb-6 items-center justify-center rounded-2xl ${card.bg} ${card.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon className="h-8 w-8" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">{card.title}</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed">{card.body}</p>
            </article>
          ))}
        </section>
      </SiteShell>
    </main>
  );
}
