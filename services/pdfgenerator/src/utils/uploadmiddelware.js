const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const config = require('../config');

const SUPPORTED_FILE_EXTENSIONS = {
  'image/gif': 'gif',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/jpe': 'jpe',
  'application/pdf': 'pdf',
};

const SUPPORTED_MIMETYPES = Object.keys(SUPPORTED_FILE_EXTENSIONS);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let s3Dir = `${req.realm.name}-${req.realm._id}`;
    let localDir = path.join(
      config.UPLOADS_DIRECTORY,
      `${req.realm.name}-${req.realm._id}`
    );
    if (req.body.folder) {
      // Avoid going up in host machine directory
      if (req.body.folder.indexOf('..') !== -1) {
        return cb(new Error('invalid folder'));
      }
      const folder = req.body.folder;
      localDir = path.join(localDir, folder);
      req.body.localDir = localDir;
      req.body.s3Dir = [s3Dir, folder].join('/');
    }
    fs.ensureDirSync(localDir);
    cb(null, localDir);
  },
  filename: function (req, file, cb) {
    if (!SUPPORTED_MIMETYPES.includes(file.mimetype)) {
      return cb(new Error('file not supported'));
    }
    const fileNameNoExt = (req.body.fileName || 'noname').replace(
      /[/\\]/g,
      '_'
    );
    const suffix = Math.round(Math.random() * 1e9);
    const extension = SUPPORTED_FILE_EXTENSIONS[file.mimetype];
    const fileName = `${fileNameNoExt}-${suffix}.${extension}`;
    req.body.fileName = fileName;
    cb(null, fileName);
  },
});

module.exports = multer({ storage: storage }).single('file');
