---
name: refactor-worker
description: Refactors codebase for self-hosting — removes SaaS dependencies, replaces drivers, creates config modules and deployment artifacts.
---

# Refactor Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Any feature that involves:
- Removing imports/dependencies (Autumn, Vercel, Neon)
- Replacing hardcoded URLs with config-driven values
- Creating new utility modules (config, SDK client)
- Creating deployment artifacts (Dockerfile, compose, health endpoint)
- Updating existing code to use new modules

## Work Procedure

### 1. Understand Scope

Read the feature description, preconditions, expectedBehavior, and verificationSteps carefully. Identify all files that need changes.

Before editing, grep the codebase to find ALL instances of what you're changing. Do not rely solely on the feature description — it may miss files. For example, if removing `autumn.check()`, run `rg "autumn\.check" app/ lib/` to find every call site.

### 2. Plan Changes

List all files that need modification. For each file:
- Read the current code around the change point
- Understand what the code does (don't just delete — understand the flow)
- Determine the replacement (if any)

### 3. Create New Modules First

If the feature requires creating new modules (e.g., `lib/config/app-url.ts`), create them BEFORE modifying consumers. This ensures imports work when you update other files.

### 4. Make Changes Systematically

Edit files one at a time. After each edit:
- Verify the edit is syntactically correct
- Ensure imports are updated (add new imports, remove old ones)
- Check that no functionality is accidentally removed (e.g., when removing `autumn.check()`, keep the rest of the handler logic intact)

### 5. Handle Removals Carefully

When removing a dependency like Autumn:
- Remove the import statement
- Remove the call and its error handling (`if (!check.allowed) { ... }`)
- Keep all surrounding logic intact
- If the removal changes indentation, fix it
- If removing a component/page, check for route references and navigation links

### 6. Verify

Run these commands and fix any issues:

```bash
# Typecheck
tsc --noEmit

# Lint
bun run lint
```

For removal features, also verify completeness:
```bash
# Example: verify all autumn references are gone
rg "autumn" app/ lib/ components/ --glob '!*.test.ts'
```

### 7. Manual Verification

After automated checks pass, manually review key changes:
- Read modified handler functions end-to-end to ensure logic flow is preserved
- Check that response schemas haven't changed (especially for API endpoints)
- Verify no debug code or TODO comments were left behind

## Important Conventions

- **Use `@/` path alias** for all imports — never relative paths
- **No `any` type** — Biome enforces `noExplicitAny: error`
- **Files: `kebab-case.ts`** — follow existing naming
- **No comments** unless explicitly required by the feature
- **Drizzle ORM only** — no raw SQL
- When creating env-driven config, use `process.env.VAR_NAME` with clear variable names
- When replacing hardcoded URLs, prefer deriving from a single source (e.g., `APP_URL`) over adding many env vars
- Do NOT run `bun run dev`, `bun run build`, `bunx drizzle-kit generate`, or `bunx drizzle-kit push`

## Example Handoff

```json
{
  "salientSummary": "Created lib/config/app-url.ts with APP_URL, INTERNAL_APP_URL, API_BASE_URL exports. Updated lib/auth/auth.ts to use config for baseURL, trustedOrigins, OAuth callbacks, passkey config. Replaced 9 hardcoded inbound.new references. tsc --noEmit passes, bun run lint passes. rg 'inbound.new' lib/auth/auth.ts returns 0 hits.",
  "whatWasImplemented": "Central URL config module at lib/config/app-url.ts exporting APP_URL, INTERNAL_APP_URL, API_BASE_URL, DOCS_URL, SUPPORT_EMAIL, LEGAL_EMAIL, PASSKEY_RP_ID, PASSKEY_ORIGIN. Updated lib/auth/auth.ts: removed VERCEL_ENV/VERCEL_URL/VERCEL_BRANCH_URL references, replaced baseURL with APP_URL, made trustedOrigins derive from APP_URL, updated OAuth redirectURIs to use APP_URL template, updated passkey rpID/origin from config, made magic link sender configurable.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {"command": "tsc --noEmit", "exitCode": 0, "observation": "No type errors"},
      {"command": "bun run lint", "exitCode": 0, "observation": "No lint errors"},
      {"command": "rg 'inbound\\.new' lib/auth/auth.ts", "exitCode": 1, "observation": "No matches - all hardcoded refs replaced"},
      {"command": "rg 'VERCEL_' lib/auth/auth.ts", "exitCode": 1, "observation": "No matches - all Vercel env vars removed"}
    ],
    "interactiveChecks": []
  },
  "tests": {
    "added": []
  },
  "discoveredIssues": [
    {"severity": "low", "description": "app/changelog/opengraph-image.tsx also has hardcoded inbound.new on line 32 — not in this feature's scope but should be addressed", "suggestedFix": "Update in the metadata cleanup feature"}
  ]
}
```

## When to Return to Orchestrator

- A file you need to edit doesn't exist or has been moved
- Removing a dependency causes cascading type errors in 10+ files not listed in your feature
- The feature description is ambiguous about what should replace removed code
- You discover a circular dependency that prevents the planned module structure
- `tsc --noEmit` or `bun run lint` fail with errors you cannot resolve within the feature scope
