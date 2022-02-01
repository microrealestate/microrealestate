import { Dialog, withStyles } from '@material-ui/core';

import dynamic from 'next/dynamic';
import { grayColor } from '../../styles/styles';
import { useCallback } from 'react';

const RichTextEditor = dynamic(import('./RichTextEditor'), {
  ssr: false,
});

const StyledDialog = withStyles(() => ({
  paperFullScreen: {
    backgroundColor: grayColor[10],
    overflow: 'hidden',
  },
}))(Dialog);

const RichTextEditorDialog = ({
  open,
  setOpen,
  onLoad,
  onSave,
  title,
  fields,
}) => {
  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <StyledDialog
      fullScreen
      disableEscapeKeyDown
      open={!!open}
      aria-labelledby="form-dialog-title"
    >
      <RichTextEditor
        title={title}
        fields={fields}
        onLoad={onLoad}
        onSave={onSave}
        onClose={handleClose}
        showPrintButton
      />
    </StyledDialog>
  );
};

export default RichTextEditorDialog;
