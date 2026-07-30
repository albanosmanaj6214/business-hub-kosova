/**
 * Client-safe Turnstile config: exposes ONLY the PUBLIC site key. Never import
 * the server module (`@/lib/turnstile`, which reads the secret) from here.
 *
 * Security hotfix: we deliberately do NOT fall back to a Cloudflare test site
 * key. In production the real site key MUST be provided via
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY (baked at build). If it is absent the widget
 * renders with an empty key and login/registration cannot proceed (fail closed).
 * Development and tests set a test key in their own environment.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
