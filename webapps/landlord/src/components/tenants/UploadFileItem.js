import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@microrealestate/commonui/components/ui/card';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LuCloudUpload, LuFileText } from 'react-icons/lu';
import DocumentHint from './DocumentHint';
import DocumentReadonlyRow from './DocumentReadonlyRow';

export default function UploadFileItem({
  file,
  disabled,
  onView,
  onUpload,
  onDelete
}) {
  const t = useTranslations('common');

  const { severity, message } = useMemo(() => {
    const state = {
      severity: 'success',
      message: ''
    };

    if (!file.documents.length) {
      return state;
    }

    if (file.template.hasExpiryDate) {
      const docSortedByExpiryDate = [...file.documents].sort((a, b) => {
        return moment(b.expiryDate)
          .endOf('day')
          .diff(moment(a.expiryDate).endOf('day'));
      });
      const doc = docSortedByExpiryDate[0];
      const todayMoment = moment().startOf('day');
      const expiryMoment = moment(doc.expiryDate).startOf('day');
      const isExpired = todayMoment.isSameOrAfter(expiryMoment);
      const remainingDays = moment
        .duration(expiryMoment - todayMoment)
        .asDays();

      const minDayBeforeExpiry = 30;
      if (remainingDays < minDayBeforeExpiry) {
        state.message = isExpired
          ? t('This document has expired')
          : t('This document will expire {relativeDate}', {
              relativeDate: expiryMoment.fromNow()
            });
      }

      state.severity = isExpired
        ? file.template.required
          ? 'warning'
          : 'info'
        : remainingDays < minDayBeforeExpiry
          ? 'warning'
          : 'success';

      return state;
    }

    return state;
  }, [file.documents, file.template.hasExpiryDate, file.template.required, t]);

  const sortedDocuments = useMemo(
    () =>
      [...file.documents].sort((a, b) =>
        moment(b.updatedDate).diff(moment(a.updatedDate))
      ),
    [file.documents]
  );

  const currentDoc = sortedDocuments[0] ?? null;

  const isExpired = useMemo(() => {
    if (!currentDoc?.expiryDate) return false;
    return moment()
      .startOf('day')
      .isSameOrAfter(moment(currentDoc.expiryDate).startOf('day'));
  }, [currentDoc]);

  const handleClickUpload = () => {
    onUpload?.(file.template);
  };

  return (
    <Card>
      <CardHeader className="pb-4 space-y-2">
        <div className="flex items-start gap-2">
          <LuFileText className="size-5 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span>{file.template.name}</span>
              {!file.documents.length && file.template.required ? (
                <Badge variant="warning" className="text-xs">
                  {t('Required')}
                </Badge>
              ) : file.documents.length && isExpired ? (
                <Badge variant="destructive" className="text-xs">
                  {t('Expired')}
                </Badge>
              ) : null}
            </div>
            {file.template?.description ? (
              <p className="text-sm text-muted-foreground">
                {file.template.description}
              </p>
            ) : null}
          </div>
        </div>
        <DocumentHint severity={severity} message={message} />
      </CardHeader>
      <Separator />
      <CardContent className={cn(sortedDocuments.length ? 'pt-4' : '')}>
        {sortedDocuments.map((doc) => {
          const handleView = () => onView?.(doc, file.template);
          const handleDelete = () =>
            onDelete?.({ name: file.template.name, ...doc });

          return (
            <div key={doc._id} className="space-y-2 my-4">
              <DocumentReadonlyRow
                doc={doc}
                templateName={file.template.name}
                disabled={disabled}
                onView={handleView}
                onDelete={handleDelete}
              />
              <Separator />
            </div>
          );
        })}
      </CardContent>

      <CardFooter>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClickUpload}>
            <LuCloudUpload />
            {t('Upload')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
