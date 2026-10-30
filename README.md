# Moshimo Town

**Rehearse one change before rearranging your coffee shop.**

Move five stations on a floor plan, open for one synthetic morning, then work with a Muse Spark companion to improve one station at a time. Before and after share the same visitors, arrival times, patience and clock. An isometric shop shows the actual simulation log.

[Live review app](https://moshimo-town.studio-gennai1.workers.dev/) — public manual play; Muse requests use a security challenge. Reviewer credentials separately enable short free-text preferences. English is the default, with Japanese available.

## Run

Node.js22.12+ (tested with24.22) and npm.

```sh
npm install
npm run dev
```

Open http://localhost:4318. The existing server serves frontend and API on one port. `npm test` checks the deterministic engine, layout constraints and model contract. `npm run build` builds production files and regenerates dependency notices. `npm start` serves that build locally.

## Try the loop

1. Arrange: drag or rotate the register, ingredients, cups, coffee machine and pickup station. Arrow keys move the focused station; R rotates. Invalid overlap, blocked entrances and unreachable working sides are rejected.
2. Rehearse: open08:00–10:00, watch, pause, seek or skip to close. The first challenge fixes92 visitors,70 cups of stock,one worker and¥500/cup: serve at least56 cups while keeping total staff walking at or below300m. Free studio lets you explore other assumptions outside the challenge.
3. With Muse: after a completed morning, ask for one move. Muse inspects a station, chooses up to3 valid placements to test, then selects an eligible calculated result or declines. The outline stays unapplied until you accept it.
4. Compare: replay the same morning side by side, with large cumulative walking and cups served. Inspect the actual changed trip and any newly served or newly unserved visitors. Repeat from the accepted layout.

English is the first-visit default; Japanese is available. Language changes preserve layout, replay and edited requests. Only explicit language choice is saved locally. Layouts and written preferences remain in page memory and are not automatically saved. Reduced motion starts at close; replay is optional.

## Meta’s role

- Standard `muse-spark-1.3`: actual function calls `inspect_station`, `simulate_moves`, `choose_move` through the server. At most3 model requests per experiment. If no candidate qualifies, the selection call is skipped. The numerical engine calculates outcomes independently of the model.
- `muse-image-1.0`: three original fictional adult-barista companion poses, generated before runtime. Full WebP originals and their embedded XMP provenance are retained. [Asset manifest](public/assets/companion/manifest.json).
- Progress labels show real application stages, not hidden chain of thought. The guide is not an official Meta mascot or endorsement.

Sample mode makes no Meta calls and does not interpret request text. Live errors never silently become sample success. Candidate IDs, station bounds, paths, machine locks and exactly-one-station changes are independently checked. A move qualifies only if it reduces total walking without serving fewer cups. This is a bounded candidate experiment, not exhaustive optimization; free-text preferences still require human review.

## Live setup

Copy `.env.example` to local `.env`; never commit credentials. Live mode requires `MODEL_API_KEY`, `META_MODEL=muse-spark-1.3` and an absolute `META_BUDGET_FILE` on persistent local storage. Initialize the budget once, with the same limit used by the server:

```sh
META_BUDGET_FILE=/persistent/moshimo.budget.json META_MAX_CALLS=20 node server/budget-init.mjs
```

The parent directory must exist and be writable only by the operator/server account. Initialization refuses to overwrite a file. `META_MAX_CALLS` is an allowance of model calls (default20, maximum100), **not an account-wide dollar cap**. Preserve the file across restarts and deployments. The configured limit must match its stored limit. Reservations durably charge up to3 calls before any dispatch; only known unsent calls are refunded on normal cleanup. Failed or interrupted dispatched calls remain charged. A crash conservatively retains the full reservation. Check actual Meta Billing separately.

### Production hosting preparation

Build with `npm ci && npm run build`, then `npm start`. Production reads injected environment variables only, never the checkout `.env`; development still loads `.env`. Default `HOST=127.0.0.1` remains local. Every production live startup (`npm start`, even on loopback behind a reverse proxy) requires authentication and HTTPS origin configuration. A non-loopback live listener or any configured public origin also requires production mode, an exact HTTPS origin such as `PUBLIC_ORIGIN=https://your-host.example` (no trailing slash/path), `ACCESS_USER`, and an `ACCESS_PASSWORD` of at least24 characters. Use a unique randomly generated password. All public live routes, including assets and status, require HTTP Basic authentication. Send credentials only over TLS; terminate HTTPS at a trusted reverse proxy and deny direct internet access to the Node port. Browser mutation requests additionally require the exact configured Origin; Origin is **not** authentication. Supply reviewer credentials privately, never in a public URL or repository.

`Dockerfile` builds an image with no keys, Git archive or raw regulation documents. It uses Node built-ins in production, runs as the unprivileged node user and defaults to sample mode. Inject runtime secrets through the hosting platform. Mount persistent local state owned/writable by that user; initialize via `node server/budget-init.mjs` with that same mounted volume before live startup. No deployment has been performed or Docker daemon build verified here.

**One instance, one Node process, one persistent local filesystem.** Do not run replicas, ephemeral/serverless workers, NFS/shared network mounts or rolling deployments that overlap processes. An exclusive `.lock` directory rejects a second process. Graceful shutdown releases it after requests finish; a crash leaves it locked. After verifying no process uses the state, an operator may remove only the stale lock directory—never reset/delete/recreate budget state to recover. Missing/corrupt state, mismatched limits, or persistence failure stops live usage. A write failure poisons the running budget until operator recovery. Loss or rollback of the volume cannot be detected; backing up and preserving current state is an operational requirement. Local throttling allows only one live experiment at a time; the provider may still complete a canceled request.

`POST /api/companion` streams actual stages. Editing and cancellation invalidate stale responses. Optional `META_USAGE_LOG` records provider IDs, usage and timing without prompts, credentials or request text; usage-log failure does not replace the mandatory durable budget. Publication, public access checks, operator/contact notices, retention policy and final rights review remain separate tasks.

## Assumptions and limits

This is a rehearsal under synthetic assumptions, **not measured demand, a profit forecast or professional advice**. It is intended for adult shop owners and planners aged18+ under the Meta API terms, not children.

- Floor5×4m; stations1×0.5m; four-neighbor paths avoid equipment.
- Assumed staff speed0.7m/s, visitor speed1m/s. Each identical order takes75 fixed task seconds:12 register,8 ingredients,4 cups,45 brew,6 pickup, plus walking and equipment waits.
- One or two workers, one order per worker, exclusive equipment reservations. Body collisions and corridor crowding are not modeled. Co-located visitors are grouped visually.
- Orders are admitted only when work can begin within patience and finish by10:00. This is schedule lookahead, not a calibrated abandonment model.
- Costs:¥140 per stocked cup (including unused stock),¥1,400/hour/person including owner for2 hours,¥1,800 space,¥1,200 preparation. No taxes, equipment purchase, rearrangement, permit or transport costs. Price does not change demand.
- Internal calculations use integer JPY. English display uses illustrative fixed¥150/US$1, with rounding.

Local tests and model examples do not establish real-store benefit or user-research outcomes. No guaranteed optimum, growth or contest result is claimed.

## Rights and data

[Licenses and AI-use disclosures](public/licenses.html) and generated [third-party notices](public/third-party-notices.html) describe only the current distribution. Code-based shop/people/control art is original; generated companion provenance stays intact. System fonts avoid external font requests; earlier Noto Sans JP attribution is retained. Third-party rights remain with their owners. Visual/search similarity review is limited and does not guarantee uniqueness or noninfringement.

Live requests send your instruction, floor plan and synthetic simulation information to Meta. Do not enter confidential or personal customer data. No analytics, advertising, purchase or tracking SDK is included. System fonts are used; no Google Fonts request is made. The Cloudflare adapter does not persist inputs, layouts, results, raw IPs or user agents; its security-cookie and provider-processing disclosures are linked above.

## Project documents

- [Current concept and scope](docs/concept.md)
- [Meta integration](docs/meta-integration.md)
- [Submission requirements](docs/submission-requirements.md)
- [Validation](docs/validation.md)

### Existing local preview compatibility

The running local preview is not restarted by these preparation changes. Before its next live restart, initialize a new persistent budget file outside the checkout once (choose an allowance after checking prior usage), and set `META_BUDGET_FILE` plus the matching `META_MAX_CALLS` in the local development `.env`. The existing `npm run dev` command and port4318 remain unchanged; sample mode needs no budget file. The old process-local counter cannot reconstruct historical spend, so initialization is an operator decision, not an automatic reset/migration. Production `npm start` requires environment injection rather than `.env`. No secrets or current budget were read or migrated during preparation.

## Cloudflare public demo (separate from the Node adapter)

The game and static assets need no login. Only Muse requests require server-verified Turnstile and a signed one-hour HttpOnly/Secure/SameSite security cookie. Public visitors choose an improvement preset; reviewers can sign in to enter at most 200 Unicode code points without control characters. Reviewer login also requires Turnstile. Preferences are untrusted data: the model has only the three allowlisted station-inspection/simulation/selection tools, and every result is independently validated. This reduces injection impact; it is not a claim of model immunity. Do not submit personal/customer information or confidential data.

`wrangler.jsonc` retains the existing Worker `moshimo-town`, SQLite class `ReviewGate`, migration `v1`, and fixed ID `moshimo-review-global-v1`. Never rename/delete its namespace or reset storage. `run_worker_first: true` checks the exact HTTPS origin and Host on every asset/API route; preview URLs are disabled. Public manual play remains available when Muse expires or exhausts its budget. The separate Node adapter above keeps its existing authenticated-production contract.

Vars: `PUBLIC_ORIGIN`, `REVIEW_EXPIRES_AT`, public `TURNSTILE_SITE_KEY`. Secrets: `TURNSTILE_SECRET_KEY`, `ANON_SIGNING_KEY` (at least32 random characters), `MODEL_API_KEY`, `ACCESS_USER` and `ACCESS_PASSWORD` (reviewer only, password at least24 characters), and a separate `OPERATOR_SECRET` (at least32 characters). Provision through official provider secret commands; never place secret values in args, Vite variables, Git or logs. The widget must allow only `moshimo-town.studio-gennai1.workers.dev`, action `companion`; no pre-clearance is needed. Missing verification configuration fails closed for Muse. The site key is intentionally public.

The existing initialized control, used slots, disabled state and stored expiry survive migration. The approved lifetime ceiling is1500 slots, UTC daily ceiling300; every experiment reserves3 before work, with **no refund** on failure, cancellation, fewer calls, or an uncertain outcome. Public admissions stop at aggregate1470/lifetime or270/day, leaving conservative reviewer capacity inside the same total caps. One active experiment and15-second global admission cooldown apply. In-memory keyed limits allow6 admission attempts/session/hour and12/IP/hour; verification24/IP/hour and reviewer login6/IP/hour. Maps expire within an hour and cap at4096 keys. These memory counters reset on runtime restart; persistent budgets do not. Cloudflare overwrites its trusted `CF-Connecting-IP` header at the public edge; other forwarding/client headers are ignored. The DO is reached only through the Worker binding, not a public route.

Each actual Meta dispatch follows a durable sync. Only Standard `muse-spark-1.3`, at most4096 output tokens, serialized request at most32768 UTF-8 bytes,25-second call timeout and90-second experiment timeout are allowed. No automatic provider retry. At reviewed rates, a byte-based upper-token approximation suggests around$88 for1500 maximum calls, but bytes-to-billable-tokens is not a guaranteed billing bound. This is **not a dollar or account-wide cap**. Cloudflare Free quotas are separate and abusive traffic can still impair availability; no paid-plan switch is performed by this code.

A five-minute signed experiment ticket contains a random UUID and cookie ownership. It authorizes one caller-selected, fully revalidated payload (not a stored layout hash). Reuse and early cancellation are rejected by the durable replay table. Cancel requires the matching session/ticket; a120-second cancellation-only grace covers an experiment admitted near ticket expiry. Unknown active runs stay locked until recovery; provider work may continue after abort.

Persistent tables contain aggregate controls/budgets, schema version, random experiment UUID/status/dispatch count and replay deadline only. No prompts, layouts, results, cookie/session/IP-derived IDs, provider response IDs, raw IPs or user agents are stored. DO alarms prune expired replay rows hourly, excluding unresolved active reservations; expired daily aggregates are also pruned. Inputs exist transiently while processing. Cookie identifiers and in-memory HMAC counters can be pseudonymous security data, not analytics. Cloudflare processes network/challenge data and Meta may retain API inputs; **zero retention is not confirmed**. See the bilingual [disclosure](public/licenses.html). Layout auto-save is disabled; language preference remains. Legacy keys `moshimo-floor-plan-v1` and `moshimo-floor-plan-v2` are no longer read or written; existing unique local work is not silently erased. Older local layout data can be cleared using browser site-data controls. Google Fonts requests are removed.

Operator endpoints use POST, exact Origin and a separate Bearer secret:
- `/operator/status`: aggregate state only.
- `/operator/init`: once only, from uninitialized to enabled; never use to replenish existing production state. Current deployment was already initialized and has used3 slots.
- `/operator/disable`: immediately closes admissions and aborts this application's active request. It does not refund or re-enable.
- `/operator/recover`: after the stale active deadline, marks unknown and releases the lock, without refund or re-enabling.

Local verification: `npm test`, `npm run build`, then `WRANGLER_SEND_METRICS=false node_modules/.bin/wrangler deploy --dry-run`. Workerd tests use fake secrets and intercept all Siteverify/Meta traffic. No new real API call or deployment is implied by tests. Observability is disabled; do not enable request/prompt logs. Existing Node preview command remains `npm run dev` on4318, with its own configured budget. Worker publication and real challenge/browser checks are operator tasks after source review.
