import {
  ArrowLeftIcon,
  HistoryIcon,
  PencilIcon,
  StopCircleIcon,
  TrashIcon
} from 'lucide-react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/card';
import ContractOverviewCard from '../../../components/tenants/ContractOverviewCard';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import RentOverviewCard from '../../../components/tenants/RentOverviewCard';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import TenantStepper from '../../../components/tenants/TenantStepper';
import TenantTabs from '../../../components/tenants/TenantTabs';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import useConfirmDialog from '../../../components/ConfirmDialog';
import useFillStore from '../../../hooks/useFillStore';
import useRentHistoryDialog from '../../../components/rents/RentHistoryDialog';
import useRichTextEditorDialog from '../../../components/RichTextEditor/RichTextEditorDialog';
import { useRouter } from 'next/router';
import useTerminateLeaseDialog from '../../../components/tenants/TerminateLeaseDialog';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

async function fetchData(store, router) {
  const tenantId = store.tenant.selected?._id || router.query.param[0];
  const results = await Promise.all([
    store.tenant.fetchOne(tenantId),
    store.property.fetch(),
    store.lease.fetch(),
    store.template.fetch(),
    store.document.fetch()
  ]);

  store.tenant.setSelected(
    store.tenant.items.find(({ _id }) => _id === tenantId)
  );

  return results;
}

function Tenant() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [RentHistoryDialog, setOpenRentHistoryDialog] = useRentHistoryDialog();
  const [ConfirmEditDialog, setOpenConfirmEditTenant] = useConfirmDialog();
  const [ConfirmDeleteDialog, setOpenConfirmDeleteTenant] = useConfirmDialog();

  const [readOnly, setReadOnly] = useState(
    store.tenant.selected.terminated ||
      !!store.tenant.selected.properties?.length
  );
  const [TerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useTerminateLeaseDialog();

  const [RichTextEditorDialog, , editContract] = useRichTextEditorDialog();

  const [fetching] = useFillStore(fetchData, [router]);

  const {
    query: {
      param: [, , backPath]
    }
  } = router;

  const onEditTenant = useCallback(() => {
    setReadOnly(false);
  }, []);

  const onDeleteTenant = useCallback(async () => {
    const { status } = await store.tenant.delete([store.tenant.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(
            t('Tenant cannot be deleted because some rents have been paid')
          );
        case 404:
          return toast.error(t('Tenant does not exist'));
        case 403:
          return toast.error(t('You are not allowed to delete the tenant'));
        default:
          return toast.error(t('Something went wrong'));
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
            expenses
          })
        ),
        ...tenantPart
      };

      if (tenant._id) {
        const { status, data } = await store.tenant.update(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Tenant name is missing'));
            case 403:
              return toast.error(t('You are not allowed to update the tenant'));
            default:
              return toast.error(t('Something went wrong'));
          }
        }
        store.tenant.setSelected(data);
      } else {
        const { status, data } = await store.tenant.create(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Tenant name is missing'));
            case 403:
              return toast.error(t('You are not allowed to add a tenant'));
            case 409:
              return toast.error(t('The tenant already exists'));
            default:
              return toast.error(t('Something went wrong'));
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
      store.tenant.selected.properties?.length > 0,
    [
      store.tenant.selected.properties?.length,
      store.tenant.selected.stepperMode
    ]
  );

  const onLoadContract = useCallback(async () => {
    let contents = '';
    let contractId = editContract?.contractId;

    if (contractId) {
      // document already generated
      const { status, data } = await store.document.fetchOne(contractId);
      if (status !== 200) {
        return toast.error(t('Something went wrong'));
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
      name: editContract.name
    });
    if (status !== 200) {
      return toast.error(t('Something went wrong'));
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
    t
  ]);

  const onSaveContract = useCallback(
    async (contents, html) => {
      const { status } = await store.document.update({
        _id: editContract.contractId,
        contents,
        html
      });
      if (status !== 200) {
        return toast.error(t('Something went wrong'));
      }
    },
    [editContract.contractId, store, t]
  );

  const handleBack = useCallback(() => {
    router.push(backPath);
  }, [router, backPath]);

  const handleDeleteTenant = useCallback(
    () => setOpenConfirmDeleteTenant(true),
    [setOpenConfirmDeleteTenant]
  );

  const handleTerminateLease = useCallback(
    () => setOpenTerminateLeaseDialog(true),
    [setOpenTerminateLeaseDialog]
  );

  const handleRentHistory = useCallback(
    () => setOpenRentHistoryDialog(store.tenant.selected),
    [setOpenRentHistoryDialog, store.tenant.selected]
  );

  const handleEditTenant = useCallback(
    () => setOpenConfirmEditTenant(true),
    [setOpenConfirmEditTenant]
  );

  return (
    <Page
      loading={fetching}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('Back')}
            Icon={ArrowLeftIcon}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={TrashIcon}
            disabled={store.tenant.selected.hasPayments}
            onClick={handleDeleteTenant}
          />
          {showTerminateLeaseButton ? (
            <ShortcutButton
              label={t('Terminate')}
              Icon={StopCircleIcon}
              onClick={handleTerminateLease}
            />
          ) : null}
          {showEditButton ? (
            <ShortcutButton
              label={t('Edit')}
              Icon={PencilIcon}
              onClick={handleEditTenant}
            />
          ) : null}
          {showEditButton ? (
            <ShortcutButton
              Icon={HistoryIcon}
              label={t('Schedule')}
              onClick={handleRentHistory}
            />
          ) : null}
        </div>
      }
    >
      {store.tenant.selected.stepperMode ? (
        <Card>
          <TenantStepper onSubmit={onSubmit} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TenantTabs onSubmit={onSubmit} readOnly={readOnly} />
            </div>
            {!!store.tenant.selected.properties && (
              <div className="hidden md:grid grid-cols-1 gap-4 h-fit">
                <ContractOverviewCard />
                <RentOverviewCard />
              </div>
            )}
          </div>
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
                    ).format('LL')
                  })
                : t('Lease running')
            }
            subTitle={t(
              'Modifying this form might break the contract signed with the tenant'
            )}
            subTitle2={t('Continue editing?')}
            onConfirm={onEditTenant}
          />
        </>
      )}
      <RentHistoryDialog />
      <ConfirmDeleteDialog
        title={
          store.tenant.selected.hasPayments
            ? t('This tenant cannot be deleted')
            : t('Deletion of the tenant?')
        }
        subTitle={
          store.tenant.selected.hasPayments
            ? t(
                'Deleting {{tenant}} is not allowed because some rent settlements have been recorded',
                {
                  tenant: store.tenant.selected.name
                }
              )
            : t('Do you confirm the permanent deletion of {{tenant}}?', {
                tenant: store.tenant.selected.name
              })
        }
        justOkButton={store.tenant.selected.hasPayments}
        onConfirm={!store.tenant.selected.hasPayments ? onDeleteTenant : null}
      />
    </Page>
  );
}

export default withAuthentication(observer(Tenant));
