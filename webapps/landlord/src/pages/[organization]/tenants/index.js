import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  Grid,
  makeStyles,
  Paper,
  Typography,
} from '@material-ui/core';
import React, { useCallback, useContext, useState } from 'react';

import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import BoxWithHover from '../../../components/BoxWithHover';
import CompulsoryDocumentStatus from '../../../components/tenants/CompulsaryDocumentStatus';
import { EmptyIllustration } from '../../../components/Illustrations';
import Hidden from '../../../components/HiddenSSRCompatible';
import { MobileButton } from '../../../components/MobileMenuButton';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyIcon from '../../../components/properties/PropertyIcon';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { StoreContext } from '../../../store';
import useFillStore from '../../../hooks/useFillStore';
import useNewTenantDialog from '../../../components/tenants/NewTenantDialog';
import usePagination from '../../../hooks/usePagination';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const useStyles = makeStyles((theme) => ({
  chipInProgress: {
    color: theme.palette.info.contrastText,
    backgroundColor: theme.palette.success.dark,
    borderRadius: 4,
  },
  chipTerminated: {
    color: theme.palette.info.contrastText,
    backgroundColor: theme.palette.text.disabled,
    borderRadius: 4,
  },
}));

function Properties({ tenant }) {
  const { t } = useTranslation('common');

  return (
    <>
      <Box fontSize="caption.fontSize" color="text.secondary">
        {t('Rented premises')}
      </Box>
      <Box display="flex" flexWrap="wrap" alignContent="start" height={78}>
        {tenant.properties?.map(({ property }) => {
          return (
            <Box
              key={property._id}
              display="flex"
              alignItems="center"
              mr={1.2}
              height={26}
            >
              <Box
                display="flex"
                fontSize="body1.fontSize"
                color="text.secondary"
              >
                <PropertyIcon
                  type={property.type}
                  color="inherit"
                  fontSize="inherit"
                />
              </Box>
              <Box color="inherit">{property.name}</Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

function TenantItem({ tenant }) {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const classes = useStyles();

  const handleClick = useCallback(async () => {
    store.tenant.setSelected(tenant);
    await router.push(
      `/${store.organization.selected.name}/tenants/${tenant._id}/${encodeURI(
        t('Tenants')
      )}/${encodeURIComponent(router.asPath)}`
    );
  }, [t, router, tenant, store.organization.selected.name, store.tenant]);

  return (
    <Paper>
      <BoxWithHover
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        withCursor
        height={370}
        onClick={handleClick}
      >
        <Box display="flex" justifyContent="space-between" m={2}>
          <Box fontSize="h6.fontSize">{tenant.name}</Box>
          {!!tenant.beginDate && (
            <Chip
              size="small"
              label={
                <Typography variant="caption">
                  {tenant.terminated ? t('Lease ended') : t('Lease running')}
                </Typography>
              }
              className={
                !tenant.terminated
                  ? classes.chipInProgress
                  : classes.chipTerminated
              }
            />
          )}
        </Box>
        <Divider />
        <Box mt={1.5} mx={2}>
          {tenant.isCompany ? (
            <>
              <Box fontSize="caption.fontSize" color="text.secondary">
                {t('Legal representative')}
              </Box>
              <Box>{_.startCase(_.capitalize(tenant.manager))}</Box>
            </>
          ) : null}
        </Box>

        <Box mt={2.5} mx={2}>
          <Box fontSize="caption.fontSize" color="text.secondary">
            {t('Contract')}
          </Box>
          <Box>
            {tenant.beginDate
              ? tenant.lease?.name || t('custom')
              : t('No associated contract')}
          </Box>
          <Box>
            {tenant.beginDate
              ? t('From {{startDate}} to {{endDate}}', {
                startDate: moment(tenant.beginDate, 'DD/MM/YYYY').format('L'),
                endDate: moment(
                  tenant.terminationDate || tenant.endDate,
                  'DD/MM/YYYY'
                ).format('L'),
              })
              : t('No associated contract')}
          </Box>
        </Box>
        <Box mt={2.5} mx={2}>
          <Properties tenant={tenant} />
        </Box>

        <CompulsoryDocumentStatus
          tenant={tenant}
          variant="compact"
          mt={1}
          mb={2}
          mx={2}
        />
      </BoxWithHover>
    </Paper>
  );
}

const SearchBar = observer(function SearchBar() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const handleSearch = useCallback(
    (status, searchText) => {
      store.tenant.setFilters({
        status: status.filter(({ id }) => id).map(({ id }) => id),
        searchText,
      });
    },
    [store.tenant]
  );

  return (
    <SearchFilterBar
      searchText={store.tenant.filters.searchText}
      selectedIds={store.tenant.filters.status}
      statusList={[
        { id: 'inprogress', label: t('Lease running') },
        { id: 'stopped', label: t('Lease ended') },
      ]}
      onSearch={handleSearch}
    />
  );
});

function TenantGrid({ tenants }) {
  const { t } = useTranslation('common');

  return tenants?.length ? (
    <Grid container spacing={3}>
      {tenants.map((tenant) => {
        return (
          <Grid key={tenant._id} item xs={12} md={6} lg={4}>
            <TenantItem tenant={tenant} />
          </Grid>
        );
      })}
    </Grid>
  ) : (
    <EmptyIllustration label={t('No tenants found')} />
  );
}

async function fetchData(store) {
  await store.tenant.fetch();
}

const Tenants = observer(function Tenants() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [pageData, setPageData] = useState([]);
  const [Pagination] = usePagination(
    20,
    store.tenant.filteredItems,
    setPageData
  );

  const [NewTenantDialog, setOpenNewTenantDialog] = useNewTenantDialog();
  const [fetching] = useFillStore(fetchData);

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, [setOpenNewTenantDialog]);

  return (
    <Page
      loading={fetching}
      title={t('Tenants')}
      ActionBar={
        <Box display="flex" justifyContent="end">
          <Hidden smDown>
            <ButtonGroup variant="contained">
              <Button startIcon={<AddIcon />} onClick={onNewTenant}>
                {t('Add a tenant')}
              </Button>
            </ButtonGroup>
          </Hidden>
          <Hidden mdUp>
            <ButtonGroup variant="text">
              <MobileButton
                label={t('Add a tenant')}
                Icon={AddIcon}
                onClick={onNewTenant}
              />
            </ButtonGroup>
          </Hidden>
        </Box>
      }
    >
      <Hidden smDown>
        <Box display="flex" alignItems="end" justifyContent="space-between">
          <SearchBar />
          <Pagination />
        </Box>
      </Hidden>
      <Hidden mdUp>
        <SearchBar />
        <Box display="flex" justifyContent="center">
          <Pagination />
        </Box>
      </Hidden>
      <TenantGrid tenants={pageData} />
      <Box display="flex" justifyContent="center">
        <Pagination />
      </Box>
      <NewTenantDialog backPage={t('Tenants')} backPath={router.asPath} />
    </Page>
  );
});

export default withAuthentication(Tenants);
