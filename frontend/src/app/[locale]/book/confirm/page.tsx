import {getTranslations} from 'next-intl/server';

import {SiteShell} from '@/components/site-shell';
import {AppointmentQRCode} from '@/components/appointment-qr-code';
import {formatDateTime} from '@/lib/format';

type ConfirmationPageProps = {
  params: {
    locale: string;
  };
  searchParams: {
    appointmentId?: string;
    venue?: string;
    staff?: string;
    service?: string;
    slot?: string;
  };
};

export default async function ConfirmationPage({params, searchParams}: ConfirmationPageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'ConfirmationPage'});

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-teal">{t('eyebrow')}</p>
        <h2 className="text-2xl font-semibold text-ink">{t('title')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white/75 p-4">
            <p className="text-sm text-ink/60">{t('fields.appointmentId')}</p>
            <p className="mt-2 font-medium text-ink">{searchParams.appointmentId ?? '-'}</p>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white/75 p-4">
            <p className="text-sm text-ink/60">{t('fields.venue')}</p>
            <p className="mt-2 font-medium text-ink">{searchParams.venue ?? '-'}</p>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white/75 p-4">
            <p className="text-sm text-ink/60">{t('fields.staff')}</p>
            <p className="mt-2 font-medium text-ink">{searchParams.staff ?? '-'}</p>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white/75 p-4">
            <p className="text-sm text-ink/60">{t('fields.service')}</p>
            <p className="mt-2 font-medium text-ink">{searchParams.service ?? '-'}</p>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white/75 p-4 sm:col-span-2">
            <p className="text-sm text-ink/60">{t('fields.slot')}</p>
            <p className="mt-2 font-medium text-ink">
              {searchParams.slot ? formatDateTime(searchParams.slot, params.locale) : '-'}
            </p>
          </article>
        </div>

        {searchParams.appointmentId ? (
          <div className="mt-8 flex justify-center border-t border-black/10 pt-8">
            <AppointmentQRCode appointmentId={searchParams.appointmentId} />
          </div>
        ) : null}
      </section>
    </SiteShell>
  );
}
