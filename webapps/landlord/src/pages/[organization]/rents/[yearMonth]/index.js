import { Box, Grid, Hidden, Typography } from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../../store';
import { useCallback, useContext, useMemo } from 'react';

import { EmptyIllustration } from '../../../../components/Illustrations';
import FullScreenDialogButton from '../../../../components/FullScreenDialogButton';
import { isServer } from '../../../../utils';
import moment from 'moment';
import { NumberFormat } from '../../../../utils/numberformat';
import { observer } from 'mobx-react-lite';
import Page from '../../../../components/Page';
import { PageCard } from '../../../../components/Cards';
import PeriodPicker from '../../../../components/PeriodPicker';
import ReceiptIcon from '@material-ui/icons/Receipt';
import RentCard from '../../../../components/rents/RentCard';
import RentTable from '../../../../components/rents/RentTable';
import SearchFilterBar from '../../../../components/SearchFilterBar';
import SendIcon from '@material-ui/icons/Send';
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

const Rents = observer(() => {
  console.log('Rents functional component');
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
        null,
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

  const onEdit = useCallback(
    async (rent) => {
      store.rent.setSelected(rent);
      await router.push(
        `/${store.organization.selected.name}/payment/${rent.occupant._id}/${
          store.rent.selected.term
        }/${encodeURI(
          t('Rents of {{date}}', {
            date: store.rent.period.format('MMM YYYY'),
          })
        )}/${encodeURIComponent(router.asPath)}`
      );
    },
    [t, router, store.rent, store.organization.selected.name]
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
      ActionToolbar={
        <FullScreenDialogButton
          variant="contained"
          buttonLabel={t('Send mass emails')}
          Icon={SendIcon}
          dialogTitle={t('Send mass emails')}
          cancelButtonLabel={t('Close')}
          showCancel
        >
          <RentTable />
        </FullScreenDialogButton>
      }
      NavBar={<PeriodToolbar onChange={onPeriodChange} />}
      SearchBar={
        <SearchFilterBar
          filters={filters}
          defaultValue={store.rent.filters}
          onSearch={onSearch}
        />
      }
    >
      {!store.rent.filters.searchText && (
        <Hidden smDown>
          <Box pb={3}>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <PageCard
                  variant="info"
                  Icon={ReceiptIcon}
                  title={t('Rents')}
                  info={t('Rents of {{period}}', {
                    period: store.rent.period.format('MMMM YYYY'),
                  })}
                >
                  <Typography variant="h3">{store.rent.countAll}</Typography>
                </PageCard>
              </Grid>
              <Grid item xs={4}>
                <PageCard
                  variant="success"
                  Icon={TrendingUpIcon}
                  title={t('Paid')}
                  info={t('{{count}} rents paid', {
                    count: store.rent.countPaid + store.rent.countPartiallyPaid,
                  })}
                >
                  <NumberFormat variant="h3" value={store.rent.totalPaid} />
                </PageCard>
              </Grid>
              <Grid item xs={4}>
                <PageCard
                  variant="warning"
                  Icon={TrendingDownIcon}
                  title={t('Not paid')}
                  info={t('{{count}} rents not paid', {
                    count: store.rent.countNotPaid,
                  })}
                >
                  <NumberFormat variant="h3" value={store.rent.totalNotPaid} />
                </PageCard>
              </Grid>
            </Grid>
          </Box>
        </Hidden>
      )}

      {store.rent?.filteredItems.length ? (
        <Grid container spacing={3}>
          {store.rent.filteredItems.map((rent) => (
            <Grid key={rent._id} item xs={12} md={6} lg={4}>
              <RentCard rent={rent} onEdit={onEdit} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyIllustration label={t('No rents found')} />
      )}
    </Page>
  );
});

Rents.getInitialProps = async (context) => {
  console.log('Rents.getInitialProps');
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
      store: toJS(store),
    },
  };
};

export default withAuthentication(Rents);
