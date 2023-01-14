import { Box, Grid } from '@material-ui/core';

import Hidden from '../HiddenSSRCompatible';
import NumberFormat from '../NumberFormat';
import { PageCard } from '../Cards';
import ReceiptIcon from '@material-ui/icons/Receipt';
import { StoreContext } from '../../store';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export function RentOverview({ ...props }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <Box {...props}>
      <Hidden xsDown>
        <Grid container spacing={3}>
          <Grid item sm={4} md={2}>
            <Box display="flex" height="100%">
              <PageCard
                variant="info"
                Icon={ReceiptIcon}
                title={t('Rents')}
                info={store.rent.period.format('MMMM YYYY')}
              >
                {store.rent.countAll}
              </PageCard>
            </Box>
          </Grid>
          <Grid item sm={4} md={5}>
            <PageCard
              variant="success"
              Icon={TrendingUpIcon}
              title={t('Paid')}
              info={t('{{count}} rents', {
                count: store.rent.countPaid + store.rent.countPartiallyPaid,
              })}
            >
              <NumberFormat value={store.rent.totalPaid} />
            </PageCard>
          </Grid>
          <Grid item sm={4} md={5}>
            <PageCard
              variant="warning"
              Icon={TrendingDownIcon}
              title={t('Not paid')}
              info={t('{{count}} rents', {
                count: store.rent.countNotPaid,
              })}
            >
              <NumberFormat value={store.rent.totalNotPaid} />
            </PageCard>
          </Grid>
        </Grid>
      </Hidden>
      <Hidden smUp>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <PageCard
              variant="success"
              Icon={TrendingUpIcon}
              title={t('Paid')}
              info={t('{{count}} rents', {
                count: store.rent.countPaid + store.rent.countPartiallyPaid,
              })}
            >
              <NumberFormat value={store.rent.totalPaid} />
            </PageCard>
          </Grid>
          <Grid item xs={6}>
            <PageCard
              variant="warning"
              Icon={TrendingDownIcon}
              title={t('Not paid')}
              info={t('{{count}} rents', {
                count: store.rent.countNotPaid,
              })}
            >
              <NumberFormat value={store.rent.totalNotPaid} />
            </PageCard>
          </Grid>
        </Grid>
      </Hidden>
    </Box>
  );
}
