import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Box,
  Grid,
  Hidden,
  List,
  ListItem,
  Paper,
  Typography,
} from '@material-ui/core';
import {
  CelebrationIllustration,
  WelcomeIllustration,
} from '../../../components/Illustrations';
import { NumberFormat, useFormatNumber } from '../../../utils/numberformat';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useComponentMountedRef, useInterval } from '../../../utils/hooks';

import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import { DashboardCard } from '../../../components/Cards';
import DescriptionIcon from '@material-ui/icons/Description';
import FirstConnection from './FirstConnection';
import moment from 'moment';
import NewLeaseDialog from '../../../components/organization/NewLeaseDialog';
import NewPaymentDialog from '../../../components/payment/NewPaymentDialog';
import NewPropertyDialog from '../../../components/properties/NewPropertyDialog';
import NewTenantDialog from '../../../components/tenants/NewTenantDialog';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PeopleIcon from '@material-ui/icons/People';
import ReceiptIcon from '@material-ui/icons/Receipt';
import ShortcutButton from '../../../components/ShortcutButton';
import StopIcon from '@material-ui/icons/Stop';
import { StoreContext } from '../../../store';
import TenantAvatar from '../../../components/tenants/TenantAvatar';
import TerminateLeaseDialog from '../../../components/tenants/TerminateLeaseDialog';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@material-ui/styles';
import useTranslation from 'next-translate/useTranslation';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { withAuthentication } from '../../../components/Authentication';

const fetchDashboardData = async (store) => {
  const responses = await Promise.all([
    store.dashboard.fetch(),
    store.tenant.fetch(),
    store.lease.fetch(),
  ]);

  return responses.find(({ status }) => status !== 200);
};

const FigureCardContent = ({ nav, children }) => (
  <Box position="relative">
    <Box
      height={150}
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="success.dark"
    >
      {children}
    </Box>
    {nav && (
      <Box position="absolute" bottom={0} right={0} fontSize={30}>
        <ArrowRightAltIcon fontSize="inherit" color="action" />
      </Box>
    )}
  </Box>
);

const TenantListItem = ({ tenant, balance, onClick }) => (
  <ListItem button onClick={onClick}>
    <Box display="flex" alignItems="center" width="100%">
      <Box mr={1}>
        <TenantAvatar tenant={tenant} />
      </Box>
      <Box flexGrow={1}>
        <Typography>{tenant.name}</Typography>
      </Box>
      <NumberFormat value={balance} withColor variant="h6" />
    </Box>
  </ListItem>
);

const Shortcuts = ({ firstConnection = false }) => {
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
        <FirstConnection
          hasContract={hasContract}
          hasProperty={hasProperty}
          hasTenant={hasTenant}
          handleCreateContract={() => setOpenNewLeaseDialog(true)}
          handleCreateProperty={() => setOpenNewPropertyDialog(true)}
          handleCreateTenant={() => setOpenNewTenantDialog(true)}
        />
      ) : (
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
  );
};

const GeneralFigures = observer(() => {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <Grid container spacing={5}>
      <Hidden smDown>
        <Grid item xs={12} md={4} lg={2}>
          <DashboardCard
            title={t('Tenant')}
            onClick={() => {
              router.push(`/${store.organization.selected.name}/tenants`);
            }}
          >
            <FigureCardContent nav>
              <Typography variant="h3">
                {store.dashboard.data.overview?.tenantCount}
              </Typography>
            </FigureCardContent>
          </DashboardCard>
        </Grid>
        <Grid item xs={12} md={4} lg={2}>
          <DashboardCard
            title={t('Property')}
            onClick={() => {
              router.push(`/${store.organization.selected.name}/properties`);
            }}
          >
            <FigureCardContent nav>
              <Typography variant="h3">
                {store.dashboard.data.overview?.propertyCount}
              </Typography>
            </FigureCardContent>
          </DashboardCard>
        </Grid>
        <Grid item xs={12} md={4} lg={2}>
          <DashboardCard title={t('Occupancy rate')}>
            <FigureCardContent>
              <NumberFormat
                value={store.dashboard.data.overview?.occupancyRate}
                minimumFractionDigits={0}
                style="percent"
                variant="h3"
              />
            </FigureCardContent>
          </DashboardCard>
        </Grid>
      </Hidden>
      <Grid item xs={12} md={12} lg={6}>
        <DashboardCard title={t('Revenues')}>
          <FigureCardContent>
            <NumberFormat
              value={store.dashboard.data.overview?.totalYearRevenues}
              variant="h3"
            />
          </FigureCardContent>
        </DashboardCard>
      </Grid>
    </Grid>
  );
});

