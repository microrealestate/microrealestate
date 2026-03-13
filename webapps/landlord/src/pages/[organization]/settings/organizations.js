import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchOrganizations, QueryKeys } from '../../../utils/restcalls';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../utils';
import config from '../../../config';
import { Input } from '../../../components/ui/input';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function OrganizationsSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [searchText, setSearchText] = useState('');
  const {
    data: organizations,
    isError,
    isLoading
  } = useQuery({
    queryKey: [QueryKeys.ORGANIZATIONS],
    queryFn: () => fetchOrganizations(store)
  });

  const handleSwitchOrganization = (organization) => () => {
    window.location.assign(
      `${config.BASE_PATH}/${organization.locale}/${organization.name}/dashboard`
    );
  };

  if (isError) {
    toast.error(t('Error fetching organizations'));
  }

  const filteredOrganizations = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) {
      return organizations || [];
    }

    return (organizations || []).filter((organization) =>
      String(organization.name || '')
        .toLowerCase()
        .includes(search)
    );
  }, [organizations, searchText]);

  return (
    <Page loading={isLoading} dataCy="organizationsPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Organizations')}</CardTitle>
          <CardDescription>{t('Your organizations')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder={t('Search')}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          {filteredOrganizations.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t('No organizations found')}
            </div>
          ) : null}

          {filteredOrganizations.map((organization) => (
            <Card
              key={organization._id}
              className={cn('flex items-center gap-2 p-4')}
            >
              {store.organization.selected?._id !== organization._id ? (
                <Button
                  variant="link"
                  onClick={handleSwitchOrganization(organization)}
                  className="justify-start text-xl p-0 h-fit min-w-32"
                >
                  {organization.name}
                </Button>
              ) : (
                <span className="text-xl min-w-32">{organization.name}</span>
              )}
              <Badge
                variant="outline"
                className="text-secondary-foreground/70 h-fit w-fit"
              >
                {t(
                  organization.members.find(
                    (member) => member.user === store.user._id
                  ).role
                )}
              </Badge>
            </Card>
          ))}
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(OrganizationsSettings);
