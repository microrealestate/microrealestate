import {
  Button,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import { getStoreInstance, StoreContext } from '../../../store';
import { useCallback, useContext, useMemo, useState } from 'react';

import AddIcon from '@material-ui/icons/Add';
import { EmptyIllustration } from '../../../components/Illustrations';
import { isServer } from '../../../utils';
import NewPropertyDialog from '../../../components/properties/NewPropertyDialog';
import { NumberFormat } from '../../../utils/numberformat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyAvatar from '../../../components/properties/PropertyAvatar';
import RequestError from '../../../components/RequestError';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import { withStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  vacant: {
    color: theme.palette.success.dark,
  },
}));

const StyledTableRow = withStyles(() => ({
  root: {
    cursor: 'pointer',
  },
}))(TableRow);

const PropertyTableRow = ({ property }) => {
  const store = useContext(StoreContext);
  const router = useRouter();
  const classes = useStyles();
  const { t } = useTranslation('common');

  const onClick = useCallback(async () => {
    store.property.setSelected(property);
    await router.push(
      `/${store.organization.selected.name}/properties/${
        property._id
      }/${encodeURI(t('Properties'))}/${encodeURIComponent(router.asPath)}`
    );
  }, [
    //t,
    property,
    router,
    store.organization.selected.name,
    store.property,
  ]);

  return (
    <StyledTableRow hover onClick={onClick}>
      <TableCell align="center">
        <PropertyAvatar type={property.type} status={property.status} />
      </TableCell>
      <TableCell>
        <Typography noWrap>{property.name}</Typography>
        <Typography noWrap>{property.description}</Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          component="div"
          className={property.status === 'vacant' ? classes.vacant : null}
        >
          {property.status === 'vacant'
            ? t('Vacant')
            : t('Occupied by {{tenant}}', {
                tenant: property.occupantLabel,
              })}
        </Typography>
      </TableCell>
      <TableCell>
        {property.address && (
          <>
            <Typography>{property.address.street1}</Typography>
            {property.address.street2 && (
              <Typography>{property.address.street2}</Typography>
            )}
            <Typography>
              {property.address.zipCode} {property.address.city}
            </Typography>
            <Typography>
              {property.address.state ? `${property.address.state} ` : ''}
              {property.address.country}
            </Typography>
          </>
        )}
      </TableCell>
      <TableCell align="right">
        <NumberFormat value={property.price} />
      </TableCell>
    </StyledTableRow>
  );
};

const Properties = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const [error /* setError*/] = useState('');
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const filters = useMemo(
    () => [
      { id: '', label: t('All') },
      { id: 'vacant', label: t('Vacant') },
      { id: 'occupied', label: t('Occupied') },
    ],
    [
      // t
    ]
  );

  const onSearch = useCallback(
    (status, searchText) => {
      store.property.setFilters({ status, searchText });
    },
    [store.property]
  );

  const onNewProperty = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, []);

  return (
    <Page
      ActionToolbar={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size={isMobile ? 'small' : 'medium'}
          onClick={onNewProperty}
        >
          {t('New property')}
        </Button>
      }
      PrimaryToolbar={
        <Typography color="textSecondary" variant="h5" noWrap>
          {t('Properties')}
        </Typography>
      }
      SearchBar={
        <SearchFilterBar
          filters={filters}
          defaultValue={store.property.filters}
          onSearch={onSearch}
        />
      }
    >
      <RequestError error={error} />
      {store.property.filteredItems?.length ? (
        <Paper variant="outlined" square>
          <Table aria-label="property table">
            <TableHead>
              <TableRow>
                <TableCell align="center" padding="checkbox"></TableCell>
                <TableCell>
                  <Typography>{t('Property')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{t('Location')}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography>{t('Rent')}</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {store.property.filteredItems.map((property) => {
                return (
                  <PropertyTableRow key={property._id} property={property} />
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <EmptyIllustration label={t('No properties found')} />
      )}
      <NewPropertyDialog
        open={openNewPropertyDialog}
        setOpen={setOpenNewPropertyDialog}
      />
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
