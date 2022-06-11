import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../store';
import React, { Fragment, memo, useCallback, useContext } from 'react';

import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import CompulsoryDocumentStatus from '../../../components/tenants/CompulsaryDocumentStatus';
import { EmptyIllustration } from '../../../components/Illustrations';
import { isServer } from '../../../utils';
import { MobileButton } from '../../../components/MobileMenuButton';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyIcon from '../../../components/properties/PropertyIcon';
import SearchFilterBar from '../../../components/SearchFilterBar';
import TenantAvatar from '../../../components/tenants/TenantAvatar';
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

const Properties = memo(function Properties({ tenant }) {
  return (
    <Box display="flex" height="100%" alignItems="center" flexWrap="wrap">
      {tenant.properties?.map(({ property }) => {
        return (
          <Box
            key={property._id}
            display="flex"
            alignItems="center"
            color="text.secondary"
            mr={1}
          >
            <PropertyIcon type={property.type} color="inherit" />
            <Typography variant="caption" color="inherit">
              {property.name}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
});

const TenantListItem = memo(function TenantListItem({ tenant }) {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const classes = useStyles();

  const onEdit = useCallback(async () => {
    store.tenant.setSelected(tenant);
    await router.push(
      `/${store.organization.selected.name}/tenants/${tenant._id}/${encodeURI(
        t('Tenants')
      )}/${encodeURIComponent(router.asPath)}`
    );
  }, [t, router, tenant, store.organization.selected.name, store.tenant]);

  return (
    <ListItem
      button
      style={{
        marginBottom: 20,
      }}
      onClick={onEdit}
    >
      <ListItemText
        primary={
          <>
            <Box display="flex" justifyContent="space-between">
              <Box display="flex" alignItems="center" mr={1}>
                <TenantAvatar
                  tenant={tenant}
                  className={
                    !!tenant.beginDate && !tenant.terminated
                      ? classes.avatarInProgress
                      : classes.avatarTerminated
                  }
                />
                <Typography variant="h5">{tenant.name}</Typography>
              </Box>
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

            <Box mt={1}>
              {tenant.isCompany && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  component="div"
                >
                  {_.startCase(_.capitalize(tenant.manager))}
                </Typography>
              )}
            </Box>
            <Box mt={1}>
              <Typography
                variant="caption"
                color="textSecondary"
                component="div"
              >
                {tenant.beginDate
                  ? t(
                      'Contract {{contract}} - from {{startDate}} to {{endDate}}',
                      {
                        contract: tenant.lease?.name || t('custom'),
                        startDate: moment(
                          tenant.beginDate,
                          'DD/MM/YYYY'
                        ).format('L'),
                        endDate: moment(
                          tenant.terminationDate || tenant.endDate,
                          'DD/MM/YYYY'
                        ).format('L'),
                      }
                    )
                  : t('No associated contract')}
              </Typography>
            </Box>
            <Box mt={1}>
              <Properties tenant={tenant} />
            </Box>

            <CompulsoryDocumentStatus tenant={tenant} mt={2} />
          </>
        }
      />
    </ListItem>
  );
});

const TenantList = memo(
  observer(function TenantList() {
    const { t } = useTranslation('common');
    const store = useContext(StoreContext);

    return store.tenant.filteredItems?.length ? (
      <List component="nav" disablePadding aria-labelledby="tenant-list">
        {store.tenant.filteredItems.map((tenant) => {
          return (
            <Paper key={tenant._id}>
              <TenantListItem tenant={tenant} />
            </Paper>
          );
        })}
      </List>
    ) : (
      <EmptyIllustration label={t('No tenants found')} />
    );
  })
);

const Tenants = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [NewTenantDialog, setOpenNewTenantDialog] = useNewTenantDialog();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

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
        !isMobile ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTenant}
          >
            {t('New tenant')}
          </Button>
        ) : (
          <MobileButton
            label={t('New tenant')}
            Icon={AddIcon}
            onClick={onNewTenant}
          />
        )
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
      <TenantList />
      <NewTenantDialog backPage={t('Tenants')} backPath={router.asPath} />
    </Page>
  );
});

Tenants.getInitialProps = async (context) => {
  console.log('Tenants.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();

  const { status } = await store.tenant.fetch();
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  return {
    initialState: {
      store: toJS(store),
    },
  };
};

export default withAuthentication(Tenants);
