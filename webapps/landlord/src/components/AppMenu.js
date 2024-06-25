import {
  KeyRoundIcon,
  LayoutDashboardIcon,
  MenuIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UserCircleIcon,
  WalletIcon
} from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from './ui/sheet';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '../utils';
import config from '../config';
import moment from 'moment';
import { Separator } from './ui/separator';
import SideMenuButton from './SideMenuButton';
import SponsorMenu from './SponsorMenu';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const menuItems = [
  {
    key: 'dashboard',
    labelId: 'Dashboard',
    pathname: '/dashboard',
    Icon: LayoutDashboardIcon,
    dataCy: 'dashboardNav'
  },
  {
    key: 'rents',
    labelId: 'Rents',
    pathname: '/rents/[yearMonth]',
    subPathnames: ['/payment/[tenantId]/[...param]'],
    Icon: ReceiptTextIcon,
    dataCy: 'rentsNav'
  },
  {
    key: 'tenants',
    labelId: 'Tenants',
    pathname: '/tenants',
    Icon: UserCircleIcon,
    dataCy: 'tenantsNav'
  },
  {
    key: 'properties',
    labelId: 'Properties',
    pathname: '/properties',
    Icon: KeyRoundIcon,
    dataCy: 'propertiesNav'
  },
  {
    key: 'accounting',
    labelId: 'Accounting',
    pathname: '/accounting/[year]',
    Icon: WalletIcon,
    dataCy: 'accountingNav'
  },
  {
    key: 'settings',
    labelId: 'Settings',
    pathname: '/settings',
    Icon: SettingsIcon,
    dataCy: 'settingsNav'
  },
  {
    hidden: true,
    key: 'account',
    labelId: 'Settings',
    pathname: '/settings/account'
  },
  {
    hidden: true,
    key: 'organizations',
    labelId: 'Settings',
    pathname: '/settings/organizations'
  },
  {
    hidden: true,
    key: 'landlord',
    labelId: 'Settings',
    pathname: '/settings/landlord'
  },
  {
    hidden: true,
    key: 'billing',
    labelId: 'Settings',
    pathname: '/settings/billing'
  },
  {
    hidden: true,
    key: 'contracts',
    labelId: 'Settings',
    pathname: '/settings/contracts'
  },
  {
    hidden: true,
    key: 'members',
    labelId: 'Settings',
    pathname: '/settings/members'
  },
  {
    hidden: true,
    key: 'thirdparties',
    labelId: 'Settings',
    pathname: '/settings/thirdparties'
  }
];

export function HamburgerMenu({ className, onChange }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState();

  useEffect(() => {
    const selectedMenuItems = menuItems.filter(
      (menuItem) => router.pathname.indexOf(menuItem.pathname) !== -1
    );
    let selectedMenuItem;
    if (selectedMenuItems.length > 0) {
      selectedMenuItem = selectedMenuItems[0];
    }
    setSelectedMenu(selectedMenuItem);
  }, [router.pathname]);

  const handleMenuClick = useCallback(
    (menuItem) => {
      setSelectedMenu(menuItem);
      onChange?.(menuItem);
      let pathname = menuItem.pathname.replace(
        '[yearMonth]',
        moment().format('YYYY.MM')
      );
      pathname = pathname.replace('[year]', moment().year());
      router.push(
        `/${store.organization.selected.name}${pathname}`,
        undefined,
        {
          locale: store.organization.selected.locale
        }
      );
    },
    [
      onChange,
      router,
      store.organization.selected?.locale,
      store.organization.selected?.name
    ]
  );

  return (
    <div className={className}>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            data-cy="appMenu"
            className="text-muted-foreground bg-card hover:bg-card"
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col px-0">
          <SheetHeader className="px-4">
            <SheetTitle> {store.organization.selected?.name}</SheetTitle>
            <SheetDescription>{config.APP_NAME}</SheetDescription>
          </SheetHeader>
          <Separator className="bg-secondary-foreground/25 flex-col" />
          <div className="flex-grow overflow-auto">
            {menuItems
              .filter((menuItem) => !menuItem.hidden)
              .map((item) => {
                return (
                  <div key={item.key}>
                    <SheetClose asChild>
                      <SideMenuButton
                        item={item}
                        selected={item === selectedMenu}
                        onClick={() => handleMenuClick(item)}
                      />
                    </SheetClose>
                  </div>
                );
              })}
          </div>
          <SponsorMenu />
        </SheetContent>
      </Sheet>
      {selectedMenu ? (
        <span className="text-base flex-grow">{t(selectedMenu.labelId)}</span>
      ) : null}
    </div>
  );
}

export function SideMenu({ className }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState();

  useEffect(() => {
    const selectedMenuItems = menuItems.filter(
      (menuItem) => router.pathname.indexOf(menuItem.pathname) !== -1
    );
    let selectedMenuItem;
    if (selectedMenuItems.length > 0) {
      selectedMenuItem = selectedMenuItems[0];
    }
    setSelectedMenu(selectedMenuItem);
  }, [router.pathname]);

  const handleMenuClick = useCallback(
    (menuItem) => () => {
      setSelectedMenu(menuItem);
      let pathname = menuItem.pathname.replace(
        '[yearMonth]',
        moment().format('YYYY.MM')
      );
      pathname = pathname.replace('[year]', moment().year());
      router.push(
        `/${store.organization.selected.name}${pathname}`,
        undefined,
        {
          locale: store.organization.selected.locale
        }
      );
    },
    [
      router,
      store.organization.selected?.locale,
      store.organization.selected?.name
    ]
  );

  return (
    <div
      className={cn(
        'bg-card flex flex-col fixed w-60 h-full z-50 shadow-md',
        className
      )}
    >
      <div className="whitespace-nowrap text-2xl font-semibold px-4 -mt-10">
        {store.organization.selected.name}
      </div>
      <div className="text-muted-foreground px-4 mt-2">{config.APP_NAME}</div>
      <Separator className="bg-secondary-foreground/25 my-4" />
      <div className="flex-grow overflow-auto">
        {menuItems
          .filter((menuItem) => !menuItem.hidden)
          .map((item) => {
            return (
              <div key={item.key}>
                <SideMenuButton
                  item={item}
                  selected={item === selectedMenu}
                  onClick={handleMenuClick(item)}
                />
              </div>
            );
          })}
      </div>
      <SponsorMenu className="mb-20" />
    </div>
  );
}
