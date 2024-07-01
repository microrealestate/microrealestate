import {
  BriefcaseBusinessIcon,
  Building2Icon,
  CableIcon,
  FilePenIcon,
  HandCoinsIcon,
  UserIcon,
  UsersIcon
} from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../ui/sheet';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import config from '../../config';
import { Separator } from '../ui/separator';
import SideMenuButton from '../SideMenuButton';
import { StoreContext } from '../../store';
import UserAvatar from '../UserAvatar';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const menuItems = [
  [
    {
      key: 'account',
      Icon: UserIcon,
      labelId: 'Your account',
      pathname: '/settings/account',
      dataCy: 'accountNav'
    },
    {
      key: 'organizations',
      Icon: Building2Icon,
      labelId: 'Your organizations',
      pathname: '/settings/organizations',
      dataCy: 'organizationsNav'
    }
  ],
  [
    {
      key: 'landlord',
      Icon: BriefcaseBusinessIcon,
      labelId: 'Landlord',
      pathname: '/settings/landlord',
      dataCy: 'landlordNav'
    },
    {
      key: 'billing',
      Icon: HandCoinsIcon,
      labelId: 'Billing',
      pathname: '/settings/billing',
      dataCy: 'billingNav'
    },
    {
      key: 'contracts',
      Icon: FilePenIcon,
      labelId: 'Contracts',
      pathname: '/settings/contracts',
      dataCy: 'contractsNav'
    },
    {
      key: 'access',
      Icon: UsersIcon,
      labelId: 'Access',
      pathname: '/settings/access',
      dataCy: 'accessNav'
    },
    {
      key: 'thirdparties',
      Icon: CableIcon,
      labelId: 'Third-parties',
      pathname: '/settings/thirdparties',
      dataCy: 'thirdpartiesNav'
    }
  ]
];

export default function OrganizationMenu({ className }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState();

  useEffect(() => {
    const selectedMenuItems = menuItems
      .flat()
      .filter((menuItem) => router.pathname.endsWith(menuItem.pathname));
    let selectedMenuItem;
    if (selectedMenuItems.length > 0) {
      selectedMenuItem = selectedMenuItems[0];
    }
    setSelectedMenu(selectedMenuItem);
  }, [router.pathname]);

  const handleSignOut = useCallback(
    async (event) => {
      event.preventDefault();
      await store.user.signOut();
      window.sessionStorage.clear();
      window.localStorage.clear();
      window.location.assign(config.BASE_PATH); // will be redirected to /signin
    },
    [store.user]
  );

  const handleMenuClick = useCallback(
    (menuItem) => {
      setSelectedMenu(menuItem);
      router.push(
        `/${store.organization.selected.name}${menuItem.pathname}`,
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
    <Sheet>
      <SheetTrigger asChild>
        <div className={className}>
          <Button variant="icon" data-cy="orgMenu">
            <UserAvatar className="cursor-pointer" />
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col px-0">
        <SheetHeader className="flex flex-row items-center px-4">
          <SheetTitle>{`${store.user.firstName} ${store.user.lastName}`}</SheetTitle>
        </SheetHeader>
        <Separator className="bg-secondary-foreground/25" />
        <div>
          {menuItems[0].map((item) => (
            <div key={item.key}>
              <SheetClose asChild>
                <SideMenuButton
                  item={item}
                  selected={item === selectedMenu}
                  onClick={() => handleMenuClick(item)}
                />
              </SheetClose>
            </div>
          ))}
        </div>
        {store.user.isAdministrator ? (
          <>
            <Separator className="bg-secondary-foreground/25" />
            <SheetDescription className="px-4">
              {t('Organization information', {
                organization: store.organization.selected.name
              })}
            </SheetDescription>
            <div>
              {menuItems[1].map((item) => (
                <div key={item.key}>
                  <SheetClose asChild>
                    <SideMenuButton
                      item={item}
                      selected={item === selectedMenu}
                      onClick={() => handleMenuClick(item)}
                    />
                  </SheetClose>
                </div>
              ))}
              <Separator className="mt-4 mb-0 bg-secondary-foreground/25" />
            </div>
          </>
        ) : (
          <Separator className="bg-secondary-foreground/25" />
        )}
        <div>
          <SheetClose asChild>
            <SideMenuButton
              item={{
                key: 'signout',
                labelId: 'Sign out',
                dataCy: 'signoutNav'
              }}
              onClick={handleSignOut}
            />
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
