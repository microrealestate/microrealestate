import { Box, Paper } from '@material-ui/core';
import { useCallback, useContext } from 'react';

import { ADMIN_ROLE } from '../../../../store/User';
import BreadcrumbBar from '../../../../components/BreadcrumbBar';
import DeleteIcon from '@material-ui/icons/Delete';
import Hidden from '../../../../components/HiddenSSRCompatible';
import LeaseStepper from '../../../../components/organization/lease/LeaseStepper';
import LeaseTabs from '../../../../components/organization/lease/LeaseTabs';
import { MobileButton } from '../../../../components/MobileMenuButton';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import { RestrictButton } from '../../../../components/RestrictedComponents';
import router from 'next/router';
import { StoreContext } from '../../../../store';
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

const Lease = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setRemoveLease] = useConfirmDialog();
  const [fetching] = useFillStore(fetchData, [router]);

  const {
    query: {
      param: [, backPage, backPath],
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
            return store.pushToastMessage({
              message: t('Some fields are missing'),
              severity: 'error',
            });
          case 403:
            return store.pushToastMessage({
              message: t('You are not allowed to update the contract'),
              severity: 'error',
            });
          case 404:
            return store.pushToastMessage({
              message: t('Contract is not found'),
              severity: 'error',
            });
          case 409:
            return store.pushToastMessage({
              message: t('The contract already exists'),
              severity: 'error',
            });
          default:
            return store.pushToastMessage({
              message: t('Something went wrong'),
              severity: 'error',
            });
        }
      }
    },
    [store, t]
  );

  const onLeaseRemove = useCallback(async () => {
    const { status } = await store.lease.delete([store.lease.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return store.pushToastMessage({
            message: t('Contract is used by tenants, it cannot be removed'),
            severity: 'error',
          });
        case 403:
          return store.pushToastMessage({
            message: t('You are not allowed to update the contract'),
            severity: 'error',
          });
        default:
          return store.pushToastMessage({
            message: t('Something went wrong'),
            severity: 'error',
          });
      }
    }
    router.push(`/${store.organization.selected.name}/settings#leases`);
  }, [store, t]);

  return (
    <Page
      loading={fetching}
      ActionBar={
        <Box display="flex" justifyContent="space-between">
          <BreadcrumbBar
            backPath={backPath}
            backPage={backPage}
            currentPage={store.lease.selected?.name || t('New contract')}
          />
          <Hidden smDown>
            <RestrictButton
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={() => setRemoveLease(true)}
              disabled={store.lease.selected?.usedByTenants}
              disabledTooltipTitle={t('Contract currently used')}
            >
              {t('Delete')}
            </RestrictButton>
          </Hidden>
          <Hidden mdUp>
            <MobileButton
              label={t('Delete')}
              Icon={DeleteIcon}
              disabled={store.lease.selected?.usedByTenants}
              onClick={() => setRemoveLease(true)}
            />
          </Hidden>
        </Box>
      }
    >
      {store.lease.selected?.stepperMode ? (
        <Paper>
          <LeaseStepper onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
        </Paper>
      ) : (
        <Paper>
          <LeaseTabs onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
        </Paper>
      )}
      <ConfirmDialog
        title={t('Are you sure to remove this contract?')}
        subTitle={store.lease.selected?.name}
        onConfirm={onLeaseRemove}
      />
    </Page>
  );
});

export default withAuthentication(Lease, ADMIN_ROLE);
