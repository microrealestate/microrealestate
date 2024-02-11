const path = require('path');
const fs = require('fs');
const { defineConfig } = require('cypress');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

let env = {};
let envFile = path.resolve(process.cwd(), '.env');
if (envFile.endsWith('e2e/.env')) {
  envFile = envFile.replace('e2e/.env', '.env');
}
if (fs.existsSync(envFile)) {
  env = dotenvExpand.expand({
    ignoreProcessEnv: true,
    parsed: { ...dotenv.parse(fs.readFileSync(envFile)) },
    ...dotenv.config({ path: '../.env' }),
  });
}

let GATEWAY_BASEURL =
  process.env.GATEWAY_URL || env.GATEWAY_BASEURL || 'http://localhost:8080';
const apiUrl = new URL(GATEWAY_BASEURL);
GATEWAY_BASEURL = `${apiUrl.protocol}//${apiUrl.host}`;

module.exports = defineConfig({
  viewportWidth: 1200,
  viewportHeight: 1200,
  defaultCommandTimeout: 10000,
  env: {
    GATEWAY_BASEURL,
  },
  e2e: {
    baseUrl:
      process.env.LANDLORD_APP_URL ||
      env.LANDLORD_APP_URL ||
      'http://localhost:8080/landlord',
  },
});
