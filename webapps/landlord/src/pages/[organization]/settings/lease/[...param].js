import { getStoreInstance, StoreContext } from '../../../../store';
import { useCallback, useContext } from 'react';

import { ADMIN_ROLE } from '../../../../store/User';
import BreadcrumbBar from '../../../../components/BreadcrumbBar';
import DeleteIcon from '@material-ui/icons/Delete';
import { isServer } from '../../../../utils';
import LeaseStepper from '../../../../components/organization/lease/LeaseStepper';
import LeaseTabs from '../../../../components/organization/lease/LeaseTabs';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import { Paper } from '@material-ui/core';
import { RestrictButton } from '../../../../components/RestrictedComponents';
import router from 'next/router';
import { toJS } from 'mobx';
import useConfirmDialog from '../../../../components/ConfirmDialog';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

const Lease = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setRemoveLease] = useConfirmDialog();

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
      title={store.lease.selected?.name || t('New contract')}
      ActionToolbar={
        <RestrictButton
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={() => setRemoveLease(true)}
          disabled={store.lease.selected?.usedByTenants}
          disabledTooltipTitle={t('Contract currently used')}
          onlyRoles={[ADMIN_ROLE]}
        >
          {t('Delete')}
        </RestrictButton>
      }
      NavBar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.lease.selected?.name || t('New contract')}
        />
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

Lease.getInitialProps = async (context) => {
  console.log('Lease.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();
  const {
    param: [leaseId],
  } = context.query;

  const responses = await Promise.all([
    store.lease.fetchOne(leaseId),
    store.template.fetch(),
    store.template.fetchFields(),
  ]);

  const errorStatusCode = responses.find(({ status }) => status !== 200);

  if (errorStatusCode) {
    return { error: { statusCode: errorStatusCode } };
  }

  const [leaseResponse] = responses;
  const { data: lease } = leaseResponse;
  store.lease.setSelected(lease);

  return {
    initialState: {
      store: toJS(store),
    },
  };
};

export default withAuthentication(Lease);
