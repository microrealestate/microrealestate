import {
  LuAlertTriangle,
  LuInfo,
  LuTrash,
  LuUploadCloud
} from 'react-icons/lu';
import { useCallback, useMemo } from 'react';
import { Button } from '../ui/button';

import moment from 'moment';
import useTranslation from 'next-translate/useTranslation';

export default function UploadFileItem({
  document,
  template,
  disabled,
  onView,
  onUpload,
  onDelete
}) {
  const { t } = useTranslation('common');

  const { severity, message, hasLinkToDocument, uploadButtonVisible } =
    useMemo(() => {
      let state = {
        severity: 'success',
        hasLinkToDocument: true,
        uploadButtonVisible: false,
        message: ''
      };

      if (!document?.url) {
        state.hasLinkToDocument = false;
        state.uploadButtonVisible = true;
        state.severity = template.required ? 'error' : 'info';
        state.message = t('This document is missing');
        return state;
      }

      if (document?.expiryDate) {
        const todayMoment = moment().startOf('day');
        const expiryMoment = moment(document?.expiryDate).startOf('day');
        const isExpired = todayMoment.isSameOrAfter(expiryMoment);
        const remainingDays = moment
          .duration(expiryMoment - todayMoment)
          .asDays();

        const minDayBeforeExpiry = 30;
        if (remainingDays < minDayBeforeExpiry) {
          state.uploadButtonVisible = true;
          state.message = isExpired
            ? t('This document has expired')
            : t('This document will expire {{relativeDate}}', {
                relativeDate: expiryMoment.fromNow()
              });
        }
        state.hasLinkToDocument = true;

        state.severity = isExpired
          ? template.required
            ? 'error'
            : 'info'
          : remainingDays < minDayBeforeExpiry
            ? 'warning'
            : 'success';

        return state;
      }

      return state;
    }, [document?.url, document?.expiryDate, template.required, t]);

  const handleClickView = useCallback(
    (event) => {
      event.preventDefault();
      if (hasLinkToDocument) {
        onView?.(document, template);
      }
    },
    [document, hasLinkToDocument, onView, template]
  );

  const handleClickUpload = useCallback(() => {
    onUpload?.(template);
  }, [onUpload, template]);

  const handleClickDelete = useCallback(() => {
    onDelete?.({ name: template.name, ...document });
  }, [document, onDelete, template.name]);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div>
        <Button
          variant="link"
          disabled={!hasLinkToDocument}
          className="p-0"
          onClick={handleClickView}
        >
          {template.name}
        </Button>
        {template.description ? (
          <div className="text-sm">{template.description}</div>
        ) : null}
        {document?.updatedDate ? (
          <div className="text-muted-foreground text-xs">
            {t('Saved on {{date}}', {
              date: moment(document?.updatedDate).format('LL hh:mm')
            })}
          </div>
        ) : null}
        {severity === 'error' && (
          <div className="flex items-center gap-1 text-warning text-xs">
            <LuAlertTriangle />
            <div>{message}</div>
          </div>
        )}
        {severity === 'warning' && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <LuInfo />
            <div>{message}</div>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center">
        {uploadButtonVisible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClickUpload}
            disabled={disabled}
          >
            <LuUploadCloud className="size-6" />
          </Button>
        )}
        {hasLinkToDocument && !uploadButtonVisible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClickDelete}
            disabled={disabled}
          >
            <LuTrash className="size-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
