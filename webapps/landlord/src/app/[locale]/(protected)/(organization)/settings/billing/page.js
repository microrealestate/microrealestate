'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import BillingForm from '@/components/organization/BillingForm';
import Page from '@/components/Page';
import useOrganization from '@/hooks/useOrganization';

function BillingSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page loading={isLoading} dataCy="billingPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Billing')}</CardTitle>
          <CardDescription>
            {t(
              'Billing information that will be shared with your tenants in receipts'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function BillingSettingsPage() {
  return <BillingSettings />;
}
