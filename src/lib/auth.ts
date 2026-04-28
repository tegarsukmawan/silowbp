import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { multiSession } from "better-auth/plugins";

import { db, schema } from "@/db";

import { getEnv } from "./env";

const env = getEnv();

function resolveRequestOrigin(request?: Request) {
  if (!request) {
    return null;
  }

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    (request.url.startsWith("https://") ? "https" : "http");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

const staticTrustedOrigins = new Set([
  env.BETTER_AUTH_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...env.BETTER_AUTH_TRUSTED_ORIGINS,
]);

export const auth = betterAuth({
  appName: "Silo WBP",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origins = new Set(staticTrustedOrigins);
    const requestOrigin = resolveRequestOrigin(request);

    if (requestOrigin) {
      origins.add(requestOrigin);
    }

    return Array.from(origins);
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "Admin",
      },
      assignment: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
  plugins: [
    nextCookies(),
    multiSession({
      maximumSessions: 1,
    }),
  ],
});

export const authHandlers = toNextJsHandler(auth);
