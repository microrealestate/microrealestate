const path = require('path');

const root_dir = path.join(__dirname, '..');

module.exports = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
  PRODUCTIVE: process.env.NODE_ENV === 'production',
  PORT: process.env.PORT || 8082,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost/sampledb',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  DATA_DIRECTORY: process.env.PDF_DIRECTORY || path.join(root_dir, '/data'),
  TEMPLATES_DIRECTORY:
    process.env.TEMPLATES_DIRECTORY || path.join(root_dir, '/templates'),
  TEMPORARY_DIRECTORY:
    process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp'),
  PDF_DIRECTORY:
    process.env.PDF_DIRECTORY || path.join(root_dir, '/pdf_documents'),
  CIPHER_KEY: process.env.CIPHER_KEY || 'cipher_key_secret',
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY || 'cipher_iv_key_secret',
};
