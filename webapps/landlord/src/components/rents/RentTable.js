import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { QueryKeys } from '../../utils/restcalls';
import { EmptyIllustration } from '../Illustrations';
import NewPaymentDialog from '../payment/NewPaymentDialog';
import DesktopRentTable from './DesktopRentTable';
import MobileRentTable from './MobileRentTable';
import RentHistoryDialog from './RentHistoryDialog';
import SendByEmailDialog from './SendByEmailDialog';

export default function RentTable({
  rents = [],
  selected,
  setSelected,
  yearMonth
}) {
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [selectedRent, setSelectedRent] = useState(null);
  const [openByEmailDialog, setOpenByEmailDialog] = useState(false);
  const [openRentHistoryDialog, setOpenRentHistoryDialog] = useState(false);
  const [selectedRentHistory, setSelectedRentHistory] = useState({});

  const selectableCount = useMemo(() => {
    return rents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
      if (hasContactEmails) {
        acc.push(_id);
      }
      return acc;
    }, []).length;
  }, [rents]);

  const handleSelectAll = useCallback(
    (checked) => {
      let rentSelected = [];
      if (checked) {
        rentSelected = rents.filter((rent) => rent.occupant.hasContactEmails);
      }
      setSelected?.(rentSelected);
    },
    [rents, setSelected]
  );

  const handleSelectOne = useCallback(
    (rent) => (checked) => {
      let rentSelected = [];
      if (checked) {
        rentSelected = [...selected, rent];
      } else {
        rentSelected = selected.filter((r) => r._id !== rent._id);
      }
      setSelected?.(rentSelected);
    },
    [selected, setSelected]
  );

  const handlePay = useCallback((rent) => {
    setSelectedRent(rent);
    setOpenNewPaymentDialog(true);
  }, []);

  const handleSendEmail = useCallback((rent) => {
    setSelectedRent(rent);
    setOpenByEmailDialog(true);
  }, []);

  const handleEmailSent = useCallback(
    (isEmailSent) => {
      if (!isEmailSent) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RENTS, yearMonth] });
    },
    [queryClient, yearMonth]
  );

  const handleHistory = useCallback((rent) => {
    setSelectedRentHistory({
      tenant: rent.occupant,
      selectedTerm: rent.term
    });
    setOpenRentHistoryDialog(true);
  }, []);

  return (
    <>
      <NewPaymentDialog
        open={openNewPaymentDialog}
        setOpen={setOpenNewPaymentDialog}
        data={selectedRent}
      />

      <SendByEmailDialog
        open={openByEmailDialog}
        setOpen={setOpenByEmailDialog}
        data={[selectedRent]}
        onDone={handleEmailSent}
      />

      <RentHistoryDialog
        open={openRentHistoryDialog}
        setOpen={setOpenRentHistoryDialog}
        data={selectedRentHistory}
      />

      {rents.length ? (
        <>
          <DesktopRentTable
            rents={rents}
            selected={selected}
            selectableCount={selectableCount}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onPay={handlePay}
            onSend={handleSendEmail}
            onHistory={handleHistory}
            className="hidden md:block"
          />
          <MobileRentTable
            rents={rents}
            selected={selected}
            selectableCount={selectableCount}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onPay={handlePay}
            onSend={handleSendEmail}
            onHistory={handleHistory}
            className="md:hidden"
          />
        </>
      ) : (
        <EmptyIllustration label={t('No rents found')} />
      )}
    </>
  );
}
