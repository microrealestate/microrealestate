'use client';
import { Button, ButtonProps } from '@/components/ui/button';
import { Download } from 'lucide-react';
import fileDownload from 'js-file-download';
import { Invoice } from '@/types';
import useApiFetcher from '@/utils/fetch/client';
import useTranslation from '@/utils/i18n/client/useTranslation';

export function DownLoadButton({
  tenant,
  invoice
}: {
  tenant: { id: string; name: string };
  invoice: Invoice;
} & ButtonProps) {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();

  const handleClick = async () => {
    const response = await apiFetcher.get(
      `/api/v2/documents/invoice/${tenant.id}/${invoice.term}`,
      {
        responseType: 'blob'
      }
    );
    fileDownload(
      response.data,
      `${tenant.name}-${invoice.term}-${t('invoice')}.pdf`
    );
  };

  return (
    <Button variant="ghost" onClick={handleClick}>
      <Download className="h-4 w-4" />
    </Button>
  );
}
