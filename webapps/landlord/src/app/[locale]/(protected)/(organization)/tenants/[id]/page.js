'use client';

import { Card } from '@microrealestate/commonui/components/ui/card';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  LuArrowLeft,
  LuCircleStop,
  LuHistory,
  LuPencil,
  LuTrash
} from 'react-icons/lu';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import Page from '@/components/Page';
import RentHistoryDialog from '@/components/rents/RentHistoryDialog';
import ShortcutButton from '@/components/ShortcutButton';
import ContractOverviewCard from '@/components/tenants/ContractOverviewCard';
import RentOverviewCard from '@/components/tenants/RentOverviewCard';
import TenantStepper from '@/components/tenants/TenantStepper';
import TenantTabs from '@/components/tenants/TenantTabs';
import TerminateLeaseDialog from '@/components/tenants/TerminateLeaseDialog';
import useFillStore from '@/hooks/useFillStore';
import { useRouter } from '@/i18n/navigation';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';

async function fetchData(store, params) {
  const results = await Promise.all([
    store.tenant.fetchOne(params.id),
    store.property.fetch(),
    store.lease.fetch(),
    store.template.fetch(),
    store.document.fetchTenant(params.id)
  ]);

  store.tenant.setSelected(
    store.tenant.items.find(({ _id }) => _id === params.id)
  );

  return results;
}

function Tenant() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const params = useParams();
  const { goBack } = useNav();
  const [openRentHistoryDialog, setOpenRentHistoryDialog] = useState(false);
  const [selectedRentHistory, setSelectedRentHistory] = useState({});
  const [openConfirmEditTenant, setOpenConfirmEditTenant] = useState(false);
  const [openConfirmDeleteTenant, setOpenConfirmDeleteTenant] = useState(false);

  const [readOnly, setReadOnly] = useState(
    store.tenant.selected.terminated ||
      !!store.tenant.selected.properties?.length
  );
  const [openTerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useState(false);

  const [fetching] = useFillStore(fetchData, [params]);

  const onEditTenant = () => {
    setReadOnly(false);
  };

  const onDeleteTenant = async () => {
    const { status } = await store.tenant.delete([store.tenant.selected._id]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(
            t('Tenant cannot be deleted because some rents have been paid')
          );
        case 404:
          return toast.error(t('Tenant does not exist'));
        default:
          return toast.error(t('Something went wrong'));
      }
    }
    goBack();
  };

  const onSubmit = async (tenantPart) => {
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
          case 409:
            return toast.error(t('The tenant already exists'));
          default:
            return toast.error(t('Something went wrong'));
        }
      }
      store.tenant.setSelected(data);
      await router.push(`/tenants/${data._id}`);
    }
  };

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

  const handleBack = () => {
    goBack();
  };

  const handleDeleteTenant = () => setOpenConfirmDeleteTenant(true);

  const handleTerminateLease = () => setOpenTerminateLeaseDialog(true);

  const handleRentHistory = () => {
    setSelectedRentHistory({
      tenant: store.tenant.selected,
      selectedTerm: moment()
        .startOf(store.tenant.selected.frequency)
        .format('YYYYMMDDHH')
    });
    setOpenRentHistoryDialog(true);
  };

  const handleEditTenant = () => setOpenConfirmEditTenant(true);

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
              Icon={LuCircleStop}
              onClick={handleTerminateLease}
            />
          ) : null}
          {showEditButton ? (
            <ShortcutButton
              label={t('Edit')}
              Icon={LuPencil}
              onClick={handleEditTenant}
              disabled={!readOnly}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <TenantStepper onSubmit={onSubmit} />
          </Card>
          {!!store.tenant.selected.properties && (
            <div className="hidden md:grid grid-cols-1 gap-4 h-fit sticky top-20">
              <ContractOverviewCard />
              <RentOverviewCard />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TenantTabs onSubmit={onSubmit} readOnly={readOnly} />
            </div>
            {!!store.tenant.selected.properties && (
              <div className="hidden md:grid grid-cols-1 gap-4 h-fit sticky top-20">
                <ContractOverviewCard />
                <RentOverviewCard />
              </div>
            )}
          </div>
          <TerminateLeaseDialog
            open={openTerminateLeaseDialog}
            setOpen={setOpenTerminateLeaseDialog}
            tenant={store.tenant.selected}
          />
          <ConfirmDialog
            title={
              store.tenant.selected.terminated
                ? t('Lease terminated on {terminationDate}', {
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
                'Deleting {tenant} is not allowed because some rent payments have been recorded',
                {
                  tenant: store.tenant.selected.name
                }
              )
            : t('Do you confirm the permanent deletion of {tenant}?', {
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

const TenantPage = observer(function () {
  return <Tenant />;
});
export default TenantPage;
