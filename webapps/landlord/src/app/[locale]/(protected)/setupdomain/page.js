'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { Card } from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Page from '@/components/Page';
import Welcome from '@/components/Welcome';
import WebServerForm from '@/components/webserver/WebServerForm';
import useOrganization from '@/hooks/useOrganization';
import { Link } from '@/i18n/navigation';

function SetupDomain() {
  const t = useTranslations('common');
  const { data: organization, isLoading } = useOrganization();
  const [isDirty, setIsDirty] = useState(false);
  const hasSavedDomain = !!organization?.webServer?.domain;

  return (
    <Page
      className="md:w-xl space-y-4"
      loading={isLoading}
      dataCy="setupDomainPage"
    >
      <Welcome />
      <div className="text-center md:text-left text-lg">
        {t('Configure your domain or skip to continue with IP address')}
      </div>
      <Card className="p-6">
        <WebServerForm
          organization={organization}
          submitLabel={t('Apply')}
          onDirtyChange={setIsDirty}
        />
      </Card>
      <div className="text-center">
        {isDirty ? (
          <Button variant="outline" disabled data-cy="skipDomain">
            {t('Skip this step')}
          </Button>
        ) : (
          <Button variant="outline" asChild data-cy="skipDomain">
            <Link href="/">
              {hasSavedDomain ? t('Continue') : t('Skip this step')}
            </Link>
          </Button>
        )}
      </div>
    </Page>
  );
}

export default SetupDomain;
