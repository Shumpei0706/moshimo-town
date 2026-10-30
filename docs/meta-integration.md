# Meta integration — current implementation

## Runtime

The frontend sends request, complete layout, config, locks and display currency to `/api/companion`. Keys stay server-side. Standard `muse-spark-1.3` uses Chat Completions with real function calls, `tool_choice:auto` (the current API supports only auto), `parallel_tool_calls:false`, reasoning minimal/low and a25s request deadline. No automatic retries or Contributor switch.

1. `inspect_station`: Muse chooses a station, excluding the coffee machine when locked. Geometry enumerates valid one-station moves and offers at most36 ranked by loop distance. This is geometry, not a sales forecast.
2. `simulate_moves`: Muse selects1–3 scoped placement IDs. Each is simulated from the original layout/config using the same seed. Server checks scope, uniqueness, footprint, bounds, entrances, reachable work sides and locks.
3. `choose_move`: Muse receives actual calculated results and chooses an eligible ID or none. Eligibility requires no reduction in cups served and strictly lower total staff walking. If no candidate qualifies, the third model call is skipped.

Function names, argument keys and candidate IDs are checked independently of strict schema. Entire assistant tool-call messages and matching tool replies are retained in the conversation. The model never supplies authoritative simulated results. Candidate enumeration/selection is bounded, not a global optimum or guaranteed free-text constraint solver.

## Delivery and safety

SSE reports actual accepted/model-started/inspection/simulation/candidate/completed stages. This is application status, not chain of thought. AbortController plus request generation IDs prevent stale response application. A valid result remains an unapplied proposal until the user accepts; acceptance opens a same-seed comparison.

Cloudflare public hosting reserves3 generation slots per experiment in a single persistent SQLite Durable Object before any model dispatch. The lifetime ceiling is1500 slots and the UTC-day ceiling is300; within these totals,30 lifetime and30 daily slots remain unavailable to public visitors so reviewers can still test. Dispatched failures, cancellations, skipped calls and crash reservations receive no refunds. Existing control state is migrated in place, including its3 previously consumed slots. Exact origin checks, a verified Turnstile challenge and short signed security capabilities gate Muse use; reviewer login additionally enables free text of at most200 Unicode characters. The app persists no prompt, layout, result, raw IP, user agent or provider response ID. Only aggregate controls/budgets and short-lived random replay state are stored. Rate counters use rotating HMACs in bounded runtime memory. A call allowance is not a guaranteed dollar cap; check Meta Billing separately.

The optional Node development/self-host adapter uses its existing persistent local-file allowance and HTTP Basic authentication for live production. Its optional metadata usage log is separate from public Worker hosting and is not enabled there.

Explicit sample mode computes an example without Meta or prose interpretation. Live failures stay failures. The previous business/layout-generation endpoints are not exposed in the final version.

## Companion art

`muse-image-1.0` generated3 text-only original fictional adult-barista poses before runtime. No private screenshot or customer data was uploaded. Returned WebP bytes/XMP remain unchanged; manifests record model, response IDs and SHA256. A limited visual and public image-search review identified no specific existing character/logo match, but was not exhaustive reverse-image clearance. The guide is not an official Meta character and implies no endorsement.

## Data disclosure and public release boundary

Live use sends the chosen preference (or authenticated reviewer's written preference), layout and synthetic results to Meta. Do not enter personal customer data or business secrets. The app saves only the explicit language choice in browser storage; layout auto-save and external Google Fonts requests are disabled. Older locally saved layouts are no longer read or written and can be cleared through browser site-data controls. Security cookies expire within an hour. Cloudflare processes network and challenge data, and Meta may retain API inputs under its terms. Standard mode does not use content for model training, but this is not zero retention; ZDR has not been confirmed. No analytics, ad or payment SDK is included. This is an18+ planning sandbox. Free hosting and application limits cannot guarantee availability against denial of service.

## Official references

- https://dev.meta.ai/docs/tool-calling
- https://dev.meta.ai/docs/image-generation
- https://dev.meta.ai/legal/terms-of-service/
- https://dev.meta.ai/legal/acceptable-use-policy/

## Cloudflare review adapter

Workers uses the existing named SQLite Durable Object (`ReviewGate`, `moshimo-review-global-v1`) and preserves initialization, expiry, disabled state and all consumed slots. One global experiment may run at a time, with a15-second admission cooldown. Each outbound dispatch awaits a durable SQL checkpoint and rechecks the active, disabled and expiry state. UUID replay and bounded early-cancellation tombstones are enforced. Public manual play needs no login. Muse requires a server-verified, single-use Turnstile token with exact hostname/action, a signed HttpOnly/Secure/SameSite security cookie and a five-minute experiment ticket. Reviewer login uses separate signed one-hour role cookies; it does not bypass budget or tool validation. Operator access uses a separate Bearer secret. Provider keys remain server-side.

SSE cancellation alone cannot guarantee immediate network cancellation. The frontend additionally sends an authenticated cancel message. The DO rejects further dispatch after it receives that message, while already-sent provider requests remain unknown/charged. Timeout/crash recovery never restores quota. See README for operator actions, expiry and Free-plan limitations. Neither this adapter nor its fake-fetch runtime tests establish public deployment or actual API usage.

## Public Cloudflare adapter update (October30)
Public manual play is unauthenticated; Turnstile gates every Muse request and reviewer login. Public preset preferences are canonical server-owned strings. Only a signed reviewer cookie enables bounded200-code-point free text; instructions remain untrusted data and do not change tools or validation. All layouts/config/locks/currency fields are allowlisted. No public arbitrary URLs/files/tools exist.
The same Durable Object retains prior used3 slots and initialized/disabled/expiry state. Lifetime1500 and UTC daily300 slots include a conservative30-slot reviewer reserve inside each ceiling. Every admission precharges3 without refunds, including unknown outcomes. No automatic retries. Each actual dispatch awaits durable sync; payload<=32768 UTF-8 bytes, max_tokens4096, Standard muse-spark-1.3. These bounds are engineering spending controls, not guaranteed dollar limits. Existing Node local behavior is separately documented in README.
Only aggregate budgets and bounded replay UUID/status/count/deadline are persisted. No input/layout/result/session/IP/provider response identifiers are stored. In-memory security counters are pseudonymous and reset on restart; global/day budgets do not. Cloudflare challenge/network processing and Meta retention remain external; zero retention is not confirmed. Exact operational details and secret names are in README.
