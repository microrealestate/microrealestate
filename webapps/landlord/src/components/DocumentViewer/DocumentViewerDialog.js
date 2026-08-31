import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import DocumentViewer from './DocumentViewer';

export default function DocumentViewerDialog({ open, setOpen, serverFile }) {
  const t = useTranslations('common');

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return serverFile ? (
    <Drawer open={open} dismissible={false}>
      <DrawerContent className="p-4" fullScreen hideHandle>
        <DrawerHeader className="flex flex-row items-center px-0">
          <DrawerTitle className="sr-only">{serverFile.title}</DrawerTitle>
          <div className="text-base md:text-xl font-semibold">
            {serverFile.title}
          </div>
          <div className="flex grow justify-end gap-4">
            <Button variant="secondary" onClick={handleClose}>
              {t('Close')}
            </Button>
          </div>
        </DrawerHeader>
        <DocumentViewer serverFile={serverFile} />
      </DrawerContent>
    </Drawer>
  ) : null;
}
