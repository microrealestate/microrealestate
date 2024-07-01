import { sanitize, sanitizePath } from './index.js';
import fs from 'fs-extra';
import multer from 'multer';
import os from 'os';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';

export default function () {
  const { UPLOAD_MAX_SIZE, UPLOADS_DIRECTORY } =
    Service.getInstance().envConfig.getValues();

  const SUPPORTED_FILE_EXTENSIONS = {
    'image/gif': 'gif',
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/jpe': 'jpe',
    'application/pdf': 'pdf'
  };

  const SUPPORTED_MIMETYPES = Object.keys(SUPPORTED_FILE_EXTENSIONS);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const orgName = sanitize(req.realm.name);
      const orgId = sanitize(req.realm._id);
      let s3Dir = `${orgName}-${orgId}`;
      let localDir = path.join(UPLOADS_DIRECTORY, `${orgName}-${orgId}`);

      if (req.body.folder) {
        const folder = sanitizePath(req.body.folder);
        localDir = path.join(localDir, folder);
        req.body.localDir = localDir;

        s3Dir = path.join(s3Dir, folder);
        if (os.platform() === 'win32') {
          s3Dir = s3Dir.replace(/\\/g, '/');
        }
        req.body.s3Dir = s3Dir;
      }

      fs.ensureDirSync(localDir);
      cb(null, localDir);
    },
    filename: function (req, file, cb) {
      if (!SUPPORTED_MIMETYPES.includes(file.mimetype)) {
        return cb(new Error('file not supported'));
      }
      const fileNameNoExt = req.body.fileName || 'noname';
      const suffix = Math.round(Math.random() * 1e9);
      const extension = SUPPORTED_FILE_EXTENSIONS[file.mimetype];
      const fileName = sanitize(`${fileNameNoExt}-${suffix}.${extension}`);
      req.body.fileName = fileName;
      cb(null, fileName);
    }
  });

  return multer({
    storage: storage,
    limits: { fileSize: UPLOAD_MAX_SIZE }
  }).single('file');
}
