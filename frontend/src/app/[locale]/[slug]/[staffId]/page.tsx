import {getTranslations} from 'next-intl/server';

import {Link} from '@/i18n/navigation';
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
      {/* Back to venue */}
      <div className="mb-4">
        <Link
          href={`/${params.slug}`}
          locale={params.locale}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-2)] shadow-sm backdrop-blur transition-all hover:border-[var(--border-accent)] hover:text-teal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {params.locale === 'ar' ? 'العودة للعيادة' : 'Back to clinic'}
        </Link>
      </div>

      <BookingPanel locale={params.locale} venue={venue} staff={staff} services={services} />
    </SiteShell>
  );
}
