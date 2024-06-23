import { fileURLToPath, URL } from 'url';
import moment from 'moment';
import mongobackup from 'mongobackup';
import path from 'path';
import { Service } from '@microrealestate/common';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bkpDirectory = path.join(__dirname, '..', '..', '..', 'backup');

function _getDBInfo() {
  const connectionString =
    Service.getInstance().envConfig.getValues().MONGO_URL;
  const url = new URL(connectionString);
  const name = url.pathname.slice(1);
  return {
    name,
    uri: connectionString
  };
}

export function restoreDB(timeStamp) {
  const { name: dbName, uri } = _getDBInfo();
  const bkpFile = path.join(
    bkpDirectory,
    timeStamp ? `${dbName}-${timeStamp}.dump` : `${dbName}.dump`
  );
  return new Promise((resolve, reject) => {
    try {
      const cmd = mongobackup.restore({
        uri,
        drop: true,
        gzip: true,
        archive: bkpFile
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

export function dumpDB() {
  const { name: dbName, uri } = _getDBInfo();
  const timeStamp = moment().format('YYYYMMDDHHmm');
  const bkpFile = path.join(bkpDirectory, `${dbName}-${timeStamp}.dump`);
  return new Promise((resolve, reject) => {
    try {
      const cmd = mongobackup.dump({
        uri,
        gzip: true,
        archive: bkpFile
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
