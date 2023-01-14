import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  Grid,
  Link,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../store';
import React, { useCallback, useContext } from 'react';

import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import CompulsoryDocumentStatus from '../../../components/tenants/CompulsaryDocumentStatus';
import { EmptyIllustration } from '../../../components/Illustrations';
import Hidden from '../../../components/HiddenSSRCompatible';
import { isServer } from '../../../utils';
import { MobileButton } from '../../../components/MobileMenuButton';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyIcon from '../../../components/properties/PropertyIcon';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { toJS } from 'mobx';
import useNewTenantDialog from '../../../components/tenants/NewTenantDialog';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const useStyles = makeStyles((theme) => ({
  avatarInProgress: {
    backgroundColor: theme.palette.success.dark,
  },
  avatarTerminated: {
    backgroundColor: theme.palette.text.disabled,
  },
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
    <Link color="inherit" underline="none" href="#" onClick={handleClick}>
      <Box
        display="flex"
        flexDirection="column"
        bgcolor="background.paper"
        border={1}
        borderColor="grey.300"
        borderRadius="borderRadius"
        alignItems="stretch"
        height="100%"
      >
        <Box display="flex" justifyContent="space-between" m={2}>
          <Box fontSize="h6.fontSize">{tenant.name}</Box>
          {!!tenant.beginDate && (
            <Chip
              size="small"
              label={
                <Typography variant="caption">
                  {tenant.terminated ? t('Terminated') : t('In progress')}
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
      </Box>
    </Link>
  );
}

const TenantGrid = observer(function TenantGrid() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return store.tenant.filteredItems?.length ? (
    <Grid container spacing={3}>
      {store.tenant.filteredItems.map((tenant) => {
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
});

function Tenants() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [NewTenantDialog, setOpenNewTenantDialog] = useNewTenantDialog();

  const onSearch = useCallback(
    (status, searchText) => {
      store.tenant.setFilters({ status, searchText });
    },
    [store.tenant]
  );

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, [setOpenNewTenantDialog]);

  return (
    <Page
      title={t('Tenants')}
      ActionToolbar={
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
      SearchBar={
        <SearchFilterBar
          filters={[
            { id: '', label: t('All') },
            { id: 'inprogress', label: t('In progress') },
            { id: 'stopped', label: t('Terminated') },
          ]}
          defaultValue={store.tenant.filters}
          onSearch={onSearch}
        />
      }
    >
      <TenantGrid />
      <NewTenantDialog backPage={t('Tenants')} backPath={router.asPath} />
    </Page>
  );
}

Tenants.getInitialProps = async (context) => {
  const store = isServer() ? context.store : getStoreInstance();

  const { status } = await store.tenant.fetch();
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  return {
    initialState: {
      store: isServer() ? toJS(store) : store,
    },
  };
};

export default withAuthentication(observer(Tenants));
