import moment from 'moment';
import UploadFileCard from '../components/UploadFileCard';

const page = {
  title: 'UploadFileCard',
  component: UploadFileCard,
};

export default page;

export const FileUploaded = (args) => {
  return <UploadFileCard {...args} />;
};
FileUploaded.args = {
  documentInfo: {
    name: 'ID card',
    description: 'scan of the legal representative ID card',
    url: '/cloud/document/1',
  },
};

export const FileUploadedWithExpiryDate = (args) => {
  return <UploadFileCard {...args} />;
};
FileUploadedWithExpiryDate.args = {
  documentInfo: {
    name: 'ID card',
    description: 'scan of the legal representative ID card',
    expiryDate: moment().add(30, 'days').toDate(),
    url: '/cloud/document/1',
  },
};

export const FileNotUploaded = (args) => {
  return <UploadFileCard {...args} />;
};
FileNotUploaded.args = {
  documentInfo: {
    name: 'ID card',
    description: 'scan of the legal representative ID card',
    expiryDate: moment().add(30, 'days').toDate(),
  },
};

export const FileCloseToExpire = (args) => {
  return <UploadFileCard {...args} />;
};
FileCloseToExpire.args = {
  documentInfo: {
    name: 'ID card',
    description: 'scan of the legal representative ID card',
    expiryDate: moment().add(10, 'days').toDate(),
    url: '/cloud/document/1',
  },
};

export const FileExpired = (args) => {
  return <UploadFileCard {...args} />;
};
FileExpired.args = {
  documentInfo: {
    name: 'ID card',
    description: 'scan of the legal representative ID card',
    expiryDate: moment().subtract(10, 'days').toDate(),
    url: '/cloud/document/1',
  },
};
