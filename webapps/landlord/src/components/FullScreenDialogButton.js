import { AppBar, Box, Grid, useMediaQuery } from '@material-ui/core';
import React, { memo, useCallback } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { MobileButton } from './MobileMenuButton';
import Slide from '@material-ui/core/Slide';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import useTranslation from 'next-translate/useTranslation';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FullScreenDialogButton = ({
  dialogTitle,
  buttonLabel,
  saveButtonLabel,
  cancelButtonLabel,
  showSave,
  showCancel,
  Icon,
  children,
  ...props
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const handleClickOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {!isMobile ? (
        <Button
          {...props}
          size="small"
          startIcon={<Icon />}
          onClick={handleClickOpen}
          style={{ whiteSpace: 'nowrap' }}
        >
          {buttonLabel}
        </Button>
      ) : (
        <MobileButton
          {...props}
          variant="text"
          Icon={Icon}
          label={buttonLabel}
          onClick={handleClickOpen}
        />
      )}
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        keepMounted
      >
        <AppBar position="sticky">
          <Toolbar>
            <Box width="100%" display="flex" alignItems="center">
              <Box flexGrow={1}>
                <Typography variant="h6">{dialogTitle}</Typography>
              </Box>
              <Box>
                <Grid container spacing={1}>
                  <Grid item>
                    {showCancel && (
                      <Button color="inherit" onClick={handleClose}>
                        {cancelButtonLabel || t('Cancel')}
                      </Button>
                    )}
                  </Grid>
                  <Grid item>
                    {showSave && (
                      <Button
                        autoFocus
                        color="primary"
                        onClick={handleSave}
                        data-cy="submit"
                      >
                        {saveButtonLabel || t('Save')}
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box py={2} px={3}>
          {open ? children : null}
        </Box>
      </Dialog>
    </>
  );
};

export default memo(FullScreenDialogButton);
