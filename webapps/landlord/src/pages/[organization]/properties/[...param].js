import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core';
import { CardRow, PageInfoCard } from '../../../components/Cards';
import { TabPanel, useTabChangeHelper } from '../../../components/Tabs';
import { useCallback, useContext } from 'react';

import BreadcrumbBar from '../../../components/BreadcrumbBar';
import DeleteIcon from '@material-ui/icons/Delete';
import Hidden from '../../../components/HiddenSSRCompatible';
import HistoryIcon from '@material-ui/icons/History';
import Map from '../../../components/Map';
import { MobileButton } from '../../../components/MobileMenuButton';
import moment from 'moment';
import NumberFormat from '../../../components/NumberFormat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyForm from '../../../components/properties/PropertyForm';
import { StoreContext } from '../../../store';
import { toJS } from 'mobx';
import useConfirmDialog from '../../../components/ConfirmDialog';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { withAuthentication } from '../../../components/Authentication';

const PropertyOverview = () => {
  const store = useContext(StoreContext);
  return (
    <Box py={2}>
      <CardRow>
        {store.property.selected.name}
        <NumberFormat value={store.property.selected.price} />
      </CardRow>
      <Map address={store.property.selected.address} />
    </Box>
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

async function fetchData(store, router) {
  const propertyId = store.property.selected?._id || router.query.param[0];
  const results = await store.property.fetchOne(propertyId);
  store.property.setSelected(
    store.property.items.find(({ _id }) => _id === propertyId)
  );
  return results;
}

const Property = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const { handleTabChange, tabSelectedIndex } = useTabChangeHelper();
  const [ConfirmDialog, setOpenConfirmDeleteProperty] = useConfirmDialog();
  const [fetching] = useFillStore(fetchData, [router]);

  const {
    query: {
      param: [, backPage, backPath],
    },
  } = router;

  const onConfirmDeleteProperty = useCallback(() => {
    setOpenConfirmDeleteProperty(true);
  }, [setOpenConfirmDeleteProperty]);

  const onDeleteProperty = useCallback(async () => {
    const { status } = await store.property.delete([
      store.property.selected._id,
    ]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return store.pushToastMessage({
            message: t('Property cannot be deleted'),
            severity: 'error',
          });
        case 404:
          return store.pushToastMessage({
            message: t('Property does not exist'),
            severity: 'error',
          });
        case 403:
          return store.pushToastMessage({
            message: t('You are not allowed to delete the Property'),
            severity: 'error',
          });
        default:
          return store.pushToastMessage({
            message: t('Something went wrong'),
            severity: 'error',
          });
      }
    }

    await router.push(backPath);
  }, [store, router, backPath, t]);

  const onSubmit = useCallback(
    async (propertyPart) => {
      let property = {
        ...toJS(store.property.selected),
        ...propertyPart,
        price: propertyPart.rent,
      };

      if (property._id) {
        const { status, data } = await store.property.update(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return store.pushToastMessage({
                message: t('Property name is missing'),
                severity: 'error',
              });
            case 403:
              return store.pushToastMessage({
                message: t('You are not allowed to update the property'),
                severity: 'error',
              });
            default:
              return store.pushToastMessage({
                message: t('Something went wrong'),
                severity: 'error',
              });
          }
        }
        store.property.setSelected(data);
      } else {
        const { status, data } = await store.property.create(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return store.pushToastMessage({
                message: t('Property name is missing'),
                severity: 'error',
              });
            case 403:
              return store.pushToastMessage({
                message: t('You are not allowed to add a property'),
                severity: 'error',
              });
            case 409:
              return store.pushToastMessage({
                message: t('The property already exists'),
                severity: 'error',
              });
            default:
              return store.pushToastMessage({
                message: t('Something went wrong'),
                severity: 'error',
              });
          }
        }
        store.property.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/properties/${data._id}`
        );
      }
    },
    [store, t, router]
  );

  return (
    <Page
      loading={fetching}
      ActionBar={
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <BreadcrumbBar
            backPath={backPath}
            backPage={backPage}
            currentPage={store.property.selected.name}
          />
          <Hidden smDown>
            <ButtonGroup variant="contained">
              <Button
                startIcon={<DeleteIcon />}
                onClick={onConfirmDeleteProperty}
              >
                {t('Delete')}
              </Button>
            </ButtonGroup>
          </Hidden>
          <Hidden mdUp>
            <ButtonGroup variant="text">
              <MobileButton
                label={t('Delete')}
                Icon={DeleteIcon}
                onClick={onConfirmDeleteProperty}
              />
            </ButtonGroup>
          </Hidden>
        </Box>
      }
    >
      <Hidden smDown>
        <Grid container spacing={5}>
          <Grid item md={7} lg={8}>
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
          </Grid>
          <Grid item md={5} lg={4}>
            <Box pb={4}>
              <PageInfoCard Icon={VpnKeyIcon} title={t('Property')}>
                <PropertyOverview />
              </PageInfoCard>
            </Box>
            <PageInfoCard Icon={HistoryIcon} title={t('Previous tenants')}>
              <OccupancyHistory />
            </PageInfoCard>
          </Grid>
        </Grid>
      </Hidden>
      <Hidden mdUp>
        <Grid container spacing={5}>
          <Grid item xs={12}>
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
          </Grid>
        </Grid>
      </Hidden>
      <ConfirmDialog
        title={t('Are you sure to definitely remove this property?')}
        subTitle={store.property.selected.name}
        onConfirm={onDeleteProperty}
      />
    </Page>
  );
});

export default withAuthentication(Property);
