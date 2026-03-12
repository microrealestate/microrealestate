import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import { LuArrowLeft, LuPlusCircle, LuStar, LuTrash } from 'react-icons/lu';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs';
import { apiFetcher } from '../../../utils/fetch';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { Input } from '../../../components/ui/input';
import NotesPanel from '../../../components/NotesPanel';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const WORK_ATTACHMENT_CATEGORY = 'work_record_attachment';
const DEFAULT_CONTRACTOR_TYPES = [
  'Plumber',
  'Electrician',
  'Painter',
  'Carpenter',
  'HVAC',
  'General Contractor',
  'Landscaper',
  'Roofer',
  'Cleaner',
  'Handyman'
];

function StarRating({ value = 0, sizeClassName = 'w-4 h-4' }) {
  const safeValue = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <LuStar
          key={starValue}
          className={`${sizeClassName} ${starValue <= safeValue ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );
}

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
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
  const [workRecords, setWorkRecords] = useState([]);
  const [loadingWork, setLoadingWork] = useState(false);
  const [workAttachmentsByRecord, setWorkAttachmentsByRecord] = useState({});
  const [uploadingWorkAttachmentId, setUploadingWorkAttachmentId] =
    useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [openWorkModal, setOpenWorkModal] = useState(false);
  const [workFormData, setWorkFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    startDate: '',
    endDate: '',
    estimatedCost: '',
    actualCost: '',
    currency: 'USD'
  });

  const isNew = router.query.id === 'new';
  const contractor = store.contractor.selected;

  const contractorTypeSuggestions = useMemo(() => {
    const suggestions = new Set(DEFAULT_CONTRACTOR_TYPES);
    (store.contractor.items || []).forEach((item) => {
      if (item?.businessType) {
        suggestions.add(item.businessType);
      }
    });

    if (formData.businessType) {
      suggestions.add(formData.businessType);
    }

    return Array.from(suggestions).sort((a, b) => a.localeCompare(b));
  }, [formData.businessType, store.contractor.items]);

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
        loadProjects(contractor._id);
      }
    } else if (!isNew) {
      setFormData({});
    }
  }, [contractor]);

  const loadWorkRecords = async (contractorId) => {
    setLoadingWork(true);
    try {
      const result = await store.contractor.fetchWork(contractorId);
      const records = result.data || [];
      setWorkRecords(records);
      await loadWorkAttachments(records);
    } catch (err) {
      console.error('Error loading work records:', err);
      setWorkAttachmentsByRecord({});
    } finally {
      setLoadingWork(false);
    }
  };

  const loadWorkAttachments = async (records) => {
    if (!records?.length) {
      setWorkAttachmentsByRecord({});
      return;
    }

    try {
      const attachmentResponses = await Promise.all(
        records.map(async (work) => {
          const response = await apiFetcher().get('/attachments', {
            params: {
              targetType: 'contractor_work',
              targetId: work._id,
              category: WORK_ATTACHMENT_CATEGORY
            }
          });

          return {
            workId: work._id,
            attachments: response.data || []
          };
        })
      );

      const map = attachmentResponses.reduce((acc, item) => {
        acc[item.workId] = item.attachments;
        return acc;
      }, {});

      setWorkAttachmentsByRecord(map);
    } catch (err) {
      console.error('Error loading work attachments:', err);
      setWorkAttachmentsByRecord({});
    }
  };

  const handleWorkAttachmentUpload = async (workId, event) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploadingWorkAttachmentId(workId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetType', 'contractor_work');
      formData.append('targetId', workId);
      formData.append('category', WORK_ATTACHMENT_CATEGORY);

      await apiFetcher().post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(t('File uploaded successfully'));
      await loadWorkRecords(contractor._id);
    } catch (err) {
      toast.error(t('Failed to upload file'));
      console.error('Error uploading work attachment:', err);
    } finally {
      setUploadingWorkAttachmentId(null);
      fileInput.value = '';
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await apiFetcher().get(
        `/attachments/${attachmentId}/download`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(t('Failed to download file'));
      console.error('Error downloading attachment:', err);
    }
  };

  const loadProjects = async (contractorId) => {
    setLoadingProjects(true);
    try {
      const response = await apiFetcher().get('/projects', {
        params: { contractorId }
      });
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error loading contractor projects:', err);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
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

  const handleWorkFormChange = (field, value) => {
    setWorkFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddWork = useCallback(() => {
    setWorkFormData({
      title: '',
      description: '',
      status: 'pending',
      startDate: '',
      endDate: '',
      estimatedCost: '',
      actualCost: '',
      currency: 'USD'
    });
    setOpenWorkModal(true);
  }, []);

  const handleSaveWork = useCallback(async () => {
    try {
      await apiFetcher().post(
        `/contractors/${contractor._id}/work`,
        workFormData
      );
      toast.success(t('Work record created'));
      setOpenWorkModal(false);
      loadWorkRecords(contractor._id);
    } catch (err) {
      toast.error(t('Error creating work record'));
      console.error(err);
    }
  }, [workFormData, contractor, t]);

  const handleAddReview = useCallback(async () => {
    if (!contractor?._id) {
      return;
    }

    const rating = Number(reviewForm.rating);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error(t('Rating must be between 1 and 5'));
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await apiFetcher().post(
        `/contractors/${contractor._id}/reviews`,
        {
          rating,
          comment: reviewForm.comment
        }
      );

      const updatedContractor = response.data;
      store.contractor.setSelected(updatedContractor);
      store.contractor.setItems(
        store.contractor.items.map((item) =>
          item._id === updatedContractor._id ? updatedContractor : item
        )
      );

      setReviewForm({ rating: '5', comment: '' });
      toast.success(t('Review added'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('Failed to add review'));
    } finally {
      setSubmittingReview(false);
    }
  }, [
    contractor?._id,
    reviewForm.comment,
    reviewForm.rating,
    store.contractor,
    t
  ]);

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
        <datalist id="contractor-type-options">
          {contractorTypeSuggestions.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>

        {!isNew && contractor ? (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="flex justify-start overflow-x-auto overflow-y-hidden">
              <TabsTrigger value="info">{t('Information')}</TabsTrigger>
              <TabsTrigger value="reviews">{t('Reviews')}</TabsTrigger>
              <TabsTrigger value="work">{t('Work Records')}</TabsTrigger>
              <TabsTrigger value="projects">{t('Projects')}</TabsTrigger>
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
                      list="contractor-type-options"
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

            <TabsContent value="reviews">
              <Card className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="text-lg font-semibold">{t('Reviews')}</h3>
                  <div className="flex items-center gap-2">
                    <StarRating value={contractor.rating || 0} />
                    <span className="text-sm text-muted-foreground">
                      {Number(contractor.rating || 0).toFixed(1)} (
                      {(contractor.reviews || []).length})
                    </span>
                  </div>
                </div>

                <div className="rounded border p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">
                        {t('Rating')}
                      </label>
                      <Select
                        value={reviewForm.rating}
                        onValueChange={(value) =>
                          setReviewForm((prev) => ({ ...prev, rating: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">
                        {t('Comment')}
                      </label>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            comment: e.target.value
                          }))
                        }
                        placeholder={t('Share your feedback')}
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddReview} disabled={submittingReview}>
                    {submittingReview ? t('Saving...') : t('Add review')}
                  </Button>
                </div>

                {(contractor.reviews || []).length === 0 ? (
                  <p className="text-muted-foreground">{t('No reviews yet')}</p>
                ) : (
                  <div className="space-y-3">
                    {[...(contractor.reviews || [])]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt || 0).getTime() -
                          new Date(a.createdAt || 0).getTime()
                      )
                      .map((review, index) => (
                        <div
                          key={`${review.createdAt || index}-${review.authorId || index}`}
                          className="rounded border p-3 space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <StarRating value={review.rating || 0} />
                              <span className="text-sm font-medium">
                                {review.authorName || t('User')}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {review.createdAt
                                ? new Date(
                                    review.createdAt
                                  ).toLocaleDateString()
                                : '-'}
                            </span>
                          </div>
                          {review.comment ? (
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="work">
              <Card className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{t('Work Records')}</h3>
                  <Button size="sm" onClick={handleAddWork}>
                    <LuPlusCircle className="w-4 h-4 mr-2" />
                    {t('Add Work')}
                  </Button>
                </div>

                {loadingWork ? (
                  <p className="text-muted-foreground">{t('Loading...')}</p>
                ) : workRecords.length === 0 ? (
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
                          <th className="text-left p-2">{t('Attachments')}</th>
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
                            <td className="p-2 space-y-2">
                              <label className="inline-flex cursor-pointer items-center rounded border px-2 py-1 text-xs hover:bg-muted">
                                {uploadingWorkAttachmentId === work._id
                                  ? t('Uploading...')
                                  : t('Upload File')}
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(event) =>
                                    handleWorkAttachmentUpload(work._id, event)
                                  }
                                  disabled={
                                    uploadingWorkAttachmentId === work._id
                                  }
                                />
                              </label>
                              {(workAttachmentsByRecord[work._id] || [])
                                .length > 0 && (
                                <div className="space-y-1">
                                  {workAttachmentsByRecord[work._id].map(
                                    (attachment) => (
                                      <button
                                        key={attachment._id}
                                        type="button"
                                        className="block text-left text-xs text-blue-600 hover:underline"
                                        onClick={() =>
                                          handleDownloadAttachment(
                                            attachment._id,
                                            attachment.filename
                                          )
                                        }
                                      >
                                        {attachment.filename}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">{t('Projects')}</h3>

                {loadingProjects ? (
                  <p className="text-muted-foreground">{t('Loading...')}</p>
                ) : projects.length === 0 ? (
                  <p className="text-muted-foreground">
                    {t('No projects yet')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-2">{t('Title')}</th>
                          <th className="text-left p-2">{t('Status')}</th>
                          <th className="text-left p-2">{t('Start Date')}</th>
                          <th className="text-left p-2">{t('End Date')}</th>
                          <th className="text-left p-2">{t('Cost')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => (
                          <tr
                            key={project._id}
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/${router.query.organization}/projects/${project._id}`
                              )
                            }
                          >
                            <td className="p-2 font-medium text-blue-600">
                              {project.title}
                            </td>
                            <td className="p-2">{t(project.status)}</td>
                            <td className="p-2">
                              {project.startDate
                                ? new Date(
                                    project.startDate
                                  ).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="p-2">
                              {project.endDate
                                ? new Date(project.endDate).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="p-2">
                              {project.actualCost || project.estimatedCost
                                ? `${project.actualCost || project.estimatedCost} ${project.currency || ''}`
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
              <NotesPanel entityType="contractor" entityId={contractor._id} />
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
                  list="contractor-type-options"
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

      <Dialog open={openWorkModal} onOpenChange={setOpenWorkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Add Work Record')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">{t('Title')}</label>
              <Input
                value={workFormData.title}
                onChange={(e) => handleWorkFormChange('title', e.target.value)}
                placeholder={t('Title')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">{t('Description')}</label>
              <Textarea
                value={workFormData.description}
                onChange={(e) =>
                  handleWorkFormChange('description', e.target.value)
                }
                placeholder={t('Description')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('Status')}</label>
              <Select
                value={workFormData.status}
                onValueChange={(value) => handleWorkFormChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('Pending')}</SelectItem>
                  <SelectItem value="in-progress">
                    {t('In Progress')}
                  </SelectItem>
                  <SelectItem value="completed">{t('Completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('Currency')}</label>
              <Input
                value={workFormData.currency}
                onChange={(e) =>
                  handleWorkFormChange('currency', e.target.value)
                }
                placeholder={t('Currency')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('Start Date')}</label>
              <Input
                type="date"
                value={workFormData.startDate}
                onChange={(e) =>
                  handleWorkFormChange('startDate', e.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('End Date')}</label>
              <Input
                type="date"
                value={workFormData.endDate}
                onChange={(e) =>
                  handleWorkFormChange('endDate', e.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t('Estimated Cost')}
              </label>
              <Input
                type="number"
                value={workFormData.estimatedCost}
                onChange={(e) =>
                  handleWorkFormChange('estimatedCost', e.target.value)
                }
                placeholder={t('Estimated Cost')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('Actual Cost')}</label>
              <Input
                type="number"
                value={workFormData.actualCost}
                onChange={(e) =>
                  handleWorkFormChange('actualCost', e.target.value)
                }
                placeholder={t('Actual Cost')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenWorkModal(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleSaveWork}>{t('Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

export default withAuthentication(observer(ContractorDetail));
