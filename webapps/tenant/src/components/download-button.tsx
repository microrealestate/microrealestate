'use client';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import { Download } from 'lucide-react';
import fileDownload from 'js-file-download';
import useTranslation from '@/utils/i18n/client/useTranslation';
import useApiFetcher from '@/utils/fetch/client';

export function DownLoadButton({
  tenant,
  invoice,
}: {
  tenant: { id: string; name: string };
  invoice: Invoice;
}) {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();

  const handleClick = async () => {
    const response = await apiFetcher.get(
      `/api/v2/documents/invoice/${tenant.id}/${invoice.term}`,
      {
        responseType: 'blob',
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
