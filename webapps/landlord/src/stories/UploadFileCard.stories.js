import { List } from '@material-ui/core';
import moment from 'moment';
import UploadFileItem from '../components/tenants/UploadFileItem';

const page = {
  title: 'UploadFileCard',
  component: UploadFileItem,
};

export default page;

export const UploadFileList = (args) => {
  return (
    <List>
      {args.items.map(({ key, ...item }) => {
        return <UploadFileItem key={key} {...item} mb={2} />;
      })}
    </List>
  );
};
UploadFileList.args = {
  items: [
    {
      key: '1',
      template: {
        name: 'ID card',
        description: 'scan of the legal representative ID card',
        required: true,
      },
      document: {
        url: '/cloud/document/1',
        updatedDate: moment().toDate(),
      },
    },
    {
      key: '2',
      template: {
        name: 'ID card',
        description: 'scan of the legal representative ID card',
        required: false,
      },
      document: {
        url: '/cloud/document/1',
        updatedDate: moment().toDate(),
        expiryDate: moment().add(30, 'days').toDate(),
      },
    },
    {
      key: '3',
      template: {
        name: 'ID card',
        description: 'scan of the legal representative ID card',
        required: true,
      },
      document: {},
    },
    {
      key: '4',
      template: {
        name: 'ID card',
        description: 'scan of the legal representative ID card',
        required: false,
      },
      document: {
        url: '/cloud/document/1',
        updatedDate: moment().toDate(),
        expiryDate: moment().add(10, 'days').toDate(),
      },
    },
    {
      key: '5',
      template: {
        name: 'ID card',
        description: 'scan of the legal representative ID card',
        required: true,
      },
      document: {
        url: '/cloud/document/1',
        updatedDate: moment().toDate(),
        expiryDate: moment().subtract(10, 'days').toDate(),
      },
    },
  ],
};
