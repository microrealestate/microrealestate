'use client';

import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Card } from '@microrealestate/commonui/components/ui/card';
import { Label } from '@microrealestate/commonui/components/ui/label';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { Switch } from '@microrealestate/commonui/components/ui/switch';
import { cn } from '@microrealestate/commonui/utils';
import type { API } from '@microrealestate/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { EmptyIllustration } from '@/components/Illustrations';
import NewLeaseDialog from '@/components/organization/lease/NewLeaseDialog';
import Page from '@/components/Page';
import { useStore } from '@/providers/StoreProvider';
import { fetchLeases, QueryKeys, updateLease } from '@/utils/restcalls';

type LeaseData = API.Landlord.Lease.LeaseData;

function LeaseDuration({ lease }: { lease: LeaseData }) {
  const t = useTranslations('common');
  const count = lease.numberOfTerms;
  if (!count) {
    return null;
  }
  switch (lease.timeRange) {
    case 'days':
      return <>{t('{count, plural, one {# day} other {# days}}', { count })}</>;
    case 'weeks':
      return (
        <>{t('{count, plural, one {# week} other {# weeks}}', { count })}</>
      );
    case 'months':
      return (
        <>{t('{count, plural, one {# month} other {# months}}', { count })}</>
      );
    case 'years':
      return (
        <>{t('{count, plural, one {# year} other {# years}}', { count })}</>
      );
    default:
      return null;
  }
}

function LeasesSettings() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
  const leasesQuery = useQuery<LeaseData[]>({
    queryKey: [QueryKeys.LEASES],
    queryFn: () => fetchLeases(store)
  });
  const leaseMutation = useMutation({
    mutationFn: updateLease,
    onMutate: async ({ lease }: { lease: LeaseData }) => {
      await queryClient.cancelQueries({ queryKey: [QueryKeys.LEASES] });
      const previous = queryClient.getQueryData<LeaseData[]>([
        QueryKeys.LEASES
      ]);
      queryClient.setQueryData<LeaseData[]>([QueryKeys.LEASES], (leases) =>
        leases?.map((item) => (item._id === lease._id ? lease : item))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData([QueryKeys.LEASES], context?.previous);
      toast.error(t('Error updating lease'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.LEASES] });
    }
  });

  useEffect(() => {
    if (leasesQuery.isError) {
      toast.error(t('Error fetching contracts'));
    }
  }, [leasesQuery.isError, t]);

  const handleNewLeaseDialog = useCallback(() => {
    setOpenNewLeaseDialog(true);
  }, []);

  const openLease = useCallback(
    (lease: LeaseData) => {
      router.push(`/settings/contracts/${lease._id}`);
    },
    [router]
  );

  const handleLeaseChange = useCallback(
    (active: boolean, lease: LeaseData) => {
      leaseMutation.mutate({ store, lease: { ...lease, active } });
    },
    [leaseMutation, store]
  );

  const leases = leasesQuery.data ?? [];

  return (
    <Page
      title={t('Contracts')}
      description={t('The lease models you use to let your properties.')}
      loading={leasesQuery.isLoading}
      actions={[
        {
          id: 'newContract',
          label: t('New contract'),
          icon: LuCirclePlus,
          onClick: handleNewLeaseDialog
        }
      ]}
      dataCy="contractsPage"
    >
      {leasesQuery.isSuccess && leases.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <EmptyIllustration label={t('No contracts yet')} />
          <Button onClick={handleNewLeaseDialog} className="gap-2">
            <LuCirclePlus className="size-4" />
            {t('New contract')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {leases.map((lease) => {
            const switchId = `contract-active-${lease._id}`;
            return (
              <Card
                key={lease._id}
                onClick={() => openLease(lease)}
                className={cn(
                  'p-4 cursor-pointer transition-colors hover:bg-accent/50',
                  !lease.active && 'text-muted-foreground bg-secondary'
                )}
                data-cy="contractCard"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="link"
                    onClick={(event) => {
                      event.stopPropagation();
                      openLease(lease);
                    }}
                    className={cn(
                      'text-xl text-left text-wrap font-semibold p-0 h-auto',
                      !lease.active && 'text-muted-foreground'
                    )}
                    data-cy="openResourceButton"
                  >
                    {lease.name}
                  </Button>
                  {!lease.active ? (
                    <Badge variant="outline">{t('Inactive')}</Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <LeaseDuration lease={lease} />
                  {lease.autoRenew ? (
                    <Badge variant="secondary">{t('Automatic renewal')}</Badge>
                  ) : null}
                  {lease.usedByTenants ? (
                    <Badge variant="secondary">{t('In use by tenants')}</Badge>
                  ) : null}
                </div>
                {lease.description ? (
                  <p className="mt-3 line-clamp-3 whitespace-pre-line">
                    {lease.description}
                  </p>
                ) : null}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops the card click; the switch handles input */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: only stops the card click; the switch handles input */}
                <div
                  className="flex items-center justify-end gap-2 mt-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Label
                    className="text-xs text-muted-foreground font-normal"
                    htmlFor={switchId}
                  >
                    {t('Available for new leases')}
                  </Label>
                  <Switch
                    id={switchId}
                    checked={!!lease.active}
                    onCheckedChange={(checked) =>
                      handleLeaseChange(checked, lease)
                    }
                    data-cy="contractActiveSwitch"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
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
