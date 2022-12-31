import Alert from '../Alert';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function CompulsoryDocumentStatus({
  tenant,
  variant = 'full', // 'full', 'compact'
  ...props
}) {
  const { t } = useTranslation('common');

  const missingDocuments = useMemo(() => {
    return tenant.filesToUpload?.filter(({ missing }) => missing);
  }, [tenant.filesToUpload]);

  if (!missingDocuments?.length || missingDocuments.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Alert
        title={t('Some compulsary documents are missing')}
        severity="warning"
        {...props}
      />
    );
  }

  return (
    <Alert
      title={
        missingDocuments.length > 1
          ? t('The following documents were not uploaded')
          : t('The following document was not uploaded')
      }
      severity="warning"
      {...props}
    >
      <ul>
        {missingDocuments.map(({ _id, name }) => {
          return <li key={_id}>{name}</li>;
        })}
      </ul>
    </Alert>
  );
}
