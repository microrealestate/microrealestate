import { Box, Grid, Paper } from '@material-ui/core';
import { useCallback, useContext, useMemo } from 'react';

import DescriptionIcon from '@material-ui/icons/Description';
import FirstConnection from './FirstConnection';
import PeopleIcon from '@material-ui/icons/People';
import ReceiptIcon from '@material-ui/icons/Receipt';
import ShortcutButton from '../../components/ShortcutButton';
import StopIcon from '@material-ui/icons/Stop';
import { StoreContext } from '../../store';
import useNewLeaseDialog from '../organization/NewLeaseDialog';
import useNewPaymentDialog from '../payment/NewPaymentDialog';
import useNewPropertyDialog from '../properties/NewPropertyDialog';
import useNewTenantDialog from '../tenants/NewTenantDialog';
import { useRouter } from 'next/router';
import useTerminateLeaseDialog from '../tenants/TerminateLeaseDialog';
import useTranslation from 'next-translate/useTranslation';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { WelcomeIllustration } from '../../components/Illustrations';

export default function Shortcuts({ firstConnection = false }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
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
        <Paper>
          <Grid container spacing={0}>
            <Grid item xs={12} md={6}>
              <Box py={1} height="100%">
                <WelcomeIllustration />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <FirstConnection
                hasContract={hasContract}
                hasProperty={hasProperty}
                hasTenant={hasTenant}
                handleCreateContract={handleCreateContract}
                handleAddProperty={handleAddProperty}
                handleAddTenant={handleAddTenant}
              />
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <>
          <Paper>
            <Grid container spacing={0}>
              <Grid item xs={12} md={6}>
                <Box py={1} height="100%">
                  <WelcomeIllustration />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box p={3} display="flex" alignItems="center">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={ReceiptIcon}
                        label={t('Enter a rent settlement')}
                        disabled={!store.dashboard.data?.overview?.tenantCount}
                        onClick={handlePayment}
                        data-cy="shortcutSettleRent"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={StopIcon}
                        label={t('Terminate a lease')}
                        onClick={handleTerminateLease}
                        data-cy="shortcutTerminateLease"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={VpnKeyIcon}
                        label={t('Add a new property')}
                        onClick={handleAddProperty}
                        data-cy="shortcutAddProperty"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={PeopleIcon}
                        label={t('Add a new tenant')}
                        onClick={handleAddTenant}
                        data-cy="shortcutAddTenant"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={DescriptionIcon}
                        label={t('Create a new contract')}
                        onClick={handleCreateContract}
                        data-cy="shortcutCreateContract"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          <NewPaymentDialog
            backPage={t('Dashboard')}
            backPath={router.asPath}
          />
          <TerminateLeaseDialog tenantList={tenantsNotTerminated} />
        </>
      )}
      <NewTenantDialog backPage={t('Dashboard')} backPath={router.asPath} />
      <NewPropertyDialog backPage={t('Dashboard')} backPath={router.asPath} />
      <NewLeaseDialog backPage={t('Dashboard')} backPath={router.asPath} />
    </>
  );
}
