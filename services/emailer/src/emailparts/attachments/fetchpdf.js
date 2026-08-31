import fs from 'node:fs';
import path from 'node:path';
import { Service } from '@microrealestate/common';
import axios from 'axios';
import { TEMPORARY_DIRECTORY } from '../../directories';

export default function (
  authorizationHeader,
  templateName,
  recordId,
  params,
  filename
) {
  const { PDFGENERATOR_URL } = Service.getInstance().envConfig.getValues();
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
        authorization: authorizationHeader
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
