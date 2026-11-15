'use client';

import {
  Card,
  CardContent
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import EmailServiceForm from '@/components/organization/EmailServiceForm';
import Page from '@/components/Page';
import useOrganization from '@/hooks/useOrganization';

function EmailServiceSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page
      title={t('Email service')}
      description={t(
        'Configuration required for sending receipts, notices and all kind of communication to the tenants'
      )}
      loading={isLoading}
      dataCy="emailPage"
    >
      <Card>
        <CardContent className="pt-6">
          <EmailServiceForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function EmailServiceSettingsPage() {
  return <EmailServiceSettings />;
}
