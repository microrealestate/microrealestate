import {
  Box,
  Grid,
  Hidden,
  List,
  ListItem,
  Paper,
  Typography,
  useTheme,
} from '@material-ui/core';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { NumberFormat, useFormatNumber } from '../../utils/numberformat';
import { useContext, useMemo } from 'react';

import { CelebrationIllustration } from '../../components/Illustrations';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import TenantAvatar from '../../components/tenants/TenantAvatar';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function TenantListItem({ tenant, balance, onClick }) {
  return (
    <ListItem button onClick={onClick}>
      <Box display="flex" alignItems="center" width="100%">
        <Hidden smDown>
          <Box mr={1}>
            <TenantAvatar tenant={tenant} />
          </Box>
        </Hidden>
        <Box flexGrow={1}>
          <Typography variant="body2">{tenant.name}</Typography>
        </Box>
        <NumberFormat value={balance} withColor variant="h6" />
      </Box>
    </ListItem>
  );
}

function MonthFigures() {
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
                          `/${store.organization.selected.name}/payment/${
                            tenant._id
                          }/${rent.term}/${encodeURI(
                            t('Dashboard')
                          )}/${encodeURIComponent(router.asPath)}`
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
}

export default observer(MonthFigures);
