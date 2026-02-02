# REREAD -- Audit & Testing Plan

> Generated 2026-02-01 -- Comprehensive codebase review + testing strategy

---

## Project Overview

**Re-Reader** is a mobile vocabulary-building companion for readers. Users search for books (via Open Library), track reading status, save words with definitions/context, and view stats.

| Layer | Technology |
|---|---|
| Frontend | React Native 0.81.5 via Expo SDK 54, expo-router v5 |
| Backend | Convex (serverless reactive DB + cloud functions) |
| Auth | `@convex-dev/auth` (password-based) |
| External Data | Open Library API |
| Package Manager | Bun workspaces |
| Language | TypeScript 5.9.x |

### File Structure

```
reread/
  apps/
    mobile/                  (@reread/mobile -- Expo app)
      app/
        _layout.tsx          Root layout + auth gate
        (auth)/
          sign-in.tsx        Email/password sign-in
          sign-up.tsx        Registration form
        (tabs)/
          _layout.tsx        5-tab navigator
          index.tsx          Home -- book list + word modals (499 lines)
          books.tsx          My Books -- filtered list
          words.tsx          My Words -- search/filter
          search.tsx         Open Library search
          profile.tsx        User stats + sign-out
        book/
          [id].tsx           Book detail + word management (420 lines)
      lib/
        api.ts               Re-exports from @reread/convex
        constants.ts         STATUS_CONFIG, formatDate, ACCENT color
  packages/
    convex/                  (@reread/convex -- backend functions)
      convex/
        schema.ts            8 tables + auth tables
        auth.ts              Password provider + profile callback
        users.ts             User CRUD
        books.ts             Book search (Open Library) + catalog
        words.ts             Word CRUD + likes
        userBooks.ts         User-book relationships + enrichment
        clearAll.ts          Dev utility -- wipe all tables
```

---

## Audit Findings

### CRITICAL -- Runtime failures or security breaches

| ID | Issue | File:Line | Impact |
|---|---|---|---|
| C1 | Hardcoded Convex URL fallback -- if env var missing, all users hit dev backend | `_layout.tsx:8` | Data leak / wrong environment |
| C2 | `CONVEX_DEPLOY_KEY` in `apps/mobile/.env` -- mobile `.gitignore` only ignores `.env*.local`, not `.env`; root `.gitignore` catches it but the layering is fragile | `apps/mobile/.env:1` | Full admin access to Convex project if leaked |
| C3 | No rate limiting on auth endpoints -- brute-force password attacks possible at Convex throughput limits | `auth.ts` | Account compromise |
| C4 | `clearAll.ts` has no environment guard -- `internalMutation` that wipes all 8 tables could be accidentally exposed | `clearAll.ts:20-34` | Total data loss |

**Status:**

- [ ] C1 -- Remove hardcoded fallback, fail explicitly if env var missing
- [ ] C2 -- Add `.env` to `apps/mobile/.gitignore`, rotate deploy key
- [ ] C3 -- Add `@convex-dev/ratelimiter` to auth flow
- [ ] C4 -- Add environment check or delete `clearAll.ts`

---

### HIGH -- Architecture issues, data integrity risks

| ID | Issue | File:Line | Impact |
|---|---|---|---|
| H1 | Denormalized counters have no consistency guarantees; `userBooks.remove` deletes words but doesn't decrement `user.stats.wordsCount` per deleted word | `userBooks.ts:165-210`, `words.ts:43-57` | Counter drift over time |
| H2 | `enrichUserBook` loads ALL word documents just to count them -- called per-book in `listMine` via `Promise.all` | `userBooks.ts:16-21` | O(books * words) document reads per home screen load; expensive at scale |
| H3 | `listMine` fetches all books then filters by status in JS -- should use compound index `["userId", "status"]` | `userBooks.ts:242-244` | Wasted reads, slower queries |
| H4 | `any` types in `enrichUserBook` ctx parameter and `withIndex` callback | `userBooks.ts:9,19` | TypeScript safety defeated |
| H5 | No `eas.json` -- locked into Expo Go, can't create dev/preview/production builds | Missing file | No path to App Store, no push notifications, no custom native modules |
| H6 | No linting or formatting (no ESLint, Prettier, or Biome) | Missing config | Code quality regressions go undetected |
| H7 | Monolithic screens (499 lines, 420 lines) with no shared component library | All screens | Untestable, duplicated UI code |

