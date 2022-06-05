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
import CompulsoryDocumentStatus from '../../../components/tenants/CompulsaryDocumentStatus';
import ContractOverviewCard from '../../../components/tenants/ContractOverviewCard';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { isServer } from '../../../utils';
import { MobileButton } from '../../../components/MobileMenuButton';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import RentOverviewCard from '../../../components/tenants/RentOverviewCard';
import StopIcon from '@material-ui/icons/Stop';
import TenantStepper from '../../../components/tenants/TenantStepper';
import TenantTabs from '../../../components/tenants/TenantTabs';
import { toJS } from 'mobx';
import useConfirmDialog from '../../../components/ConfirmDialog';
import useRichTextEditorDialog from '../../../components/RichTextEditor/RichTextEditorDialog';
import { useRouter } from 'next/router';
import useTerminateLeaseDialog from '../../../components/tenants/TerminateLeaseDialog';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const Tenant = observer(() => {
  console.log('Tenant functional component');
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [ConfirmEditDialog, setOpenConfirmEditTenant] = useConfirmDialog();
  const [ConfirmDeleteDialog, setOpenConfirmDeleteTenant] = useConfirmDialog();

  const [readOnly, setReadOnly] = useState(
    store.tenant.selected.terminated ||
      !!store.tenant.selected.properties?.length
  );
  const [TerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useTerminateLeaseDialog();

  const [RichTextEditorDialog, , editContract] = useRichTextEditorDialog();
  const {
    query: {
      param: [, backPage, backPath],
    },
  } = router;

  const onEditTenant = useCallback(() => {
    setReadOnly(false);
  }, []);

  const onDeleteTenant = useCallback(async () => {
    const { status } = await store.tenant.delete([store.tenant.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return store.pushToastMessage({
            message: t(
              'Tenant cannot be deleted because some rents have been paid'
            ),
            severity: 'error',
          });
        case 404:
          return store.pushToastMessage({
            message: t('Tenant does not exist'),
            severity: 'error',
          });
        case 403:
          return store.pushToastMessage({
            message: t('You are not allowed to delete the tenant'),
            severity: 'error',
          });
        default:
          return store.pushToastMessage({
            message: t('Something went wrong'),
            severity: 'error',
          });
      }
    }

    await router.push(backPath);
  }, [store, router, backPath, t]);

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

      if (tenant._id) {
        const { status, data } = await store.tenant.update(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return store.pushToastMessage({
                message: t('Tenant name is missing'),
                severity: 'error',
              });
            case 403:
              return store.pushToastMessage({
                message: t('You are not allowed to update the tenant'),
                severity: 'error',
              });
            default:
              return store.pushToastMessage({
                message: t('Something went wrong'),
                severity: 'error',
              });
          }
        }
        store.tenant.setSelected(data);
      } else {
        const { status, data } = await store.tenant.create(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return store.pushToastMessage({
                message: t('Tenant name is missing'),
                severity: 'error',
              });
            case 403:
              return store.pushToastMessage({
                message: t('You are not allowed to add a tenant'),
                severity: 'error',
              });
            case 409:
              return store.pushToastMessage({
                message: t('The tenant already exists'),
                severity: 'error',
              });
            default:
              return store.pushToastMessage({
                message: t('Something went wrong'),
                severity: 'error',
              });
          }
        }
        store.tenant.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/tenants/${data._id}`
        );
      }
    },
    [store, t, router]
  );

  const showTerminateLeaseButton = useMemo(
    () =>
      !!(
        store.tenant.selected.beginDate &&
        store.tenant.selected.endDate &&
        !store.tenant.selected.terminationDate &&
        !store.tenant.selected.stepperMode &&
        !store.tenant.selected.terminated
      ),
    [store.tenant.selected]
  );

  const showEditButton = useMemo(
    () =>
      !store.tenant.selected.stepperMode &&
      store.tenant.selected.properties?.length > 0 &&
      readOnly,
    [
      readOnly,
      store.tenant.selected.properties?.length,
      store.tenant.selected.stepperMode,
    ]
  );

  const onLoadContract = useCallback(async () => {
    let contents = '';
    let contractId = editContract?.contractId;

    if (contractId) {
      // document already generated
      const { status, data } = await store.document.fetchOne(contractId);
      if (status !== 200) {
        return store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
      contents = data.contents;
      return contents;
    }

    // no existing document then generate it from the lease template
    // (if template not available then generate an empty document)
    const lease = store.lease.items.find(
      ({ _id }) => _id === editContract?.leaseId
    );
    const templateId = lease?.templateId;
    const { status, data } = await store.document.create({
      templateId,
      tenantId: editContract._id,
      leaseId: lease._id,
      type: 'text',
      name: editContract.name,
    });
    if (status !== 200) {
      return store.pushToastMessage({
        message: t('Something went wrong'),
        severity: 'error',
      });
    }
    contractId = data._id;
    contents = data.contents;

    await onSubmit({ contractId });
    return contents;
  }, [
    editContract?.contractId,
    editContract._id,
    editContract.name,
    editContract?.leaseId,
    store,
    onSubmit,
    t,
  ]);

  const onSaveContract = useCallback(
    async (contents, html) => {
      const { status } = await store.document.update({
        _id: editContract.contractId,
        contents,
        html,
      });
      if (status !== 200) {
        return store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
    },
    [editContract.contractId, store, t]
  );

  const handleDeleteTenant = useCallback(
    () => setOpenConfirmDeleteTenant(true),
    [setOpenConfirmDeleteTenant]
  );

  const handleTerminateLease = useCallback(
    () => setOpenTerminateLeaseDialog(true),
    [setOpenTerminateLeaseDialog]
  );

  const handleEditTenant = useCallback(
    () => setOpenConfirmEditTenant(true),
    [setOpenConfirmEditTenant]
  );

  return (
    <Page
      title={store.tenant.selected.name}
      ActionToolbar={
        !isMobile ? (
          <Grid container spacing={2}>
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
                    onClick={handleDeleteTenant}
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
                  onClick={handleTerminateLease}
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
                  onClick={handleEditTenant}
                >
                  {t('Edit')}
                </Button>
              </Grid>
            )}
          </Grid>
        ) : (
          <Grid container>
            {!store.tenant.selected.hasPayments && (
              <Grid item>
                <MobileButton
                  label={t('Delete')}
                  Icon={DeleteIcon}
                  onClick={handleDeleteTenant}
                />
              </Grid>
            )}
            {showTerminateLeaseButton && (
              <Grid item>
                <MobileButton
                  label={t('Terminate')}
                  Icon={StopIcon}
                  onClick={handleTerminateLease}
                />
              </Grid>
            )}
            {showEditButton && (
              <Grid item>
                <MobileButton
                  label={t('Edit')}
                  Icon={EditIcon}
                  onClick={handleEditTenant}
                />
              </Grid>
            )}
          </Grid>
        )
      }
      NavBar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.tenant.selected.name}
        />
      }
    >
      {store.tenant.selected.stepperMode ? (
        <Paper>
          <TenantStepper onSubmit={onSubmit} />
        </Paper>
      ) : (
        <>
          <CompulsoryDocumentStatus tenant={store.tenant.selected} mb={4} />

          <Grid container spacing={5}>
            <Grid item xs={12} md={7} lg={8}>
              <TenantTabs onSubmit={onSubmit} readOnly={readOnly} />
            </Grid>
            {!!store.tenant.selected.properties && (
              <Grid item xs={12} md={5} lg={4}>
                <Box pb={4}>
                  <ContractOverviewCard />
                </Box>
                <Box pb={4}>
                  <RentOverviewCard />
                </Box>
              </Grid>
            )}
          </Grid>
          <RichTextEditorDialog
            onLoad={onLoadContract}
            onSave={onSaveContract}
            title={store.tenant.selected.name}
            hideFields={true}
          />
          <TerminateLeaseDialog />
          <ConfirmEditDialog
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
            onConfirm={onEditTenant}
          />
        </>
      )}
      <ConfirmDeleteDialog
        title={t('Are you sure to definitely remove this tenant?')}
        subTitle={store.tenant.selected.name}
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
