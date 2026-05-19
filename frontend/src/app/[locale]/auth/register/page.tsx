import {getTranslations} from 'next-intl/server';

import {RegisterForm} from '@/components/register-form';
import {SiteShell} from '@/components/site-shell';

type RegisterPageProps = {
  params: {
    locale: string;
  };
};

export default async function RegisterPage({params}: RegisterPageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'RegisterPage'});

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <RegisterForm />
    </SiteShell>
  );
}
