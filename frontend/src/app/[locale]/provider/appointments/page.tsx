import {getTranslations} from 'next-intl/server';

import {ProviderAppointments} from '@/components/provider-appointments';
import {SiteShell} from '@/components/site-shell';

type ProviderAppointmentsPageProps = {
  params: {
    locale: string;
  };
};

export default async function ProviderAppointmentsPage({params}: ProviderAppointmentsPageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'ProviderAppointmentsPage'});

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <ProviderAppointments />
    </SiteShell>
  );
}
