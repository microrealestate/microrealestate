import { Button } from './ui/button';
import { LuAlertTriangle } from 'react-icons/lu';
import ResponsiveDialog from './ResponsiveDialog';
import { useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function ConfirmDialog({
  title,
  subTitle,
  open,
  setOpen,
  data,
  onConfirm,
  justOkButton = false,
  children
}) {
  const { t } = useTranslation('common');
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  const handleConfirm = useCallback(() => {
    setOpen(false);
    onConfirm?.(data);
  }, [setOpen, onConfirm, data]);

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      renderHeader={() => (
        <>
          <div className="flex flex-col md:flex-row items-center gap-2">
            <LuAlertTriangle className="size-8" />
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
