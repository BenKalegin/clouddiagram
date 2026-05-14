# Filigree integration needs

Status of each request raised when clouddiagram set out to migrate off `@dagrejs/dagre` (initial layout) and `elkjs` (post-pass relayout) in favor of `filigree`.

**Resolved** items are kept here for the audit trail; **outstanding** items move to the bottom.

---

## Install (resolved)

Filigree is published to GitHub Packages under the `@benkalegin` scope.

`.npmrc` (already present in clouddiagram — same pattern as `@benkalegin/ui26`):
```
@benkalegin:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`package.json`:
```json
"@benkalegin/filigree-api": "^0.1.0"
```

The facade re-exports everything we need; individual sub-packages (`@benkalegin/filigree-graph`, `-hints`, `-core`, `-alg-layered`, …) are still installable directly if we want a narrower import surface later.

---

## Resolved requests

| # | Request | How it landed |
|---|---|---|
| 1 | Distribution from GitHub | Published to GitHub Packages as `@benkalegin/filigree-*` (rescoped from `@filigree/*`). `private: true` dropped, every package tagged `0.1.0`. |
| 2 | `elk.direction` on layered | Added `elk.direction` accepting `DOWN`/`RIGHT`/`UP`/`LEFT` (commit `fb2a8fb`). Implemented in core well-known-options. |
| 3 | Document pre-set port handling | `docs/interop.md` — layered respects pre-set `(x, y)` and dimensions; `IPort.side` is **not** read yet (anchored at port center). Clouddiagram's `adjustPortAlignments` post-pass stays. |
| 4 | Confirm edge bend-point shape | `docs/interop.md` — `IEdge.bendPoints` is the routed orthogonal polyline; endpoints excluded; local frame; hyperedges use `IEdge.routeSegments`; empty for straight edges. Matches elkjs. |
| 5 | `elk.edgeRouting` option | Added (`fb2a8fb`). Accepts `'OFF'` / `'ORTHOGONAL'` / `'POLYLINE'`. We can opt out of routing when our own router takes over. |
| 6 | Stable compound bounds | 2-level compound test added (commit `99d129f`). Clouddiagram can drop `computeClusterBoundsFromNodes` once we verify it on real inputs. |
| 7 | Hints in JSON shape | `IJsonGraph` gained `filigreeHints?: readonly IJsonHint[]` (commit `99d129f`). `IJsonHint` is loose (`{ kind: string; [field]: unknown }`) so the graph package stays decoupled from hints — `@benkalegin/filigree-api`'s `layout` hands them to `attachHints`. Importers can emit JSON directly without holding an `ElkGraph`. |
| 9 | Async-only? | `docs/interop.md` — `async` is a forward-compatibility contract; today algorithms are synchronous CPU-only, no workers. Idempotent. Safe to call from `Worker.onmessage` if a host wants one. |

---

## Outstanding

### 10. `hierarchyHandling: INCLUDE_CHILDREN` for layered — *blocker for rich diagrams*

Filigree's layered algorithm runs per-compound — cross-compound edges don't influence inter-cluster ordering at the parent layer. Concrete effect: a TB diagram with edges `Clients → LB → AppLayer → AWSLayer → Functions` (where each capitalized name is a subgraph cluster) lays Clients, AppLayer, AWSLayer, Functions all on the same root row instead of stacking them vertically, because at the root level filigree sees no edges between the sibling compounds.

elkjs supports this via `elk.hierarchyHandling: 'INCLUDE_CHILDREN'`, which makes the layered algorithm consider every edge across the hierarchy when ranking nodes at any level.

Two structurally-sound layout tests in clouddiagram are currently `it.skip`'d on this gap:
- `layout flows top-to-bottom: Clients above AppLayer, AppLayer above AWSLayer, AWSLayer above Functions`
- `LB node sits vertically between Clients and AppLayer clusters`

Both unskip once filigree honors cross-compound edges.

Note: filigree's per-compound layouts ARE correct (members positioned within their cluster's bounds). It's only the inter-cluster ranking at the parent level that's missing.

### 8. Document `elk.direction` × hint interaction

After #2 landed, this is no longer hypothetical. `OrderBefore('a', 'b')` means "a sits left of b in the layer" — what does "left of" become when `elk.direction` is `RIGHT` (LR) and layers run column-wise? Either:

- "left of" stays absolute (a sits left of b in screen space), regardless of layer orientation, *or*
- "left of" becomes "earlier within the layer" (so for direction=RIGHT it means "above b within the column").

Pick a definition and document it in `docs/hints.md`. Same question for `Group` packing direction.

Clouddiagram needs this nailed down before emitting `orderBefore` from importers, otherwise the source-order → hint translation has to depend on the diagram's direction in a way we'd have to reverse-engineer from tests.

---

## Next step on the clouddiagram side

Once `pnpm install` resolves `@benkalegin/filigree-api`, start the migration sequence from `docs/layout-engine-design.md` / the chat plan:

1. New `src/features/layout/filigreeLayout.ts` adapter — same signature as `applyElkLayout`, internally calls `layout(json)` from `@benkalegin/filigree-api`.
2. Swap `applyElkLayout` → `applyFiligreeLayout` inside `elkRelayout.ts`. Delete `elkLayout.ts` and `elkjs` from `package.json`.
3. Replace dagre in `autoLayout.ts` with a filigree call; collapse the dagre→elk two-pass into a single filigree pass.
4. Wire up `OrderBefore`/`Group` hints from importers via the new `filigreeHints` JSON field — pending #8 above.
5. Once everything's green, remove `@dagrejs/dagre` from `package.json`.
