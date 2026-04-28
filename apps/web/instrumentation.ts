import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 1.0,
  serverName:
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local",
  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
});