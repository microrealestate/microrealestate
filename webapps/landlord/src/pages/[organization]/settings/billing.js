import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchOrganizations, QueryKeys } from '../../../utils/restcalls';
import BillingForm from '../../../components/organization/BillingForm';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function BillingSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.ORGANIZATIONS],
    queryFn: () => fetchOrganizations(store)
  });

  if (isError) {
    toast.error(t('Error fetching organizations'));
  }

  const organization =
    data?.find((org) => org._id === store.organization.selected?._id) ||
    data?.[0];

  return (
    <Page loading={isLoading} dataCy="billingPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Billing')}</CardTitle>
          <CardDescription>
            {t(
              'Billing information that will be shared with your tenants in invoices'
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

export default withAuthentication(BillingSettings);
