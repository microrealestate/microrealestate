'use client';

import {
  Card,
  CardContent
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import LandlordForm from '@/components/organization/LandlordForm';
import Page from '@/components/Page';
import useOrganization from '@/hooks/useOrganization';

function LandlordSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page
      title={t('Landlord details')}
      description={t(
        'The landlord shown to your tenants on leases, payment notices and receipts.'
      )}
      loading={isLoading}
      dataCy="landlordPage"
    >
      <Card>
        <CardContent className="pt-6">
          <LandlordForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function LandlordSettingsPage() {
  return <LandlordSettings />;
}
