import { Hidden, ListItemIcon, Typography } from '@material-ui/core';
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import DashboardIcon from '@material-ui/icons/Dashboard';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import MobileMenu from './MobileMenu';
import MobileMenuButton from './MobileMenuButton';
import moment from 'moment';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import ReceiptIcon from '@material-ui/icons/Receipt';
import SettingsIcon from '@material-ui/icons/Settings';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import { useStyles } from '../styles/components/Nav.styles';
import { useTimeout } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

const MENU_ITEMS = [
  {
    key: 'dashboard',
    labelId: 'Dashboard',
    pathname: '/dashboard',
    Icon: DashboardIcon,
    dataCy: 'dashboardNav',
  },
  {
    key: 'rents',
    labelId: 'Rents',
    pathname: '/rents/[yearMonth]',
    subPathnames: ['/payment/[tenantId]/[...param]'],
    Icon: ReceiptIcon,
    dataCy: 'rentsNav',
  },
  {
    key: 'tenants',
    labelId: 'Tenants',
    pathname: '/tenants',
    Icon: PeopleAltIcon,
    dataCy: 'tenantsNav',
  },
  {
    key: 'properties',
    labelId: 'Properties',
    pathname: '/properties',
    Icon: VpnKeyIcon,
    dataCy: 'propertiesNav',
  },
  {
    key: 'accounting',
    labelId: 'Accounting',
    pathname: `/accounting/[year]`,
    Icon: AccountBalanceWalletIcon,
    dataCy: 'accountingNav',
  },
  {
    key: 'settings',
    labelId: 'Settings',
    pathname: '/settings',
    Icon: SettingsIcon,
    dataCy: 'settingsNav',
  },
];

const MOBILE_MENU_ITEMS = MENU_ITEMS.filter(
  ({ key }) => !['accounting'].includes(key)
);

function MenuItem({ item, selected, open, onClick }) {
  const classes = useStyles();
  const { t } = useTranslation('common');

  const onMenuClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  const Icon = useMemo(() => item.Icon, [item.Icon]);

  return (
    <ListItem
      className={selected ? classes.itemSelected : ''}
      button
      selected={selected}
      onClick={onMenuClick}
      data-cy={item.dataCy}
    >
      <ListItemIcon classes={{ root: selected ? classes.itemSelected : '' }}>
        <Icon />
      </ListItemIcon>
      <ListItemText
        className={`${classes.itemText} ${
          open ? classes.itemTextOpen : classes.itemTextClose
        }`}
        primary={<Typography noWrap>{t(item.labelId)}</Typography>}
      />
    </ListItem>
  );
}

const Nav = () => {
  const classes = useStyles();
  const [selectedPathname, setSelectedPathname] = useState('');
  const [openDebounced, setOpenDebounced] = useState(false);
  const store = useContext(StoreContext);
  const router = useRouter();

  useEffect(() => {
    setSelectedPathname(router.pathname.replace('/[organization]', ''));
  }, [router.pathname]);

  const triggerOpen = useTimeout(() => {
    !openDebounced && setOpenDebounced(true);
  }, 1000);

  const triggerClose = useTimeout(() => {
    openDebounced && setOpenDebounced(false);
  }, 250);

  const handleMenuClick = useCallback(
    (menuItem) => {
      triggerOpen.clear();
      setSelectedPathname(menuItem.pathname);
      if (store.organization.selected?.name && store.rent?.periodAsString) {
        let pathname = menuItem.pathname.replace(
          '[yearMonth]',
          store.rent.periodAsString
        );
        pathname = pathname.replace('[year]', moment().year());
        router.push(`/${store.organization.selected.name}${pathname}`, null, {
          locale: store.organization.selected.locale,
        });
      }
    },
    [
      triggerOpen,
      store.organization.selected?.name,
      store.organization.selected?.locale,
      store.rent?.periodAsString,
      router,
    ]
  );

  const handleMouseEnter = useCallback(() => {
    triggerClose.clear();
    !openDebounced && triggerOpen.start();
  }, [openDebounced, triggerOpen, triggerClose]);

  const handleMouseLeave = useCallback(() => {
    triggerOpen.clear();
    openDebounced && triggerClose.start();
  }, [openDebounced, triggerOpen, triggerClose]);

  return (
    <>
      <Hidden smDown>
        <Drawer
          className={`${
            openDebounced ? classes.drawerOpen : classes.drawerClose
          }`}
          variant="permanent"
          classes={{
            paper: openDebounced ? classes.drawerOpen : classes.drawerClose,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <List className={classes.list}>
            {MENU_ITEMS.map((item) => {
              return (
                <MenuItem
                  key={item.key}
                  item={item}
                  selected={
                    selectedPathname.indexOf(item.pathname) !== -1 ||
                    item.subPathnames?.some((p) => selectedPathname.includes(p))
                  }
                  open={openDebounced}
                  onClick={handleMenuClick}
                />
              );
            })}
          </List>
        </Drawer>
      </Hidden>
      <Hidden mdUp>
        <MobileMenu
          position="fixed"
          bottom={0}
          width="100%"
          display="flex"
          justifyContent="space-around"
        >
          {MOBILE_MENU_ITEMS.map((item) => {
            return (
              <MobileMenuButton
                key={item.key}
                labelId={item.labelId}
                Icon={item.Icon}
                selected={
                  selectedPathname.indexOf(item.pathname) !== -1 ||
                  item.subPathnames?.some((p) => selectedPathname.includes(p))
                }
                item={item}
                onClick={handleMenuClick}
              />
            );
          })}
        </MobileMenu>
      </Hidden>
    </>
  );
};

export default memo(Nav);
