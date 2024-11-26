import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '../ui/drawer';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { Button } from '../ui/button';
import PaymentTabs from './PaymentTabs';
import RentSelector from './RentSelector';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

export default function NewPaymentDialog({
  open,
  setOpen,
  data: defaultRent,
  onClose
}) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [selectedRent, setSelectedRent] = useState();
  const [rents, setRents] = useState();
  const formRef = useRef();

  useEffect(() => {
    const fetchRents = async () => {
      const { status, data } = await store.rent.fetchWithoutUpdatingStore();

      if (status !== 200) {
        toast.error(t('Something went wrong'));
        setRents([]);
      } else {
        setRents(data.rents);
        if (data.rents.length === 1) {
          setSelectedRent(data.rents[0]);
        }
      }
    };

    setSelectedRent(open ? defaultRent : null);
    setRents(open && defaultRent ? [defaultRent] : null);
    if (open && !defaultRent) {
      fetchRents();
    }
  }, [open, defaultRent, store, t]);

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
      <DrawerContent className="h-full w-full">
        <DrawerHeader className="mx-auto w-full max-w-screen-lg text-lg md:text-xl font-semibold leading-none tracking-tight px-4">
          <DrawerTitle>
            {rents?.length > 1 ? t('Pay a rent') : t('Enter a rent settlement')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto mx-auto w-full max-w-screen-lg space-y-2">
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

        <DrawerFooter className="mx-auto w-full max-w-screen-lg">
          <div className="flex flex-col md:flex-row md:justify-end sm:gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('Cancel')}
            </Button>
            <Button
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
