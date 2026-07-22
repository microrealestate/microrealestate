/* eslint-disable sort-imports */
import { LuArrowLeft } from 'react-icons/lu';
import { useCallback, useContext } from 'react';
import { Card } from '../../../../components/ui/card';
import ContractOverviewCard from '../../../../components/tenants/ContractOverviewCard';
import LeaseContractForm from '../../../../components/tenants/forms/LeaseContractForm';
import LeaseWorkflowPanel from '../../../../components/leaseinstances/LeaseWorkflowPanel';
import Page from '../../../../components/Page';
import ShortcutButton from '../../../../components/ShortcutButton';
import { StoreContext } from '../../../../store';
import { observer } from 'mobx-react-lite';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import useFillStore from '../../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';
import moment from 'moment';
/* eslint-enable sort-imports */

function toIsoDate(dateValue) {
  if (!dateValue) {
    return null;
  }
  const parsed = moment(dateValue, 'DD/MM/YYYY', true);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.toDate().toISOString();
}

async function syncTenantLeaseInstance(store, tenant) {
  const primaryPropertyId = tenant?.properties?.[0]?.propertyId;
  if (!tenant?._id || !primaryPropertyId) {
    return;
  }

  const startDate = toIsoDate(tenant.beginDate);
  const endDate = toIsoDate(tenant.endDate);
  const invoiceEmail = tenant.invoiceEmail || null;

  await store.leaseInstance.fetchByTenant(tenant._id);
  const existingDraft = (store.leaseInstance.items || []).find(
    ({ status, propertyId }) =>
      status === 'draft' && String(propertyId || '') === String(primaryPropertyId)
  );

  const payload = {
    propertyId: String(primaryPropertyId),
    tenantIds: [String(tenant._id)],
    startDate,
    endDate,
    invoiceEmail,
    notes: tenant.contract || ''
  };

  if (existingDraft?._id) {
    await store.leaseInstance.update({
      _id: existingDraft._id,
      ...payload
    });
    return;
  }

  await store.leaseInstance.create(payload);
}

async function fetchData(store, router) {
  const results = await Promise.all([
    store.tenant.fetchOne(router.query.id),
    store.leaseInstance.fetchByTenant(router.query.id),
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

function TenantLeasePage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [fetching] = useFillStore(fetchData, [router]);

  const handleBack = useCallback(() => {
    router.push(`/${store.organization.selected.name}/tenants/${store.tenant.selected._id}`);
  }, [router, store.organization.selected.name, store.tenant.selected._id]);

  const onSubmitLease = useCallback(
    async (tenantPart) => {
      const existing = toJS(store.tenant.selected);

      // Build updated properties list from submitted propertyIds array,
      // preserving existing rent/expense data for already-assigned properties.
      let properties = [];
      const submittedIds = tenantPart.propertyIds || [];\n      if (submittedIds.length > 0) {\n        const existingMap = Object.fromEntries(\n          (existing.properties || []).map((p) => [\n            String(p.propertyId),\n            { propertyId: p.propertyId, entryDate: p.entryDate, exitDate: p.exitDate, rent: p.rent, expenses: p.expenses }\n          ])\n        );\n        properties = submittedIds.map((id) => existingMap[String(id)] || { propertyId: id, rent: 0, expenses: [] });\n      }

      const tenant = {
        ...existing,
        properties,
        ...(tenantPart.leaseId !== undefined ? { leaseId: tenantPart.leaseId } : {}),
        ...(tenantPart.frequency !== undefined ? { frequency: tenantPart.frequency } : {}),
        ...(tenantPart.beginDate !== undefined ? { beginDate: tenantPart.beginDate } : {}),
        ...(tenantPart.endDate !== undefined ? { endDate: tenantPart.endDate } : {})
      };

      const { status, data } = await store.tenant.update(tenant);
      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Lease fields are missing'));
          case 403:
            return toast.error(t('You are not allowed to update this lease'));
          case 409:
            return toast.error(
              t('Lease cannot be updated with the current contract values')
            );
          default:
            return toast.error(t('Something went wrong'));
        }
      }

      store.tenant.setSelected(data);
      await store.document.fetch();
      await syncTenantLeaseInstance(store, data);
      toast.success(t('Lease saved'));
    },
    [store, t]
  );

  return (
    <Page
      loading={fetching}
      dataCy="tenantLeasePage"
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('Back to tenant')}
            Icon={LuArrowLeft}
            onClick={handleBack}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-6">
            <LeaseContractForm onSubmit={onSubmitLease} readOnly={false} />
          </Card>
          <LeaseWorkflowPanel tenantId={store.tenant.selected?._id} />
        </div>
        <div className="hidden md:grid grid-cols-1 gap-4 h-fit">
          <ContractOverviewCard />
        </div>
      </div>
    </Page>
  );
}

export default withAuthentication(observer(TenantLeasePage));
