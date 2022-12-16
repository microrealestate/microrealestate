import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { useCallback, useContext } from 'react';

import { ElevationScroll } from './Scroll';
import getConfig from 'next/config';
import Hidden from './HiddenSSRCompatible';
import { Loading } from '@microrealestate/commonui/components';
import MobileMenu from './MobileMenu';
import { observer } from 'mobx-react-lite';
import OrganizationSwitcher from './organization/OrganizationSwitcher';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import { StoreContext } from '../store';
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

  return (
    <>
      <Hidden smDown>
        <Box ml={7}>
          <Toolbar disableGutters>
            <Container maxWidth={maxWidth}>
              <Box display="flex" alignItems="center" width="100%">
                <Typography variant="h5">{APP_NAME}</Typography>
                <Box flexGrow={1} mx={10}>
                  {!loading && SearchBar}
                </Box>
                <Box display="flex" alignItems="center">
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
      </Hidden>
      <Hidden mdUp>
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
      </Hidden>
    </>
  );
}

function SubToolbar({ NavBar, ActionBar, maxWidth, loading }) {
  if (loading || (!NavBar && !ActionBar)) {
    return null;
  }

  return (
    <>
      <Hidden smDown>
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
      </Hidden>
      <Hidden mdUp>
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
      </Hidden>
    </>
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
          <SubToolbar NavBar={NavBar} ActionBar={ActionBar} />
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

  if (!store.user?.signedIn) {
    return null;
  }

  return (
    <>
      <Hidden smDown>
        <DesktopToolbars
          title={title}
          NavBar={NavBar}
          SearchBar={SearchBar}
          ActionBar={ActionBar}
          loading={loading}
          maxWidth={maxWidth}
          onSignOut={onSignOut}
        />
      </Hidden>
      <Hidden mdUp>
        <MobileToolbars
          title={title}
          NavBar={NavBar}
          SearchBar={SearchBar}
          ActionBar={ActionBar}
          loading={loading}
          maxWidth={maxWidth}
          onSignOut={onSignOut}
        />
      </Hidden>
    </>
  );
}

function PageContent({ maxWidth, children }) {
  return (
    <>
      <Hidden smDown>
        <Box ml={7}>
          <Container maxWidth={maxWidth}>
            <Box my={2}>{children}</Box>
          </Container>
        </Box>
      </Hidden>
      <Hidden mdUp>
        <Box>
          <Container maxWidth={maxWidth}>
            <Box my={2}>{children}</Box>
          </Container>
        </Box>
      </Hidden>
    </>
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
  const store = useContext(StoreContext);

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
        loading={loading}
        maxWidth={maxWidth}
        onSignOut={handleSignOut}
      />

      <PageContent maxWidth={maxWidth}>
        {loading ? <Loading fullScreen /> : children}
      </PageContent>
    </>
  );
}

export default observer(Page);
