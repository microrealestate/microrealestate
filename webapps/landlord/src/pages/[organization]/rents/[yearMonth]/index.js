import { Box, Grid, Typography } from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../../store';
import { useCallback, useContext, useMemo } from 'react';

import { EmptyIllustration } from '../../../../components/Illustrations';
import Hidden from '../../../../components/HiddenSSRCompatible';
import { isServer } from '../../../../utils';
import moment from 'moment';
import NumberFormat from '../../../../components/NumberFormat';
import Page from '../../../../components/Page';
import { PageCard } from '../../../../components/Cards';
import PeriodPicker from '../../../../components/PeriodPicker';
import ReceiptIcon from '@material-ui/icons/Receipt';
import RentTable from '../../../../components/rents/RentTable';
import SearchFilterBar from '../../../../components/SearchFilterBar';
import { toJS } from 'mobx';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

function MobileToolbar({ rentPeriod, onChange }) {
  return (
    <PeriodPicker
      format="MMM YYYY"
      period="month"
      value={rentPeriod}
      onChange={onChange}
    />
  );
}

function DesktopToolbar({ rentPeriod, onChange }) {
  const { t } = useTranslation('common');
  return (
    <Grid container alignItems="center" spacing={2} wrap="nowrap">
      <Grid item>
        <Typography color="textSecondary" variant="h5" noWrap>
          {t('Rents')}
        </Typography>
      </Grid>
      <Grid item>
        <PeriodPicker
          format="MMM YYYY"
          period="month"
          value={rentPeriod}
          onChange={onChange}
        />
      </Grid>
    </Grid>
  );
}

function PeriodToolbar({ onChange }) {
  const router = useRouter();
  const rentPeriod = moment(router.query.yearMonth, 'YYYY.MM');

  return (
    <>
      <Hidden smDown>
        <DesktopToolbar rentPeriod={rentPeriod} onChange={onChange} />
      </Hidden>
      <Hidden mdUp>
        <MobileToolbar rentPeriod={rentPeriod} onChange={onChange} />
      </Hidden>
    </>
  );
}

function CardSection() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <Box mb={2}>
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
function Rents() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const onSearch = useCallback(
    (status, searchText) => {
      let queryString = '';
      if (searchText || status) {
        queryString = `?search=${encodeURIComponent(
          searchText
        )}&status=${encodeURIComponent(status)}`;
      }
      router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}${queryString}`,
        undefined,
        { shallow: true }
      );
      store.rent.setFilters({ status, searchText });
    },
    [router, store.rent, store.organization.selected.name]
  );

  const onPeriodChange = useCallback(
    async (period) => {
      store.rent.setPeriod(period);
      await router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}`
      );
    },
    [router, store.rent, store.organization.selected.name]
  );

  const filters = useMemo(
    () => [
      { id: '', label: t('All') },
      { id: 'notpaid', label: t('Not paid') },
      { id: 'partiallypaid', label: t('Partially paid') },
      { id: 'paid', label: t('Paid') },
    ],
    [t]
  );

  return (
    <Page
      title={t('Rents')}
      NavBar={<PeriodToolbar onChange={onPeriodChange} />}
      SearchBar={
        <SearchFilterBar
          filters={filters}
          defaultValue={store.rent.filters}
          onSearch={onSearch}
        />
      }
    >
      <CardSection />

      {store.rent?.filteredItems.length ? (
        <RentTable rents={store.rent?.filteredItems} />
      ) : (
        <EmptyIllustration label={t('No rents found')} />
      )}
    </Page>
  );
}

Rents.getInitialProps = async (context) => {
  const store = isServer() ? context.store : getStoreInstance();

  if (isServer()) {
    const { yearMonth, search, status } = context.query;
    const rentPeriod = moment(yearMonth, 'YYYY.MM', true);
    if (!rentPeriod.isValid()) {
      return { error: { statusCode: 404 } };
    }
    store.rent.setPeriod(rentPeriod);
    store.rent.setFilters({ searchText: search, status });
  }

  const { status } = await store.rent.fetch();
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  return {
    initialState: {
      store: isServer() ? toJS(store) : store,
    },
  };
};

export default withAuthentication(Rents);
