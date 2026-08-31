'use client';

import { Card } from '@microrealestate/commonui/components/ui/card';
import { observer } from 'mobx-react-lite';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuArrowLeft, LuTrash } from 'react-icons/lu';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import LeaseStepper from '@/components/organization/lease/LeaseStepper';
import LeaseTabs from '@/components/organization/lease/LeaseTabs';
import Page from '@/components/Page';
import ShortcutButton from '@/components/ShortcutButton';
import useFillStore from '@/hooks/useFillStore';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';

async function fetchData(store, params) {
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
  const params = useParams();
  const { goBack } = useNav();
  const [openRemoveContractDialog, setOpenRemoveContractDialog] =
    useState(false);
  const [fetching] = useFillStore(fetchData, [params]);

  const onLeaseAddUpdate = async (leasePart) => {
    const lease = {
      ...store.lease.selected,
      ...leasePart
    };

    let status;
    if (!store.lease.selected._id) {
      const response = await store.lease.create(lease);
      status = response.status;
    } else {
      const response = await store.lease.update(lease);
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
  };

  const handleBack = () => {
    goBack();
  };

  const onLeaseRemove = async () => {
    const { status } = await store.lease.delete([store.lease.selected._id]);
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
    goBack();
  };

  return (
    <Page
      loading={fetching}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('Back')}
            Icon={LuArrowLeft}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={LuTrash}
            onClick={() => setOpenRemoveContractDialog(true)}
            disabled={store.lease.selected?.usedByTenants}
            className="col-start-2 col-end-2"
            dataCy="removeResourceButton"
          />
        </div>
      }
      dataCy="contractPage"
    >
      {store.lease.selected?.stepperMode ? (
        <Card>
          <LeaseStepper onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
        </Card>
      ) : (
        <LeaseTabs onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
      )}
      <ConfirmDialog
        title={t('Are you sure to remove this contract?')}
        subTitle={store.lease.selected?.name}
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
