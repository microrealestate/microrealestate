const path = require('path');
const fileUrl = require('file-url');
const db = require('../');
const config = require('../../src/config');

const template_dir = config.TEMPLATES_DIRECTORY;

module.exports = {
  async get(params) {
    const data = await db.getRentsData(params);

    if (!data || !data.tenant || !data.tenant.rents) {
      throw new Error(
        `data not found to generate document invoice with id=${params.id}`
      );
    }

    data.cssUrl = fileUrl(path.join(template_dir, 'css', 'print.css'));
    data.logoUrl = fileUrl(path.join(template_dir, 'img', 'logo.png'));

    return data;
  },
};
