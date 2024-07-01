import { Dialog, DialogContent, DialogFooter, DialogHeader } from './ui/dialog';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader } from './ui/drawer';
import Loading from './Loading';
import { useMediaQuery } from 'usehooks-ts';
import useTranslation from 'next-translate/useTranslation';

function InProgress() {
  const { t } = useTranslation('common');
  return (
    <div className='flex items-center justify-center gap-2 text-sm h-10 md:justify-normal'>
      <span>{t('In progress')}</span>
      <Loading  fullScreen={false} className="size-4"/> 
    </div>
  );
}

export default function ResponsiveDialog({ open, setOpen, renderHeader, renderContent, renderFooter, isLoading }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const handleOpenChange = (value) => {
    if (isLoading) {
      return;
    } 
    setOpen(value);
  };

  if (isDesktop) {
    return (
      <Dialog 
        open={open} 
        onOpenChange={handleOpenChange}
        modal={true}
      >
        <DialogContent
          onInteractOutside={e => e.preventDefault()}
        >
          { renderHeader ? (
            <DialogHeader className="text-lg font-semibold leading-none tracking-tight px-4">
              {renderHeader()}
            </DialogHeader>
          ) : null } 
        
          { renderContent ? (
            <div className='px-4'>
              {renderContent()}
            </div>
          ) : null}
        
          {renderFooter ? (
            <DialogFooter className="px-4">
              {!isLoading ? renderFooter() : (
                <InProgress />
              )}
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
      dismissible={false}
    >
      <DrawerContent 
        className="w-full"
      >
        { renderHeader ? (
          <DrawerHeader className="text-lg md:text-xl font-semibold leading-none tracking-tight px-4">
            {renderHeader()}
          </DrawerHeader>
        ) : null }
        
        { renderContent ? (
          <div className='flex justify-center p-4 max-h-96 overflow-y-auto'>
            {renderContent()}
          </div>
        ) : null}
        
        {renderFooter ? (
          <DrawerFooter className="px-4">
            {!isLoading ? renderFooter() : (
              <InProgress />
            )}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
