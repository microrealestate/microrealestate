const path = require('path');
const { URL } = require('url');
const mongobackup = require('mongobackup');
const config = require('@microrealestate/common/config');
const moment = require('moment');

const connectionString = config.MONGO_URL;
const dbUrl = new URL(connectionString);
const dbName = dbUrl.pathname.slice(1);
const bkpDirectory = path.join(__dirname, '..', '..', '..', 'backup');

async function restoreDB(timeStamp) {
  const bkpFile = path.join(
    bkpDirectory,
    timeStamp ? `${dbName}-${timeStamp}.dump` : `${dbName}.dump`
  );
  await new Promise((resolve, reject) => {
    try {
      const cmd = mongobackup.restore({
        uri: connectionString,
        drop: true,
        gzip: true,
        archive: bkpFile,
      });
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
}

async function dumpDB() {
  const timeStamp = moment().format('YYYYMMDDHHmm');
  const bkpFile = path.join(bkpDirectory, `${dbName}-${timeStamp}.dump`);
  await new Promise((resolve, reject) => {
    try {
      const cmd = mongobackup.dump({
        uri: connectionString,
        gzip: true,
        archive: bkpFile,
      });
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
}

module.exports = {
  restoreDB,
  dumpDB,
};
