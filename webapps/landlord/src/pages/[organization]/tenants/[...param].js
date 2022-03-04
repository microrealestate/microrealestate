import {
  Box,
  Button,
  Grid,
  Paper,
  Tooltip,
  useMediaQuery,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../store';
import { useCallback, useContext, useMemo, useState } from 'react';

import BreadcrumbBar from '../../../components/BreadcrumbBar';
import ConfirmDialog from '../../../components/ConfirmDialog';
import ContractOverviewCard from '../../../components/tenants/ContractOverviewCard';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { isServer } from '../../../utils';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import RentOverviewCard from '../../../components/tenants/RentOverviewCard';
import RequestError from '../../../components/RequestError';
import RichTextEditorDialog from '../../../components/RichTextEditor/RichTextEditorDialog';
import StopIcon from '@material-ui/icons/Stop';
import TenantDocumentsCard from '../../../components/tenants/TenantDocumentsCard';
import TenantStepper from '../../../components/tenants/TenantStepper';
import TenantTabs from '../../../components/tenants/TenantTabs';
import TerminateLeaseDialog from '../../../components/tenants/TerminateLeaseDialog';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const Tenant = observer(() => {
  console.log('Tenant functional component');
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const [readOnly, setReadOnly] = useState(
    store.tenant.selected.terminated ||
      !!store.tenant.selected.properties?.length
  );
  const [error, setError] = useState('');
  const [openTerminateLease, setOpenTerminateLease] = useState(false);
  const [openConfirmDeleteTenant, setOpenConfirmDeleteTenant] = useState(false);
  const [openConfirmEditTenant, setOpenConfirmEditTenant] = useState(false);
  const [editContract, setEditContract] = useState(false);
  const {
    query: {
      param: [, backPage, backPath],
    },
  } = router;
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const onDeleteTenant = useCallback(async () => {
    setError('');

    const { status } = await store.tenant.delete([store.tenant.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return setError(
            t('Tenant cannot be deleted because some rents have been paid')
          );
        case 404:
          return setError(t('Tenant does not exist'));
        case 403:
          return setError(t('You are not allowed to delete the tenant'));
        default:
          return setError(t('Something went wrong'));
      }
    }

    await router.push(backPath);
  }, [
    // t,
    router,
    backPath,
    store.tenant,
  ]);

  const onSubmit = useCallback(
    async (tenantPart) => {
      let tenant = toJS(store.tenant.selected);

      tenant.properties = tenant.properties || [];
      tenant = {
        isCompany: false,
        isVat: false,
        ...tenant,
        properties: tenant.properties.map(
          ({ propertyId, entryDate, exitDate, expenses }) => ({
            propertyId,
            entryDate,
            exitDate,
            expenses,
          })
        ),
        ...tenantPart,
      };

      setError('');

      if (tenant._id) {
        const { status, data } = await store.tenant.update(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return setError(t('Tenant name is missing'));
            case 403:
              return setError(t('You are not allowed to update the tenant'));
            default:
              return setError(t('Something went wrong'));
          }
        }
        store.tenant.setSelected(data);
      } else {
        const { status, data } = await store.tenant.create(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return setError(t('Tenant name is missing'));
            case 403:
              return setError(t('You are not allowed to add a tenant'));
            case 409:
              return setError(t('The tenant already exists'));
            default:
              return setError(t('Something went wrong'));
          }
        }
        store.tenant.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/tenants/${data._id}`
        );
      }
    },
    [
      // t,
      router,
      store.organization.selected.name,
      store.tenant,
    ]
  );

  const showTerminateLeaseButton = useMemo(
    () =>
      !!(
        store.tenant.selected.beginDate &&
        store.tenant.selected.endDate &&
        !store.tenant.selected.terminationDate &&
        !store.tenant.selected.stepperMode
      ),
    [store.tenant.selected]
  );

  const showEditButton = useMemo(
    () => !store.tenant.selected.stepperMode,
    [store.tenant.selected]
  );

  const onLoadContract = useCallback(async () => {
    // TODO: handle errors
    //setError('');
    let contents = '';
    let contractId = editContract?.contractId;

    if (contractId) {
      // document already generated
      const { /*status,*/ data } = await store.document.fetchOne(contractId);
      contents = data.contents;
      return contents;
    }

    // no existing document then generate it from the lease template
    // (if template not available then generate an empty document)
    const lease = store.lease.items.find(
      ({ _id }) => _id === editContract?.leaseId
    );
    const templateId = lease?.templateId;
    const { /*status,*/ data } = await store.document.create({
      templateId,
      tenantId: editContract._id,
      leaseId: lease._id,
      type: 'contract',
      name: editContract.name,
    });
    contractId = data._id;
    contents = data.contents;

    await onSubmit({ contractId });
    return contents;
  }, [store.document, store.lease.items, editContract, onSubmit]);

  const onSaveContract = useCallback(
    async (contents, html) => {
      // TODO: handle errors
      //setError('');
      await store.document.update({
        _id: editContract.contractId,
        contents,
        html,
      });
      // if (status !== 200) {
      //   // switch (status) {
      //   //   case 422:
      //   //     return setError(
      //   //       t('')
      //   //     );
      //   //   case 404:
      //   //     return setError(t('Template does not exist'));
      //   //   case 403:
      //   //     return setError(t(''));
      //   //   default:
      //   //     return setError(t('Something went wrong'));
      //   // }
      //   return console.error(status);
      // }
    },
    [editContract, store.document]
  );

  return (
    <Page
      ActionToolbar={
        <Grid container spacing={!isMobile ? 2 : 1}>
          <Grid item>
            <Tooltip
              title={
                store.tenant.selected.hasPayments
                  ? t(
                      'This tenant cannot be deleted because some rent settlements have been recorded'
                    )
                  : ''
              }
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={<DeleteIcon />}
                  disabled={store.tenant.selected.hasPayments}
                  size={isMobile ? 'small' : 'medium'}
                  onClick={() => setOpenConfirmDeleteTenant(true)}
                >
                  {t('Delete')}
                </Button>
              </span>
            </Tooltip>
          </Grid>
          {showTerminateLeaseButton && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<StopIcon />}
                disabled={store.tenant.selected.terminated}
                size={isMobile ? 'small' : 'medium'}
                onClick={() => setOpenTerminateLease(true)}
              >
                {t('Terminate')}
              </Button>
            </Grid>
          )}
          {showEditButton && (
            <Grid item>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                disabled={
                  !(!!store.tenant.selected.properties?.length && readOnly)
                }
                size={isMobile ? 'small' : 'medium'}
                onClick={() => setOpenConfirmEditTenant(true)}
              >
                {t('Edit')}
              </Button>
            </Grid>
          )}
        </Grid>
      }
      NavBar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.tenant.selected.name}
        />
      }
    >
      <RequestError error={error} />
      {store.tenant.selected.stepperMode ? (
        <Paper>
          <TenantStepper onSubmit={onSubmit} />
        </Paper>
      ) : (
        <>
          <Grid container spacing={5}>
            <Grid item sm={12} md={7} lg={8}>
              <Paper>
                <TenantTabs onSubmit={onSubmit} readOnly={readOnly} />
              </Paper>
            </Grid>
            {!!store.tenant.selected.properties && (
              <Grid item xs={12} md={5} lg={4}>
                <Box pb={4}>
                  <ContractOverviewCard />
                </Box>
                <Box pb={4}>
                  <RentOverviewCard />
                </Box>
                {!store.tenant.selected.stepperMode && <TenantDocumentsCard />}
              </Grid>
            )}
          </Grid>
          <RichTextEditorDialog
            open={editContract}
            setOpen={setEditContract}
            onLoad={onLoadContract}
            onSave={onSaveContract}
            title={store.tenant.selected.name}
            hideFields={true}
          />
          <TerminateLeaseDialog
            open={openTerminateLease}
            setOpen={setOpenTerminateLease}
          />
          <ConfirmDialog
            title={
              store.tenant.selected.terminated
                ? t('Lease terminated on {{terminationDate}}', {
                    terminationDate: moment(
                      store.tenant.selected.terminationDate,
                      'DD/MM/YYYY'
                    ).format('LL'),
                  })
                : t('Lease is in progress')
            }
            subTitle={t(
              'Modifying this form might break the contract signed with the tenant'
            )}
            subTitle2={t('Continue editing?')}
            open={openConfirmEditTenant}
            setOpen={setOpenConfirmEditTenant}
            onConfirm={() => setReadOnly(false)}
          />
        </>
      )}
      <ConfirmDialog
        title={t('Are you sure to definitely remove this tenant?')}
        subTitle={store.tenant.selected.name}
        open={openConfirmDeleteTenant}
        setOpen={setOpenConfirmDeleteTenant}
        onConfirm={onDeleteTenant}
      />
    </Page>
  );
});

Tenant.getInitialProps = async (context) => {
  console.log('Tenant.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();
  const tenantId = isServer()
    ? context.query.param[0]
    : store.tenant.selected._id;

  const responses = await Promise.all([
    store.tenant.fetchOne(tenantId),
    store.property.fetch(),
    store.lease.fetch(),
    store.template.fetch(),
    store.document.fetch(),
  ]);

  const statuses = responses.map(({ status }) => status);

  if (statuses.every((status) => status !== 200)) {
    return { error: { statusCode: statuses.find((status) => status !== 200) } };
  }

  store.tenant.setSelected(responses[0].data);

  const props = {
    initialState: {
      store: toJS(store),
    },
  };
  return props;
};

export default withAuthentication(Tenant);
