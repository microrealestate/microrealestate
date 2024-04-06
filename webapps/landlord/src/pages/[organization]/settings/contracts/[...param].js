import { ArrowLeftIcon, TrashIcon } from 'lucide-react';
import { useCallback, useContext } from 'react';
import { ADMIN_ROLE } from '../../../../store/User';
import { Card } from '../../../../components/ui/card';
import LeaseStepper from '../../../../components/organization/lease/LeaseStepper';
import LeaseTabs from '../../../../components/organization/lease/LeaseTabs';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import router from 'next/router';
import ShortcutButton from '../../../../components/ShortcutButton';
import { StoreContext } from '../../../../store';
import { toast } from 'sonner';
import useConfirmDialog from '../../../../components/ConfirmDialog';
import useFillStore from '../../../../hooks/useFillStore';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

async function fetchData(store, router) {
  const {
    param: [leaseId],
  } = router.query;

  const results = await Promise.all([
    store.lease.fetchOne(leaseId),
    store.template.fetch(),
    store.template.fetchFields(),
  ]);

  store.lease.setSelected(store.lease.items.find(({ _id }) => _id === leaseId));

  return results;
}

function Contract() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setRemoveLease] = useConfirmDialog();
  const [fetching] = useFillStore(fetchData, [router]);

  const {
    query: {
      param: [, , backPath],
    },
  } = router;

  const onLeaseAddUpdate = useCallback(
    async (leasePart) => {
      const lease = {
        ...store.lease.selected,
        ...leasePart,
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
          case 403:
            return toast.error(t('You are not allowed to update the contract'));
          case 404:
            return toast.error(t('Contract is not found'));
          case 409:
            return toast.error(t('The contract already exists'));
          default:
            return toast.error(t('Something went wrong'));
        }
      }
    },
    [store, t]
  );

  const handleBack = useCallback(() => {
    router.push(backPath);
  }, [backPath]);

  const onLeaseRemove = useCallback(async () => {
    const { status } = await store.lease.delete([store.lease.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(t('Contract is used by tenants, it cannot be removed'));
        case 403:
          return toast.error(t('You are not allowed to update the contract'));
        default:
          return toast.error(t('Something went wrong'));
      }
    }
    router.push(`/${store.organization.selected.name}/settings#leases`);
  }, [store, t]);

  return (
    <Page
      loading={fetching}
      ActionBar={
        <div className='grid grid-cols-5 gap-1.5 md:gap-4'>
          <ShortcutButton
            label={t('Back')}
            Icon={ArrowLeftIcon}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={TrashIcon}
            onClick={() => setRemoveLease(true)}
            disabled={store.lease.selected?.usedByTenants || store.user.role !== ADMIN_ROLE}
            className="col-start-2 col-end-2"
          />
        </div>
      }
    >
      <Card>
        {store.lease.selected?.stepperMode ? (
          <LeaseStepper onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
        ) : (
          <LeaseTabs onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
        )}
      </Card>
      <ConfirmDialog
        title={t('Are you sure to remove this contract?')}
        subTitle={store.lease.selected?.name}
        onConfirm={onLeaseRemove}
      />
    </Page>
  );
}

export default withAuthentication(observer(Contract), ADMIN_ROLE);
