import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';

function checkDocumentOk(t, tenant) {
  const missingDocuments = tenant.filesToUpload?.filter(
    ({ missing }) => missing
  );
  if (!missingDocuments?.length || missingDocuments.length === 0) {
    return { status: 'ok', message: '' };
  }
  return {
    status: 'warning',
    message: t('Some compulsory documents are missing')
  };
}

export default function TenantStatus({ tenant, className }) {
  const t = useTranslations('common');

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
          <LuTriangleAlert className="size-4 text-warning" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 text-warning">
        {checks[0].message}
      </PopoverContent>
    </Popover>
  ) : null;
}
