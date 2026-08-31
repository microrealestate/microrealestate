'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import Members from '@/components/organization/Members';
import Page from '@/components/Page';
import useOrganization from '@/hooks/useOrganization';
import { useStore } from '@/providers/StoreProvider';

function AccessSettings() {
  const t = useTranslations('common');
  const store = useStore();
  const { data: organization, isLoading } = useOrganization();

  const isOwner =
    !!store.user.email &&
    store.user.email.toLowerCase() ===
      organization?.member1?.email?.toLowerCase();

  return (
    <Page loading={isLoading} dataCy="accessPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Access')}</CardTitle>
          <CardDescription>
            {t('Managing access to your organization')}
          </CardDescription>
          {!isLoading && !isOwner ? (
            <CardDescription data-cy="membersReadOnly">
              {t('Only the organization owner can manage collaborators')}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <Members organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function AccessSettingsPage() {
  return <AccessSettings />;
}
