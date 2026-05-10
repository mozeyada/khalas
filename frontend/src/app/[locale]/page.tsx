import {getTranslations} from 'next-intl/server';

import {HealthStatus} from '@/components/health-status';
import {LocaleSwitcher} from '@/components/locale-switcher';

type HomePageProps = {
  params: {
    locale: string;
  };
};

export default async function HomePage({params}: HomePageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'HomePage'});

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-ink shadow-soft backdrop-blur">
          {t('brand')}
        </div>
        <LocaleSwitcher />
      </div>

      <section className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6 rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{t('eyebrow')}</p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {t('headline')}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-ink/75 sm:text-lg">{t('body')}</p>

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
    </main>
  );
}

