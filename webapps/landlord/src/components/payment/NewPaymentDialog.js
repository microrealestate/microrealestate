import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { Button } from '../ui/button';
import { flushSync } from 'react-dom';
import PaymentTabs from './PaymentTabs';
import RentSelector from './RentSelector';
import ResponsiveDialog from '../ResponsiveDialog';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useDialog from '../../hooks/useDialog';
import useTranslation from 'next-translate/useTranslation';

function NewPaymentDialog({ open, setOpen, onClose }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [rents, setRents] = useState([]);
  const [selectedRent, setSelectedRent] = useState({});
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

    if (open) {
      if (!open?._id) {
        fetchRents();
      } else {
        const rent = open;
        setTimeout(() => {
          flushSync(() => {
            setSelectedRent(rent);
          });
          flushSync(() => {
            setRents([rent]);
          });
        });
      }
    }
  }, [open, store, t]);

  const onRentChange = async (rent) => {
    setSelectedRent(rent);
    formRef.current?.setValues(rent);
  };

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleSave = useCallback(() => {
    formRef.current.submit();
  }, []);

  const handleSubmit = useCallback(() => {
    onClose?.(selectedRent);
    handleClose();
  }, [handleClose, onClose, selectedRent]);

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      renderHeader={() =>
        rents?.length > 1 ? t('Pay a rent') : t('Enter a rent settlement')
      }
      renderContent={() => (
        <div>
          <RentSelector
            value={selectedRent}
            rents={rents}
            onChange={onRentChange}
            className="mb-2"
          />
          {selectedRent.term ? (
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
            disabled={!!selectedRent.occupant === false}
          >
            {t('Save')}
          </Button>
        </>
      )}
    />
  );
}

export default function useNewPaymentDialog() {
  return useDialog(NewPaymentDialog);
}
