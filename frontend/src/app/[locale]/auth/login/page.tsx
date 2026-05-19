import {getTranslations} from 'next-intl/server';

import {LoginForm} from '@/components/login-form';
import {SiteShell} from '@/components/site-shell';

type LoginPageProps = {
  params: {
    locale: string;
  };
};

export default async function LoginPage({params}: LoginPageProps) {
  const t = await getTranslations({locale: params.locale, namespace: 'LoginPage'});

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <LoginForm />
    </SiteShell>
  );
}
