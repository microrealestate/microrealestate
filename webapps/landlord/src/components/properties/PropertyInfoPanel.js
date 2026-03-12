import { apiFetcher } from '../../utils/fetch';
import { Card } from '../ui/card';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function FileRow({ file, onDownload }) {
  return (
    <div className="flex items-center justify-between rounded border p-2">
      <div className="min-w-0">
        <div className="text-sm truncate">{file.filename}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(file.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button
        type="button"
        className="text-sm text-blue-600 hover:text-blue-800"
        onClick={() => onDownload(file._id, file.filename)}
      >
        Download
      </button>
    </div>
  );
}

export default function PropertyInfoPanel({ property, onSave }) {
  const [taxId, setTaxId] = useState(property?.taxId || '');
  const [countyRecordsReference, setCountyRecordsReference] = useState(
    property?.countyRecordsReference || ''
  );
  const [saving, setSaving] = useState(false);
  const [floorPlan, setFloorPlan] = useState(null);
  const [countyFiles, setCountyFiles] = useState([]);
  const [floorPlanPreview, setFloorPlanPreview] = useState('');

  const floorPlanIsImage = useMemo(
    () => floorPlan?.mimeType?.startsWith('image/'),
    [floorPlan]
  );

  const propertyId = property?._id;

  useEffect(() => {
    setTaxId(property?.taxId || '');
    setCountyRecordsReference(property?.countyRecordsReference || '');
  }, [property?.taxId, property?.countyRecordsReference]);

  const fetchAttachments = async () => {
    if (!propertyId) return;

    try {
      const [floorRes, countyRes] = await Promise.all([
        apiFetcher().get('/attachments', {
          params: {
            targetType: 'property',
            targetId: propertyId,
            category: 'property_floor_plan'
          }
        }),
        apiFetcher().get('/attachments', {
          params: {
            targetType: 'property',
            targetId: propertyId,
            category: 'county_record'
          }
        })
      ]);

      setFloorPlan((floorRes.data || [])[0] || null);
      setCountyFiles(countyRes.data || []);
    } catch (error) {
      toast.error('Failed to load property info files');
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [propertyId]);

  useEffect(() => {
    let currentUrl = '';

    const loadFloorPlanPreview = async () => {
      if (!floorPlan?._id || !floorPlanIsImage) {
        setFloorPlanPreview('');
        return;
      }

      try {
        const response = await apiFetcher().get(
          `/attachments/${floorPlan._id}/download`,
          { responseType: 'blob' }
        );
        currentUrl = window.URL.createObjectURL(response.data);
        setFloorPlanPreview(currentUrl);
      } catch (error) {
        setFloorPlanPreview('');
      }
    };

    loadFloorPlanPreview();

    return () => {
      if (currentUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [floorPlan?._id, floorPlanIsImage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        taxId,
        countyRecordsReference,
        floorPlanAttachmentId: floorPlan?._id || null
      });
      toast.success('General info saved');
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file, category) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetType', 'property');
    formData.append('targetId', propertyId);
    formData.append('category', category);

    const response = await apiFetcher().post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  };

  const handleUploadFloorPlan = async (event) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file || !propertyId) return;

    try {
      const attachment = await uploadFile(file, 'property_floor_plan');
      setFloorPlan(attachment);
      await onSave({ floorPlanAttachmentId: attachment._id });
      toast.success('Floor plan uploaded');
    } catch (error) {
      toast.error('Failed to upload floor plan');
    } finally {
      fileInput.value = '';
    }
  };

  const handleUploadCountyRecord = async (event) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file || !propertyId) return;

    try {
      await uploadFile(file, 'county_record');
      await fetchAttachments();
      toast.success('County record uploaded');
    } catch (error) {
      toast.error('Failed to upload county record');
    } finally {
      fileInput.value = '';
    }
  };

  const handleDownload = async (attachmentId, filename) => {
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
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-sm font-semibold">General information</h3>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Tax ID</label>
        <input
          type="text"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-background text-foreground"
          placeholder="e.g. 12-3456789"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">
          County records reference
        </label>
        <input
          type="text"
          value={countyRecordsReference}
          onChange={(e) => setCountyRecordsReference(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-background text-foreground"
          placeholder="County record # or URL"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Floor plan</label>
          <label className="px-3 py-1 border rounded text-sm cursor-pointer hover:bg-muted">
            Upload
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleUploadFloorPlan}
              className="hidden"
            />
          </label>
        </div>

        {floorPlan ? (
          <div className="rounded border p-2 space-y-2">
            <div className="text-sm">{floorPlan.filename}</div>
            {floorPlanIsImage && floorPlanPreview ? (
              <img
                src={floorPlanPreview}
                alt="Floor plan"
                className="w-full h-56 object-contain rounded bg-muted"
              />
            ) : null}
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => handleDownload(floorPlan._id, floorPlan.filename)}
            >
              Download floor plan
            </button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No floor plan uploaded yet.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">
            County record files
          </label>
          <label className="px-3 py-1 border rounded text-sm cursor-pointer hover:bg-muted">
            Upload
            <input
              type="file"
              onChange={handleUploadCountyRecord}
              className="hidden"
            />
          </label>
        </div>
        {!countyFiles.length ? (
          <div className="text-sm text-muted-foreground">
            No county record files yet.
          </div>
        ) : (
          <div className="space-y-2">
            {countyFiles.map((file) => (
              <FileRow key={file._id} file={file} onDownload={handleDownload} />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save general info'}
      </button>
    </Card>
  );
}
