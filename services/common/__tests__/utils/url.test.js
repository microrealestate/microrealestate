const URL = require('../../utils/url');

describe('utils', () => {
  it('can build an url', () => {
    expect(
      URL.buildUrl({
        protocol: 'http:',
        domain: 'localhost',
      })
    ).toBe('http://localhost');

    expect(
      URL.buildUrl({
        protocol: 'http:',
        domain: 'localhost',
        port: '8080',
        basePath: '/app',
      })
    ).toBe('http://localhost:8080/app');

    expect(
      URL.buildUrl({
        protocol: 'https:',
        domain: '10.1.1.2',
      })
    ).toBe('https://10.1.1.2');

    expect(
      URL.buildUrl({
        protocol: 'https:',
        domain: '10.1.1.2',
        port: '8080',
        basePath: '/app',
      })
    ).toBe('https://10.1.1.2:8080/app');

    expect(
      URL.buildUrl({
        protocol: 'http:',
        domain: 'example.com',
      })
    ).toBe('http://example.com');

    expect(
      URL.buildUrl({
        protocol: 'https:',
        domain: 'example.com',
        port: '8080',
        basePath: '/app',
      })
    ).toBe('https://example.com:8080/app');

    expect(
      URL.buildUrl({
        protocol: 'https:',
        subDomain: 'mre',
        domain: 'example.com',
        basePath: '/app',
      })
    ).toBe('https://mre.example.com/app');
  });

  it('can destruct url containing localhost', () => {
    let destructedUrl = URL.destructUrl('http://localhost:8080');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('localhost');
    expect(destructedUrl.port).toBe('8080');
    expect(destructedUrl.basePath).toBeUndefined();

    destructedUrl = URL.destructUrl('http://localhost');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('localhost');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBeUndefined();

    destructedUrl = URL.destructUrl('http://localhost/basePath');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('localhost');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBe('/basePath');
  });

  it('can destruct url containing a domain name', () => {
    let destructedUrl = URL.destructUrl('http://example.com:8080');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('example.com');
    expect(destructedUrl.port).toBe('8080');
    expect(destructedUrl.basePath).toBeUndefined();

    destructedUrl = URL.destructUrl('https://example.com');
    expect(destructedUrl.protocol).toBe('https:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('example.com');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBeUndefined();

    destructedUrl = URL.destructUrl('http://example.com/basePath');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('example.com');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBe('/basePath');

    destructedUrl = URL.destructUrl('http://mre.example.com/basePath');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBe('mre');
    expect(destructedUrl.domain).toBe('example.com');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBe('/basePath');

    destructedUrl = URL.destructUrl('http://stage.mre.example.com/basePath');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBe('stage.mre');
    expect(destructedUrl.domain).toBe('example.com');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBe('/basePath');
  });

  it('can destruct url containing ip address', () => {
    let destructedUrl = URL.destructUrl('http://10.1.1.5:8080');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('10.1.1.5');
    expect(destructedUrl.port).toBe('8080');
    expect(destructedUrl.basePath).toBeUndefined();

    destructedUrl = URL.destructUrl('https://10.1.1.5');
    expect(destructedUrl.protocol).toBe('https:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('10.1.1.5');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBeUndefined();

    destructedUrl = URL.destructUrl('http://10.1.1.5/basePath');
    expect(destructedUrl.protocol).toBe('http:');
    expect(destructedUrl.subDomain).toBeUndefined();
    expect(destructedUrl.domain).toBe('10.1.1.5');
    expect(destructedUrl.port).toBe('');
    expect(destructedUrl.basePath).toBe('/basePath');
  });
});
