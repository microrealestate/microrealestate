const baseConfig = require('@mre/common/config');

const toBoolean = (value) => {
  if (value && typeof value !== 'boolean') {
    value = value.toLowerCase() === 'true';
  }
  return value;
};

module.exports = {
  ...baseConfig,
  appHttpPort: process.env.PORT || 8080,
  businesslogic: 'FR',
  productive: process.env.NODE_ENV === 'production',
  signup: toBoolean(process.env.SIGNUP || false),
  restoreDatabase: toBoolean(process.env.RESTORE_DB || true),
  demoMode: toBoolean(process.env.DEMO_MODE || true),
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  PDFGENERATOR_URL:
    process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
};
