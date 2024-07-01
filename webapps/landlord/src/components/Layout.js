import { HamburgerMenu, SideMenu } from './AppMenu';
import { cn } from '../utils';
import EnvironmentBar from './EnvironmentBar';
import OrganizationMenu from './organization/OrganizationMenu';
import { StoreContext } from '../store';
import { Toaster } from '../components/ui/sonner';
import { useContext } from 'react';
import { useMediaQuery } from 'usehooks-ts';

export default function Layout({ hideMenu, children }) {
  const store = useContext(StoreContext);
  const isXLorGreater = useMediaQuery('(min-width: 1280px)');

  return (
    <>
      {hideMenu ? (
        <>
          <div className="sticky top-0 z-50 shadow-md">
            <EnvironmentBar />
          </div>
          <div className={cn('flex-grow')}>{children}</div>
        </>
      ) : (
        <>
          <div className="sticky top-0 z-50 shadow-md">
            <EnvironmentBar />
            {store.user?.signedIn ? (
              <div className="flex items-center xl:justify-end bg-card w-full gap-2 py-1">
                {!isXLorGreater ? (
                  <HamburgerMenu className="flex flex-grow items-center" />
                ) : null}
                <OrganizationMenu />
              </div>
            ) : null}
          </div>
          <div className="flex">
            {store.user?.signedIn && isXLorGreater ? <SideMenu /> : null}
            <div
              className={cn(
                'flex-grow',
                store.user?.signedIn ? 'xl:ml-60' : ''
              )}
            >
              {children}
            </div>
          </div>
        </>
      )}

      <Toaster
        position="bottom-center"
        closeButton
        toastOptions={{
          unstyled: true,
          classNames: {
            error:
              'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-destructive text-destructive-foreground',
            success:
              'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-success text-success-foreground',
            warning:
              'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-warning text-warning-foreground',
            info: 'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-info text-info-foreground'
          }
        }}
      />
    </>
  );
}
