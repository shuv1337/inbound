# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Key Environment Variables

- `NEXT_PUBLIC_APP_URL` — Public-facing URL (e.g., `https://mail.shuv.dev`)
- `INTERNAL_BASE_URL` — Internal loopback URL for server-to-self calls (e.g., `http://127.0.0.1:3000`)
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Auth secret
- `INBOUND_API_KEY` — SDK self-consumption key (bootstrap after first deploy)
- `CRON_SECRET` — Auth for cron webhook endpoints
- `SUPPORT_EMAIL`, `LEGAL_EMAIL` — Configurable contact emails

## External Dependencies (kept as-is)

- **Upstash Redis** — REST-based, no local Redis needed
- **Upstash QStash** — Scheduled email delivery
- **AWS SES** — Email sending/receiving
- **AWS S3 + Lambda** — Inbound email processing pipeline

## Package Manager

**Bun only** — never npm, yarn, or pnpm.
