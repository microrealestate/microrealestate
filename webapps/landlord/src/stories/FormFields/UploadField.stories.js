import UploadField from '../../components/FormFields/UploadField';
import withFormik from '@bbbtech/storybook-formik';

const page = {
  title: 'Form/UploadField',
  component: UploadField,
};

export default page;

export const Default = () => {
  return <UploadField name="file" />;
};

Default.decorators = [withFormik];
