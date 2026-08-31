import FileDownload from 'js-file-download';
import apiClient from './apiClient';

export const downloadDocument = async ({ endpoint, documentName }) => {
  const response = await apiClient.get(endpoint, {
    responseType: 'blob'
  });
  FileDownload(response.data, documentName);
};

export const uploadDocument = async ({
  endpoint,
  documentName,
  file,
  folder
}) => {
  const formData = new FormData();
  if (folder) {
    formData.append('folder', folder);
  }
  formData.append('fileName', documentName);
  formData.append('file', file);
  return await apiClient.post(endpoint, formData, {
    headers: {
      timeout: 30000
    }
  });
};
