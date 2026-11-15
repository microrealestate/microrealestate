export const PASSWORD_MIN_LENGTH = 8;
/** at least one lowercase, one uppercase and one digit */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Checks a password against the application password policy.
 * Shared by the landlord webapp forms and the authenticator service so both
 * sides enforce the exact same rule.
 */
export function isStrongPassword(password: unknown): boolean {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}
