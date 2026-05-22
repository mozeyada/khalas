import {getTranslations} from 'next-intl/server';
import {SiteShell} from '@/components/site-shell';
import {ForgotPasswordForm} from '@/components/forgot-password-form';

type Props = { params: { locale: string } };

export default async function ForgotPasswordPage({params}: Props) {
  const t = await getTranslations({locale: params.locale, namespace: 'LoginPage'});

  return (
    <SiteShell title="Forgot Password" subtitle="Request a password reset link">
      <ForgotPasswordForm />
    </SiteShell>
  );
}
