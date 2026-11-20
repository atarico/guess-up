import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  TWELVE_DATA_API_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
});

export type Env = z.infer<typeof schema> & { corsOrigins: string[] };

function isOrigin(entry: string): boolean {
  try {
    return new URL(entry).origin === entry;
  } catch {
    return false;
  }
}

/**
 * CORS_ORIGIN is a comma-separated list of exact origins: localhost first, the Vercel URL added
 * after the first deploy. The cors package compares entries with strict equality, so a trailing
 * slash, a path or `*` would silently match nothing; they stop the boot instead.
 */
function parseCorsOrigins(raw: string): string[] {
  const entries = raw.split(',').map((entry) => entry.trim());
  if (entries.every((entry) => entry === '')) {
    throw new Error('CORS_ORIGIN must list at least one origin.');
  }
  for (const entry of entries) {
    if (entry === '') {
      throw new Error('CORS_ORIGIN has an empty entry: two commas in a row, or a comma at either end.');
    }
    if (!isOrigin(entry)) {
      throw new Error(`CORS_ORIGIN entry "${entry}" is not an origin: expected scheme://host[:port], with no path and no trailing slash.`);
    }
  }
  return entries;
}

/** Reads and validates the environment once, at boot (02 §8). */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Name the variables, never their values: this message ends up in the host's logs.
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Missing or invalid environment variables: ${names.join(', ')}. See backend/.env.example.`);
  }
  return { ...parsed.data, corsOrigins: parseCorsOrigins(parsed.data.CORS_ORIGIN) };
}
