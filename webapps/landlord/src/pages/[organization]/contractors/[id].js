import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { LuArrowLeft, LuPencil, LuPlusCircle, LuTrash } from 'react-icons/lu';
import Page from '../../../components/Page';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import { observer } from 'mobx-react-lite';
import useFillStore from '../../../hooks/useFillStore';
import ConfirmDialog from '../../../components/ConfirmDialog';
import NotesPanel from '../../../components/NotesPanel';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs';

async function fetchData(store, router) {
  if (router.query.id && router.query.id !== 'new') {
    return await store.contractor.fetchOne(router.query.id);
  }
}

function ContractorDetail() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [fetching] = useFillStore(fetchData, [router]);
  const [formData, setFormData] = useState({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [workRecords, setWorkRecords] = useState([]);
  const [loadingWork, setLoadingWork] = useState(false);

  const isNew = router.query.id === 'new';
  const contractor = store.contractor.selected;

  // Initialize form with contractor data
  useEffect(() => {
    if (contractor) {
      setFormData({
        name: contractor.name || '',
        businessType: contractor.businessType || '',
        company: contractor.company || '',
        manager: contractor.manager || '',
        isCompany: contractor.isCompany || false,
        street1: contractor.street1 || '',
        street2: contractor.street2 || '',
        city: contractor.city || '',
        zipCode: contractor.zipCode || '',
        country: contractor.country || '',
        phone: contractor.contacts?.[0]?.phone || '',
        email: contractor.contacts?.[0]?.email || '',
        legalForm: contractor.legalForm || '',
        siret: contractor.siret || '',
        taxId: contractor.taxId || '',
        licenseNumber: contractor.licenseNumber || '',
        notes: contractor.notes || '',
        active: contractor.active !== false
      });

      // Load work records
      if (contractor._id) {
        loadWorkRecords(contractor._id);
      }
    } else if (!isNew) {
      setFormData({});
    }
  }, [contractor]);

  const loadWorkRecords = async (contractorId) => {
    setLoadingWork(true);
    try {
      const result = await store.contractor.fetchWork(contractorId);
      setWorkRecords(result.data || []);
    } catch (err) {
      console.error('Error loading work records:', err);
    } finally {
      setLoadingWork(false);
    }
  };

  const handleBack = useCallback(() => {
    router.push(`/${router.query.organization}/contractors`);
  }, [router]);

  const handleDelete = useCallback(() => {
    setOpenConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await store.contractor.delete([contractor._id]);
      toast.success(t('Contractor deleted'));
      router.push(`/${router.query.organization}/contractors`);
    } catch (err) {
      toast.error(t('Error deleting contractor'));
    }
  }, [store, contractor, router, t]);

  const handleSave = useCallback(async () => {
    try {
      const data = {
        ...formData,
        contacts:
          formData.email || formData.phone
            ? [
                {
                  contact: formData.phone || formData.email,
                  phone: formData.phone,
                  email: formData.email
                }
              ]
            : []
      };

      if (isNew) {
        await store.contractor.create(data);
        toast.success(t('Contractor created'));
        router.push(`/${router.query.organization}/contractors`);
      } else {
        await store.contractor.update({
          _id: contractor._id,
          ...data
        });
        toast.success(t('Contractor updated'));
      }
    } catch (err) {
      toast.error(t('Error saving contractor'));
      console.error(err);
    }
  }, [formData, isNew, contractor, store, router, t]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

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
          {!isNew && (
            <ShortcutButton
              label={t('Delete')}
              Icon={LuTrash}
              onClick={handleDelete}
              className="col-start-2 col-end-2"
            />
          )}
        </div>
      }
      dataCy="contractorPage"
    >
      <div className="space-y-4">
        {!isNew && contractor ? (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="flex justify-start overflow-x-auto overflow-y-hidden">
              <TabsTrigger value="info">{t('Information')}</TabsTrigger>
              <TabsTrigger value="work">{t('Work Records')}</TabsTrigger>
              <TabsTrigger value="notes">{t('Notes')}</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('Name')}</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder={t('Name')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t('Business Type')}
                    </label>
                    <Input
                      value={formData.businessType}
                      onChange={(e) =>
                        handleFormChange('businessType', e.target.value)
                      }
                      placeholder={t('e.g., Plumber, Electrician')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('Phone')}</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        handleFormChange('phone', e.target.value)
                      }
                      placeholder={t('Phone')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('Email')}</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleFormChange('email', e.target.value)
                      }
                      placeholder={t('Email')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('Street')}</label>
                    <Input
                      value={formData.street1}
                      onChange={(e) =>
                        handleFormChange('street1', e.target.value)
                      }
                      placeholder={t('Street')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('City')}</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                      placeholder={t('City')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t('Zip Code')}
                    </label>
                    <Input
                      value={formData.zipCode}
                      onChange={(e) =>
                        handleFormChange('zipCode', e.target.value)
                      }
                      placeholder={t('Zip Code')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t('Country')}
                    </label>
                    <Input
                      value={formData.country}
                      onChange={(e) =>
                        handleFormChange('country', e.target.value)
                      }
                      placeholder={t('Country')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">{t('Notes')}</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) =>
                        handleFormChange('notes', e.target.value)
                      }
                      placeholder={t('Notes')}
                    />
                  </div>
                </div>
                <Button onClick={handleSave}>{t('Save')}</Button>
              </Card>
            </TabsContent>

            <TabsContent value="work">
              <Card className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{t('Work Records')}</h3>
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/${router.query.organization}/contractors/${contractor._id}/work`
                      )
                    }
                  >
                    <LuPlusCircle className="w-4 h-4 mr-2" />
                    {t('Add Work')}
                  </Button>
                </div>

                {workRecords.length === 0 ? (
                  <p className="text-muted-foreground">
                    {t('No work records')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-2">{t('Title')}</th>
                          <th className="text-left p-2">{t('Date')}</th>
                          <th className="text-left p-2">{t('Status')}</th>
                          <th className="text-left p-2">{t('Cost')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workRecords.map((work) => (
                          <tr
                            key={work._id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="p-2">{work.title}</td>
                            <td className="p-2">
                              {new Date(work.startDate).toLocaleDateString()}
                            </td>
                            <td className="p-2">{work.status}</td>
                            <td className="p-2">
                              {work.actualCost
                                ? `${work.actualCost} ${work.currency}`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <NotesPanel entityType="contact" entityId={contractor._id} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('Name')}</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder={t('Name')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t('Business Type')}
                </label>
                <Input
                  value={formData.businessType || ''}
                  onChange={(e) =>
                    handleFormChange('businessType', e.target.value)
                  }
                  placeholder={t('e.g., Plumber, Electrician')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('Phone')}</label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder={t('Phone')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('Email')}</label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder={t('Email')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('Street')}</label>
                <Input
                  value={formData.street1 || ''}
                  onChange={(e) => handleFormChange('street1', e.target.value)}
                  placeholder={t('Street')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('City')}</label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder={t('City')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('Zip Code')}</label>
                <Input
                  value={formData.zipCode || ''}
                  onChange={(e) => handleFormChange('zipCode', e.target.value)}
                  placeholder={t('Zip Code')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('Country')}</label>
                <Input
                  value={formData.country || ''}
                  onChange={(e) => handleFormChange('country', e.target.value)}
                  placeholder={t('Country')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">{t('Notes')}</label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder={t('Notes')}
                />
              </div>
            </div>
            <Button onClick={handleSave}>{t('Create Contractor')}</Button>
          </Card>
        )}
      </div>

      <ConfirmDialog
        title={t('Delete Contractor')}
        subTitle={contractor?.name}
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        onConfirm={handleConfirmDelete}
      />
    </Page>
  );
}

export default withAuthentication(observer(ContractorDetail));
