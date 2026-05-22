import {getTranslations} from 'next-intl/server';
import {SiteShell} from '@/components/site-shell';
import {ResetPasswordForm} from '@/components/reset-password-form';

type Props = { params: { locale: string } };

export default async function ResetPasswordPage({params}: Props) {
  const t = await getTranslations({locale: params.locale, namespace: 'LoginPage'});

  return (
    <SiteShell title="Reset Password" subtitle="Choose a new password">
      <ResetPasswordForm />
    </SiteShell>
  );
}
