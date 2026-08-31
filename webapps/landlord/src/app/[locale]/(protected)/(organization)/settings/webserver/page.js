'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import Page from '@/components/Page';
import WebServerForm from '@/components/webserver/WebServerForm';
import useOrganization from '@/hooks/useOrganization';

function WebServerSettings() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();

  return (
    <Page loading={isLoading} dataCy="webServerPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Web server')}</CardTitle>
          <CardDescription>
            {t('Configure the public domain and HTTPS')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebServerForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function WebServerSettingsPage() {
  return <WebServerSettings />;
}
