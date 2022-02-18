import { getStoreInstance, StoreContext } from '../../../../store';
import { Grid, Paper } from '@material-ui/core';
import { useCallback, useContext, useState } from 'react';

import { ADMIN_ROLE } from '../../../../store/User';
import BreadcrumbBar from '../../../../components/BreadcrumbBar';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { isServer } from '../../../../utils';
import LeaseForm from '../../../../components/organization/LeaseForm';
import LeaseTemplatesCard from '../../../../components/organization/LeaseTemplatesCard';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import RequestError from '../../../../components/RequestError';
import { RestrictButton } from '../../../../components/RestrictedComponents';
import router from 'next/router';
import { toJS } from 'mobx';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

const Lease = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [error, setError] = useState('');
  const [removeLease, setRemoveLease] = useState(false);
  const {
    query: {
      param: [, backPage, backPath],
    },
  } = router;

  const onLeaseAddUpdate = useCallback(
    async (leasePart) => {
      setError('');

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
            return setError(t('Some fields are missing'));
          case 403:
            return setError(t('You are not allowed to update the contract'));
          case 404:
            return setError(t('Contract is not found'));
          case 409:
            return setError(t('The contract already exists'));
          default:
            return setError(t('Something went wrong'));
        }
      }
    },
    [
      // t,
      setError,
      store.lease,
    ]
  );

  const onLeaseRemove = useCallback(async () => {
    const { status } = await store.lease.delete([store.lease.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return setError(
            t('Contract is used by tenants, it cannot be removed')
          );
        case 403:
          return setError(t('You are not allowed to update the contract'));
        default:
          return setError(t('Something went wrong'));
      }
    }
    router.push(`/${store.organization.selected.name}/settings#leases`);
  }, [
    // t,
    setError,
    store.lease,
    store.organization.selected.name,
  ]);

  return (
    <Page
      ActionToolbar={
        <RestrictButton
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={() => setRemoveLease(true)}
          disabled={
            store.lease.selected?.usedByTenants || store.lease.selected?.system
          }
          disabledTooltipTitle={
            store.lease.selected?.usedByTenants
              ? t('Contract currently used')
              : store.lease.selected?.system
              ? t('System contract cannot be removed')
              : ''
          }
          onlyRoles={[ADMIN_ROLE]}
        >
          {t('Delete')}
        </RestrictButton>
      }
      PrimaryToolbar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.lease.selected?.name || t('New contract')}
        />
      }
    >
      <RequestError error={error} />
      <Grid container spacing={5}>
        <Grid item xs={12} md={7} lg={8}>
          <Paper>
            <LeaseForm onSubmit={onLeaseAddUpdate} onRemove={onLeaseRemove} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <LeaseTemplatesCard />
        </Grid>
      </Grid>
      <ConfirmDialog
        title={t('Are you sure to remove this contract?')}
        subTitle={store.lease.selected?.name}
        open={removeLease}
        setOpen={setRemoveLease}
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
