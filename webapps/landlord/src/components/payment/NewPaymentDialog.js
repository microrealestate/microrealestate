import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/providers/StoreProvider';
import { fetchRents, QueryKeys } from '@/utils/restcalls';
import PaymentTabs from './PaymentTabs';
import RentSelector from './RentSelector';

export default function NewPaymentDialog({
  open,
  setOpen,
  data: defaultRent,
  onClose
}) {
  const t = useTranslations('common');
  const store = useStore();
  const [selectedRent, setSelectedRent] = useState();
  const formRef = useRef();
  const { data, isError } = useQuery({
    queryKey: [QueryKeys.RENTS],
    queryFn: () => fetchRents(store, null, false),
    enabled: !!open && !defaultRent,
    refetchOnMount: 'always',
    retry: 3
  });

  useEffect(() => {
    if (defaultRent) {
      setSelectedRent(defaultRent);
    } else if (data?.rents?.length === 1) {
      setSelectedRent(data.rents[0]);
    }
  }, [defaultRent, data]);

  if (isError) {
    toast.error(t('Something went wrong'));
  }

  const rents = !defaultRent ? data?.rents || [] : [defaultRent];

  const handleRentChange = async (rent) => {
    setSelectedRent(rent);
    formRef.current?.setValues(rent);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleSave = useCallback(() => {
    formRef.current.submit();
  }, []);

  const handleSubmit = useCallback(() => {
    onClose?.(selectedRent);
    handleClose();
  }, [handleClose, onClose, selectedRent]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent fullScreen data-cy="newPaymentDialog">
        <DrawerHeader className="mx-auto w-full max-w-(--breakpoint-lg) text-lg md:text-xl font-semibold leading-none tracking-tight px-4">
          <DrawerTitle>{t('Cash a rent')}</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto mx-auto w-full max-w-(--breakpoint-lg) space-y-2">
          <RentSelector
            value={selectedRent}
            rents={rents}
            onChange={handleRentChange}
          />
          {selectedRent?.term ? (
            <PaymentTabs
              ref={formRef}
              rent={selectedRent}
              onSubmit={handleSubmit}
            />
          ) : null}
        </div>

        <DrawerFooter className="mx-auto w-full max-w-(--breakpoint-lg)">
          <div className="flex flex-col md:flex-row md:justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('Cancel')}
            </Button>
            <Button
              data-cy="savePayment"
              onClick={handleSave}
              disabled={!!selectedRent?.occupant === false}
            >
              {t('Save')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
