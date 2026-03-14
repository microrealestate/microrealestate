import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../../components/ui/card';
import {
  fetchLeases,
  QueryKeys,
  updateLease
} from '../../../../utils/restcalls';
import { useCallback, useContext, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/button';
import { cn } from '../../../../utils';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { LuPlusCircle } from 'react-icons/lu';
import NewLeaseDialog from '../../../../components/organization/lease/NewLeaseDialog';
import Page from '../../../../components/Page';
import ShortcutButton from '../../../../components/ShortcutButton';
import { StoreContext } from '../../../../store';
import { Switch } from '../../../../components/ui/switch';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

function LeasesSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const leasesQuery = useQuery({
    queryKey: [QueryKeys.LEASES],
    queryFn: () => fetchLeases(store)
  });
  const leaseMutation = useMutation({
    mutationFn: updateLease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.LEASES] });
    }
  });

  const handleNewLeaseDialog = useCallback(() => {
    setOpenNewLeaseDialog(true);
  }, [setOpenNewLeaseDialog]);

  const handleLeaseChange = useCallback(
    async (active, lease) => {
      lease.active = active;
      await leaseMutation.mutateAsync({ store, lease });
    },
    [leaseMutation, store]
  );

  if (leasesQuery.isError) {
    toast.error(t('Error fetching organizations'));
  }

  if (leaseMutation.isError) {
    toast.error(t('Error updating lease'));
  }

  const filteredLeases = (leasesQuery.data || []).filter((lease) => {
    if (statusFilter === 'active' && !lease.active) {
      return false;
    }

    if (statusFilter === 'inactive' && lease.active) {
      return false;
    }

    const search = searchText.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return (
      String(lease.name || '')
        .toLowerCase()
        .includes(search) ||
      String(lease.description || '')
        .toLowerCase()
        .includes(search)
    );
  });

  return (
    <Page
      loading={leasesQuery.isLoading}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('New contract')}
            Icon={LuPlusCircle}
            disabled={store.tenant.selected.hasPayments}
            onClick={handleNewLeaseDialog}
          />
        </div>
      }
      dataCy="contractsPage"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('Contracts')}</CardTitle>
          <CardDescription>
            {t('Contracts to rent out your properties')}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder={t('Search')}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="all">{t('All')}</option>
              <option value="active">{t('Active')}</option>
              <option value="inactive">{t('Inactive')}</option>
            </select>
          </div>

          {filteredLeases.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              {t('No contracts found')}
            </div>
          ) : null}

          {filteredLeases.map((lease) => {
            return (
              <Card
                key={lease._id}
                className={cn(
                  'p-4 min-h-56 md:min-h-48',
                  lease.active ? '' : 'text-muted-foreground bg-secondary'
                )}
              >
                <div>
                  <Button
                    variant="link"
                    onClick={() => {
                      store.appHistory.setPreviousPath(router.asPath);
                      router.push(
                        `/${store.organization.selected.name}/settings/contracts/${lease._id}`
                      );
                    }}
                    className={cn(
                      'text-xl text-left text-wrap font-semibold p-0 ',
                      lease.active ? '' : 'text-muted-foreground'
                    )}
                    data-cy="openResourceButton"
                  >
                    {lease.name}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {lease.numberOfTerms && lease.timeRange
                    ? t('{{numberOfTerms}} {{timeRange}}', {
                        numberOfTerms: lease.numberOfTerms,
                        timeRange: t(lease.timeRange)
                      })
                    : ''}
                </div>
                <div className="mt-4 h-20 md:h-14 overflow-auto">
                  {lease.description}
                </div>
                {lease.lastUpdatedBy ? (
                  <div className="text-xs text-muted-foreground mt-2">
                    {t('Last updated by')}:{' '}
                    <span className="font-medium">{lease.lastUpdatedBy}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Label
                    className="text-xs text-muted-foreground font-normal"
                    htmlFor="contract-active"
                  >
                    {t('Activate contract')}
                  </Label>
                  <Switch
                    id="contract-active"
                    checked={lease.active}
                    onCheckedChange={(checked) =>
                      handleLeaseChange(checked, lease)
                    }
                  />
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>
      <NewLeaseDialog
        open={openNewLeaseDialog}
        setOpen={setOpenNewLeaseDialog}
      />
    </Page>
  );
}

export default withAuthentication(LeasesSettings);
