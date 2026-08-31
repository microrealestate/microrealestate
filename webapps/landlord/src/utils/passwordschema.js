import { PASSWORD_MIN_LENGTH, PASSWORD_PATTERN } from '@microrealestate/shared';
import * as Yup from 'yup';

export const PASSWORD_HELP =
  'Use at least 8 characters with an uppercase letter, a lowercase letter and a number';

export const passwordSchema = Yup.string()
  .required()
  .min(PASSWORD_MIN_LENGTH)
  .matches(
    PASSWORD_PATTERN,
    'Password must contain at least one uppercase letter, one lowercase letter and one number'
  );

export const confirmationPasswordSchema = (ref = 'password') =>
  Yup.string()
    .required()
    .oneOf([Yup.ref(ref), null], 'Passwords must match');
