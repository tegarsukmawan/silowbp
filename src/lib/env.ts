import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://postgres:postgres@localhost:5432/silowbp"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16)
    .default("development-secret-please-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional().default(""),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type ParsedEnv = z.infer<typeof envSchema>;

interface AppEnv extends Omit<ParsedEnv, "BETTER_AUTH_TRUSTED_ORIGINS"> {
  BETTER_AUTH_TRUSTED_ORIGINS: string[];
}

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
    NODE_ENV: process.env.NODE_ENV,
  });

  cachedEnv = {
    ...parsedEnv,
    BETTER_AUTH_TRUSTED_ORIGINS: parsedEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };

  return cachedEnv;
}
