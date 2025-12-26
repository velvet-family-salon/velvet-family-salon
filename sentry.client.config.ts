// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// P2 FIX: DSN moved to environment variable (NEXT_PUBLIC_SENTRY_DSN)
// BEFORE: Hardcoded DSN exposed in client bundle
// AFTER: Only loaded from env, conditional initialization
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Reduced sample rates for production (cost and privacy)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Session replay - disabled by default for privacy
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,

        // P2 FIX: Disable sending user PII by default
        sendDefaultPii: false,

        // Enable logs only in development
        enableLogs: process.env.NODE_ENV === 'development',

        // Set the environment
        environment: process.env.NODE_ENV,

        // Filter out sensitive data
        beforeSend(event) {
            // Don't send events with customer phone/email in breadcrumbs
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.filter(b =>
                    !b.message?.includes('phone') &&
                    !b.message?.includes('email')
                );
            }
            return event;
        },
    });
}

