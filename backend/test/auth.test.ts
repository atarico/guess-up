import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps, inMemoryUsers, TEST_JWT_SECRET } from './fakeDeps.js';

const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse';

function setup() {
  const users = inMemoryUsers();
  const app = createApp(fakeDeps({ users }));
  // Every /auth response the test receives, to check none of them carries a hash.
  const bodies: unknown[] = [];
  const keep = (res: request.Response) => {
    bodies.push(res.body);
    return res;
  };
  return {
    users,
    bodies,
    register: (body: object) => request(app).post('/auth/register').send(body).then(keep),
    login: (body: object) => request(app).post('/auth/login').send(body).then(keep),
    me: (authorization?: string) => {
      const req = request(app).get('/auth/me');
      return (authorization ? req.set('Authorization', authorization) : req).then(keep);
    },
  };
}

function expectError(res: request.Response, status: number, code: string) {
  expect(res.status).toBe(status);
  expect(res.body.error.code).toBe(code);
}

beforeEach(() => {
  // The error handler logs one line per client error; tests do not need it on screen.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('register → login → protected route', () => {
  it('registers, logs in and reads the user with the login token', async () => {
    const { register, login, me } = setup();

    const registered = await register({ email: '  Ana@Example.COM ', password: PASSWORD });
    expect(registered.status).toBe(201);
    expect(registered.body.user).toEqual({ id: expect.any(String), email: EMAIL, isDemo: false });
    expect(registered.body.token).toEqual(expect.any(String));

    const loggedIn = await login({ email: 'ANA@example.com', password: PASSWORD });
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.user).toEqual(registered.body.user);

    const current = await me(`Bearer ${loggedIn.body.token}`);
    expect(current.status).toBe(200);
    expect(current.body).toEqual({ user: registered.body.user });
  });

  it('signs an HS256 token for 7 days with the user id as subject', async () => {
    const { register } = setup();
    const res = await register({ email: EMAIL, password: PASSWORD });

    const decoded = jwt.decode(res.body.token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
    const payload = decoded?.payload as jwt.JwtPayload;
    expect(payload.sub).toBe(res.body.user.id);
    expect(payload.exp! - payload.iat!).toBe(7 * 24 * 60 * 60);
  });
});

describe('POST /auth/register', () => {
  it('answers 409 EMAIL_TAKEN for an email already registered, in any letter case', async () => {
    const { register } = setup();
    await register({ email: EMAIL, password: PASSWORD });
    expectError(await register({ email: 'ANA@EXAMPLE.COM', password: 'another-password' }), 409, 'EMAIL_TAKEN');
  });

  it.each([
    ['no body', undefined],
    ['an invalid email', { email: 'ana.example.com', password: PASSWORD }],
    ['a password under 8 characters', { email: EMAIL, password: '1234567' }],
    ['a password over 72 bytes (37 × ñ = 74 bytes)', { email: EMAIL, password: 'ñ'.repeat(37) }],
  ])('answers 400 VALIDATION for %s', async (_case, body) => {
    const { register } = setup();
    expectError(await register(body ?? {}), 400, 'VALIDATION');
  });

  it('accepts a password of exactly 72 bytes', async () => {
    const { register } = setup();
    expect((await register({ email: EMAIL, password: 'ñ'.repeat(36) })).status).toBe(201);
  });
});

describe('POST /auth/login', () => {
  it('answers 401 INVALID_CREDENTIALS with the same body for a wrong password and an unknown email', async () => {
    const { register, login } = setup();
    await register({ email: EMAIL, password: PASSWORD });

    const wrongPassword = await login({ email: EMAIL, password: 'wrong-password' });
    const unknownEmail = await login({ email: 'nobody@example.com', password: PASSWORD });

    expectError(wrongPassword, 401, 'INVALID_CREDENTIALS');
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});

describe('GET /auth/me (requireAuth)', () => {
  async function registeredUserId(register: ReturnType<typeof setup>['register']) {
    return (await register({ email: EMAIL, password: PASSWORD })).body.user.id as string;
  }

  it('answers 401 UNAUTHORIZED without a token', async () => {
    const { me } = setup();
    expectError(await me(), 401, 'UNAUTHORIZED');
    expectError(await me('Basic abc'), 401, 'UNAUTHORIZED');
  });

  it('answers 401 UNAUTHORIZED for a token signed with another secret', async () => {
    const { register, me } = setup();
    const token = jwt.sign({}, 'another-secret-that-is-32-chars-long', { algorithm: 'HS256', subject: await registeredUserId(register) });
    expectError(await me(`Bearer ${token}`), 401, 'UNAUTHORIZED');
  });

  it('answers 401 UNAUTHORIZED for a token that is not a JWT', async () => {
    const { me } = setup();
    expectError(await me('Bearer not-a-token'), 401, 'UNAUTHORIZED');
  });

  it('answers 401 UNAUTHORIZED for an expired token', async () => {
    const { register, me } = setup();
    const expired = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, TEST_JWT_SECRET, {
      algorithm: 'HS256',
      subject: await registeredUserId(register),
    });
    expectError(await me(`Bearer ${expired}`), 401, 'UNAUTHORIZED');
  });

  it('answers 401 UNAUTHORIZED for a token signed with our secret but HS384: the algorithm is pinned', async () => {
    const { register, me } = setup();
    const token = jwt.sign({}, TEST_JWT_SECRET, { algorithm: 'HS384', subject: await registeredUserId(register) });
    expectError(await me(`Bearer ${token}`), 401, 'UNAUTHORIZED');
  });

  it('answers 401 UNAUTHORIZED for a valid token whose user no longer exists', async () => {
    const { users, register, me } = setup();
    const token = (await register({ email: EMAIL, password: PASSWORD })).body.token;
    users.rows.clear();
    expectError(await me(`Bearer ${token}`), 401, 'UNAUTHORIZED');
  });
});

describe('no /auth response carries the password hash', () => {
  it('holds for every success and error response of the flow', async () => {
    const { users, bodies, register, login, me } = setup();
    const { body } = await register({ email: EMAIL, password: PASSWORD });
    await register({ email: EMAIL, password: PASSWORD });
    await login({ email: EMAIL, password: PASSWORD });
    await login({ email: EMAIL, password: 'wrong-password' });
    await me(`Bearer ${body.token}`);
    await me();

    const storedHash = [...users.rows.values()][0].passwordHash;
    expect(storedHash).toMatch(/^\$2[aby]\$10\$/);
    const serialised = JSON.stringify(bodies);
    expect(bodies).toHaveLength(6);
    expect(serialised).not.toMatch(/password_?hash/i);
    expect(serialised).not.toContain(storedHash);
    expect(serialised).not.toContain(PASSWORD);
  });
});