**Status:**

- [ ] H1 -- Fix `userBooks.remove` to decrement word counts; consider a reconciliation job
- [ ] H2 -- Replace `.collect().length` with maintained counter or Convex aggregate
- [ ] H3 -- Add `by_user_status` compound index, use it in `listMine`
- [ ] H4 -- Type `enrichUserBook` ctx properly using Convex's `QueryCtx`
- [ ] H5 -- Add `eas.json` with development/preview/production profiles
- [ ] H6 -- Add ESLint + Prettier (or Biome) configuration
- [ ] H7 -- Extract shared components: BookCard, WordCard, StatusBadge, Modal wrappers

---

### MEDIUM -- Code quality, performance, DX

| ID | Issue | File:Line | Impact |
|---|---|---|---|
| M1 | Tab bar uses emoji `Text` instead of `@expo/vector-icons` | `(tabs)/_layout.tsx:20-62` | Looks unprofessional, inconsistent across platforms |
| M2 | `listMine` accepts `status: v.optional(v.string())` -- should validate against status union | `userBooks.ts:228` | Invalid status values pass validation |
| M3 | No pagination -- all queries use `.collect()` loading everything | All query files | Performance degrades linearly with data |
| M4 | `words.listMine` does N+1: fetches all words then `ctx.db.get(bookId)` per word | `words.ts:180-188` | Slow for users with many words |
| M5 | `books.search` action has no error handling for Open Library API failures | `books.ts:7-37` | Unhandled promise rejection on network error |
| M6 | No `KeyboardAvoidingView` in Add Word modal | `index.tsx:238-289` | Keyboard covers inputs on small screens |
| M7 | Local ad-hoc types instead of importing from Convex generated types | `index.tsx:32-43`, `words.tsx:14-25`, `search.tsx:17-24` | Type drift from actual schema |
| M8 | `book/[id].tsx` receives `id` as string from params, needs `Id<"userBooks">` | `book/[id].tsx` | Implicit cast, fragile |
| M9 | No offline support or error boundaries -- network failure = white screen | All screens | Poor UX on unreliable connections |
| M10 | No Turborepo despite monorepo -- root scripts use `cd apps/mobile && ...` | Root `package.json` | No caching, no parallel tasks, no dependency graph |
| M11 | `follows`, `badges`, `userBadges` tables in schema but completely unused | `schema.ts:97-122` | Dead schema, confusing for new contributors |
| M12 | `users.create` mutation exists but is never called (auth profile callback handles it) | `users.ts:29-71` | Dead code |

**Status:**

- [ ] M1 -- Replace emoji tabs with `@expo/vector-icons`
- [ ] M2 -- Change `v.optional(v.string())` to `v.optional(v.union(...))`
- [ ] M3 -- Add `.paginate()` to queries, implement infinite scroll on frontend
- [ ] M4 -- Batch book lookups or denormalize `bookTitle`/`bookAuthor` onto words
- [ ] M5 -- Add try/catch with user-friendly error in `books.search`
- [ ] M6 -- Wrap Add Word modal in `KeyboardAvoidingView`
- [ ] M7 -- Import types from `@reread/convex/dataModel` instead of defining locally
- [ ] M8 -- Validate/cast `id` param properly
- [ ] M9 -- Add React Error Boundaries + offline detection
- [ ] M10 -- Add Turborepo or switch to Bun script orchestration
- [ ] M11 -- Comment or remove unused tables until ready to implement
- [ ] M12 -- Remove dead `users.create` mutation

---

### LOW -- Cleanup, polish

