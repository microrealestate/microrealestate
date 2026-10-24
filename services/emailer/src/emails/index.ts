import type { EmailDefinition } from '../engine/types';
import otp from './otp';
import receipt from './receipt';
import rentnotice from './rentnotice';
import rentnoticeLastReminder from './rentnotice_last_reminder';
import rentnoticeReminder from './rentnotice_reminder';
import resetPassword from './reset_password';

const definitions: EmailDefinition[] = [
  receipt,
  rentnotice,
  rentnoticeReminder,
  rentnoticeLastReminder,
  otp,
  resetPassword
];

export default definitions;
