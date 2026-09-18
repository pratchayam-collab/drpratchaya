/// <reference types="@astrojs/cloudflare/types.d.ts" />

/** Used by SEO utilities and server modules. */
type CloudflareEnv = Env;

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  MAGIC_LINK_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  CLINIC_NOTIFY_EMAIL?: string;
}

declare namespace Cloudflare {
  interface Env {
    TURNSTILE_SECRET_KEY?: string;
    MAGIC_LINK_SECRET?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    CLINIC_NOTIFY_EMAIL?: string;
  }
}

declare module 'cloudflare:workers' {
  export const env: Env;
}
