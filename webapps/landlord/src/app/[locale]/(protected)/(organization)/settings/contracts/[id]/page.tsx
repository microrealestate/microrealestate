'use client';

import {
  Alert,
  AlertDescription
} from '@microrealestate/commonui/components/ui/alert';
import { Card } from '@microrealestate/commonui/components/ui/card';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import type { API } from '@microrealestate/shared';
import { flowResult } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuInfo, LuTrash } from 'react-icons/lu';
import ConfirmDialog from '@/components/ConfirmDialog';
import LeaseStepper from '@/components/organization/lease/LeaseStepper';
import LeaseTabs from '@/components/organization/lease/LeaseTabs';
import LeaseTitle from '@/components/organization/lease/LeaseTitle';
import Page from '@/components/Page';
import useFillStore from '@/hooks/useFillStore';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';
import type Store from '@/store/Store';

type ContractParams = { id: string };

function selectedLease(store: Store) {
  return store.lease.selected as
    | Partial<API.Landlord.Lease.LeaseData>
    | undefined;
}

async function fetchData(store: Store, params: ContractParams) {
  const results = await Promise.all([
    store.lease.fetchOne(params.id),
    store.template.fetch(),
    store.template.fetchFields()
  ]);

  store.lease.setSelected(
    store.lease.items.find(({ _id }) => _id === params.id)
  );

  return results;
}

function Contract() {
  const t = useTranslations('common');
  const store = useStore();
  const params = useParams<ContractParams>();
  const { goBack } = useNav();
  const [openRemoveContractDialog, setOpenRemoveContractDialog] =
    useState(false);
  const [fetching] = useFillStore(fetchData, [params]);

  // biome-ignore lint/suspicious/noExplicitAny: the lease forms are untyped JS
  const onLeaseAddUpdate = async (leasePart: any) => {
    const lease = {
      ...store.lease.selected,
      ...leasePart
    };

    const isUpdate = !!selectedLease(store)?._id;
    const inStepper = !!selectedLease(store)?.stepperMode;
    let status: number;
    if (!isUpdate) {
      const response = await flowResult(store.lease.create(lease));
      status = response.status;
    } else {
      const response = await flowResult(store.lease.update(lease));
      status = response.status;
    }

    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(t('Some fields are missing'));
        case 404:
          return toast.error(t('Contract is not found'));
        case 409:
          return toast.error(t('The contract already exists'));
        default:
          return toast.error(t('Something went wrong'));
      }
    }
    if (isUpdate && !inStepper) {
      toast.success(t('Changes saved'));
    }
  };

  const handleBack = () => {
    goBack('/settings/contracts');
  };

  const onLeaseRemove = async () => {
    const { status } = await flowResult(
      store.lease.delete([selectedLease(store)?._id])
    );
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(
            t('Contract is used by tenants, it cannot be removed')
          );
        default:
          return toast.error(t('Something went wrong'));
      }
    }
    goBack('/settings/contracts');
  };

  return (
    <Page
      description={t(
        'Terms and template documents of this lease model, used for each new lease.'
      )}
      loading={fetching}
      title={fetching ? null : <LeaseTitle />}
      onBack={handleBack}
      actions={[
        {
          id: 'delete',
          label: t('Delete'),
          icon: LuTrash,
          onClick: () => setOpenRemoveContractDialog(true),
          hidden: !!selectedLease(store)?.usedByTenants,
          destructive: true,
          dataCy: 'removeResourceButton'
        }
      ]}
      dataCy="contractPage"
    >
      <div className="space-y-4">
        {selectedLease(store)?.usedByTenants ? (
          <Alert data-cy="contractInUse">
            <LuInfo className="size-4" />
            <AlertDescription>
              {t(
                'Tenants use this contract. You cannot delete it or change its rent payment period or lease length.'
              )}
            </AlertDescription>
          </Alert>
        ) : null}
        {selectedLease(store)?.stepperMode ? (
          <Card>
            <LeaseStepper onSubmit={onLeaseAddUpdate} />
          </Card>
        ) : (
          <LeaseTabs onSubmit={onLeaseAddUpdate} />
        )}
      </div>
      <ConfirmDialog
        title={t('Are you sure to remove this contract?')}
        subTitle={selectedLease(store)?.name}
        open={openRemoveContractDialog}
        setOpen={setOpenRemoveContractDialog}
        onConfirm={onLeaseRemove}
      />
    </Page>
  );
}

const ContractPage = observer(function () {
  return <Contract />;
});
export default ContractPage;
