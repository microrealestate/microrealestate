'use client';
import {
  Button,
  type ButtonProps
} from '@microrealestate/commonui/components/ui/button';
import fileDownload from 'js-file-download';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Receipt } from '@/types';
import apiClient from '@/utils/fetch/client';

export function DownloadButton({
  tenant,
  receipt,
  documentType = 'receipt',
  ...rest
}: {
  tenant: { id: string; name: string };
  receipt: Receipt;
  documentType?: 'receipt' | 'rentnotice';
} & ButtonProps) {
  const t = useTranslations('common');
  const [downloading, setDownloading] = useState(false);
  // 'rentnotice' is presented as a "notice" in the UI (Notice column header)
  const documentLabel = t(documentType === 'rentnotice' ? 'notice' : 'receipt');

  const handleClick = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await apiClient.get(
        `/api/v2/documents/${documentType}/${tenant.id}/${receipt.term}`,
        {
          responseType: 'blob'
        }
      );
      fileDownload(
        response.data,
        `${tenant.name}-${receipt.term}-${documentLabel}.pdf`
      );
    } catch {
      toast.error(t('Cannot download document'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      {...rest}
      onClick={handleClick}
      disabled={downloading || rest.disabled}
      aria-label={documentLabel}
      data-cy={`${documentType}-download`}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
