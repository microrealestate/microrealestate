import { FaDroplet, FaFaucet } from 'react-icons/fa6';
import {
  LuBuilding2,
  LuClipboardList,
  LuDollarSign,
  LuKeyRound,
  LuLandmark,
  LuLayoutDashboard,
  LuMenu,
  LuSettings,
  LuStickyNote,
  LuUserCircle,
  LuWallet,
  LuWrench
} from 'react-icons/lu';
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
import { BsReceipt } from 'react-icons/bs';
import { Button } from './ui/button';
import { cn } from '../utils';
import config from '../config';
import moment from 'moment';
import { Separator } from './ui/separator';
import SideMenuButton from './SideMenuButton';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function CityRentEstimatesIcon({ className }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      <LuBuilding2 className="size-full" />
      <LuDollarSign className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-background text-emerald-600" />
    </span>
  );
}

function UtilitiesIcon({ className }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      <FaFaucet className="size-full text-muted-foreground" />
      <FaDroplet className="absolute right-[-3px] top-[92%] size-2.5 text-sky-500" />
    </span>
  );
}

const menuItems = [
  {
    key: 'dashboard',
    labelId: 'Dashboard',
    pathname: '/dashboard',
    Icon: LuLayoutDashboard,
    dataCy: 'dashboardNav'
  },
  {
    key: 'notes',
    labelId: 'Notes',
    pathname: '/notes',
    Icon: LuStickyNote,
    dataCy: 'notesNav'
  },
  {
    key: 'rents',
    labelId: 'Rents',
    pathname: '/rents/[yearMonth]',
    subPathnames: ['/payment/[tenantId]/[...param]'],
    Icon: BsReceipt,
    dataCy: 'rentsNav'
  },
  {
    key: 'tenants',
    labelId: 'Tenants',
    pathname: '/tenants',
    Icon: LuUserCircle,
    dataCy: 'tenantsNav'
  },
  {
    key: 'contractors',
    labelId: 'Contractors',
    pathname: '/contractors',
    Icon: LuWrench,
    dataCy: 'contractorsNav'
  },
  {
    key: 'projects',
    labelId: 'Projects',
    pathname: '/projects',
    Icon: LuClipboardList,
    dataCy: 'projectsNav'
  },
  {
    key: 'properties',
    labelId: 'Properties',
    pathname: '/properties',
    Icon: LuKeyRound,
    dataCy: 'propertiesNav'
  },
  {
    key: 'utilities',
    labelId: 'Utilities',
    pathname: '/utilities',
    Icon: UtilitiesIcon,
    dataCy: 'utilitiesNav'
  },
  {
    key: 'propertyTaxes',
    labelId: 'Property taxes',
    pathname: '/property-taxes',
    Icon: LuLandmark,
    dataCy: 'propertyTaxesNav'
  },
  {
    key: 'rentEstimates',
    labelId: 'City rent estimates',
    pathname: '/properties/rent-estimates',
    Icon: CityRentEstimatesIcon,
    dataCy: 'rentEstimatesNav'
  },
  {
    key: 'accounting',
    labelId: 'Accounting',
    pathname: '/accounting/[year]',
    Icon: LuWallet,
    dataCy: 'accountingNav'
  },
  {
    key: 'settings',
    labelId: 'Settings',
    pathname: '/settings',
    Icon: LuSettings,
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
  },
  {
    hidden: true,
    key: 'utilitiesSettings',
    labelId: 'Settings',
    pathname: '/settings/utilities'
  },
  {
    hidden: true,
    key: 'spacesSettings',
    labelId: 'Settings',
    pathname: '/settings/spaces'
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
    selectedMenuItems.sort(
      (first, second) => second.pathname.length - first.pathname.length
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
            <LuMenu />
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
    selectedMenuItems.sort(
      (first, second) => second.pathname.length - first.pathname.length
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
    </div>
  );
}
