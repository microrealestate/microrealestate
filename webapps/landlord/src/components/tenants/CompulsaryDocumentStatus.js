import { Alert } from '../ui/alert';
import { LuAlertTriangle } from 'react-icons/lu';
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
      <div className="flex items-center gap-4">
        <LuAlertTriangle className="size-6" />
        <div className="text-sm">
          {t('Some compulsary documents are missing')}
        </div>
      </div>
    </Alert>
  );
}
