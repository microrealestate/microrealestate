/* eslint-disable sort-imports */
import { Card, CardContent } from '../../components/ui/card';
import { LuKeyRound, LuStopCircle, LuUserCircle } from 'react-icons/lu';
import { TbCashRegister } from 'react-icons/tb';
import { useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '../../utils';
import FirstConnection from './FirstConnection';
import NewLeaseDialog from '../organization/lease/NewLeaseDialog';
import NewPaymentDialog from '../payment/NewPaymentDialog';
import NewPropertyDialog from '../properties/NewPropertyDialog';
import NewTenantDialog from '../tenants/NewTenantDialog';
import { observer } from 'mobx-react-lite';
import { RiContractLine } from 'react-icons/ri';
import ShortcutButton from '../ShortcutButton';
import { StoreContext } from '../../store';
import TerminateLeaseDialog from '../tenants/TerminateLeaseDialog';
import { useMediaQuery } from 'usehooks-ts';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { WelcomeIllustration } from '../../components/Illustrations';

function Shortcuts({ firstConnection = false, className }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);
  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [openTerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useState(false);

  const tenantsNotTerminated = useMemo(
    () => store.tenant.items.filter((t) => !t.terminated),
    [store.tenant.items]
  );

  const hasContract = !!store.lease?.items?.length;
  const hasProperty = !!store.dashboard.data.overview?.propertyCount;
  const hasTenant = !!store.tenant?.items?.length;

  const handleCreateContract = useCallback(() => {
    setOpenNewLeaseDialog(true);
  }, [setOpenNewLeaseDialog]);

  const handleAddProperty = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, [setOpenNewPropertyDialog]);

  const handleAddTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, [setOpenNewTenantDialog]);

  const handlePayment = useCallback(() => {
    setOpenNewPaymentDialog(true);
  }, [setOpenNewPaymentDialog]);

  const handleTerminateLease = useCallback(() => {
    setOpenTerminateLeaseDialog(true);
  }, [setOpenTerminateLeaseDialog]);

  return (
    <>
      {firstConnection ? (
        <Card className={className}>
          <CardContent className="flex items-center justify-center pt-6 ">
            <div className="hidden lg:block h-full w-1/2">
              <WelcomeIllustration />
            </div>
            <FirstConnection
              hasContract={hasContract}
              hasProperty={hasProperty}
              hasTenant={hasTenant}
              handleCreateContract={handleCreateContract}
              handleAddProperty={handleAddProperty}
              handleAddTenant={handleAddTenant}
            />
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            'fixed grid grid-cols-5 gap-1.5 bottom-0 left-0 w-full z-50 border-t rounded-none',
            'md:relative md:z-auto md:rounded-md md:border md:gap-4 md:p-4',
            className
          )}
        >
          <ShortcutButton
            Icon={TbCashRegister}
            label={isDesktop ? t('Pay a rent') : t('Pay')}
            disabled={!store.dashboard.data?.overview?.tenantCount}
            onClick={handlePayment}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutSettleRent"
          />

          <ShortcutButton
            Icon={LuStopCircle}
            label={isDesktop ? t('Terminate a lease') : t('Terminate')}
            onClick={handleTerminateLease}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutTerminateLease"
          />

          <ShortcutButton
            Icon={LuKeyRound}
            label={isDesktop ? t('Add a property') : t('Add')}
            onClick={handleAddProperty}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutAddProperty"
          />

          <ShortcutButton
            Icon={LuUserCircle}
            label={isDesktop ? t('Add a tenant') : t('Add')}
            onClick={handleAddTenant}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutAddTenant"
          />

          {store.user.isAdministrator && (
            <ShortcutButton
              Icon={RiContractLine}
              label={isDesktop ? t('Create a contract') : t('Create')}
              onClick={handleCreateContract}
              className="md:flex md:flex-col md:items-center md:justify-start"
              data-cy="shortcutCreateContract"
            />
          )}
        </Card>
      )}
      <NewPaymentDialog
        open={openNewPaymentDialog}
        setOpen={setOpenNewPaymentDialog}
      />
      <TerminateLeaseDialog
        open={openTerminateLeaseDialog}
        setOpen={setOpenTerminateLeaseDialog}
        tenantList={tenantsNotTerminated}
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
  );
}

export default observer(Shortcuts);
