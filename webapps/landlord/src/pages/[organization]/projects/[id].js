/* eslint-disable import/order, sort-imports */
import { observer } from 'mobx-react-lite';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { LuArrowLeft, LuSave } from 'react-icons/lu';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { withAuthentication } from '../../../components/Authentication';
import NotesPanel from '../../../components/NotesPanel';
import Page from '../../../components/Page';
import ShortcutButton from '../../../components/ShortcutButton';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { StoreContext } from '../../../store';
import useFillStore from '../../../hooks/useFillStore';

async function fetchData(store, router) {
  if (!router.query.id) {
    return;
  }

  await Promise.all([
    store.project.fetchOne(router.query.id),
    store.contractor.fetch()
  ]);
}

function ProjectDetail() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [fetching] = useFillStore(fetchData, [router]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'planned',
    startDate: '',
    endDate: '',
    estimatedCost: '',
    actualCost: '',
    currency: 'USD',
    contractorId: ''
  });

  const [newBid, setNewBid] = useState({
    contractorId: '',
    amount: '',
    notes: ''
  });
  const [creatingBid, setCreatingBid] = useState(false);
  const [bidWorkRecords, setBidWorkRecords] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  const project = store.project.selected;

  const contractorMap = useMemo(() => {
    const map = new Map();
    store.contractor.items.forEach((contractor) => {
      map.set(
        contractor._id,
        contractor.name || contractor.company || t('Unknown')
      );
    });
    return map;
  }, [store.contractor.items, t]);

  const totalBidAmount = useMemo(() => {
    return bidWorkRecords.reduce((sum, work) => {
      const value = Number(work?.estimatedCost || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }, [bidWorkRecords]);

  const loadBids = useCallback(async () => {
    if (!project?._id) {
      return;
    }

    setLoadingBids(true);
    try {
      const response = await store.contractor.fetchAllWork({
        projectId: project._id
      });
      setBidWorkRecords(response?.data || []);
    } catch (error) {
      toast.error(t('Failed to load bids'));
    } finally {
      setLoadingBids(false);
    }
  }, [project?._id, store.contractor, t]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setFormData({
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'planned',
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().slice(0, 10)
        : '',
      endDate: project.endDate
        ? new Date(project.endDate).toISOString().slice(0, 10)
        : '',
      estimatedCost:
        project.estimatedCost === null || project.estimatedCost === undefined
          ? ''
          : String(project.estimatedCost),
      actualCost:
        project.actualCost === null || project.actualCost === undefined
          ? ''
          : String(project.actualCost),
      currency: project.currency || 'USD',
      contractorId: project.contractorId || ''
    });
  }, [project]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const handleBack = useCallback(() => {
    router.push(`/${router.query.organization}/projects`);
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!project?._id) {
      return;
    }

    if (!formData.title.trim()) {
      toast.error(t('Project title is required'));
      return;
    }

    const selectedContractor = store.contractor.items.find(
      (contractor) => contractor._id === formData.contractorId
    );

    const payload = {
      _id: project._id,
      title: formData.title.trim(),
      description: formData.description,
      status: formData.status,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      estimatedCost:
        formData.estimatedCost === '' ? null : Number(formData.estimatedCost),
      actualCost:
        formData.actualCost === '' ? null : Number(formData.actualCost),
      currency: formData.currency || 'USD',
      contractorId: formData.contractorId || null,
      contractorName: selectedContractor
        ? selectedContractor.name || selectedContractor.company || null
        : null
    };

    setSaving(true);
    try {
      await store.project.update(payload);
      toast.success(t('Project updated successfully'));
      await store.project.fetchOne(project._id);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        message
          ? `${t('Failed to update project')}: ${message}`
          : t('Failed to update project')
      );
    } finally {
      setSaving(false);
    }
  }, [formData, project, store.project, store.contractor.items, t]);

  const handleCreateBid = useCallback(async () => {
    if (!project?._id) {
      return;
    }

    if (!newBid.contractorId || !newBid.amount) {
      toast.error(t('Contractor and bid amount are required'));
      return;
    }

    const contractor = store.contractor.items.find(
      (item) => item._id === newBid.contractorId
    );
    if (!contractor) {
      toast.error(t('Contractor not found'));
      return;
    }

    setCreatingBid(true);
    try {
      await store.contractor.createWork(newBid.contractorId, {
        projectId: project._id,
        propertyId:
          project.targetType === 'property' ? project.targetId : undefined,
        title: `Bid - ${project.title}`,
        description: newBid.notes,
        workType: 'Bid',
        status: 'pending',
        startDate: new Date().toISOString(),
        estimatedCost: Number(newBid.amount),
        currency: formData.currency || 'USD',
        paymentStatus: 'unpaid',
        notes: newBid.notes,
        internalNotes: `Project bid for ${project.title}`
      });

      setNewBid({ contractorId: '', amount: '', notes: '' });
      toast.success(t('Bid added successfully'));
      await loadBids();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        message
          ? `${t('Failed to add bid')}: ${message}`
          : t('Failed to add bid')
      );
    } finally {
      setCreatingBid(false);
    }
  }, [formData.currency, loadBids, newBid, project, store.contractor, t]);

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
            label={saving ? t('Saving') : t('Save')}
            Icon={LuSave}
            onClick={handleSave}
          />
        </div>
      }
      dataCy="projectDetail"
    >
      <div className="space-y-4">
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">{t('Project Details')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Input
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: event.target.value
                  }))
                }
                placeholder={t('Project title')}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))
                }
                placeholder={t('Description')}
              />
            </div>

            <div>
              <label className="text-sm">{t('Status')}</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={formData.status}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: event.target.value
                  }))
                }
              >
                <option value="planned">{t('Planned')}</option>
                <option value="in-progress">{t('In Progress')}</option>
                <option value="completed">{t('Completed')}</option>
                <option value="on-hold">{t('On Hold')}</option>
                <option value="cancelled">{t('Cancelled')}</option>
              </select>
            </div>

            <div>
              <label className="text-sm">{t('Contractor')}</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={formData.contractorId}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    contractorId: event.target.value
                  }))
                }
              >
                <option value="">{t('Unassigned')}</option>
                {store.contractor.items.map((contractor) => (
                  <option key={contractor._id} value={contractor._id}>
                    {contractor.name || contractor.company || contractor._id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">{t('Start Date')}</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: event.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm">{t('End Date')}</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    endDate: event.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm">{t('Estimated Cost')}</label>
              <Input
                type="number"
                min="0"
                value={formData.estimatedCost}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedCost: event.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm">{t('Actual Cost')}</label>
              <Input
                type="number"
                min="0"
                value={formData.actualCost}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    actualCost: event.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm">{t('Currency')}</label>
              <Input
                value={formData.currency}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: event.target.value
                  }))
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">{t('Contractor Bids')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm">{t('Contractor')}</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={newBid.contractorId}
                onChange={(event) =>
                  setNewBid((prev) => ({
                    ...prev,
                    contractorId: event.target.value
                  }))
                }
              >
                <option value="">{t('Select contractor')}</option>
                {store.contractor.items.map((contractor) => (
                  <option key={contractor._id} value={contractor._id}>
                    {contractor.name || contractor.company || contractor._id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm">{t('Bid Amount')}</label>
              <Input
                type="number"
                min="0"
                value={newBid.amount}
                onChange={(event) =>
                  setNewBid((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">{t('Notes')}</label>
              <Input
                value={newBid.notes}
                onChange={(event) =>
                  setNewBid((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder={t('Bid details')}
              />
            </div>
          </div>

          <Button onClick={handleCreateBid} disabled={creatingBid}>
            {creatingBid ? t('Saving') : t('Add Bid')}
          </Button>

          <div className="text-sm text-muted-foreground">
            {t('Total Bid Amount')}: {totalBidAmount.toFixed(2)}{' '}
            {formData.currency || 'USD'}
          </div>

          {loadingBids ? (
            <div className="text-sm text-muted-foreground">
              {t('Loading...')}
            </div>
          ) : bidWorkRecords.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t('No bids yet')}
            </div>
          ) : (
            <div className="space-y-2">
              {bidWorkRecords.map((work) => (
                <div key={work._id} className="border rounded p-3 text-sm">
                  <div className="font-medium">
                    {contractorMap.get(work.contractorId) || t('Unknown')}
                  </div>
                  <div className="text-muted-foreground">
                    {Number(work.estimatedCost || 0).toFixed(2)}{' '}
                    {work.currency || formData.currency || 'USD'}
                  </div>
                  {work.notes && <div className="mt-1">{work.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {project?._id && (
          <NotesPanel entityType="project" entityId={project._id} />
        )}
      </div>
    </Page>
  );
}

export default withAuthentication(observer(ProjectDetail));
