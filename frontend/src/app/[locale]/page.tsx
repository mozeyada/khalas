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

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navbar substitute (since SiteShell is wrapping this, we'll keep the landing page content below SiteShell) */}
      <SiteShell>
        <section className="relative overflow-hidden rounded-[3rem] bg-[url('/hero-alexandria.png')] bg-cover bg-center px-6 py-20 text-center shadow-2xl sm:px-12 sm:py-32">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-teal/50 mix-blend-multiply filter"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

          <div className="relative z-10 mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-sm font-medium text-amber-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {t('eyebrow')}
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t('headline')}
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              {t('body')}
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 pt-4">
              <Link
                href="/search"
                locale={params.locale}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-teal px-8 py-4 text-base font-semibold text-white transition-all hover:bg-teal/90 hover:scale-105 shadow-[0_0_20px_rgba(13,148,136,0.4)] sm:w-auto"
              >
                {t('ctaSearch')}
                <svg xmlns="http://www.w3.org/-2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link
                href="/auth/register"
                locale={params.locale}
                className="flex w-full items-center justify-center rounded-full bg-white/10 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/20 hover:scale-105 sm:w-auto backdrop-blur-md border border-white/10"
              >
                {t('ctaPrimary')}
              </Link>
              <Link
                href="/provider-test-clinic"
                locale={params.locale}
                className="flex w-full items-center justify-center rounded-full bg-amber-400/10 text-amber-300 px-8 py-4 text-base font-semibold transition-all hover:bg-amber-400/20 hover:scale-105 sm:w-auto backdrop-blur-md border border-amber-400/20"
              >
                {t('ctaDemo')}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          <article className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <svg xmlns="http://www.w3.org/-2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h2 className="mb-3 text-xl font-bold text-ink">{t('cards.backendTitle')}</h2>
            <p className="text-base leading-relaxed text-ink/70">{t('cards.backendBody')}</p>
          </article>
          
          <article className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-600">
              <svg xmlns="http://www.w3.org/-2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mb-3 text-xl font-bold text-ink">{t('cards.frontendTitle')}</h2>
            <p className="text-base leading-relaxed text-ink/70">{t('cards.frontendBody')}</p>
          </article>
          
          <article className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-600">
              <svg xmlns="http://www.w3.org/-2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="mb-3 text-xl font-bold text-ink">{t('cards.docsTitle')}</h2>
            <p className="text-base leading-relaxed text-ink/70">{t('cards.docsBody')}</p>
          </article>
        </section>


      </SiteShell>
    </main>
  );
}
