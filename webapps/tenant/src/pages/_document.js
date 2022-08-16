import { Head, Html, Main, NextScript } from 'next/document';

import getConfig from 'next/config';
import React from 'react';

const {
  publicRuntimeConfig: { BASE_PATH },
} = getConfig();

export default function MyDocument() {
  return (
    <Html translate="no">
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <link rel="shortcut icon" href={`${BASE_PATH}/favicon.svg`} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
