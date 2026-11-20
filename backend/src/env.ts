import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  TWELVE_DATA_API_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
});

export type Env = z.infer<typeof schema> & { corsOrigins: string[] };

/** Reads and validates the environment once, at boot (02 §8). */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Name the variables, never their values: this message ends up in the host's logs.
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Missing or invalid environment variables: ${names.join(', ')}. See backend/.env.example.`);
  }
  // CORS_ORIGIN is a comma-separated list: localhost first, the Vercel URL added after the first deploy.
  const corsOrigins = parsed.data.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
  return { ...parsed.data, corsOrigins };
}
