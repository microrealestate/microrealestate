import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { fetchRents, QueryKeys } from '@/utils/restcalls';
import DrawerActionBar from '../DrawerActionBar';
import PaymentTabs from './PaymentTabs';
import RentSelector from './RentSelector';

export default function NewPaymentDialog({
  open,
  setOpen,
  data: defaultRent,
  onClose = () => {}
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
          <DrawerTitle>{t('Record payment')}</DrawerTitle>
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

        <DrawerActionBar>
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
        </DrawerActionBar>
      </DrawerContent>
    </Drawer>
  );
}
