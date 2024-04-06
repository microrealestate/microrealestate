import { Alert, AlertTitle } from '../ui/alert';
import { AlertTriangleIcon } from 'lucide-react';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function CompulsoryDocumentStatus({ tenant, className }) {
  const { t } = useTranslation('common');

  const missingDocuments = useMemo(() => {
    return tenant.filesToUpload?.filter(({ missing }) => missing);
  }, [tenant.filesToUpload]);

  if (!missingDocuments?.length || missingDocuments.length === 0) {
    return null;
  }

  return (
    <Alert variant="warning" className={className}>
      <AlertTriangleIcon className="h-4 w-4" />
      <AlertTitle>{t('Some compulsary documents are missing')}</AlertTitle>
    </Alert>
  );
}
