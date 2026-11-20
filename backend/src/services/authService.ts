import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../middleware/errors.js';
import type { User, UsersRepository } from '../repositories/users.js';

/** The one algorithm we sign with and the only one requireAuth accepts (02 §4). */
export const JWT_ALGORITHM = 'HS256';

// bcryptjs is pure JS, so the host needs no native build; cost 10 is about 100 ms per hash.
const BCRYPT_COST = 10;
// No refresh token: a 7-day token is acceptable for a game with no money in it (DECISIONS.md).
const TOKEN_TTL = '7d';

export type AuthResult = { token: string; user: User };

export function authService(users: UsersRepository, jwtSecret: string) {
  function issue(user: User): AuthResult {
    const token = jwt.sign({}, jwtSecret, { algorithm: JWT_ALGORITHM, subject: user.id, expiresIn: TOKEN_TTL });
    return { token, user };
  }

  return {
    async register(email: string, password: string): Promise<AuthResult> {
      const user = await users.create(email, await bcrypt.hash(password, BCRYPT_COST));
      if (!user) throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
      return issue(user);
    },

    /**
     * An unknown email and a wrong password get the same error (02 §4). An unknown email skips
     * bcrypt, so it answers faster; not hidden, because register's 409 already tells whether an
     * email exists (DECISIONS.md).
     */
    async login(email: string, password: string): Promise<AuthResult> {
      const found = await users.findByEmail(email);
      if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      return issue({ id: found.id, email: found.email, isDemo: found.isDemo });
    },

    /** A valid token whose user no longer exists is treated like an invalid token. */
    async me(userId: string): Promise<User> {
      const user = await users.findById(userId);
      if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token');
      return user;
    },
  };
}
