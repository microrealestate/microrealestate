import {
  AppBar,
  Box,
  Button,
  Dialog,
  Typography,
  withStyles,
} from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';

import { apiFetcher } from '../../utils/fetch';
import EditorButton from '../RichTextEditor/EditorButton';
import { grayColor } from '../../styles/styles';
import Loading from '../Loading';
import { printPlugin } from '@react-pdf-viewer/print';
import { useToast } from '../../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const StyledDialog = withStyles(() => ({
  paperFullScreen: {
    backgroundColor: grayColor[10],
    overflow: 'hidden',
  },
}))(Dialog);

export default function PdfViewer({ open, setOpen }) {
  const { t } = useTranslation('common');
  const [pdfSrc, setPdfSrc] = useState();
  const [Toast, setToastMessage, toastVisible] = useToast();

  const printPluginInstance = printPlugin();
  const { Print } = printPluginInstance;

  useEffect(() => {
    (async () => {
      if (open?.url) {
        try {
          const response = await apiFetcher().get(open.url, {
            responseType: 'blob',
          });
          setPdfSrc(URL.createObjectURL(response.data));
        } catch (error) {
          console.error(error);
          setToastMessage(t('Document not found'));
        }
      }
    })();
  }, [t, open, setToastMessage]);

  const handleClose = useCallback(() => {
    setPdfSrc();
    setOpen(false);
  }, [setOpen]);

  if (open && pdfSrc) {
    return (
      <StyledDialog fullScreen open={!!open} onClose={handleClose}>
        <AppBar>
          <Box display="flex" justifyContent="space-between" p={1}>
            <Typography variant="h6" component="div">
              {open.title}
            </Typography>
            <Box display="flex">
              <Box mr={1}>
                <Print>
                  {(props) => (
                    <EditorButton
                      iconType="ri-printer-fill"
                      onClick={props.onClick}
                    />
                  )}
                </Print>
              </Box>
              <Button variant="contained" size="small" onClick={handleClose}>
                {t('Close')}
              </Button>
            </Box>
          </Box>
        </AppBar>
        <Box overflow="auto">
          <Box pt={8} maxWidth="230mm">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.13.216/build/pdf.worker.js">
              <Viewer fileUrl={pdfSrc} plugins={[printPluginInstance]} />
            </Worker>
          </Box>
        </Box>
      </StyledDialog>
    );
  }

  if (open && !pdfSrc && !toastVisible) {
    return <Loading fullScreen />;
  }

  return <Toast severity="error" onClose={handleClose} />;
}
