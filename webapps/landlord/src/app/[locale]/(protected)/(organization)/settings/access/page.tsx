'use client';

import {
  Card,
  CardContent
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
    <Page
      title={t('Team members')}
      description={t('Give other people access to your rentals.')}
      intro={
        !isLoading && !isOwner ? (
          <p
            className="text-sm text-muted-foreground"
            data-cy="membersReadOnly"
          >
            {t('Only the organization owner can manage collaborators')}
          </p>
        ) : null
      }
      loading={isLoading}
      dataCy="accessPage"
    >
      <Card>
        <CardContent className="pt-6">
          <Members organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default function AccessSettingsPage() {
  return <AccessSettings />;
}
