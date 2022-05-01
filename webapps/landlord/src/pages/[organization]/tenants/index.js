import {
  Box,
  Button,
  Chip,
  Grid,
  Hidden,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  makeStyles,
  Paper,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../store';
import { memo, useCallback, useContext, useState } from 'react';

import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import { EmptyIllustration } from '../../../components/Illustrations';
import { isServer } from '../../../utils';
import moment from 'moment';
import NewTenantDialog from '../../../components/tenants/NewTenantDialog';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyIcon from '../../../components/properties/PropertyIcon';
import SearchFilterBar from '../../../components/SearchFilterBar';
import TenantAvatar from '../../../components/tenants/TenantAvatar';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const useStyles = makeStyles((theme) => ({
  avatarInProgress: {
    backgroundColor: theme.palette.success.main,
  },
  inProgress: {
    color: theme.palette.success.dark,
  },
}));

const Properties = memo(function Properties({ tenant }) {
  return (
    <Box display="flex" height="100%" alignItems="center" flexWrap="wrap">
      {tenant.properties?.map(({ property }) => {
        return (
          <Box key={property._id} m={0.5}>
            <Chip
              icon={<PropertyIcon type={property.type} color="action" />}
              label={property.name}
            />
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
      <Hidden smDown>
        <ListItemAvatar>
          <TenantAvatar
            tenant={tenant}
            className={
              !!tenant.beginDate && !tenant.terminated
                ? classes.avatarInProgress
                : null
            }
          />
        </ListItemAvatar>
      </Hidden>
      <ListItemText
        primary={
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5">{tenant.name}</Typography>
              {tenant.isCompany && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  component="div"
                >
                  {_.startCase(_.capitalize(tenant.manager))}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="textSecondary"
                component="div"
              >
                {tenant.beginDate
                  ? t(
                      'Contract {{contract}} - from {{startDate}} to {{endDate}}',
                      {
                        contract: tenant.contract,
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

              {!!tenant.beginDate && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  component="div"
                  className={!tenant.terminated ? classes.inProgress : null}
                >
                  {tenant.terminated ? t('Terminated') : t('In progress')}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              <Properties tenant={tenant} />
            </Grid>
          </Grid>
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
      <List component="nav" aria-labelledby="tenant-list">
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
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const onSearch = useCallback(
    (status, searchText) => {
      store.tenant.setFilters({ status, searchText });
    },
    [store.tenant]
  );

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, []);

  return (
    <Page
      ActionToolbar={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size={isMobile ? 'small' : 'medium'}
          onClick={onNewTenant}
        >
          {t('New tenant')}
        </Button>
      }
      NavBar={
        !isMobile ? (
          <Typography color="textSecondary" variant="h5" noWrap>
            {t('Tenants')}
          </Typography>
        ) : null
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
      <NewTenantDialog
        open={openNewTenantDialog}
        setOpen={setOpenNewTenantDialog}
        backPage={t('Tenants')}
        backPath={router.asPath}
      />
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
