'use client';

import {
  Card,
  CardContent
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import Page from '@/components/Page';
import WebServerForm from '@/components/webserver/WebServerForm';
import useOrganization from '@/hooks/useOrganization';

function WebServerSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page
      title={t('Web server')}
      description={
        organization?.reverseProxy === 'external'
          ? t(
              'Set at installation: the application runs behind your own reverse proxy'
            )
          : t('Configure the public domain and HTTPS')
      }
      loading={isLoading}
      dataCy="webServerPage"
    >
      <Card>
        <CardContent className="pt-6">
          <WebServerForm
            organization={organization}
            submitLabel={undefined}
            onSuccess={undefined}
            onDirtyChange={undefined}
          />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function WebServerSettingsPage() {
  return <WebServerSettings />;
}
