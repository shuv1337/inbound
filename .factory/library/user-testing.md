# User Testing

Testing surface, resource cost classification, and validation approach.

---

## Validation Surface

**No user testing surface available.** The app cannot run locally without external services:
- PostgreSQL database with schema applied
- Upstash Redis (rate limiting, realtime)
- Upstash QStash (scheduled sends)
- AWS SES (email sending/receiving)
- OAuth providers (GitHub, Google)

Validation relies exclusively on:
1. Scrutiny review (automated code review per feature)
2. `tsc --noEmit` (typecheck)
3. `bun run lint` (Biome lint)
4. grep-based verification (e.g., `rg "inbound\.new"` to confirm removal)

## Validation Concurrency

Not applicable — no user testing surface.

## Accepted Limitations

- Cannot verify runtime behavior (email sending, auth flows, webhook processing)
- Cannot verify Docker image builds (would require building, which needs env vars)
- User will validate functionality during actual deployment
