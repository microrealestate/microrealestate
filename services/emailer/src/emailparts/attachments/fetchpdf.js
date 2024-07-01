import axios from 'axios';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';

export default function (
  authorizationHeader,
  organizationId,
  templateName,
  recordId,
  params,
  filename
) {
  const { PDFGENERATOR_URL, TEMPORARY_DIRECTORY } =
    Service.getInstance().envConfig.getValues();
  const uri = `${PDFGENERATOR_URL}/documents/${templateName}/${recordId}/${params.term}`;
  const fileDir = path.join(TEMPORARY_DIRECTORY, templateName);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir);
  }
  const filePath = path.join(fileDir, filename);
  const wStream = fs.createWriteStream(filePath);

  return axios
    .get(uri, {
      responseType: 'stream',
      headers: {
        authorization: authorizationHeader,
        organizationid: organizationId
      }
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
}