| ID | Issue | File:Line | Impact |
|---|---|---|---|
| L1 | `react-native-web@~0.19.13` may conflict with React 19 / RN 0.81 | `mobile/package.json` | Web build may fail |
| L2 | No `.nvmrc` or `engines` field to pin Node version | Root | Works-on-my-machine issues |
| L3 | Duplicate `bun.lock` in root and `apps/mobile` | Both dirs | Potential version conflicts |
| L4 | `clearAll.ts` references `authRateLimits` table that may not exist | `clearAll.ts:24` | Runtime error if called |
| L5 | `Date.now()` everywhere, no timezone consideration | All mutations | Inconsistent timestamps across timezones |
| L6 | No custom splash screen configuration | `app.json` | Generic Expo splash on launch |
| L7 | `AUDIT.md` is stale -- refers to Phase 1 issues already fixed | Root | Misleading documentation |

**Status:**

- [ ] L1 -- Upgrade or remove `react-native-web`
- [ ] L2 -- Add `.nvmrc` with Node 22.x
- [ ] L3 -- Remove nested `bun.lock`
- [ ] L4 -- Fix or remove `clearAll.ts`
- [ ] L5 -- Consider ISO timestamps or explicit timezone handling
- [ ] L6 -- Configure splash screen assets
- [ ] L7 -- Replace `AUDIT.md` with this plan

---

## Testing Plan

### Research: What T3 Turbo Does

After thorough analysis, **create-t3-turbo has zero test infrastructure**. No Jest, Vitest, Detox, Maestro, Playwright -- nothing. Their CI pipeline runs only:

| Job | Tool | Purpose |
|---|---|---|
| `lint` | ESLint + Sherif | Code quality + workspace validation |
| `format` | Prettier | Code style consistency |
| `typecheck` | TypeScript `tsc --noEmit` | Type safety |

Their quality assurance strategy relies entirely on static analysis + end-to-end type safety (tRPC + Zod + strict TypeScript). This is a deliberate choice for a starter template.

**What we CAN learn from T3 Turbo:**

| Pattern | Their Approach | Our Takeaway |
|---|---|---|
| Metro config | `expo/metro-config` + custom cache in `node_modules/.cache/metro` | Add metro.config.js for monorepo support |
| EAS builds | 3 profiles: `development` (device), `preview` (simulator), `production` | Copy this pattern for our eas.json |
| CI structure | 3 parallel jobs with Turborepo remote caching | Model our future CI on this |
| TypeScript | `strict: true` + `noUncheckedIndexedAccess` | Already have `strict: true`, should add `noUncheckedIndexedAccess` |
| Turbo tasks | Well-defined task graph with `dependsOn` chains | Add when we set up Turborepo |

---

### Testing Strategy: 3 Phases

#### Phase 1: Foundation -- Get on iPhone + Unit Tests

**Goal:** Physical device testing + backend test coverage

| Step | What | Tool | Priority |
|---|---|---|---|
| 1.1 | Add `eas.json` with dev/preview/production profiles | EAS CLI | HIGH |
| 1.2 | Create iOS development build | `eas build --platform ios --profile development` | HIGH |
| 1.3 | Add `metro.config.js` for monorepo support | `expo/metro-config` | HIGH |
| 1.4 | Add Vitest + `convex-test` for backend function tests | Vitest 3.x + convex-test | HIGH |
| 1.5 | Write tests for: auth flow, word CRUD, counter consistency, cascade deletes | convex-test | HIGH |
| 1.6 | Add React Native Testing Library for component tests | @testing-library/react-native | MEDIUM |

**EAS Configuration (eas.json):**
```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "base": {
      "node": "22.12.0",
      "bun": "1.2.0",
      "ios": { "resourceClass": "m-medium" }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "extends": "base",
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "extends": "base"
    }
  }
}
```

