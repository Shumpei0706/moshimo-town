# Meta integration — current implementation

## Runtime

The frontend sends request, complete layout, config, locks and display currency to `/api/companion`. Keys stay server-side. Standard `muse-spark-1.3` uses Chat Completions with real function calls, `tool_choice:auto` (the current API supports only auto), `parallel_tool_calls:false`, reasoning minimal/low and a25s request deadline. No automatic retries or Contributor switch.

1. `inspect_station`: Muse chooses a station, excluding the coffee machine when locked. Geometry enumerates valid one-station moves and offers at most36 ranked by loop distance. This is geometry, not a sales forecast.
2. `simulate_moves`: Muse selects1–3 scoped placement IDs. Each is simulated from the original layout/config using the same seed. Server checks scope, uniqueness, footprint, bounds, entrances, reachable work sides and locks.
3. `choose_move`: Muse receives actual calculated results and chooses an eligible ID or none. Eligibility requires no reduction in cups served and strictly lower total staff walking. If no candidate qualifies, the third model call is skipped.

Function names, argument keys and candidate IDs are checked independently of strict schema. Entire assistant tool-call messages and matching tool replies are retained in the conversation. The model never supplies authoritative simulated results. Candidate enumeration/selection is bounded, not a global optimum or guaranteed free-text constraint solver.

## Delivery and safety

SSE reports actual accepted/model-started/inspection/simulation/candidate/completed stages. This is application status, not chain of thought. AbortController plus request generation IDs prevent stale response application. A valid result remains an unapplied proposal until the user accepts; acceptance opens a same-seed comparison.

A persistent local-file allowance reserves3 calls durably before dispatch. Known unsent calls are refunded only on normal cleanup; dispatched failures and crash reservations remain charged. Restarts preserve usage, and an exclusive lock rejects concurrent processes. Live mode requires operator initialization and persistent storage; public live also requires HTTPS origin configuration and server authentication. This is a call allowance, not a dollar budget. Optional usage logs retain model/response IDs, token usage and duration without keys, prompts or user request text. Dispatched failures and cancellations may still incur cost; missing usage is unknown.

Explicit sample mode computes an example without Meta or prose interpretation. Live failures stay failures. The previous business/layout-generation endpoints are not exposed in the final version.

## Companion art

`muse-image-1.0` generated3 text-only original fictional adult-barista poses before runtime. No private screenshot or customer data was uploaded. Returned WebP bytes/XMP remain unchanged; manifests record model, response IDs and SHA256. A limited visual and public image-search review identified no specific existing character/logo match, but was not exhaustive reverse-image clearance. The guide is not an official Meta character and implies no endorsement.

## Data disclosure and public release boundary

Live use sends the request, layout and synthetic results to Meta. Do not enter personal customer data or business secrets. Browser storage retains language/free layout; Google Fonts supplies the font. No analytics/ad/payment SDK is included. This is an18+ planning sandbox. Server-side authentication, exact HTTPS origin checks and persistent call allowance are implemented for production preparation. A public release still needs actual hosting/reverse-proxy verification, operator/contact details, operational budget ownership, appropriate data/retention notices and final requirements review; local success does not establish worldwide legal clearance.

## Official references

- https://dev.meta.ai/docs/tool-calling
- https://dev.meta.ai/docs/image-generation
- https://dev.meta.ai/legal/terms-of-service/
- https://dev.meta.ai/legal/acceptable-use-policy/
