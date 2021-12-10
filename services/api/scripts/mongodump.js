const path = require('path');
const mongobackup = require('mongobackup');
const config = require('../src/config');

const db_url = new URL(config.MONGO_URL);
const db_name = db_url.pathname.slice(1);

mongobackup.dump({
  host: db_url.hostname,
  db: db_name,
  out: path.join(__dirname, '..', 'bkp'),
});
