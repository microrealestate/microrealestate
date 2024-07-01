import Document, { Head, Html, Main, NextScript } from 'next/document';

import React from 'react';
import Script from 'next/script';
import { ServerStyleSheets } from '@material-ui/core/styles';

export default function MyDocument() {
  return (
    <Html translate="no">
      <Head>
        <Script
          src={`${process.env.BASE_PATH || ''}/__ENV.js`}
          strategy="beforeInteractive"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.min.css"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-background text-secondary-foreground">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />)
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement()
    ]
  };
};
