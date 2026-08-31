'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { Label } from '@microrealestate/commonui/components/ui/label';
import { Switch } from '@microrealestate/commonui/components/ui/switch';
import { cn } from '@microrealestate/commonui/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { toast } from 'sonner';
import NewLeaseDialog from '@/components/organization/lease/NewLeaseDialog';
import Page from '@/components/Page';
import ShortcutButton from '@/components/ShortcutButton';
// redirect removed as it was unused
import { useStore } from '@/providers/StoreProvider';
import { fetchLeases, QueryKeys, updateLease } from '@/utils/restcalls';

function LeasesSettings() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
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

  const handleNewLeaseDialog = () => {
    setOpenNewLeaseDialog(true);
  };

  const handleLeaseChange = useCallback(
    async (active, lease) => {
      lease.active = active;
      await leaseMutation.mutateAsync({ store, lease });
    },
    [leaseMutation, store]
  );

  if (leasesQuery.isError) {
    toast.error(t('Error fetching contracts'));
  }

  if (leaseMutation.isError) {
    toast.error(t('Error updating lease'));
  }

  return (
    <Page
      loading={leasesQuery.isLoading}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('New contract')}
            Icon={LuCirclePlus}
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
          {leasesQuery.data?.map((lease) => {
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
                      router.push(`/settings/contracts/${lease._id}`);
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
                    ? t('{numberOfTerms} {timeRange}', {
                        numberOfTerms: lease.numberOfTerms,
                        timeRange: t(lease.timeRange)
                      })
                    : ''}
                </div>
                <div className="mt-4 h-20 md:h-14 overflow-auto">
                  {lease.description}
                </div>
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

export default function LeasesSettingsPage() {
  return <LeasesSettings />;
}
