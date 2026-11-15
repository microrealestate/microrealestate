'use client';

import {
  Alert,
  AlertDescription
} from '@microrealestate/commonui/components/ui/alert';
import { Card } from '@microrealestate/commonui/components/ui/card';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import type { API, LeaseTimeRange } from '@microrealestate/shared';
import { flowResult, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  LuCircleStop,
  LuHistory,
  LuInfo,
  LuPencil,
  LuTrash
} from 'react-icons/lu';
import ConfirmDialog from '@/components/ConfirmDialog';
import Page from '@/components/Page';
import RentHistoryDialog from '@/components/rents/RentHistoryDialog';
import ContractOverviewCard from '@/components/tenants/ContractOverviewCard';
import RentOverviewCard from '@/components/tenants/RentOverviewCard';
import TenantStepper from '@/components/tenants/TenantStepper';
import TenantTabs from '@/components/tenants/TenantTabs';
import TenantTitle from '@/components/tenants/TenantTitle';
import TerminateLeaseDialog from '@/components/tenants/TerminateLeaseDialog';
import useFillStore from '@/hooks/useFillStore';
import { useRouter } from '@/i18n/navigation';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';
import type Store from '@/store/Store';

type TenantParams = { id: string };

type TenantData = Partial<API.Landlord.Tenant.OccupantData> & {
  frequency?: LeaseTimeRange;
};

function selectedTenant(store: Store) {
  return store.tenant.selected as TenantData;
}

async function fetchData(store: Store, params: TenantParams) {
  const results = await Promise.all([
    store.tenant.fetchOne(params.id),
    store.property.fetch(),
    store.lease.fetch(),
    store.template.fetch(),
    store.document.fetchTenant(params.id)
  ]);

  store.tenant.setSelected(
    store.tenant.items.find(
      ({ _id }: API.Landlord.Tenant.OccupantData) => _id === params.id
    )
  );

  return results;
}

function Tenant() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const params = useParams<TenantParams>();
  const { goBack } = useNav();
  const selected = selectedTenant(store);
  const [openRentHistoryDialog, setOpenRentHistoryDialog] = useState(false);
  const [selectedRentHistory, setSelectedRentHistory] = useState<{
    tenant: TenantData | undefined;
    selectedTerm: string | undefined;
  }>({ tenant: undefined, selectedTerm: undefined });
  const [openConfirmEditTenant, setOpenConfirmEditTenant] = useState(false);
  const [openConfirmDeleteTenant, setOpenConfirmDeleteTenant] = useState(false);

  const [readOnly, setReadOnly] = useState(
    selected.terminated || !!selected.properties?.length
  );
  const [openTerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useState(false);

  const [fetching] = useFillStore(fetchData, [params]);

  const onEditTenant = () => {
    setReadOnly(false);
  };

  const onDeleteTenant = async () => {
    const { status } = await flowResult(
      store.tenant.delete([selectedTenant(store)._id])
    );
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
    goBack('/tenants');
  };

  const onSubmit = async (tenantPart: TenantData) => {
    const selectedCopy = toJS(selectedTenant(store));
    const tenant = {
      isCompany: false,
      isVat: false,
      ...selectedCopy,
      properties: (selectedCopy.properties || []).map(
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
      const { status, data } = await flowResult(store.tenant.update(tenant));
      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Tenant name is missing'));
          default:
            return toast.error(t('Something went wrong'));
        }
      }
      store.tenant.setSelected(data);
      if (!selectedCopy.stepperMode) {
        toast.success(t('Changes saved'));
      }
    } else {
      const { status, data } = await flowResult(store.tenant.create(tenant));
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
        selected.beginDate &&
        selected.endDate &&
        !selected.terminationDate &&
        !selected.stepperMode &&
        !selected.terminated
      ),
    [selected]
  );

  const showEditButton = useMemo(
    () => !selected.stepperMode && (selected.properties?.length ?? 0) > 0,
    [selected.properties?.length, selected.stepperMode]
  );

  const handleBack = () => {
    goBack('/tenants');
  };

  const handleDeleteTenant = () => setOpenConfirmDeleteTenant(true);

  const handleTerminateLease = () => setOpenTerminateLeaseDialog(true);

  const handleRentHistory = () => {
    const { frequency } = selectedTenant(store);
    setSelectedRentHistory({
      tenant: selectedTenant(store),
      selectedTerm: (frequency ? moment().startOf(frequency) : moment()).format(
        'YYYYMMDDHH'
      )
    });
    setOpenRentHistoryDialog(true);
  };

  const handleEditTenant = () => setOpenConfirmEditTenant(true);

  return (
    <Page
      description={t(
        'Contact details, lease, billing and documents of this tenant.'
      )}
      loading={fetching}
      title={fetching ? null : <TenantTitle />}
      onBack={handleBack}
      actions={[
        {
          id: 'edit',
          label: t('Edit'),
          icon: LuPencil,
          onClick: handleEditTenant,
          disabled: !readOnly,
          hidden: !showEditButton,
          primary: true
        },
        {
          id: 'schedule',
          label: t('Due dates'),
          icon: LuHistory,
          onClick: handleRentHistory,
          hidden: !showEditButton
        },
        {
          id: 'terminate',
          label: t('Terminate'),
          icon: LuCircleStop,
          onClick: handleTerminateLease,
          hidden: !showTerminateLeaseButton
        },
        {
          id: 'delete',
          label: t('Delete'),
          icon: LuTrash,
          onClick: handleDeleteTenant,
          hidden: !!selected.hasPayments,
          destructive: true,
          dataCy: 'removeResourceButton'
        }
      ]}
      dataCy="tenantPage"
    >
      {selected.stepperMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <TenantStepper onSubmit={onSubmit} />
          </Card>
          {!!selected.properties && (
            <div className="hidden md:grid grid-cols-1 gap-4 h-fit sticky top-20">
              <ContractOverviewCard />
              <RentOverviewCard />
            </div>
          )}
        </div>
      ) : (
        <>
          {selected.hasPayments ? (
            <Alert className="mb-4" data-cy="tenantNotDeletable">
              <LuInfo className="size-4" />
              <AlertDescription>
                {t(
                  'Rent payments are recorded for this tenant, so it cannot be deleted.'
                )}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TenantTabs onSubmit={onSubmit} readOnly={readOnly} />
            </div>
            {!!selected.properties && (
              <div className="hidden md:grid grid-cols-1 gap-4 h-fit sticky top-20">
                <ContractOverviewCard />
                <RentOverviewCard />
              </div>
            )}
          </div>
          <TerminateLeaseDialog
            open={openTerminateLeaseDialog}
            setOpen={setOpenTerminateLeaseDialog}
            tenant={selected}
          />
          <ConfirmDialog
            title={
              selected.terminated
                ? t('Lease terminated on {terminationDate}', {
                    terminationDate: moment(
                      selected.terminationDate,
                      'DD/MM/YYYY'
                    ).format('LL')
                  })
                : t('Lease running')
            }
            subTitle={t(
              'Modifying this form might break the contract signed with the tenant'
            )}
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
        title={t('Deletion of the tenant?')}
        subTitle={t('Do you confirm the permanent deletion of {tenant}?', {
          tenant: selected.name ?? ''
        })}
        open={openConfirmDeleteTenant}
        setOpen={setOpenConfirmDeleteTenant}
        onConfirm={onDeleteTenant}
      />
    </Page>
  );
}

const TenantPage = observer(function () {
  return <Tenant />;
});
export default TenantPage;
