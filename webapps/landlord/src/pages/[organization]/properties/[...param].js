import {
  Box,
  Button,
  Grid,
  Hidden,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  makeStyles,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import { CardRow, PageInfoCard } from '../../../components/Cards';
import { getStoreInstance, StoreContext } from '../../../store';
import { TabPanel, useTabChangeHelper } from '../../../components/Tabs';
import { useCallback, useContext, useState } from 'react';

import BreadcrumbBar from '../../../components/BreadcrumbBar';
import ConfirmDialog from '../../../components/ConfirmDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import HistoryIcon from '@material-ui/icons/History';
import { isServer } from '../../../utils';
import Map from '../../../components/Map';
import moment from 'moment';
import { NumberFormat } from '../../../utils/numberformat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyForm from '../../../components/properties/PropertyForm';
import RequestError from '../../../components/RequestError';
import TenantAvatar from '../../../components/tenants/TenantAvatar';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { withAuthentication } from '../../../components/Authentication';

const PropertyOverview = () => {
  const store = useContext(StoreContext);
  return (
    <>
      <CardRow>
        <Typography color="textSecondary" noWrap>
          {store.property.selected.name}
        </Typography>
        <NumberFormat
          color="textSecondary"
          value={store.property.selected.price}
          noWrap
        />
      </CardRow>
      <Map address={store.property.selected.address} />
    </>
  );
};

const useStyles = makeStyles(() => ({
  root: {
    overflow: 'auto',
    maxHeight: 601,
  },
}));

const OccupancyHistory = () => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const classes = useStyles();
  return (
    <List className={classes.root}>
      {store.property.selected?.occupancyHistory?.length ? (
        store.property.selected.occupancyHistory.map((occupant) => {
          const occupationDates = t('{{beginDate}} to {{endDate}}', {
            beginDate: moment(occupant.beginDate, 'DD/MM/YYYY').format('LL'),
            endDate: moment(occupant.endDate, 'DD/MM/YYYY').format('LL'),
          });
          return (
            <ListItem key={occupant.id}>
              <ListItemAvatar>
                <TenantAvatar tenant={occupant} />
              </ListItemAvatar>
              <ListItemText
                primary={occupant.name}
                secondary={occupationDates}
              />
            </ListItem>
          );
        })
      ) : (
        <Typography color="textSecondary">
          {t('Property not rented so far')}
        </Typography>
      )}
    </List>
  );
};

const hashes = ['property'];
const Property = observer(() => {
  console.log('Property functional component');
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const { handleTabChange, tabSelectedIndex, tabsReady } =
    useTabChangeHelper(hashes);
  const [error, setError] = useState('');
  const [openConfirmDeleteProperty, setOpenConfirmDeleteProperty] =
    useState(false);

  const {
    query: {
      param: [, backPage, backPath],
    },
  } = router;
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const onConfirmDeleteProperty = useCallback(() => {
    setOpenConfirmDeleteProperty(true);
  }, []);

  const onDeleteProperty = useCallback(async () => {
    setError('');

    const { status } = await store.property.delete([
      store.property.selected._id,
    ]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return setError(t('Property cannot be deleted'));
        case 404:
          return setError(t('Property does not exist'));
        case 403:
          return setError(t('You are not allowed to delete the Property'));
        default:
          return setError(t('Something went wrong'));
      }
    }

    await router.push(backPath);
  }, [t, router, backPath, store.property]);

  const onSubmit = useCallback(
    async (propertyPart) => {
      let property = {
        ...toJS(store.property.selected),
        ...propertyPart,
        price: propertyPart.rent,
      };

      setError('');

      if (property._id) {
        const { status, data } = await store.property.update(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return setError(t('Property name is missing'));
            case 403:
              return setError(t('You are not allowed to update the property'));
            default:
              return setError(t('Something went wrong'));
          }
        }
        store.property.setSelected(data);
      } else {
        const { status, data } = await store.property.create(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return setError(t('Property name is missing'));
            case 403:
              return setError(t('You are not allowed to add a property'));
            case 409:
              return setError(t('The property already exists'));
            default:
              return setError(t('Something went wrong'));
          }
        }
        store.property.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/properties/${data._id}`
        );
      }
    },
    [t, router, store.organization.selected.name, store.property]
  );

  return (
    <Page
      ActionToolbar={
        <Button
          variant="contained"
          startIcon={<DeleteIcon />}
          size={isMobile ? 'small' : 'medium'}
          onClick={onConfirmDeleteProperty}
        >
          {t('Delete')}
        </Button>
      }
      NavBar={
        <BreadcrumbBar
          backPath={backPath}
          backPage={backPage}
          currentPage={store.property.selected.name}
        />
      }
    >
      <RequestError error={error} />
      <Grid container spacing={5}>
        <Grid item xs={12} md={7} lg={8}>
          {tabsReady && (
            <Paper>
              <Tabs
                variant="scrollable"
                value={tabSelectedIndex}
                onChange={handleTabChange}
                aria-label="Property tabs"
              >
                <Tab label={t('Property')} wrapped />
              </Tabs>
              <TabPanel value={tabSelectedIndex} index={0}>
                <PropertyForm onSubmit={onSubmit} />
              </TabPanel>
            </Paper>
          )}
        </Grid>
        <Hidden smDown>
          <Grid item xs={12} md={5} lg={4}>
            <Box pb={4}>
              <PageInfoCard Icon={VpnKeyIcon} title={t('Property')}>
                <PropertyOverview />
              </PageInfoCard>
            </Box>
            <PageInfoCard Icon={HistoryIcon} title={t('Previous tenants')}>
              <OccupancyHistory />
            </PageInfoCard>
          </Grid>
        </Hidden>
      </Grid>
      <ConfirmDialog
        title={t('Are you sure to definitely remove this property?')}
        subTitle={store.property.selected.name}
        open={openConfirmDeleteProperty}
        setOpen={setOpenConfirmDeleteProperty}
        onConfirm={onDeleteProperty}
      />
    </Page>
  );
});

Property.getInitialProps = async (context) => {
  console.log('Property.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();
  const propertyId = isServer()
    ? context.query.param[0]
    : store.property.selected._id;

  const response = await store.property.fetch();

  if (response.status !== 200) {
    return { error: { statusCode: response.status } };
  }

  store.property.setSelected(
    store.property.items.find(({ _id }) => _id === propertyId)
  );

  const props = {
    initialState: {
      store: toJS(store),
    },
  };
  return props;
};

export default withAuthentication(Property);
