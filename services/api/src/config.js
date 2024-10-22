const baseConfig = require('@microrealestate/common/config');

const toBoolean = (value) => {
  if (value && typeof value !== 'boolean') {
    value = value.toLowerCase() === 'true';
  }
  return value;
};

module.exports = {
  ...baseConfig,
  PORT: process.env.PORT || 8080,
  businesslogic: 'FR',
  restoreDatabase: toBoolean(process.env.RESTORE_DB || true),
  demoMode: toBoolean(process.env.DEMO_MODE || true),
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  PDFGENERATOR_URL:
    process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
};
