import { TextField } from '@microrealestate/commonui/components';
import withFormik from '@bbbtech/storybook-formik';

const page = {
  title: 'Form/TextField',
  component: TextField,
};

export default page;

export const Default = () => {
  return <TextField label="Name" name="contact" />;
};

Default.decorators = [withFormik];
