// import Alert from './Alert';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Button, Paper, Typography, withStyles } from '@material-ui/core';
import { useCallback, useEffect, useState } from 'react';

import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import moment from 'moment';
import useTranslation from 'next-translate/useTranslation';
import VisibilityIcon from '@material-ui/icons/Visibility';

const StyledAlert = withStyles(() => ({
  root: {
    height: '76px',
    alignItems: 'center',
  },
}))(Alert);

export default function UploadFileCard({ documentInfo, onView, onUpload }) {
  const [severity, setSeverity] = useState();
  const [message, setMessage] = useState();
  const [uploadButtonVisible, setUploadButtonVisible] = useState(false);
  const [viewButtonVisible, setViewButtonVisible] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    setMessage();
    setUploadButtonVisible(false);
    setViewButtonVisible(false);
    setSeverity();

    if (!documentInfo?.url) {
      setUploadButtonVisible(true);
      setMessage(t('not uploaded'));
      return setSeverity('error');
    }

    if (documentInfo.expiryDate) {
      const todayMoment = moment().startOf('day');
      const expiryMoment = moment(documentInfo.expiryDate).startOf('day');
      const isExpired = todayMoment.isSameOrAfter(expiryMoment);
      const remainingDays = moment
        .duration(expiryMoment - todayMoment)
        .asDays();

      const minDayBeforeExpiry = 30;
      if (remainingDays < minDayBeforeExpiry) {
        setUploadButtonVisible(true);
        setMessage(
          isExpired
            ? t('expired')
            : t('expiry {{relativeDate}}', {
                relativeDate: expiryMoment.fromNow(),
              })
        );
      }
      setViewButtonVisible(true);
      return setSeverity(
        isExpired
          ? 'error'
          : remainingDays < minDayBeforeExpiry
          ? 'warning'
          : 'success'
      );
    }
    setViewButtonVisible(true);
    return setSeverity('success');
  }, [documentInfo, t]);

  const handleClickView = useCallback(() => {
    onView?.(documentInfo);
  }, [documentInfo, onView]);

  const handleClickUpload = useCallback(() => {
    onUpload?.(documentInfo);
  }, [documentInfo, onUpload]);

  return (
    <Paper>
      <StyledAlert
        severity={severity}
        action={
          <>
            {viewButtonVisible && (
              <Button
                color="inherit"
                startIcon={<VisibilityIcon fontSize="large" />}
                onClick={handleClickView}
              >
                {t('View')}
              </Button>
            )}

            {uploadButtonVisible && (
              <Button
                color="inherit"
                startIcon={<CloudUploadIcon fontSize="large" />}
                onClick={handleClickUpload}
              >
                {t('Upload')}
              </Button>
            )}
          </>
        }
      >
        <AlertTitle>
          {documentInfo?.name}
          {message ? ` - ${message}` : ''}
        </AlertTitle>
        {documentInfo?.description ? (
          <Typography variant="caption">{documentInfo?.description}</Typography>
        ) : null}
      </StyledAlert>
    </Paper>
  );
}
