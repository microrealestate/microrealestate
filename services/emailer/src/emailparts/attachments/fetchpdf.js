const path = require('path');
const fs = require('fs');
const axios = require('axios');
const config = require('../../config');

module.exports = (
  authorizationHeader,
  organizationId,
  templateName,
  recordId,
  params,
  filename
) => {
  const uri = `${config.PDFGENERATOR_URL}/documents/${templateName}/${recordId}/${params.term}`;
  const fileDir = path.join(config.TEMPORARY_DIRECTORY, templateName);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir);
  }
  const filePath = path.join(fileDir, `${filename}.pdf`);
  const wStream = fs.createWriteStream(filePath);

  return axios
    .get(uri, {
      responseType: 'stream',
      headers: {
        authorization: authorizationHeader,
        organizationid: organizationId,
      },
    })
    .then((response) => {
      return new Promise((resolve, reject) => {
        let isErrorOccured = false;
        wStream.on('error', (error) => {
          isErrorOccured = true;
          wStream.close();
          reject(error);
        });
        wStream.on('close', () => {
          if (!isErrorOccured) {
            resolve(filePath);
          }
          //no need to call the reject here, already done in the 'error' stream;
        });
        response.data.pipe(wStream);
      });
    });
};
