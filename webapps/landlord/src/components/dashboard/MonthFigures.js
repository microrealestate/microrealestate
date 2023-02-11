import {
  Box,
  Grid,
  List,
  ListItem,
  Paper,
  Typography,
  useTheme,
} from '@material-ui/core';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useContext, useMemo } from 'react';

import { CelebrationIllustration } from '../../components/Illustrations';
import moment from 'moment';
import NumberFormat from '../NumberFormat';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useFormatNumber from '../../hooks/useFormatNumber';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function TenantListItem({ tenant, balance, onClick }) {
  return (
    <ListItem button onClick={onClick}>
      <Box display="flex" alignItems="center" width="100%">
        <Box flexGrow={1}>
          <Typography variant="body2">{tenant.name}</Typography>
        </Box>
        <NumberFormat value={balance} withColor fontSize="h6.fontSize" />
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
  const yearMonth = moment().format('YYYY.MM');
  const data = useMemo(() => {
    const currentRevenues = store.dashboard.currentRevenues;
    return [
      {
        name: 'notPaid',
        value: currentRevenues.notPaid,
        yearMonth,
        status: 'notpaid',
      },
      {
        name: 'paid',
        value: currentRevenues.paid,
        yearMonth,
        status: 'paid',
      },
    ];
  }, [store.dashboard.currentRevenues, yearMonth]);

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
            <Box pt={2} width="100%" height={239}>
              <ResponsiveContainer height={239}>
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
                      store.rent.setFilters({ status: [status] });
                      router.push(
                        `/${store.organization.selected.name}/rents/${yearMonth}?status=${status}`
                      );
                    }}
                    label={({ value }) => (value ? formatNumber(value) : '')}
                    labelLine={false}
                  >
                    <Cell fill={theme.palette.warning.dark} />
                    <Cell fill={theme.palette.success.dark} />
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
              <List style={{ height: 239 }}>
                {store.dashboard.data.topUnpaid.map(
                  ({ tenant, balance, rent }) => (
                    <TenantListItem
                      key={tenant._id}
                      tenant={tenant}
                      balance={balance}
                      onClick={() => {
                        store.rent.setSelected(rent);
                        store.rent.setFilters({ searchText: tenant.name });
                        router.push(
                          `/${store.organization.selected.name}/rents/${yearMonth}?search=${tenant.name}`
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
                  height={223}
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
