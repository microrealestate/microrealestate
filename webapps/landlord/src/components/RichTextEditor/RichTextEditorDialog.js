import { Dialog } from '@material-ui/core';
import dynamic from 'next/dynamic';
import { grayColor } from '../../styles/styles';
import { useCallback } from 'react';
import { useDialog } from '../../utils/hooks';
import { withStyles } from '@material-ui/core/styles';

const RichTextEditor = dynamic(import('./RichTextEditor'), {
  ssr: false,
});

const StyledDialog = withStyles(() => ({
  paperFullScreen: {
    backgroundColor: grayColor[10],
    overflow: 'hidden',
  },
}))(Dialog);

function RichTextEditorDialog({
  open,
  setOpen,
  onLoad,
  onSave,
  title,
  fields,
  editable,
}) {
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
        editable={editable}
      />
    </StyledDialog>
  );
}

export default function useRichTextEditorDialog() {
  return useDialog(RichTextEditorDialog);
}
