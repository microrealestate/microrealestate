const path = require('path');
const baseConfig = require('@microrealestate/common/config');

const root_dir = path.join(__dirname, '..');

module.exports = {
  ...baseConfig,
  PORT: process.env.PORT || 8082,
  DATA_DIRECTORY: process.env.DATA_DIRECTORY || path.join(root_dir, '/data'),
  TEMPLATES_DIRECTORY:
    process.env.TEMPLATES_DIRECTORY || path.join(root_dir, '/templates'),
  TEMPORARY_DIRECTORY:
    process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp'),
  PDF_DIRECTORY:
    process.env.PDF_DIRECTORY || path.join(root_dir, '/pdf_documents'),
  UPLOADS_DIRECTORY:
    process.env.UPLOADS_DIRECTORY || path.join(root_dir, '/uploads'),
  UPLOAD_MAX_SIZE: process.env.UPLOAD_MAX_SIZE || 1024 * 1024 * 2 /* 2Mb */,
};
