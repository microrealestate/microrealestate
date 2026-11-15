'use client';

import {
  Card,
  CardContent
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import BillingForm from '@/components/organization/BillingForm';
import Page from '@/components/Page';
import useOrganization from '@/hooks/useOrganization';

function BillingSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page
      title={t('Billing')}
      description={t(
        'The bank account and company details printed on payment notices and receipts.'
      )}
      loading={isLoading}
      dataCy="billingPage"
    >
      <Card>
        <CardContent className="pt-6">
          <BillingForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function BillingSettingsPage() {
  return <BillingSettings />;
}
