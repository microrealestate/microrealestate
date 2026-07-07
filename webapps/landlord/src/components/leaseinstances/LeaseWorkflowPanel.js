import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/card';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

function getLeaseLabel(t, lease) {
  if (lease.status === 'active') {
    return t('Active');
  }
  if (lease.status === 'expired') {
    return t('Expired');
  }
  return t('Draft');
}

function LeaseDates({ startDate, endDate }) {
  if (!startDate && !endDate) {
    return <span>-</span>;
  }

  return (
    <span>
      {startDate ? moment(startDate).format('L') : '-'}
      {' to '}
      {endDate ? moment(endDate).format('L') : '-'}
    </span>
  );
}

function LeaseWorkflowPanel({ propertyId, tenantId }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(false);
  const [pendingActionId, setPendingActionId] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (tenantId) {
        await store.leaseInstance.fetchByTenant(tenantId);
      } else if (propertyId) {
        await store.leaseInstance.fetchByProperty(propertyId);
      } else {
        store.leaseInstance.items = [];
      }
    } finally {
      setLoading(false);
    }
  }, [propertyId, store, tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const leases = useMemo(() => {
    if (tenantId) {
      return (store.leaseInstance.items || []).filter(({ tenantIds = [] }) =>
        tenantIds.includes(String(tenantId))
      );
    }
    if (propertyId) {
      return (store.leaseInstance.items || []).filter(
        ({ propertyId: currentPropertyId }) =>
          String(currentPropertyId || '') === String(propertyId)
      );
    }
    return store.leaseInstance.items || [];
  }, [propertyId, store.leaseInstance.items, tenantId]);

  const onActivate = useCallback(
    async (leaseInstanceId) => {
      setPendingActionId(leaseInstanceId);
      const { status, data } = await store.leaseInstance.activate(leaseInstanceId);
      setPendingActionId('');

      if (status !== 200) {
        const msg = data?.message || t('Unable to activate lease');
        toast.error(msg);
      }
    },
    [store, t]
  );

  const onDelete = useCallback(
    async (leaseInstanceId) => {
      setPendingActionId(leaseInstanceId);
      const { status, data } = await store.leaseInstance.delete(leaseInstanceId);
      setPendingActionId('');

      if (status !== 204) {
        const msg = data?.message || t('Unable to delete lease draft');
        toast.error(msg);
      }
    },
    [store, t]
  );

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">{t('Lease workflow')}</h3>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-muted"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? t('Loading...') : t('Refresh')}
        </button>
      </div>

      {!leases.length ? (
        <div className="text-sm text-muted-foreground">
          {t('No lease instances yet')}
        </div>
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => {
            const isBusy = pendingActionId === lease._id;

            return (
              <div key={lease._id} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium">
                    {t('Status')}: {getLeaseLabel(t, lease)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lease.lastUpdatedBy || '-'}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {t('Period')}: <LeaseDates startDate={lease.startDate} endDate={lease.endDate} />
                </div>

                <div className="text-sm text-muted-foreground">
                  {t('Tenants assigned')}: {lease.tenantIds?.length || 0}
                </div>

                <div className="flex items-center gap-2">
                  {lease.status === 'draft' ? (
                    <button
                      type="button"
                      className="px-3 py-1 text-sm border rounded hover:bg-muted"
                      onClick={() => onActivate(lease._id)}
                      disabled={isBusy}
                    >
                      {t('Activate')}
                    </button>
                  ) : null}
                  {lease.status === 'draft' ? (
                    <button
                      type="button"
                      className="px-3 py-1 text-sm border rounded hover:bg-muted"
                      onClick={() => onDelete(lease._id)}
                      disabled={isBusy}
                    >
                      {t('Delete draft')}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default observer(LeaseWorkflowPanel);
