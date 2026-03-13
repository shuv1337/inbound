# Architecture

Architectural decisions, patterns discovered during the mission.

**What belongs here:** Key patterns, module relationships, design decisions.

---

## App Structure

- `app/api/e2/` — Primary Elysia API (mounted via Next.js catch-all route)
- `app/api/webhooks/` — Webhook handlers (QStash, cron jobs)
- `app/api/inbound/` — Inbound email webhook from AWS Lambda
- `lib/` — Shared server-side libraries
- `emails/` — React email templates (transactional, rendered at runtime)
- `components/` — React components (some generate email HTML at runtime)

## Self-Hosting Config Pattern

Central config module: `lib/config/app-url.ts`
- All public URLs derive from `APP_URL` (env: `NEXT_PUBLIC_APP_URL`)
- Internal server-to-self calls use `INTERNAL_APP_URL` (env: `INTERNAL_BASE_URL`)
- Email sender addresses use configurable domain
- Passkey config derives from APP_URL hostname

Shared SDK client: `lib/inbound-client.ts`
- Single `getInboundClient()` function
- Uses `INTERNAL_APP_URL` to avoid tunnel hairpinning
- All runtime `new Inbound()` calls replaced with this

## Database

- Drizzle ORM with `node-postgres` driver (migrated from Neon HTTP)
- Schema: `lib/db/schema.ts`
- Config: `drizzle.config.ts`

## Key Conventions

- `@/` path alias for all imports
- `kebab-case.ts` file naming
- No comments unless explicitly needed
- Biome lint with `noExplicitAny: error`
