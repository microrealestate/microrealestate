const logger = require('winston');
const AWS = require('aws-sdk');
const fs = require('fs-extra');
const crypto = require('@mre/common/utils/crypto');

function _initS3(b2Config) {
  const credentials = new AWS.Credentials(
    crypto.decrypt(b2Config.keyId),
    crypto.decrypt(b2Config.applicationKey)
  );
  AWS.config.credentials = credentials;
  const ep = new AWS.Endpoint(b2Config.endpoint);
  return new AWS.S3({ endpoint: ep });
}

module.exports = {
  isEnabled: (b2Config) => {
    return !!(
      b2Config?.keyId &&
      b2Config?.applicationKey &&
      b2Config?.endpoint &&
      b2Config?.bucket
    );
  },

  downloadFile: (b2Config, url) => {
    logger.debug(`download ${url} from s3`);
    const s3 = _initS3(b2Config);
    return s3
      .getObject({
        Bucket: b2Config.bucket,
        Key: url,
      })
      .createReadStream();
  },

  uploadFile: (b2Config, { file, fileName, url }) => {
    logger.debug(`upload ${url} to s3`);
    return new Promise((resolve, reject) => {
      const s3 = _initS3(b2Config);
      const fileStream = fs.createReadStream(file.path);
      s3.putObject(
        {
          Bucket: b2Config.bucket,
          Key: url,
          Body: fileStream,
        },
        (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve({
            fileName,
            key: url,
            versionId: data.VersionId,
          });
        }
      );
    });
  },

  deleteFiles: (b2Config, urlsIds) => {
    logger.debug(`delete ${JSON.stringify(urlsIds)} from s3`);
    return new Promise((resolve, reject) => {
      const s3 = _initS3(b2Config);
      s3.deleteObjects(
        {
          Bucket: b2Config.bucket,
          Delete: {
            Objects: urlsIds.map(({ url, versionId }) => ({
              Key: url,
              VersionId: versionId,
            })),
          },
        },
        (err, data) => {
          if (err) {
            logger.error(err);
            return reject(err);
          }
          logger.debug({ data });
          resolve(data);
        }
      );
    });
  },
};
