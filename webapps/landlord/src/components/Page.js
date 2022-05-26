import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import { memo, useCallback, useContext, useEffect, useState } from 'react';

import { ElevationScroll } from './Scroll';
import getConfig from 'next/config';
import Loading from './Loading';
import MobileMenu from './MobileMenu';
import { observer } from 'mobx-react-lite';
import OrganizationSwitcher from './organization/OrganizationSwitcher';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const {
  publicRuntimeConfig: { DEMO_MODE, APP_NAME, BASE_PATH },
} = getConfig();

const SubToolbar = memo(function SubToolbar({ PrimaryBar, SecondaryBar }) {
  return (
    <Toolbar disableGutters>
      {SecondaryBar ? (
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box>{PrimaryBar}</Box>
          <Box>{SecondaryBar}</Box>
        </Box>
      ) : (
        <Box width="100%">{PrimaryBar}</Box>
      )}
    </Toolbar>
  );
});

const EnvironmentBar = memo(function EnvironmentBar() {
  const { t } = useTranslation('common');
  return DEMO_MODE || process.env.NODE_ENV === 'development' ? (
    <Box
      color="primary.contrastText"
      bgcolor={DEMO_MODE ? 'success.dark' : 'grey.700'}
    >
      <Typography variant="caption" component="div" align="center">
        {DEMO_MODE ? t('Demonstration mode') : t('Development mode')}
      </Typography>
    </Box>
  ) : null;
});

const MobileToolbars = ({
  loading,
  NavBar,
  SearchBar,
  ActionBar,
  maxWidth,
  onSignOut,
}) => {
  const store = useContext(StoreContext);

  return (
    // <ElevationScroll>
    <AppBar position="sticky">
      <EnvironmentBar />
      <MobileMenu>
        <Container maxWidth={maxWidth}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            {!!(
              store.organization.items && store.organization.items.length
            ) && <OrganizationSwitcher />}
            <Box flexGrow={1}>{!loading && SearchBar}</Box>
            <IconButton
              aria-label="sign out"
              onClick={onSignOut}
              color="inherit"
              data-cy="signout"
            >
              <PowerSettingsNewIcon />
            </IconButton>
          </Box>
        </Container>
      </MobileMenu>
      {!loading ? (
        <Container maxWidth={maxWidth}>
          {NavBar ? (
            <Box display="flex" justifyContent="space-between">
              <Toolbar disableGutters>{NavBar}</Toolbar>
              {!!ActionBar && <Toolbar disableGutters>{ActionBar}</Toolbar>}
            </Box>
          ) : (
            <Box display="flex" justifyContent="end">
              {!!ActionBar && <Toolbar disableGutters>{ActionBar}</Toolbar>}
            </Box>
          )}
        </Container>
      ) : null}
    </AppBar>
    // </ElevationScroll>
  );
};

const DesktopToolbars = ({
  loading,
  NavBar,
  SearchBar,
  ActionBar,
  maxWidth,
  onSignOut,
}) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <>
      <ElevationScroll>
        <AppBar position="sticky">
          <EnvironmentBar />

          <Container maxWidth={maxWidth}>
            <Toolbar disableGutters>
              <Box display="flex" alignItems="center" width="100%">
                <Typography variant="h5">{APP_NAME}</Typography>
                <Box flexGrow={1} mx={10}>
                  {!loading && SearchBar}
                </Box>
                <Box display="flex">
                  {!!(
                    store.organization.items && store.organization.items.length
                  ) && <OrganizationSwitcher />}
                  <Tooltip title={t('Sign out')} aria-label="sign out">
                    <IconButton
                      aria-label="sign out"
                      onClick={onSignOut}
                      color="default"
                      data-cy="signout"
                    >
                      <PowerSettingsNewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </ElevationScroll>

      {!loading && NavBar ? (
        <Container maxWidth={maxWidth}>
          <Box mt={1}>
            <SubToolbar PrimaryBar={NavBar} SecondaryBar={ActionBar} />
          </Box>
        </Container>
      ) : null}
    </>
  );
};

const Page = observer(
  ({
    children,
    title = '',
    SearchBar,
    NavBar,
    ActionToolbar,
    maxWidth = 'lg',
    loading = false,
  }) => {
    console.log('Page functional component');
    const store = useContext(StoreContext);
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
    const [routeloading, setRouteLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const routeChangeStart = (url, { shallow }) => {
        if (!shallow) {
          setRouteLoading(true);
        }
      };
      const routeChangeComplete = (url, { shallow }) => {
        if (!shallow) {
          setRouteLoading(false);
        }
      };

      router.events.on('routeChangeStart', routeChangeStart);
      router.events.on('routeChangeComplete', routeChangeComplete);

      return () => {
        router.events.off('routeChangeStart', routeChangeStart);
        router.events.off('routeChangeComplete', routeChangeComplete);
      };
    }, [router]);

    const handleSignOut = useCallback(
      async (event) => {
        event.preventDefault();
        await store.user.signOut();
        window.location.assign(BASE_PATH); // will be redirected to /signin
      },
      [store.user]
    );

    return (
      <>
        {store.user.signedIn && !isMobile && (
          <DesktopToolbars
            title={title}
            NavBar={NavBar}
            SearchBar={SearchBar}
            ActionBar={ActionToolbar}
            loading={loading || routeloading}
            maxWidth={maxWidth}
            onSignOut={handleSignOut}
          />
        )}

        {store.user.signedIn && isMobile && (
          <MobileToolbars
            title={title}
            NavBar={NavBar}
            SearchBar={SearchBar}
            ActionBar={ActionToolbar}
            loading={loading || routeloading}
            maxWidth={maxWidth}
            onSignOut={handleSignOut}
          />
        )}

        <Container maxWidth={maxWidth}>
          {!loading && !routeloading ? (
            <Box mt={1}>{children}</Box>
          ) : (
            <Loading fullScreen />
          )}
        </Container>
      </>
    );
  }
);

export default memo(Page);
