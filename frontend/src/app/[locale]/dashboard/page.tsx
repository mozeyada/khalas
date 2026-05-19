import {getTranslations} from 'next-intl/server';

import {PatientDashboard} from '@/components/patient-dashboard';
import {SiteShell} from '@/components/site-shell';

type DashboardPageProps = {
  params: {
    locale: string;
  };
};

export default async function DashboardPage({params}: DashboardPageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'DashboardPage'});

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <PatientDashboard />
    </SiteShell>
  );
}
