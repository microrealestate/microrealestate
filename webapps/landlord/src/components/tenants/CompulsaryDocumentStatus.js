import Alert from '../Alert';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function CompulsoryDocumentStatus({ tenant, ...props }) {
  const { t } = useTranslation('common');

  const missingDocuments = useMemo(() => {
    return tenant.filesToUpload?.filter(({ missing }) => missing);
  }, [tenant.filesToUpload]);

  if (!missingDocuments?.length || missingDocuments.length === 0) {
    return null;
  }

  return (
    <Alert
      title={t('Some compulsary documents are missing')}
      severity="warning"
      {...props}
    />
  );
}
