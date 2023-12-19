import {
  Box,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core';
import { useCallback, useMemo } from 'react';

import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import moment from 'moment';
import ReportProblemOutlinedIcon from '@material-ui/icons/ReportProblemOutlined';
import useTranslation from 'next-translate/useTranslation';

export default function UploadFileItem({
  document,
  template,
  disabled,
  onView,
  onUpload,
  onDelete,
}) {
  const { t } = useTranslation('common');

  const { severity, message, hasLinkToDocument, uploadButtonVisible } =
    useMemo(() => {
      let state = {
        severity: 'success',
        hasLinkToDocument: true,
        uploadButtonVisible: false,
        message: '',
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
              relativeDate: expiryMoment.fromNow(),
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
        onView?.(document);
      }
    },
    [document, hasLinkToDocument, onView]
  );

  const handleClickUpload = useCallback(() => {
    onUpload?.(template);
  }, [onUpload, template]);

  const handleClickDelete = useCallback(() => {
    onDelete?.({ name: template.name, ...document });
  }, [document, onDelete, template.name]);

  return (
    <ListItem divider button={hasLinkToDocument} onClick={handleClickView}>
      <ListItemText
        primary={
          <>
            <Box>
              <Box color={!hasLinkToDocument ? 'text.disabled' : null}>
                {template.name}
              </Box>
              {template.description ? (
                <Box
                  fontSize="caption.fontSize"
                  color={
                    !hasLinkToDocument ? 'text.disabled' : 'text.secondary'
                  }
                >
                  {template.description}
                </Box>
              ) : null}
              {document?.updatedDate ? (
                <Box fontSize="caption.fontSize" color="text.secondary">
                  {t('Saved on {{date}}', {
                    date: moment(document?.updatedDate).format('LL hh:mm'),
                  })}
                </Box>
              ) : null}
            </Box>
            {severity === 'error' && (
              <Box
                display="flex"
                alignItems="center"
                gridGap={4}
                color="warning.main"
                mt={0.5}
              >
                <ReportProblemOutlinedIcon fontSize="small" />
                <Box fontSize="caption.fontSize" color="text.primary">
                  {message}
                </Box>
              </Box>
            )}
            {severity === 'warning' && (
              <Box
                display="flex"
                alignItems="center"
                gridGap={4}
                color="info.main"
              >
                <InfoOutlinedIcon fontSize="small" />
                <Box fontSize="caption.fontSize" color="text.secondary">
                  {message}
                </Box>
              </Box>
            )}
          </>
        }
      />
      <ListItemSecondaryAction>
        <Box display="flex" justifyContent="end" alignItems="center">
          {uploadButtonVisible && (
            <IconButton onClick={handleClickUpload} disabled={disabled}>
              <CloudUploadIcon />
            </IconButton>
          )}
          {hasLinkToDocument && !uploadButtonVisible && (
            <IconButton onClick={handleClickDelete} disabled={disabled}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
}
