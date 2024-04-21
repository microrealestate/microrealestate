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
import ResponsiveDialog from '../ResponsiveDialog';
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
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      renderHeader={() =>
        rents?.length > 1 ? t('Pay a rent') : t('Enter a rent settlement')
      }
      renderContent={() => (
        <div>
          <RentSelector
            value={selectedRent}
            rents={rents}
            onChange={handleRentChange}
            className="mb-2"
          />
          {selectedRent?.term ? (
            <PaymentTabs
              ref={formRef}
              rent={selectedRent}
              onSubmit={handleSubmit}
            />
          ) : null}
        </div>
      )}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!selectedRent?.occupant === false}
          >
            {t('Save')}
          </Button>
        </>
      )}
    />
  );
}
