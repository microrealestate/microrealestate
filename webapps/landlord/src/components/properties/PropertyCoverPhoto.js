import { apiFetcher } from '../../utils/fetch';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function PropertyCoverPhoto({
  propertyId,
  onAttachmentSelected
}) {
  const [uploading, setUploading] = useState(false);
  const [coverAttachment, setCoverAttachment] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

  const isImage = useMemo(() => {
    return coverAttachment?.mimeType?.startsWith('image/');
  }, [coverAttachment]);

  const fetchCover = async () => {
    if (!propertyId) return;

    try {
      const response = await apiFetcher().get('/attachments', {
        params: {
          targetType: 'property',
          targetId: propertyId,
          category: 'property_cover'
        }
      });
      const [latest] = response.data || [];
      setCoverAttachment(latest || null);
    } catch (error) {
      toast.error('Failed to load cover photo');
    }
  };

  useEffect(() => {
    fetchCover();
  }, [propertyId]);

  useEffect(() => {
    let currentUrl = '';

    const loadPreview = async () => {
      if (!coverAttachment?._id || !isImage) {
        setCoverPreviewUrl('');
        return;
      }

      try {
        const response = await apiFetcher().get(
          `/attachments/${coverAttachment._id}/download`,
          { responseType: 'blob' }
        );
        currentUrl = window.URL.createObjectURL(response.data);
        setCoverPreviewUrl(currentUrl);
      } catch (error) {
        setCoverPreviewUrl('');
      }
    };

    loadPreview();

    return () => {
      if (currentUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [coverAttachment?._id, isImage]);

  const handleUpload = async (event) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file || !propertyId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetType', 'property');
      formData.append('targetId', propertyId);
      formData.append('category', 'property_cover');

      const response = await apiFetcher().post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploaded = response.data;
      setCoverAttachment(uploaded);
      onAttachmentSelected?.(uploaded?._id || null);
      toast.success('Cover photo uploaded');
    } catch (error) {
      toast.error('Failed to upload cover photo');
    } finally {
      setUploading(false);
      fileInput.value = '';
    }
  };

  const handleDownload = async () => {
    if (!coverAttachment?._id) return;

    try {
      const response = await apiFetcher().get(
        `/attachments/${coverAttachment._id}/download`,
        {
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', coverAttachment.filename || 'cover-photo');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download cover photo');
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">Building picture</div>
        <label className="px-2 py-1 text-xs border rounded cursor-pointer hover:bg-muted">
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {coverAttachment ? (
        <button
          type="button"
          className="w-full text-left rounded border p-2 hover:bg-muted/40"
          onClick={handleDownload}
        >
          {isImage && coverPreviewUrl ? (
            <img
              src={coverPreviewUrl}
              alt="Building cover"
              className="w-full h-40 object-cover rounded"
            />
          ) : (
            <div className="text-xs text-muted-foreground truncate">
              {coverAttachment.filename}
            </div>
          )}
        </button>
      ) : (
        <div className="text-xs text-muted-foreground">
          No building picture yet
        </div>
      )}
    </div>
  );
}
