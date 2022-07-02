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
import { useCallback, useContext, useEffect, useState } from 'react';

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

function EnvironmentBar() {
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
}

function MainToolbar({ maxWidth, loading, SearchBar, onSignOut }) {
  const { t } = useTranslation('common');
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return !isMobile ? (
    <Box ml={7}>
      <Toolbar disableGutters>
        <Container maxWidth={maxWidth}>
          <Box display="flex" alignItems="center" width="100%">
            <Typography variant="h5">{APP_NAME}</Typography>
            <Box flexGrow={1} mx={10}>
              {!loading && SearchBar}
            </Box>
            <Box display="flex">
              <OrganizationSwitcher />
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
        </Container>
      </Toolbar>
    </Box>
  ) : (
    <MobileMenu>
      <Toolbar disableGutters>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <OrganizationSwitcher />
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
      </Toolbar>
    </MobileMenu>
  );
}

function SubToolbar({ NavBar, ActionBar, maxWidth, loading }) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  if (loading || (!NavBar && !ActionBar)) {
    return null;
  }

  return !isMobile ? (
    <Box ml={7}>
      <Toolbar disableGutters>
        <Container maxWidth={maxWidth}>
          {ActionBar ? (
            <Box display="flex" justifyContent="space-between" width="100%">
              <Box>{!!NavBar && NavBar}</Box>
              <Box>{ActionBar}</Box>
            </Box>
          ) : (
            !!NavBar && NavBar
          )}
        </Container>
      </Toolbar>
    </Box>
  ) : (
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
  );
}

function MobileToolbars({
  loading,
  NavBar,
  SearchBar,
  ActionBar,
  maxWidth,
  onSignOut,
}) {
  return (
    <>
      <ElevationScroll>
        <AppBar position="fixed">
          <EnvironmentBar />
          <MainToolbar
            maxWidth={maxWidth}
            SearchBar={SearchBar}
            onSignOut={onSignOut}
            loading={loading}
          />
          <SubToolbar NavBar={NavBar} ActionBar={ActionBar} loading={loading} />
        </AppBar>
      </ElevationScroll>
      <Toolbar />
      {(!!NavBar || !!ActionBar) && <Toolbar />}
    </>
  );
}

function DesktopToolbars({
  loading,
  NavBar,
  SearchBar,
  ActionBar,
  maxWidth,
  onSignOut,
}) {
  return (
    <>
      <ElevationScroll>
        <AppBar position="sticky">
          <EnvironmentBar />
          <MainToolbar
            maxWidth={maxWidth}
            SearchBar={SearchBar}
            onSignOut={onSignOut}
            loading={loading}
          />
        </AppBar>
      </ElevationScroll>
      <SubToolbar NavBar={NavBar} ActionBar={ActionBar} loading={loading} />
    </>
  );
}

function Toolbars({
  title,
  SearchBar,
  NavBar,
  ActionBar,
  loading,
  maxWidth,
  onSignOut,
}) {
  const store = useContext(StoreContext);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  if (!store.user?.signedIn) {
    return null;
  }

  return !isMobile ? (
    <DesktopToolbars
      title={title}
      NavBar={NavBar}
      SearchBar={SearchBar}
      ActionBar={ActionBar}
      loading={loading}
      maxWidth={maxWidth}
      onSignOut={onSignOut}
    />
  ) : (
    <MobileToolbars
      title={title}
      NavBar={NavBar}
      SearchBar={SearchBar}
      ActionBar={ActionBar}
      loading={loading}
      maxWidth={maxWidth}
      onSignOut={onSignOut}
    />
  );
}
function PageContent({ maxWidth, loading, children }) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return (
    <Box ml={!isMobile ? 7 : 0}>
      <Container maxWidth={maxWidth}>
        {loading ? <Loading fullScreen /> : <Box my={2}>{children}</Box>}
      </Container>
    </Box>
  );
}

function Page({
  children,
  title = '',
  SearchBar,
  NavBar,
  ActionToolbar,
  maxWidth = 'lg',
  loading = false,
}) {
  console.log('Page functional component');
  const store = useContext(StoreContext);
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
      <Toolbars
        title={title}
        NavBar={NavBar}
        SearchBar={SearchBar}
        ActionBar={ActionToolbar}
        loading={loading || routeloading}
        maxWidth={maxWidth}
        onSignOut={handleSignOut}
      />

      <PageContent maxWidth={maxWidth} loading={loading || routeloading}>
        {children}
      </PageContent>
    </>
  );
}

export default observer(Page);
