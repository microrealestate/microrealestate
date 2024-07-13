import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchOrganizations, QueryKeys } from '../../../utils/restcalls';
import LandlordForm from '../../../components/organization/LandlordForm';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function LandlordSettings() {
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
    <Page loading={isLoading} dataCy="landlordPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Landlord')}</CardTitle>
          <CardDescription>
            {t(
              'Landlord information that will be shared with your tenants in contracts and invoices'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandlordForm organization={organization} />
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(LandlordSettings);
