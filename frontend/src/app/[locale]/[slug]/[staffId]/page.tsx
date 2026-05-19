import {getTranslations} from 'next-intl/server';

import {BookingPanel} from '@/components/booking-panel';
import {SiteShell} from '@/components/site-shell';
import {getPublicVenue, getStaffProfile, getStaffServices} from '@/lib/api';

type StaffPageProps = {
  params: {
    locale: string;
    slug: string;
    staffId: string;
  };
};

export default async function StaffPage({params}: StaffPageProps) {
  const [t, venue, staff, services] = await Promise.all([
    getTranslations({locale: params.locale, namespace: 'StaffPage'}),
    getPublicVenue(params.slug),
    getStaffProfile(params.staffId),
    getStaffServices(params.staffId)
  ]);

  return (
    <SiteShell
      title={params.locale === 'ar' ? staff.name_ar : staff.name_en}
      subtitle={params.locale === 'ar' ? staff.specialty_ar ?? t('emptySpecialty') : staff.specialty_en ?? t('emptySpecialty')}
    >
      <BookingPanel locale={params.locale} venue={venue} staff={staff} services={services} />
    </SiteShell>
  );
}
