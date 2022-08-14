import { NumberField } from '@microrealestate/commonui/components';
import withFormik from '@bbbtech/storybook-formik';

const page = {
  title: 'Form/NumberField',
  component: NumberField,
};

export default page;

export const Default = () => {
  return <NumberField label="Amount" name="amount" />;
};

Default.decorators = [withFormik];
// Default.parameters = {
//   formik: {
//     initialValues: {
//       contact: 'ddddd',
//     },
//     onSubmit: (v) => console.log('I want to log these... ', v),
//   },
// };
