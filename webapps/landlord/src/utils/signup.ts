const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8080';

export async function isSignUpAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      `${GATEWAY_URL}/api/v2/authenticator/landlord/signup/status`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      return false;
    }
    const { available } = await response.json();
    return !!available;
  } catch (error) {
    console.error('====>[SIGNUP]', String(error));
    return false;
  }
}
