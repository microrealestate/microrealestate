import { Box, Typography } from '@material-ui/core';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { useCallback } from 'react';
import { useDialog } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';
import WarningIcon from '@material-ui/icons/ReportProblemOutlined';

function ConfirmDialog({
  title,
  subTitle,
  subTitle2,
  open,
  setOpen,
  onConfirm,
}) {
  const { t } = useTranslation('common');
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  const handleConfirm = useCallback(() => {
    setOpen(false);
    onConfirm(open);
  }, [setOpen, onConfirm, open]);

  return (
    <Dialog
      open={!!open}
      onClose={handleClose}
      aria-labelledby="confirm-dialog"
    >
      <Box p={1}>
        <DialogContent>
          <Box display="flex" alignItems="center">
            <Box pr={1}>
              <WarningIcon fontSize="large" color="secondary" />
            </Box>
            <Typography variant="h6">{title}</Typography>
          </Box>
          {!!subTitle && (
            <Box py={2}>
              <Typography variant="body2" align="center">
                {subTitle}
              </Typography>
            </Box>
          )}
          {!!subTitle2 && (
            <Box pb={2}>
              <Typography variant="body2" align="center">
                {subTitle2}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="contained" onClick={handleClose}>
            {t('No')}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleConfirm}
            color="primary"
          >
            {t('Yes')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function useConfirmDialog() {
  return useDialog(ConfirmDialog);
}
