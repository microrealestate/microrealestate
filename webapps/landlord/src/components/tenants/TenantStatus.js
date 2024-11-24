import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { LuAlertTriangle } from 'react-icons/lu';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

function checkDocumentOk(t, tenant) {
  const missingDocuments = tenant.filesToUpload?.filter(
    ({ missing }) => missing
  );
  if (!missingDocuments?.length || missingDocuments.length === 0) {
    return { status: 'ok', message: '' };
  }
  return {
    status: 'warning',
    message: t('Some compulsary documents are missing')
  };
}

export default function TenantStatus({ tenant, className }) {
  const { t } = useTranslation('common');

  const checks = useMemo(() => {
    const checks = [checkDocumentOk(t, tenant)].filter(
      ({ status }) => status !== 'ok'
    );

    return checks;
  }, [t, tenant]);

  return checks.length > 0 ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <LuAlertTriangle className="size-6 text-warning" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 font-bold text-warning">
        {checks[0].message}
      </PopoverContent>
    </Popover>
  ) : null;
}
