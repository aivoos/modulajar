import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
    "Network request failed",
  ],

  integrations: [
    Sentry.browserTracingIntegration({
      instrumentNavigation: true,
    }),
  ],

  serverName:
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local",
  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
});
