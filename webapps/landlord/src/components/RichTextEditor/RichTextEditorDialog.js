import {
  Drawer,
  DrawerContent,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false
});

export default function RichTextEditorDialog({
  open,
  setOpen,
  onLoad,
  onSave,
  title,
  fields,
  editable
}) {
  const t = useTranslations('common');
  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <Drawer open={!!open} dismissible={false}>
      <DrawerContent fullScreen hideHandle>
        <DrawerTitle className="sr-only">
          {title || t('Untitled document')}
        </DrawerTitle>
        <RichTextEditor
          title={title}
          fields={fields}
          onLoad={onLoad}
          onSave={onSave}
          onClose={handleClose}
          showPrintButton
          editable={editable}
        />
      </DrawerContent>
    </Drawer>
  );
}
