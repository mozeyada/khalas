import {unstable_setRequestLocale} from 'next-intl/server';
import {useTranslations} from 'next-intl';

import {SiteShell} from '@/components/site-shell';
import {ProfileSettingsForm} from '@/components/profile-settings-form';

export default function ProfilePage({
  params: {locale},
}: {
  params: {locale: string};
}) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('ProfilePage');

  return (
    <SiteShell title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <div className="py-6">
        <ProfileSettingsForm />
      </div>
    </SiteShell>
  );
}
