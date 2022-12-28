import Alert from '../Alert';
import { Box } from '@material-ui/core';
import moment from 'moment';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

const now = moment();

export default function CompulsoryDocumentStatus({
  tenant,
  variant = 'full',
  ...boxProps
}) {
  const { t } = useTranslation('common');

  const missingDocuments = useMemo(() => {
    return tenant.filesToUpload?.filter(
      ({ required, requiredOnceContractTerminated, documents }) =>
        (required || (requiredOnceContractTerminated && tenant.terminated)) &&
        (!documents.length ||
          !documents.some(({ expiryDate }) =>
            expiryDate ? moment(expiryDate).isSameOrAfter(now) : true
          ))
    );
  }, [tenant.filesToUpload, tenant.terminated]);

  if (!missingDocuments?.length || missingDocuments.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Box {...boxProps}>
        <Alert title={t('Some compulsary documents are missing')} />
      </Box>
    );
  }

  return (
    <Box {...boxProps}>
      <Alert
        title={
          missingDocuments.length > 1
            ? t('The following compulsary documents are missing')
            : t('The following compulsary document is missing')
        }
      >
        <ul>
          {missingDocuments.map(({ _id, name }) => {
            return <li key={_id}>{name}</li>;
          })}
        </ul>
      </Alert>
    </Box>
  );
}
