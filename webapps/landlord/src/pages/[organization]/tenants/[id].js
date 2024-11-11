import {
  LuArrowLeft,
  LuHistory,
  LuPencil,
  LuStopCircle,
  LuTrash
} from 'react-icons/lu';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/card';
import ConfirmDialog from '../../../components/ConfirmDialog';
import ContractOverviewCard from '../../../components/tenants/ContractOverviewCard';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import RentHistoryDialog from '../../../components/rents/RentHistoryDialog';
import RentOverviewCard from '../../../components/tenants/RentOverviewCard';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import TenantStepper from '../../../components/tenants/TenantStepper';
import TenantTabs from '../../../components/tenants/TenantTabs';
import TerminateLeaseDialog from '../../../components/tenants/TerminateLeaseDialog';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

async function fetchData(store, router) {
  const results = await Promise.all([
    store.tenant.fetchOne(router.query.id),
    store.property.fetch(),
    store.lease.fetch(),
    store.template.fetch(),
    store.document.fetch()
  ]);

  store.tenant.setSelected(
    store.tenant.items.find(({ _id }) => _id === router.query.id)
  );

  return results;
}

function Tenant() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [openRentHistoryDialog, setOpenRentHistoryDialog] = useState(false);
  const [selectedRentHistory, setSelectedRentHistory] = useState(null);
  const [openConfirmEditTenant, setOpenConfirmEditTenant] = useState(false);
  const [openConfirmDeleteTenant, setOpenConfirmDeleteTenant] = useState(false);

  const [readOnly, setReadOnly] = useState(
    store.tenant.selected.terminated ||
      !!store.tenant.selected.properties?.length
  );
  const [openTerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useState(false);

  const [fetching] = useFillStore(fetchData, [router]);

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

    await router.push(store.appHistory.previousPath);
  }, [store, router, t]);

  const onSubmit = useCallback(
    async (tenantPart) => {
      let tenant = toJS(store.tenant.selected);

      tenant.properties = tenant.properties || [];
      tenant = {
        isCompany: false,
        isVat: false,
        ...tenant,
        properties: tenant.properties.map(
          ({ propertyId, entryDate, exitDate, rent, expenses }) => ({
            propertyId,
            entryDate,
            exitDate,
            rent,
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

  const handleBack = useCallback(() => {
    router.push(store.appHistory.previousPath);
  }, [router, store.appHistory.previousPath]);

  const handleDeleteTenant = useCallback(
    () => setOpenConfirmDeleteTenant(true),
    [setOpenConfirmDeleteTenant]
  );

  const handleTerminateLease = useCallback(
    () => setOpenTerminateLeaseDialog(true),
    [setOpenTerminateLeaseDialog]
  );

  const handleRentHistory = useCallback(() => {
    setSelectedRentHistory(store.tenant.selected);
    setOpenRentHistoryDialog(true);
  }, [setOpenRentHistoryDialog, setSelectedRentHistory, store.tenant.selected]);

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
            Icon={LuArrowLeft}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={LuTrash}
            disabled={store.tenant.selected.hasPayments}
            onClick={handleDeleteTenant}
            dataCy="removeResourceButton"
          />
          {showTerminateLeaseButton ? (
            <ShortcutButton
              label={t('Terminate')}
              Icon={LuStopCircle}
              onClick={handleTerminateLease}
            />
          ) : null}
          {showEditButton ? (
            <ShortcutButton
              label={t('Edit')}
              Icon={LuPencil}
              onClick={handleEditTenant}
            />
          ) : null}
          {showEditButton ? (
            <ShortcutButton
              Icon={LuHistory}
              label={t('Schedule')}
              onClick={handleRentHistory}
            />
          ) : null}
        </div>
      }
      dataCy="tenantPage"
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
          <TerminateLeaseDialog
            open={openTerminateLeaseDialog}
            setOpen={setOpenTerminateLeaseDialog}
          />
          <ConfirmDialog
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
            open={openConfirmEditTenant}
            setOpen={setOpenConfirmEditTenant}
            onConfirm={onEditTenant}
          />
        </>
      )}
      <RentHistoryDialog
        open={openRentHistoryDialog}
        setOpen={setOpenRentHistoryDialog}
        data={selectedRentHistory}
      />
      <ConfirmDialog
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
        open={openConfirmDeleteTenant}
        setOpen={setOpenConfirmDeleteTenant}
        justOkButton={store.tenant.selected.hasPayments}
        onConfirm={!store.tenant.selected.hasPayments ? onDeleteTenant : null}
      />
    </Page>
  );
}

export default withAuthentication(observer(Tenant));
