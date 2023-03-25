import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Typography,
} from '@material-ui/core';
import { useCallback, useContext, useState } from 'react';

import AddIcon from '@material-ui/icons/Add';
import { EmptyIllustration } from '../../../components/Illustrations';
import Hidden from '../../../components/HiddenSSRCompatible';
import { MobileButton } from '../../../components/MobileMenuButton';
import NumberFormat from '../../../components/NumberFormat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyAvatar from '../../../components/properties/PropertyAvatar';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { StoreContext } from '../../../store';
import types from '../../../components/properties/types';
import useFillStore from '../../../hooks/useFillStore';
import useNewPropertyDialog from '../../../components/properties/NewPropertyDialog';
import usePagination from '../../../hooks/usePagination';
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

function PropertyListItem({ property }) {
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
                    {property.status === 'vacant' ? t('Vacant') : t('Rented')}
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
                {t('Rent excluding tax and expenses')}
              </Typography>
              <NumberFormat fontSize="h5.fontSize" value={property.price} />
            </Box>
          </>
        }
      />
    </ListItem>
  );
}

const SearchBar = observer(function SearchBar() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const handleSearch = useCallback(
    (status, searchText) => {
      store.property.setFilters({
        status: status.filter(({ id }) => id).map(({ id }) => id),
        searchText,
      });
    },
    [store.property]
  );

  return (
    <SearchFilterBar
      searchText={store.property.filters.searchText}
      selectedIds={store.property.filters.status}
      statusList={[
        { id: 'vacant', label: t('Vacant') },
        { id: 'occupied', label: t('Rented') },
        ...types.map(({ id, labelId }) => ({
          id,
          label: t(labelId),
        })),
      ]}
      onSearch={handleSearch}
    />
  );
});

function PropertyList({ properties }) {
  const { t } = useTranslation('common');

  return properties.length ? (
    <List component="nav" disablePadding aria-labelledby="property-list">
      {properties.map((property) => {
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
}

async function fetchData(store) {
  return await store.property.fetch();
}

const Properties = observer(function Properties() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [pageData, setPageData] = useState([]);
  const [Pagination] = usePagination(
    20,
    store.property.filteredItems,
    setPageData
  );

  const [NewPropertyDialog, setOpenNewPropertyDialog] = useNewPropertyDialog();

  const [fetching] = useFillStore(fetchData);

  const onNewProperty = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, [setOpenNewPropertyDialog]);

  return (
    <Page
      loading={fetching}
      ActionBar={
        <Box display="flex" justifyContent="end">
          <Hidden smDown>
            <ButtonGroup variant="contained">
              <Button startIcon={<AddIcon />} onClick={onNewProperty}>
                {t('Add a property')}
              </Button>
            </ButtonGroup>
          </Hidden>
          <Hidden mdUp>
            <ButtonGroup variant="text">
              <MobileButton
                label={t('Add a property')}
                Icon={AddIcon}
                onClick={onNewProperty}
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
      <PropertyList properties={pageData} />
      <Box display="flex" justifyContent="center">
        <Pagination />
      </Box>
      <NewPropertyDialog backPage={t('Properties')} backPath={router.asPath} />
    </Page>
  );
});

export default withAuthentication(Properties);
