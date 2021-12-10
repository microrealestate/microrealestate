const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const mongobackup = require('mongobackup');
const config = require('../src/config');

const db_url = new URL(config.MONGO_URL);
const db_name = db_url.pathname.slice(1);

const bkpDirectory = path.join(__dirname, '..', 'bkp');
const bkpFile = path.join(bkpDirectory, `${db_name}.dump`);

module.exports = async () => {
  await new Promise((resolve, reject) => {
    try {
      let cmd;
      if (fs.existsSync(bkpFile)) {
        cmd = mongobackup.restore({
          host: db_url.hostname,
          drop: true,
          gzip: true,
          archive: bkpFile,
        });
      } else {
        cmd = mongobackup.restore({
          db: db_name,
          host: db_url.hostname,
          drop: true,
          path: path.join(bkpDirectory, db_name),
        });
      }
      cmd.on('close', (code) => {
        resolve(code);
      });
      cmd.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
