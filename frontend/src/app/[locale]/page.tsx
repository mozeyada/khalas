import {getTranslations} from 'next-intl/server';

import {HealthStatus} from '@/components/health-status';
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
    <SiteShell title={t('headline')} subtitle={t('body')}>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6 rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{t('eyebrow')}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              locale={params.locale}
              className="rounded-full bg-teal px-5 py-3 text-sm font-medium text-white transition hover:bg-teal/90"
            >
              {t('ctaSearch')}
            </Link>
            <Link
              href="/auth/register"
              locale={params.locale}
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition hover:bg-black/5"
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/auth/login"
              locale={params.locale}
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition hover:bg-black/5"
            >
              {t('ctaSecondary')}
            </Link>
            <Link
              href="/provider-test-clinic"
              locale={params.locale}
              className="rounded-full border border-black/10 bg-sand px-5 py-3 text-sm font-medium text-ink transition hover:bg-black/5"
            >
              {t('ctaDemo')}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-3xl border border-[var(--border)] bg-white/70 p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink">{t('cards.backendTitle')}</h2>
              <p className="text-sm leading-6 text-ink/70">{t('cards.backendBody')}</p>
            </article>
            <article className="rounded-3xl border border-[var(--border)] bg-white/70 p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink">{t('cards.frontendTitle')}</h2>
              <p className="text-sm leading-6 text-ink/70">{t('cards.frontendBody')}</p>
            </article>
            <article className="rounded-3xl border border-[var(--border)] bg-white/70 p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink">{t('cards.docsTitle')}</h2>
              <p className="text-sm leading-6 text-ink/70">{t('cards.docsBody')}</p>
            </article>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-slate-950 p-5 text-slate-50 shadow-soft sm:p-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {t('statusEyebrow')}
          </p>
          <h2 className="mb-3 text-2xl font-semibold">{t('statusTitle')}</h2>
          <p className="mb-6 text-sm leading-6 text-slate-300">{t('statusBody')}</p>
          <HealthStatus />
        </div>
      </section>
    </SiteShell>
  );
}
