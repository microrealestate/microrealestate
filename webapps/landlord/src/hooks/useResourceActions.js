import { useMemo, useState } from 'react';
import NewLeaseDialog from '../components/organization/lease/NewLeaseDialog';
import NewPaymentDialog from '../components/payment/NewPaymentDialog';
import NewPropertyDialog from '../components/properties/NewPropertyDialog';
import NewTenantDialog from '../components/tenants/NewTenantDialog';
import TerminateLeaseDialog from '../components/tenants/TerminateLeaseDialog';

export default function useResourceActions() {
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);
  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [openTerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useState(false);

  const handleCreateContract = () => {
    setOpenNewLeaseDialog(true);
  };

  const handleAddProperty = () => {
    setOpenNewPropertyDialog(true);
  };

  const handleAddTenant = () => {
    setOpenNewTenantDialog(true);
  };

  const handlePayment = () => {
    setOpenNewPaymentDialog(true);
  };

  const handleTerminateLease = () => {
    setOpenTerminateLeaseDialog(true);
  };

  const ResourceDialogs = useMemo(
    () => () => (
      <>
        <NewPaymentDialog
          open={openNewPaymentDialog}
          setOpen={setOpenNewPaymentDialog}
        />
        <TerminateLeaseDialog
          open={openTerminateLeaseDialog}
          setOpen={setOpenTerminateLeaseDialog}
        />
        <NewTenantDialog
          open={openNewTenantDialog}
          setOpen={setOpenNewTenantDialog}
        />
        <NewPropertyDialog
          open={openNewPropertyDialog}
          setOpen={setOpenNewPropertyDialog}
        />
        <NewLeaseDialog
          open={openNewLeaseDialog}
          setOpen={setOpenNewLeaseDialog}
        />
      </>
    ),
    [
      openNewLeaseDialog,
      openNewTenantDialog,
      openNewPropertyDialog,
      openNewPaymentDialog,
      openTerminateLeaseDialog
    ]
  );

  return {
    ResourceDialogs,
    handleCreateContract,
    handleAddProperty,
    handleAddTenant,
    handlePayment,
    handleTerminateLease
  };
}
