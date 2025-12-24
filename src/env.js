// File: src/env.js

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    AUTH_DISCORD_ID: z.string(),
    AUTH_DISCORD_SECRET: z.string(),
    NEXTAUTH_URL: z.string().url().optional(),
    DB_ADMIN_USER: z.string(),
    DB_ADMIN_PASSWORD: z.string(),
    DB_HOST: z.string(),
    DB_PORT: z.string().regex(/^\d+$/),
    DB_NAME: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    STREAMING_KEY: z.string(),
    SONGBIRD_API_KEY: z.string().optional(),
    ELECTRON_BUILD: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_SONGBIRD_API_URL: z.string().url().optional().or(z.undefined()),
    NEXT_PUBLIC_NEXTAUTH_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DB_ADMIN_USER: process.env.DB_ADMIN_USER,
    DB_ADMIN_PASSWORD: process.env.DB_ADMIN_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SONGBIRD_API_URL: process.env.NEXT_PUBLIC_SONGBIRD_API_URL,
    NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
    STREAMING_KEY: process.env.STREAMING_KEY,
    SONGBIRD_API_KEY: process.env.SONGBIRD_API_KEY,
    ELECTRON_BUILD: process.env.ELECTRON_BUILD,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
