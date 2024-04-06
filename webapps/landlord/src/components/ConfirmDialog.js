import { AlertTriangleIcon } from 'lucide-react';
import { Button } from './ui/button';
import ResponsiveDialog from './ResponsiveDialog';
import { useCallback } from 'react';
import useDialog from '../hooks/useDialog';
import useTranslation from 'next-translate/useTranslation';

function ConfirmDialog({
  title,
  subTitle,
  open,
  setOpen,
  onConfirm,
  justOkButton = false,
  children
}) {
  const { t } = useTranslation('common');
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  const handleConfirm = useCallback(() => {
    setOpen(false);
    onConfirm?.(open);
  }, [setOpen, onConfirm, open]);

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      renderHeader={() => (
        <>
          <div className="flex flex-col md:flex-row items-center gap-2">
            <AlertTriangleIcon size={32} />
            <span>{title}</span>
          </div>
          {subTitle ? (
            <div className="flex text-base items-center justify-center font-normal min-h-20">
              {subTitle}
            </div>
          ) : null}
        </>
      )}
      renderContent={
        children ? () => <div className="p-4">{children}</div> : null
      }
      renderFooter={() =>
        justOkButton ? (
          <Button onClick={handleClose}>{t('Ok')}</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleConfirm}>{t('Continue')}</Button>
          </>
        )
      }
    />
  );
}

export default function useConfirmDialog() {
  return useDialog(ConfirmDialog);
}