const MonthFigures = observer(() => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const theme = useTheme();
  const formatNumber = useFormatNumber();

  const data = useMemo(() => {
    const currentRevenues = store.dashboard.currentRevenues;
    return [
      {
        name: 'paid',
        value: currentRevenues.paid,
        yearMonth: moment().format('YYYY.MM'),
        status: 'paid',
      },
      {
        name: 'notPaid',
        value: currentRevenues.notPaid,
        yearMonth: moment().format('YYYY.MM'),
        status: 'notpaid',
      },
    ];
  }, [store.dashboard.currentRevenues]);

  return (
    <>
      <Box mb={3}>
        <Typography variant="h5">
          {t('Rents of {{monthYear}}', {
            monthYear: moment().format('MMMM YYYY'),
          })}
        </Typography>
      </Box>
      <Grid container spacing={5}>
        <Grid item xs={12} md={5}>
          <Box mb={1}>
            <Typography variant="subtitle1">{t('Settlements')}</Typography>
          </Box>
          <Paper>
            <Box pt={2} width="100%" height={296}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Legend
                    verticalAlign="top"
                    formatter={(value) =>
                      value === 'paid' ? t('Rents paid') : t('Rents not paid')
                    }
                  />
                  <Pie
                    data={data}
                    startAngle={180}
                    endAngle={0}
                    cy="70%"
                    paddingAngle={2}
                    dataKey="value"
                    innerRadius="55%"
                    cursor="pointer"
                    onClick={(data) => {
                      if (!data?.payload) {
                        return;
                      }
                      const {
                        payload: { yearMonth, status },
                      } = data;
                      router.push(
                        `/${store.organization.selected.name}/rents/${yearMonth}?status=${status}`
                      );
                    }}
                    label={({ value }) => (value ? formatNumber(value) : '')}
                    labelLine={false}
                  >
                    <Cell fill={theme.palette.success.dark} />
                    <Cell fill={theme.palette.warning.dark} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Box mb={1}>
            <Typography variant="subtitle1">
              {t('Top 5 of not paid rents')}
            </Typography>
          </Box>
          <Paper>
            {store.dashboard.data.topUnpaid?.length ? (
              <List style={{ height: 296 }}>
                {store.dashboard.data.topUnpaid.map(
                  ({ tenant, balance, rent }) => (
                    <TenantListItem
                      key={tenant._id}
                      tenant={tenant}
                      balance={balance}
                      onClick={() => {
                        store.rent.setSelected(rent);
                        router.push(
                          `/${store.organization.selected.name}/payment/${tenant._id}/${rent.term}`
                        );
                      }}
                    />
                  )
                )}
              </List>
            ) : (
              <Box py={1}>
                <CelebrationIllustration
                  label={t('Well done! All rents are paid')}
                  height={252}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
});

const YearFigures = observer(() => {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const formatNumber = useFormatNumber();
  const theme = useTheme();

  const data = useMemo(() => {
    const now = moment();
    return store.dashboard.data.revenues?.reduce((acc, revenues) => {
      const revenuesMoment = moment(revenues.month, 'MMYYYY');
      const graphData = {
        ...revenues,
        name: revenuesMoment.format('MMM'),
        yearMonth: moment(revenues.month, 'MMYYYY').format('YYYY.MM'),
      };
      if (revenuesMoment.isSameOrBefore(now)) {
        acc.push(graphData);
      } else {
        acc.push({
          ...graphData,
          notPaid: 0,
        });
      }
      return acc;
    }, []);
  }, [store.dashboard.data.revenues]);

  const hasRevenues = useMemo(() => {
    return data.some((r) => r.notPaid !== 0 || r.paid !== 0);
  }, [data]);

  const onClick = useCallback(
    (data) => {
      if (
        !data?.activePayload?.[0]?.payload ||
        !store.organization.selected?.name
      ) {
        return;
      }
      const {
        activePayload: [
          {
            payload: { yearMonth },
          },
        ],
      } = data;
      store.rent.setPeriod(moment(yearMonth, 'YYYY.MM', true));
      router.push(`/${store.organization.selected.name}/rents/${yearMonth}`);
    },
    [router, store.rent, store.organization.selected.name]
  );

  return hasRevenues ? (
    <>
      <Box mb={3}>
        <Typography variant="h5">
          {t('Rents of {{year}}', {
            year: moment().format('YYYY'),
          })}
        </Typography>
      </Box>
      <Grid container>
        <Grid item xs={12}>
          <Paper>
            <Box py={2} px={3} width="100%" height={600}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  stackOffset="sign"
                  onClick={onClick}
                >
                  <XAxis
                    type="number"
                    hide={true}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    dataKey="name"
                    hide={false}
                    axisLine={false}
                    tickLine={false}
                    type="category"
                  />
                  <Legend
                    verticalAlign="top"
                    height={40}
                    formatter={(value) =>
                      value === 'paid' ? t('Rent paid') : t('Rents not paid')
                    }
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="notPaid"
                    fill={theme.palette.warning.dark}
                    stackId="stack"
                    cursor="pointer"
                    background={{ fill: theme.palette.grey[300] }}
                    label={{
                      fill: theme.palette.grey[50],
                      formatter: (value) =>
                        value < 0 ? formatNumber(value) : '',
                    }}
                  />

                  <Bar
                    isAnimationActive={false}
                    dataKey="paid"
                    fill={theme.palette.success.dark}
                    stackId="stack"
                    cursor="pointer"
                    label={{
                      fill: theme.palette.grey[50],
                      formatter: (value) =>
                        value > 0 ? formatNumber(value) : '',
                    }}
                  />
                  <ReferenceLine x={0} stroke={theme.palette.grey[400]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  ) : null;
});

const Welcome = () => {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  return (
    <Typography component="h1" variant="h5">
      {t('Welcome {{firstName}}', {
        firstName: store.user.firstName,
        lastName: store.user.lastName,
      })}
    </Typography>
  );
};

const Dashboard = observer(() => {
  console.log('Dashboard functional component');
  const store = useContext(StoreContext);
  const [ready, setReady] = useState(false);
  const mountedRef = useComponentMountedRef();
  const triggerRefreshData = useInterval(
    () => fetchDashboardData(store),
    10000
  );

  useEffect(() => {
    const fetchData = async () => {
      await fetchDashboardData(store);
      if (mountedRef.current) {
        setReady(true);
      }
    };
    fetchData();
  }, [mountedRef, store]);

  useEffect(() => {
    if (mountedRef.current && ready) {
      triggerRefreshData.start();
    }

    return () => triggerRefreshData.clear();
  }, [mountedRef, triggerRefreshData, ready]);

  const isFirstConnection = useMemo(() => {
    return (
      !store.lease?.items?.filter(({ system }) => !system)?.length ||
      !store.dashboard.data.overview?.propertyCount ||
      !store.tenant?.items?.length
    );
  }, [
    store.dashboard.data.overview?.propertyCount,
    store.lease?.items,
    store.tenant?.items?.length,
  ]);

  return (
    <Page loading={!ready}>
      <>
        <Box my={5}>
          <Welcome />
        </Box>
        {isFirstConnection ? (
          <Box mt={10}>
            <Shortcuts firstConnection={true} />
          </Box>
        ) : (
          <>
            <Box mb={10}>
              <Shortcuts />
            </Box>
            <Box my={10}>
              <GeneralFigures />
            </Box>
            <Box my={10}>
              <MonthFigures />
            </Box>
            <Hidden smDown>
              {!!store.dashboard.data.overview && (
                <Box my={10}>
                  <YearFigures />
                </Box>
              )}
            </Hidden>
          </>
        )}
      </>
    </Page>
  );
});

export default withAuthentication(Dashboard);
