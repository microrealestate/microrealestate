import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader
} from '@/components/ui/drawer';
import Loading from './loading';
import { useMediaQuery } from 'usehooks-ts';
import useTranslation from '@/utils/i18n/client/useTranslation';

function InProgress() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 text-sm h-10 md:justify-normal">
      <span>{t('In progress')}</span>
      <Loading fullScreen={false} className="size-4" />
    </div>
  );
}

export default function ResponsiveDialog({
  open,
  setOpen,
  renderHeader,
  renderContent,
  renderFooter,
  isLoading,
  dismissible = true,
  fullScreen = false
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  renderHeader?: () => React.ReactNode;
  renderContent?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  isLoading?: boolean;
  dismissible?: boolean;
  fullScreen?: boolean;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const handleOpenChange: (value: boolean) => void = (value) => {
    if (isLoading) {
      return;
    }
    setOpen(value);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          dismissible={dismissible}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            !dismissible && e.preventDefault();
          }}
          className={fullScreen ? 'h-5/6 w-5/6 max-w-none' : 'max-w-fit'}
        >
          {renderHeader ? (
            <DialogHeader className="text-lg font-semibold leading-none tracking-tight px-4">
              {renderHeader()}
            </DialogHeader>
          ) : null}

          {renderContent ? <div className="px-4">{renderContent()}</div> : null}

          {renderFooter ? (
            <DialogFooter className="px-4">
              {!isLoading ? renderFooter() : <InProgress />}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={dismissible}
    >
      <DrawerContent className={fullScreen ? 'w-full h-full' : 'w-full'}>
        {renderHeader ? (
          <DrawerHeader className="text-lg md:text-xl font-semibold leading-none tracking-tight px-4">
            {renderHeader()}
          </DrawerHeader>
        ) : null}

        {renderContent ? <div className="px-4">{renderContent()}</div> : null}

        {renderFooter ? (
          <DrawerFooter className="px-4">
            {!isLoading ? renderFooter() : <InProgress />}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
