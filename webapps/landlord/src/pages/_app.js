import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import 'react-awesome-lightbox/build/style.css';
import '../components/PdfViewer/pdfviewer.css';
import '../components/RichTextEditor/richtexteditor.css';

import * as Yup from 'yup';

import App from 'next/app';
import Application from '../components/Application';
import CssBaseline from '@material-ui/core/CssBaseline';
import getConfig from 'next/config';
import Head from 'next/head';
import { InjectStoreContext } from '../store';
import theme from '../styles/theme';
import { ThemeProvider } from '@material-ui/core/styles';
import { useEffect } from 'react';

const {
  publicRuntimeConfig: { APP_NAME, DEMO_MODE },
} = getConfig();

const APP_TITLE = [APP_NAME, 'Landlord'];
if (process.env.NODE_ENV === 'development') {
  APP_TITLE.push('DEV');
} else if (DEMO_MODE) {
  APP_TITLE.push('DEMO');
}

Yup.addMethod(Yup.string, 'emails', function (message) {
  return this.test({
    name: 'emails',
    message: message || '${path} one of the emails is invalid or is not unique',
    test: (value) => {
      if (value == null) {
        return true;
      }
      const schema = Yup.string().email();
      const emails = value.replace(/\s/g, '').split(',');
      return (
        emails.every((email) => schema.isValidSync(email)) &&
        emails.length === new Set(emails).size
      );
    },
  });
});

function MyApp(props) {
  const { Component, pageProps } = props;

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <>
      <Head>
        <title>{APP_TITLE.join(' - ')}</title>
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <InjectStoreContext initialData={pageProps.initialState?.store}>
          <Application {...pageProps}>
            <Component {...pageProps} />
          </Application>
        </InjectStoreContext>
      </ThemeProvider>
    </>
  );
}

MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  if (!appProps.pageProps.initialState) {
    appProps.pageProps.initialState = {};
  }
  return { ...appProps };
};

export default MyApp;
