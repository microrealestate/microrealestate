import { apiFetcher } from '../../utils/fetch';
import { Card } from '../ui/card';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function buildPreviewMap(files) {
  return files.reduce((acc, file) => {
    acc[file._id] = '';
    return acc;
  }, {});
}

export default function PropertyPhotosPanel({ propertyId }) {
  const [photos, setPhotos] = useState([]);
  const [albumName, setAlbumName] = useState('Default');
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({});

  const albums = useMemo(() => {
    const groups = {};
    photos.forEach((photo) => {
      const key = (photo.albumName || 'Default').trim() || 'Default';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(photo);
    });
    return groups;
  }, [photos]);

  const fetchPhotos = async () => {
    if (!propertyId) return;

    try {
      const response = await apiFetcher().get('/attachments', {
        params: {
          targetType: 'property',
          targetId: propertyId,
          category: 'property_album_photo'
        }
      });
      setPhotos(response.data || []);
      setPreviewUrls(buildPreviewMap(response.data || []));
    } catch (error) {
      toast.error('Failed to load property photos');
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [propertyId]);

  useEffect(() => {
    const revokers = [];

    const loadAllPreviews = async () => {
      const nextUrls = {};
      for (const photo of photos) {
        if (!photo.mimeType?.startsWith('image/')) {
          nextUrls[photo._id] = '';
          continue;
        }

        try {
          const response = await apiFetcher().get(
            `/attachments/${photo._id}/download`,
            { responseType: 'blob' }
          );
          const url = window.URL.createObjectURL(response.data);
          nextUrls[photo._id] = url;
          revokers.push(url);
        } catch (error) {
          nextUrls[photo._id] = '';
        }
      }

      setPreviewUrls(nextUrls);
    };

    if (photos.length) {
      loadAllPreviews();
    } else {
      setPreviewUrls({});
    }

    return () => {
      revokers.forEach((url) => window.URL.revokeObjectURL(url));
    };
  }, [photos]);

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
      formData.append('category', 'property_album_photo');
      formData.append('albumName', albumName || 'Default');

      await apiFetcher().post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchPhotos();
      toast.success('Photo uploaded');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      fileInput.value = '';
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await apiFetcher().delete(`/attachments/${attachmentId}`);
      setPhotos((previous) =>
        previous.filter((photo) => photo._id !== attachmentId)
      );
      toast.success('Photo deleted');
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold">Photos & albums</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            className="px-3 py-1.5 border rounded text-sm bg-background text-foreground"
            placeholder="Album name"
          />
          <label className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm cursor-pointer hover:bg-blue-700">
            {uploading ? 'Uploading...' : 'Upload photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {!photos.length ? (
        <div className="text-sm text-muted-foreground">
          No photos uploaded yet.
        </div>
      ) : (
        Object.entries(albums).map(([name, albumPhotos]) => (
          <div key={name} className="space-y-2">
            <h4 className="text-sm font-medium">{name}</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {albumPhotos.map((photo) => (
                <div key={photo._id} className="rounded border p-2 space-y-2">
                  {previewUrls[photo._id] ? (
                    <img
                      src={previewUrls[photo._id]}
                      alt={photo.filename}
                      className="w-full h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-28 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {photo.filename}
                    </div>
                  )}
                  <div className="text-xs truncate text-muted-foreground">
                    {photo.filename}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(photo._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
