const { defineConfig } = require('cypress');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

dotenvExpand.expand(dotenv.config({ path: '../.env' }));

let API_BASEURL = 'http://localhost:8080';
if (process.env.API_URL) {
  const apiUrl = new URL(process.env.API_URL);
  API_BASEURL = `${apiUrl.protocol}//${apiUrl.host}`;
}

module.exports = defineConfig({
  viewportWidth: 1200,
  viewportHeight: 1200,
  defaultCommandTimeout: 10000,
  env: {
    API_BASEURL,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: process.env.LANDLORD_APP_URL || 'http://localhost:8080/landlord',
  },
});
