import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@microrealestate/commonui/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from 'usehooks-ts';
import Loading from './Loading';

function InProgress() {
  const t = useTranslations('common');
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
  title,
  renderHeader,
  renderContent,
  renderFooter,
  isLoading,
  hideTitle = false
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const handleOpenChange = (value) => {
    if (isLoading) {
      return;
    }
    setOpen(value);
  };
  const showHeader = !!renderHeader || (!!title && !hideTitle);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-fit min-w-150 min-h-75"
        >
          {open && showHeader ? (
            <DialogHeader className="text-lg font-semibold leading-none tracking-tight px-4">
              <DialogTitle className={renderHeader ? 'sr-only' : undefined}>
                {title}
              </DialogTitle>
              {renderHeader ? renderHeader() : null}
            </DialogHeader>
          ) : null}
          {open && !showHeader ? (
            <DialogTitle className="sr-only">{title}</DialogTitle>
          ) : null}

          {renderContent && open ? (
            <div className="px-4">{renderContent()}</div>
          ) : null}

          {renderFooter && open ? (
            <DialogFooter className="space-x-2 px-4">
              {!isLoading ? renderFooter() : <InProgress />}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} dismissible={false}>
      <DrawerContent className="w-full" hideHandle>
        {open && showHeader ? (
          <DrawerHeader className="text-lg md:text-xl font-semibold leading-none tracking-tight px-4">
            <DrawerTitle className={renderHeader ? 'sr-only' : undefined}>
              {title}
            </DrawerTitle>
            {renderHeader ? renderHeader() : null}
          </DrawerHeader>
        ) : null}
        {open && !showHeader ? (
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
        ) : null}

        {renderContent && open ? (
          <div className="flex justify-center p-4 max-h-96 overflow-y-auto">
            {renderContent()}
          </div>
        ) : null}

        {renderFooter && open ? (
          <DrawerFooter className="px-4">
            {!isLoading ? renderFooter() : <InProgress />}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
