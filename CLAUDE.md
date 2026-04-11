# Dine Mauritius — Claude Code Guidelines

> Inspired by Andrej Karpathy's observations on LLM coding pitfalls.

## Project Overview

**Dine Mauritius** is a Next.js 16 / React 19 swipe-first restaurant discovery PWA for Mauritius.
- Data source: Google Places API (nearby search + place details)
- Storage: Upstash Redis (via `@upstash/redis`)
- Styling: Tailwind CSS v4 + shadcn/ui
- Design language: warm Claude/Anthropic aesthetic — see `docs/design.md`
- Product shape: restaurant swipe deck first, saved shortlist second
- Docs and design files live in `docs/`

### Key files
| Path | Purpose |
|------|---------|
| `app/api/sync/route.ts` | Syncs restaurants from Google Places into Redis |
| `app/api/restaurants/route.ts` | Lists/filters restaurants from Redis |
| `app/api/restaurants/[id]/route.ts` | Fetches single restaurant details (Redis → Google fallback) |
| `lib/redis.ts` | Upstash Redis client + key constants |
| `lib/types.ts` | Shared TypeScript types |
| `docs/design.md` | Full design system reference (colors, typography, components) |
| `docs/dine-mauritius-ux-research.md` | UX, branding, and MVP product rationale |

### Architecture decisions
- **Sync stores only nearby-search data** (not full details) to stay within Vercel's serverless timeout.
- **Details are fetched lazily**: when a user opens a restaurant modal, `[id]/route.ts` checks Redis first, then calls Google Places on demand and caches the result.
- **Incremental storage**: sync writes to Redis after each district so partial results survive a timeout.

---

## The Four Principles

### 1. Think Before Coding
State assumptions explicitly. Don't pick an interpretation silently.

- If a request is ambiguous, name the ambiguity and ask rather than guess.
- Present tradeoffs before implementing non-trivial changes.
- Push back if a simpler path exists.
- Stop and surface confusion — don't run with wrong assumptions.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios (trust internal guarantees).
- If 100 lines could be 30, prefer 30.
- Test: would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes
Touch only what you must.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style (Tailwind classes, file structure, naming conventions).
- If you notice unrelated dead code, mention it — don't delete it.
- Every changed line should trace directly to the user's request.
- Remove imports/variables made unused by YOUR changes; leave pre-existing dead code alone.

### 4. Goal-Driven Execution
Define success criteria before coding. Verify after.

| Instead of... | Do this... |
|--------------|-----------|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Reproduce the bug, verify reproduction, then fix" |
| "Refactor X" | "Ensure behavior is identical before and after" |

For multi-step tasks, state a brief plan first:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

---

## Project-Specific Rules

- **Google Places API**: Uses Places API (Old) — `nearbysearch` and `place/details`. The API key must have **Places API** enabled in Google Cloud Console.
- **Vercel timeouts**: Hobby plan = 10s default, 60s max. Add `export const maxDuration = 60` to long-running routes. Never do N×M API calls in a single serverless request.
- **Redis keys**: All defined in `lib/redis.ts` `REDIS_KEYS`. Don't hardcode key strings.
- **Design**: Always follow `docs/design.md`. Use warm neutrals, Georgia/serif for headings, parchment backgrounds — never cool blue-grays.
- **Interaction model**: Discovery starts on the restaurant swipe deck. Saved restaurants and filters support that core flow.
- **Types**: All shared types in `lib/types.ts`. Don't duplicate type definitions.
- **Images**: Google Maps photo URLs require the `key` param. They're allowlisted in `next.config.mjs`.

---

## Docs Folder

All project documentation, design specs, and architectural notes belong in `docs/`.

| File | Contents |
|------|---------|
| `docs/design.md` | Full UI/UX design system (colors, typography, components, do's & don'ts) |

---

## What NOT to Do

- Don't fetch full Place Details for every restaurant during sync — it causes timeouts.
- Don't store all data at the end of a loop — store incrementally so partial results survive.
- Don't use cool blue-grays anywhere in the UI — see `docs/design.md`.
- Don't add features, refactor, or "improve" code beyond what was asked.
- Don't add error handling for internal code paths that can't fail.
