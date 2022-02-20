import { Box, Grid, Paper } from '@material-ui/core';
import { useContext, useMemo, useState } from 'react';

import DescriptionIcon from '@material-ui/icons/Description';
import FirstConnection from './FirstConnection';
import NewLeaseDialog from '../../components/organization/NewLeaseDialog';
import NewPaymentDialog from '../../components/payment/NewPaymentDialog';
import NewPropertyDialog from '../../components/properties/NewPropertyDialog';
import NewTenantDialog from '../../components/tenants/NewTenantDialog';
import PeopleIcon from '@material-ui/icons/People';
import ReceiptIcon from '@material-ui/icons/Receipt';
import ShortcutButton from '../../components/ShortcutButton';
import StopIcon from '@material-ui/icons/Stop';
import { StoreContext } from '../../store';
import TerminateLeaseDialog from '../../components/tenants/TerminateLeaseDialog';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { WelcomeIllustration } from '../../components/Illustrations';

export default function Shortcuts({ firstConnection = false }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');

  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);
  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const [openNewLeaseDialog, setOpenNewLeaseDialog] = useState(false);
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [openTerminateLease, setOpenTerminateLease] = useState(false);

  const tenantsNotTerminated = useMemo(
    () => store.tenant.items.filter((t) => !t.terminated),
    [store.tenant.items]
  );

  const hasContract = !!store.lease?.items?.filter(({ system }) => !system)
    ?.length;
  const hasProperty = !!store.dashboard.data.overview?.propertyCount;
  const hasTenant = !!store.tenant?.items?.length;

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
                handleCreateContract={() => setOpenNewLeaseDialog(true)}
                handleCreateProperty={() => setOpenNewPropertyDialog(true)}
                handleCreateTenant={() => setOpenNewTenantDialog(true)}
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
                <Box p={3} height={362} display="flex" alignItems="center">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={ReceiptIcon}
                        label={t('Enter a rent settlement')}
                        disabled={!store.dashboard.data?.overview?.tenantCount}
                        onClick={() => setOpenNewPaymentDialog(true)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={StopIcon}
                        label={t('Terminate a lease')}
                        onClick={() => setOpenTerminateLease(true)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={VpnKeyIcon}
                        label={t('Add a new property')}
                        onClick={() => setOpenNewPropertyDialog(true)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={PeopleIcon}
                        label={t('Add a new tenant')}
                        onClick={() => setOpenNewTenantDialog(true)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ShortcutButton
                        Icon={DescriptionIcon}
                        label={t('Create a new contract')}
                        onClick={() => setOpenNewLeaseDialog(true)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          <NewPaymentDialog
            open={openNewPaymentDialog}
            setOpen={setOpenNewPaymentDialog}
            backPage={t('Dashboard')}
            backPath={router.asPath}
          />
          <TerminateLeaseDialog
            open={openTerminateLease}
            setOpen={setOpenTerminateLease}
            tenantList={tenantsNotTerminated}
          />
        </>
      )}
      <NewTenantDialog
        open={openNewTenantDialog}
        setOpen={setOpenNewTenantDialog}
        backPage={t('Dashboard')}
        backPath={router.asPath}
      />
      <NewPropertyDialog
        open={openNewPropertyDialog}
        setOpen={setOpenNewPropertyDialog}
        backPage={t('Dashboard')}
        backPath={router.asPath}
      />
      <NewLeaseDialog
        open={openNewLeaseDialog}
        setOpen={setOpenNewLeaseDialog}
        backPage={t('Dashboard')}
        backPath={router.asPath}
      />
    </>
  );
}
