'use client';

import { Card } from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import LandlordForm from '@/components/organization/LandlordForm';
import Page from '@/components/Page';
import Welcome from '@/components/Welcome';

function SetupOrganization() {
  const t = useTranslations('common');

  return (
    <Page className="md:w-xl space-y-4" dataCy="setupOrganizationPage">
      <Welcome />
      <div className="text-center md:text-left text-lg">
        {t(
          "Let's start by telling us who the landlord is, then you can add your properties and tenants"
        )}
      </div>
      <Card className="p-6">
        <LandlordForm />
      </Card>
    </Page>
  );
}

export default SetupOrganization;
