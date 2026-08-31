import {
  transformRequestDates,
  transformResponseDates
} from '@microrealestate/shared';
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig
} from 'axios';

// The landlord access token lives 30 seconds
const ACCESS_TOKEN_TTL_MS = 30 * 1000;
const REFRESH_MARGIN_MS = 10 * 1000;

export type Credentials = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
};

function readRefreshTokenCookie(setCookie: string[] | undefined) {
  if (!setCookie) {
    return undefined;
  }
  for (const cookie of setCookie) {
    const match = /(?:^|;\s*)refreshToken=([^;]*)/.exec(cookie);
    if (match?.[1]) {
      return match[1];
    }
  }
  return undefined;
}

export class SeedClient {
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private refreshToken?: string;
  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.http = axios.create({
      baseURL: this.baseUrl,
      transformResponse: [transformResponseDates],
      validateStatus: (status) => status < 500
    });

    this.http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (config.data && typeof config.data === 'object') {
        config.data = transformRequestDates(config.data);
      }
      return config;
    });
  }

  // Only proxied by the gateway when it does not run in production mode.
  async reset() {
    const response = await this.http.delete('/api/reset');
    if (response.status === 404) {
      throw new Error(
        `${this.baseUrl}/api/reset is not reachable. The reset service is only exposed when the gateway does not run in production mode. Use --keep to seed without resetting.`
      );
    }
    if (response.status >= 400) {
      throw new Error(`reset failed with status ${response.status}`);
    }
  }

  async isSignUpAvailable() {
    const response = await this.http.get(
      '/api/v2/authenticator/landlord/signup/status'
    );
    if (response.status >= 400) {
      throw new Error(
        `cannot reach ${this.baseUrl}: signup/status returned ${response.status}`
      );
    }
    return !!response.data?.available;
  }

  async signUp(credentials: Credentials) {
    const { firstname, lastname, email, password } = credentials;
    const response = await this.http.post(
      '/api/v2/authenticator/landlord/signup',
      { firstname, lastname, email, password }
    );
    if (response.status === 403) {
      throw new Error(
        'signup is closed: an account already exists. Run without --keep to reset the database first.'
      );
    }
    if (response.status >= 400) {
      throw new Error(
        `signup failed with status ${response.status}: ${JSON.stringify(response.data)}`
      );
    }
  }

  async signIn(email: string, password: string) {
    const response = await this.http.post(
      '/api/v2/authenticator/landlord/signin',
      { email, password }
    );
    if (response.status >= 400) {
      throw new Error(
        `signin failed with status ${response.status}: ${JSON.stringify(response.data)}`
      );
    }
    this.setAccessToken(response.data?.accessToken);
    this.refreshToken = readRefreshTokenCookie(
      response.headers['set-cookie'] as string[] | undefined
    );
    if (!this.refreshToken) {
      throw new Error('signin did not return a refreshToken cookie');
    }
  }

  private setAccessToken(accessToken: string | undefined) {
    if (!accessToken) {
      throw new Error('no access token returned by the authenticator');
    }
    this.accessToken = accessToken;
    this.accessTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;
  }

  private async refreshAccessToken() {
    const response = await this.http.post(
      '/api/v2/authenticator/landlord/refreshtoken',
      undefined,
      { headers: { Cookie: `refreshToken=${this.refreshToken}` } }
    );
    if (response.status >= 400) {
      throw new Error(
        `refreshtoken failed with status ${response.status}. The session expired, run the seeder again.`
      );
    }
    this.setAccessToken(response.data?.accessToken);
    this.refreshToken =
      readRefreshTokenCookie(
        response.headers['set-cookie'] as string[] | undefined
      ) ?? this.refreshToken;
  }

  private async authorizationHeader() {
    if (Date.now() > this.accessTokenExpiresAt - REFRESH_MARGIN_MS) {
      await this.refreshAccessToken();
    }
    return `Bearer ${this.accessToken}`;
  }

  async api<ResponseBody>(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    body?: unknown
  ): Promise<ResponseBody> {
    let response = await this.http.request({
      method,
      url: `/api/v2${path}`,
      data: body,
      headers: { Authorization: await this.authorizationHeader() }
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      response = await this.http.request({
        method,
        url: `/api/v2${path}`,
        data: body,
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    }

    if (response.status >= 400) {
      throw new Error(
        `${method.toUpperCase()} ${path} failed with status ${response.status}: ${JSON.stringify(response.data)}`
      );
    }

    return response.data as ResponseBody;
  }
}
