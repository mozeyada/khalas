import {getTranslations} from 'next-intl/server';

import {Link} from '@/i18n/navigation';
import {SiteShell} from '@/components/site-shell';

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
        {/* ── Search Bar (Uber "Where to?" style) ─────────────── */}
        <section className="mt-4 sm:mt-6">
          <Link
            href="/search"
            locale={params.locale}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-all active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text-1)]">{t('ctaSearch')}</p>
              <p className="text-xs text-[var(--text-3)]">{t('searchHint')}</p>
            </div>
          </Link>
        </section>

        {/* ── Category Pills ──────────────────────────────────── */}
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
            {t('categoriesTitle')}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={`/search?category=${cat.key}`}
                locale={params.locale}
                className="flex shrink-0 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-sm font-medium text-[var(--text-1)] transition-all hover:border-teal/20 hover:bg-teal/[0.03] active:scale-95"
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{t(`categories.${cat.key}`)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl bg-[var(--text-1)] p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
            {t('ctaDemo')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-white text-sm font-bold">1</div>
              <div>
                <p className="font-semibold text-white text-sm">{t('steps.searchTitle')}</p>
                <p className="text-xs text-white/50 mt-0.5">{t('steps.searchBody')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-white text-sm font-bold">2</div>
              <div>
                <p className="font-semibold text-white text-sm">{t('steps.bookTitle')}</p>
                <p className="text-xs text-white/50 mt-0.5">{t('steps.bookBody')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-white text-sm font-bold">3</div>
              <div>
                <p className="font-semibold text-white text-sm">{t('steps.confirmTitle')}</p>
                <p className="text-xs text-white/50 mt-0.5">{t('steps.confirmBody')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Value Props — compact cards ─────────────────────── */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3 mb-4">
          <article className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-1)]">{t('cards.verifiedTitle')}</h3>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{t('cards.verifiedBody')}</p>
            </div>
          </article>

          <article className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-1)]">{t('cards.bookingTitle')}</h3>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{t('cards.bookingBody')}</p>
            </div>
          </article>

          <article className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-1)]">{t('cards.remindersTitle')}</h3>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{t('cards.remindersBody')}</p>
            </div>
          </article>
        </section>
      </SiteShell>
    </main>
  );
}