**Test file structure:**
```
packages/
  convex/
    convex/
      __tests__/
        words.test.ts        Word CRUD, counter updates, cascade deletes
        userBooks.test.ts     Add/remove books, counter consistency
        users.test.ts        Profile creation via auth, updates
        auth.test.ts         Password validation, rate limiting
apps/
  mobile/
    __tests__/
      components/
        BookCard.test.tsx
        WordCard.test.tsx
      screens/
        Home.test.tsx
        Search.test.tsx
```

#### Phase 2: E2E Testing on Device

**Goal:** Automated user flow testing on physical iPhone

| Step | What | Tool | Priority |
|---|---|---|---|
| 2.1 | Install Maestro CLI | `brew install maestro` | HIGH |
| 2.2 | Write core user flow: sign-up -> search -> add book -> save word -> view words | Maestro YAML | HIGH |
| 2.3 | Write auth flow: sign-in, sign-out, invalid credentials | Maestro YAML | MEDIUM |
| 2.4 | Write edge cases: empty states, remove book cascade, status changes | Maestro YAML | MEDIUM |

**Maestro flow structure:**
```
.maestro/
  flows/
    auth/
      sign-up.yaml
      sign-in.yaml
      sign-out.yaml
    books/
      search-and-add.yaml
      change-status.yaml
      remove-book.yaml
    words/
      add-word.yaml
      edit-word.yaml
      delete-word.yaml
    smoke/
      full-flow.yaml          Complete happy path
```

**Example Maestro flow (`smoke/full-flow.yaml`):**
```yaml
appId: com.reread.mobile
---
- launchApp
# Sign up
- tapOn: "Create an account"
- tapOn:
    id: "username-input"
- inputText: "testuser_${Date.now()}"
- tapOn:
    id: "email-input"
- inputText: "test_${Date.now()}@example.com"
- tapOn:
    id: "password-input"
- inputText: "testpassword123"
- tapOn: "Create Account"
# Verify home screen
- assertVisible: "No Books Yet"
# Search for a book
- tapOn: "Search"
- tapOn:
    id: "search-input"
- inputText: "The Great Gatsby"
- assertVisible: "F. Scott Fitzgerald"
# Add book
- tapOn: "Add"
- assertVisible: "Reading"
# Navigate home
- tapOn: "Home"
- assertVisible: "The Great Gatsby"
# Add a word
- tapOn: "+ Word"
- tapOn:
    id: "word-input"
- inputText: "supercilious"
- tapOn:
    id: "definition-input"
- inputText: "behaving as if one is superior to others"
- tapOn: "Save Word"
- assertVisible: "supercilious"
```

#### Phase 3: CI/CD Integration

**Goal:** Automated quality gates on every PR

| Step | What | Tool | Priority |
|---|---|---|---|
| 3.1 | Add GitHub Actions workflow: lint + typecheck + unit tests | GitHub Actions | HIGH |
| 3.2 | Add Turborepo with `test` task | Turborepo | MEDIUM |
| 3.3 | Add Maestro Cloud for automated E2E on PRs | Maestro Cloud + EAS | LOW |
| 3.4 | Add EAS Update for OTA preview deployments | expo-updates | LOW |

**CI Workflow (`.github/workflows/ci.yml`):**
```yaml
name: CI
on:
  pull_request:
    branches: ["*"]
  push:
    branches: ["main"]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run typecheck

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test
```

---

## Recommended Execution Order

| Order | Items | Effort | Reason |
|---|---|---|---|
| 1 | C1, C2, C3, C4 | ~2 hours | Security/reliability must come first |
| 2 | H5 (eas.json) | ~30 min | Unblocks iPhone testing |
| 3 | Phase 1 Testing (1.1-1.5) | ~4 hours | Backend test coverage + dev build |
| 4 | H1, H2, H3 | ~3 hours | Data integrity + performance (now testable) |
| 5 | H6 (linting) | ~1 hour | Catches issues going forward |
| 6 | H4, H7 | ~4 hours | TypeScript safety + component extraction |
| 7 | M1-M12 | ~6 hours | Code quality improvements |
| 8 | Phase 2 Testing (2.1-2.4) | ~4 hours | E2E flows on device |
| 9 | Phase 3 Testing (3.1-3.4) | ~3 hours | CI/CD automation |
| 10 | L1-L7 | ~2 hours | Final cleanup |

