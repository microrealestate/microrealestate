'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import LandlordForm from '@/components/organization/LandlordForm';
import Page from '@/components/Page';
import useOrganization from '@/hooks/useOrganization';

function LandlordSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page loading={isLoading} dataCy="landlordPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Landlord')}</CardTitle>
          <CardDescription>
            {t(
              'Landlord information that will be shared with your tenants in contracts and receipts'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandlordForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function LandlordSettingsPage() {
  return <LandlordSettings />;
}
