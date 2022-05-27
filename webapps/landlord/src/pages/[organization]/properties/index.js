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
import { useCallback, useContext, useMemo } from 'react';

import AddIcon from '@material-ui/icons/Add';
import { EmptyIllustration } from '../../../components/Illustrations';
import { isServer } from '../../../utils';
import { MobileButton } from '../../../components/MobileMenuButton';
import { NumberFormat } from '../../../utils/numberformat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyAvatar from '../../../components/properties/PropertyAvatar';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { toJS } from 'mobx';
import useNewPropertyDialog from '../../../components/properties/NewPropertyDialog';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const useStyles = makeStyles((theme) => ({
  avatarVacant: {
    backgroundColor: theme.palette.success.dark,
  },
  avatarOccupied: {
    backgroundColor: theme.palette.text.disabled,
  },
  chipOccupied: {
    color: theme.palette.info.contrastText,
    backgroundColor: theme.palette.text.disabled,
    borderRadius: 4,
  },
  chipVacant: {
    color: theme.palette.info.contrastText,
    backgroundColor: theme.palette.success.dark,
    borderRadius: 4,
  },
}));

const PropertyListItem = ({ property }) => {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const classes = useStyles();

  const onClick = useCallback(async () => {
    store.property.setSelected(property);
    await router.push(
      `/${store.organization.selected.name}/properties/${
        property._id
      }/${encodeURI(t('Properties'))}/${encodeURIComponent(router.asPath)}`
    );
  }, [t, property, router, store.organization.selected.name, store.property]);

  return (
    <ListItem
      button
      style={{
        marginBottom: 20,
      }}
      onClick={onClick}
    >
      <ListItemText
        primary={
          <>
            <Box display="flex" justifyContent="space-between">
              <Box display="flex" alignItems="center" mr={1}>
                <PropertyAvatar
                  type={property.type}
                  className={
                    property.status === 'vacant'
                      ? classes.avatarVacant
                      : classes.avatarOccupied
                  }
                />
                <Typography variant="h5">{property.name}</Typography>
              </Box>
              <Chip
                size="small"
                label={
                  <Typography variant="caption">
                    {property.status === 'vacant' ? t('Vacant') : t('Occupied')}
                  </Typography>
                }
                className={
                  property.status === 'vacant'
                    ? classes.chipVacant
                    : classes.chipOccupied
                }
              />
            </Box>
            <Box mt={1}>
              <Typography variant="caption" color="textSecondary">
                {property.description}
              </Typography>
            </Box>
            {/* <Box mt={1}>
              {property.address && (
                <>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    component="div"
                  >
                    {property.address.street1}
                  </Typography>
                  {property.address.street2 && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      component="div"
                    >
                      {property.address.street2}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    component="div"
                  >
                    {property.address.zipCode} {property.address.city}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    component="div"
                  >
                    {property.address.state ? `${property.address.state} ` : ''}
                    {property.address.country}
                  </Typography>
                </>
              )}
            </Box> */}
            {property.status !== 'vacant' && (
              <Box mt={1}>
                <Typography variant="caption" color="textSecondary">
                  {t('Occupied by {{tenant}}', {
                    tenant: property.occupantLabel,
                  })}
                </Typography>
              </Box>
            )}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" color="textSecondary">
                {t('Rent without expenses')}
              </Typography>
              <NumberFormat variant="h5" value={property.price} />
            </Box>
          </>
        }
      />
    </ListItem>
  );
};

const PropertyList = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return store.property.filteredItems?.length ? (
    <List component="nav" disablePadding aria-labelledby="property-list">
      {store.property.filteredItems.map((property) => {
        return (
          <Paper key={property._id}>
            <PropertyListItem property={property} />
          </Paper>
        );
      })}
    </List>
  ) : (
    <EmptyIllustration label={t('No properties found')} />
  );
});

const Properties = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [NewPropertyDialog, setOpenNewPropertyDialog] = useNewPropertyDialog();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const filters = useMemo(
    () => [
      { id: '', label: t('All') },
      { id: 'vacant', label: t('Vacant') },
      { id: 'occupied', label: t('Occupied') },
    ],
    [t]
  );

  const onSearch = useCallback(
    (status, searchText) => {
      store.property.setFilters({ status, searchText });
    },
    [store.property]
  );

  const onNewProperty = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, [setOpenNewPropertyDialog]);

  return (
    <Page
      title={t('Properties')}
      ActionToolbar={
        !isMobile ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewProperty}
          >
            {t('New property')}
          </Button>
        ) : (
          <MobileButton
            label={t('New property')}
            Icon={AddIcon}
            onClick={onNewProperty}
          />
        )
      }
      SearchBar={
        <SearchFilterBar
          filters={filters}
          defaultValue={store.property.filters}
          onSearch={onSearch}
        />
      }
    >
      <PropertyList />
      <NewPropertyDialog backPage={t('Properties')} backPath={router.asPath} />
    </Page>
  );
});

Properties.getInitialProps = async (context) => {
  console.log('Properties.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();

  const { status } = await store.property.fetch();
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  return {
    initialState: {
      store: toJS(store),
    },
  };
};

export default withAuthentication(Properties);