**Total estimated effort: ~30 hours**

---

## Summary Table

| Severity | Count | Status |
|---|---|---|
| Critical | 4 | All pending |
| High | 7 | All pending |
| Medium | 12 | All pending |
| Low | 7 | All pending |
| **Total** | **30** | **0 complete** |


[✓] 
M1: Replace emoji tab icons with @expo/vector-icons
[✓] 
M3: Add .take() caps to all queries as pagination safeguard
[•] 
M4: Fix words.listMine N+1 -- batch book lookups
[ ] 
M5: Add error handling to books.search action
[ ] 
M6: Add KeyboardAvoidingView to Add Word modals
[ ] 
M7: Replace ad-hoc types with Convex generated types
[ ] 
M8: Validate/cast id param in book/[id].tsx
[ ] 
M9: Add error boundaries + offline detection
[ ] 
M10: Add Turborepo with proper task graph
[ ] 
M11: Remove unused follows/badges/userBadges tables from schema
[ ] 
L1: Fix react-native-web version
[ ] 
L2: Add .nvmrc with Node 22
[ ] 
L3: Remove duplicate bun.lock
[ ] 
L5: Standardize timestamps
[ ] 
L6: Configure splash screen
[ ] 
L7: Delete stale AUDIT.md

MEDIUM
| ID | Issue | File:Line | Fix |
|---|---|---|---|
| M1 | Tab bar uses emoji Text instead of proper icon library | (tabs)/_layout.tsx:20-62 | Switch to @expo/vector-icons |
| M2 | listMine accepts v.optional(v.string()) | userBooks.ts:228 | Done (fixed in H4 -- now uses statusValidator) |
| M3 | No pagination -- all queries use .collect() | All query files | Add .paginate() + infinite scroll |
| M4 | words.listMine N+1: fetches all words then db.get(bookId) per word | words.ts:180-188 | Batch book lookups or denormalize onto words |
| M5 | books.search has no error handling for Open Library API failures | books.ts:7-37 | Add try/catch with user-friendly error |
| M6 | No KeyboardAvoidingView in Add Word modal | index.tsx:238-289 | Wrap modal in KeyboardAvoidingView |
| M7 | Local ad-hoc types instead of Convex generated types | index.tsx:32-43, words.tsx:14-25, search.tsx:17-24 | Import from @reread/convex/dataModel |
| M8 | book/[id].tsx receives id as string, needs Id<"userBooks"> | book/[id].tsx:29 | Validate/cast param properly |
| M9 | No offline support or error boundaries | All screens | Add React Error Boundaries + offline detection |
| M10 | No Turborepo despite monorepo -- root scripts use cd && ... | Root package.json | Add Turborepo or Bun script orchestration |
| M11 | follows, badges, userBadges tables defined but completely unused | schema.ts:97-122 | Comment out or remove until ready |
| M12 | users.create mutation exists but never called | users.ts:29-71 | Done (removed in H7) |
LOW
| ID | Issue | File:Line | Fix |
|---|---|---|---|
| L1 | react-native-web@~0.19.13 may conflict with React 19 / RN 0.81 | mobile/package.json | Upgrade or remove |
| L2 | No .nvmrc or engines field to pin Node version | Root | Add .nvmrc with Node 22.x |
| L3 | Duplicate bun.lock in root and apps/mobile | Both dirs | Remove nested lockfile |
| L4 | clearAll.ts references authRateLimits table | clearAll.ts:24 | Done (file deleted in C4) |
| L5 | Date.now() everywhere, no timezone consideration | All mutations | Consider ISO timestamps |
| L6 | No custom splash screen configuration | app.json | Configure splash assets |
| L7 | AUDIT.md is stale -- refers to fixed Phase 1 issues | Root | Replace with PLAN.md or delete |
