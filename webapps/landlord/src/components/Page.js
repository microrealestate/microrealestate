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

function SubBar({ Bar, maxWidth, loading }) {
  if (loading || !Bar) {
    return null;
  }

  return (
    <>
      <Hidden smDown>
        <Box ml={7}>
          <Toolbar disableGutters>
            <Container maxWidth={maxWidth}>{Bar}</Container>
          </Toolbar>
        </Box>
      </Hidden>
      <Hidden mdUp>
        <Box p={0.75}>{Bar}</Box>
      </Hidden>
    </>
  );
}

function MobileToolbars({
  loading,
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
          <SubBar Bar={ActionBar} />
        </AppBar>
      </ElevationScroll>
    </>
  );
}

function DesktopToolbars({
  loading,
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
      <SubBar Bar={ActionBar} loading={loading} />
    </>
  );
}

function Toolbars({
  title,
  SearchBar,
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

function PageContent({ maxWidth, hasSubBar, children }) {
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
        <Box mt={hasSubBar ? 18.5 : 12} mb={7}>
          <Container maxWidth={maxWidth}>{children}</Container>
        </Box>
      </Hidden>
    </>
  );
}

function Page({
  children,
  title = '',
  SearchBar,
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
        SearchBar={SearchBar}
        ActionBar={ActionToolbar}
        loading={loading}
        maxWidth={maxWidth}
        onSignOut={handleSignOut}
      />

      <PageContent maxWidth={maxWidth} hasSubBar={!!ActionToolbar}>
        {loading ? <Loading fullScreen /> : children}
      </PageContent>
    </>
  );
}

export default observer(Page);
