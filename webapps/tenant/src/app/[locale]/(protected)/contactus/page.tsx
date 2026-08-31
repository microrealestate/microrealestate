import { getTranslations } from 'next-intl/server';
import ContactCard from '@/components/contact-card';
import Page from '@/components/page';
import Request from '@/utils/request';

export default async function ContactUsPage() {
  const t = await getTranslations('common');
  const leases = await Request.fetchAllTenants();
  const landlord = leases[0]?.landlord;

  return (
    <Page
      description={t(
        'Contact your landlord directly using the information below.'
      )}
      dataCy="contactUsPage"
      className="gap-6"
    >
      {landlord ? (
        <ContactCard contactInfo={landlord} showCard />
      ) : (
        <p className="text-muted-foreground text-sm">
          {t('No landlord contact information available.')}
        </p>
      )}
    </Page>
  );
}
