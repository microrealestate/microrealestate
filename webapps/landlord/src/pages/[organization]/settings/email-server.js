import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchOrganizations, QueryKeys } from '../../../utils/restcalls';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import EmailServerForm from '../../../components/organization/EmailServerForm';
import { toast } from 'sonner';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function EmailServerSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const {
    data: orgs,
    isError,
    isLoading
  } = useQuery({
    queryKey: [QueryKeys.ORGANIZATIONS],
    queryFn: () => fetchOrganizations(store)
  });

  if (isError) {
    toast.error(t('Error fetching organizations'));
  }

  const organization =
    orgs?.find((org) => org._id === store.organization.selected?._id) ||
    orgs?.[0];

  return (
    <Page loading={isLoading} dataCy="emailServerPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Email server')}</CardTitle>
          <CardDescription>
            {t(
              'Configure the email server used for invitations, password reset, and tenant communication'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailServerForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(EmailServerSettings);
