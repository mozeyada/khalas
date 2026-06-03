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
    <main>
      <SiteShell>
        {/* ── Hero — full-bleed, breaks out of the SiteShell inner padding ── */}
        {/*
          We use negative horizontal margins (-mx-4 sm:-mx-6 lg:-mx-8) to
          break the hero out of the max-w-6xl gutters set by SiteShell,
          making it edge-to-edge on every screen size.
        */}
        <section className="relative -mx-4 overflow-hidden bg-[url('/hero-alexandria.png')] bg-cover bg-center px-6 py-32 text-center sm:-mx-6 sm:px-12 sm:py-44 lg:-mx-8">
          {/* Dark gradient overlay — bottom half is darker so cards below feel separate */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/60 to-slate-950/85" />
          {/* Teal brand tint */}
          <div className="absolute inset-0 bg-teal-900/20 mix-blend-multiply" />

          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-1.5 text-sm font-semibold text-amber-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {t('eyebrow')}
            </div>

            {/* Headline — text-balance prevents orphaned words */}
            <h1
              className="text-balance text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{textWrap: 'balance'}}
            >
              {t('headline')}
            </h1>

            {/* Body */}
            <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
              {t('body')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center sm:gap-4">
              {/* Primary — Find a doctor */}
              <Link
                href="/search"
                locale={params.locale}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-teal px-8 py-4 text-base font-bold text-white shadow-[0_0_24px_rgba(13,148,136,0.5)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_32px_rgba(13,148,136,0.65)] sm:w-auto"
              >
                {t('ctaSearch')}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>

              {/* Secondary — Book an appointment */}
              <Link
                href="/auth/register"
                locale={params.locale}
                className="flex w-full items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/10 px-8 py-4 text-base font-semibold text-amber-200 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-amber-400 hover:bg-amber-400/20 sm:w-auto"
              >
                {t('ctaPrimary')}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Value Props ─────────────────────────────────────────── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {/* Card 1: Verified Providers */}
          <article className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border-accent)] hover:shadow-[var(--shadow-float)]">
            <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[var(--text-1)]">{t('cards.verifiedTitle')}</h2>
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{t('cards.verifiedBody')}</p>
            </div>
          </article>

          {/* Card 2: Instant Booking */}
          <article className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/25 hover:shadow-[var(--shadow-float)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[var(--text-1)]">{t('cards.bookingTitle')}</h2>
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{t('cards.bookingBody')}</p>
            </div>
          </article>

          {/* Card 3: WhatsApp Reminders */}
          <article className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/25 hover:shadow-[var(--shadow-float)]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[var(--text-1)]">{t('cards.remindersTitle')}</h2>
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{t('cards.remindersBody')}</p>
            </div>
          </article>
        </section>
      </SiteShell>
    </main>
  );
}
