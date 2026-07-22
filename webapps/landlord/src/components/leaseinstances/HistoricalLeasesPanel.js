/* eslint-disable sort-imports */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/card';
import { StoreContext } from '../../store';
import { apiFetcher, downloadDocument, uploadDocument } from '../../utils/fetch';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
/* eslint-enable sort-imports */

const HISTORICAL_LEASE_DESCRIPTION = 'historical_lease';

export default function HistoricalLeasesPanel() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [uploading, setUploading] = useState(false);

  const historicalDocs = useMemo(
    () =>
      (store.document.items || []).filter(
        ({ tenantId, type, description }) =>
          String(tenantId) === String(store.tenant.selected?._id) &&
          type === 'file' &&
          description === HISTORICAL_LEASE_DESCRIPTION
      ),
    [store.document.items, store.tenant.selected?._id]
  );

  const handleUpload = useCallback(
    async (event) => {
      const fileInput = event.target;
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;

      if (!store.tenant.selected?._id) {
        toast.error(t('Tenant must be saved before uploading'));
        return;
      }

      try {
        setUploading(true);
        const uploadResponse = await uploadDocument({
          endpoint: '/documents/upload',
          documentName: file.name,
          file,
          folder: [
            store.tenant.selected.name?.replace(/[/\\]/g, '_') ||
              'tenant-documents',
            'historical_leases'
          ].join('/')
        });

        const { status } = await store.document.create({
          tenantId: store.tenant.selected._id,
          type: 'file',
          name: file.name,
          description: HISTORICAL_LEASE_DESCRIPTION,
          mimeType: file.type,
          url: uploadResponse.data.key,
          versionId: uploadResponse.data.versionId
        });

        if (status !== 200) {
          toast.error(t('Cannot save document'));
          return;
        }
        await store.document.fetch();
        toast.success(t('Historical lease uploaded'));
      } catch {
        toast.error(t('Cannot upload document'));
      } finally {
        setUploading(false);
      }
    },
    [store, t]
  );

  const handleDownload = useCallback(
    (doc) => {
      downloadDocument({
        endpoint: `/documents/${doc._id}`,
        documentName: doc.name
      });
    },
    []
  );

  const handleDelete = useCallback(
    async (documentId) => {
      const { status } = await store.document.delete([documentId]);
      if (status !== 200) {
        toast.error(t('Something went wrong'));
        return;
      }
      await store.document.fetch();
      toast.success(t('Document removed'));
    },
    [store.document, t]
  );

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('Historical leases')}</h3>
        <label className="inline-flex items-center px-3 py-1.5 border rounded text-sm cursor-pointer hover:bg-muted">
          {uploading ? t('Uploading...') : t('Upload')}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('Store past lease documents for historical reference only.')}
      </p>

      {historicalDocs.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {t('No historical leases uploaded yet')}
        </div>
      ) : (
        <div className="space-y-2">
          {historicalDocs.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center justify-between rounded border p-2"
            >
              <div className="text-sm truncate mr-4">{doc.name}</div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => handleDownload(doc)}
                >
                  {t('Download')}
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(doc._id)}
                >
                  {t('Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
