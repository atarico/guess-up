import { describe, expect, it } from 'vitest';
import { demoArrival, demoCredentials } from './demo';

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

describe('demoArrival (03 §5.2): what /login does with ?demo=1', () => {
  const demo = { email: 'demo@guess-up.test', password: 'demo-password' };

  it('logs in with the demo account only when there is no session', () => {
    expect(demoArrival(true, 'signedOut', demo)).toBe('logIn');
  });

  it('with a session open, ignores the parameter: the visitor stays as they were', () => {
    expect(demoArrival(true, 'signedIn', demo)).toBe('ignore');
  });

  it('waits while the stored session has not been read yet', () => {
    expect(demoArrival(true, 'loading', demo)).toBe('wait');
  });

  it('does nothing without the parameter, or without demo credentials', () => {
    expect(demoArrival(false, 'signedOut', demo)).toBe('nothing');
    expect(demoArrival(true, 'signedOut', null)).toBe('ignore');
  });
});
