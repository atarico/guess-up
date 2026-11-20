import { describe, expect, it } from 'vitest';
import { demoCredentials } from './demo';

describe('demoCredentials (03 §5.2): the demo link is rendered only with both variables', () => {
  it('neither variable set: no credentials, so no link', () => {
    expect(demoCredentials(undefined, undefined)).toBeNull();
  });

  it('only one of the two set: no credentials, so no link', () => {
    expect(demoCredentials('demo@guess-up.test', undefined)).toBeNull();
    expect(demoCredentials(undefined, 'demo-password')).toBeNull();
  });

  it('a variable set to an empty string counts as missing', () => {
    expect(demoCredentials('demo@guess-up.test', '')).toBeNull();
    expect(demoCredentials('', 'demo-password')).toBeNull();
  });

  it('both set: the credentials the link logs in with', () => {
    expect(demoCredentials('demo@guess-up.test', 'demo-password')).toEqual({ email: 'demo@guess-up.test', password: 'demo-password' });
  });
});
