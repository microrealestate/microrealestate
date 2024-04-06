import { Card, CardContent } from '../../components/ui/card';
import {
  CircleUserIcon,
  FileTextIcon,
  KeyRoundIcon,
  ReceiptTextIcon,
  StopCircleIcon
} from 'lucide-react';
('lucide-react');
import { useCallback, useContext, useMemo } from 'react';
import { cn } from '../../utils';
import FirstConnection from './FirstConnection';
import { observer } from 'mobx-react-lite';
import ShortcutButton from '../ShortcutButton';
import { StoreContext } from '../../store';
import { useMediaQuery } from 'usehooks-ts';
import useNewLeaseDialog from '../organization/lease/NewLeaseDialog';
import useNewPaymentDialog from '../payment/NewPaymentDialog';
import useNewPropertyDialog from '../properties/NewPropertyDialog';
import useNewTenantDialog from '../tenants/NewTenantDialog';
import { useRouter } from 'next/router';
import useTerminateLeaseDialog from '../tenants/TerminateLeaseDialog';
import useTranslation from 'next-translate/useTranslation';
import { WelcomeIllustration } from '../../components/Illustrations';

function Shortcuts({ firstConnection = false, className }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [NewLeaseDialog, setOpenNewLeaseDialog] = useNewLeaseDialog();
  const [NewTenantDialog, setOpenNewTenantDialog] = useNewTenantDialog();
  const [NewPropertyDialog, setOpenNewPropertyDialog] = useNewPropertyDialog();
  const [NewPaymentDialog, setOpenNewPaymentDialog] = useNewPaymentDialog();
  const [TerminateLeaseDialog, setOpenTerminateLeaseDialog] =
    useTerminateLeaseDialog();

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
          <CardContent className="flex items-center pt-6 ">
            <div className="hidden lg:block w-3/5 h-96">
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
            Icon={ReceiptTextIcon}
            label={isDesktop ? t('Pay a rent') : t('Pay')}
            disabled={!store.dashboard.data?.overview?.tenantCount}
            onClick={handlePayment}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutSettleRent"
          />

          <ShortcutButton
            Icon={StopCircleIcon}
            label={isDesktop ? t('Terminate a lease') : t('Terminate')}
            onClick={handleTerminateLease}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutTerminateLease"
          />

          <ShortcutButton
            Icon={KeyRoundIcon}
            label={isDesktop ? t('Add a property') : t('Add')}
            onClick={handleAddProperty}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutAddProperty"
          />

          <ShortcutButton
            Icon={CircleUserIcon}
            label={isDesktop ? t('Add a tenant') : t('Add')}
            onClick={handleAddTenant}
            className="md:flex md:flex-col md:items-center md:justify-start"
            data-cy="shortcutAddTenant"
          />

          {store.user.isAdministrator && (
            <ShortcutButton
              Icon={FileTextIcon}
              label={isDesktop ? t('Create a contract') : t('Create')}
              onClick={handleCreateContract}
              className="md:flex md:flex-col md:items-center md:justify-start"
              data-cy="shortcutCreateContract"
            />
          )}
        </Card>
      )}
      <NewPaymentDialog />
      <TerminateLeaseDialog tenantList={tenantsNotTerminated} />
      <NewTenantDialog backPage={t('Dashboard')} backPath={router.asPath} />
      <NewPropertyDialog backPage={t('Dashboard')} backPath={router.asPath} />
      <NewLeaseDialog backPage={t('Dashboard')} backPath={router.asPath} />
    </>
  );
}

export default observer(Shortcuts);
