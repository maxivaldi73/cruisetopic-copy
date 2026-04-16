# Ship Action Classes (1 file)

**Directory:** `App/Actions/Provider/Ship/`  
**Namespace:** `App\Actions\Provider\Ship`  
**Type:** Single-responsibility action class (Laravel Actions pattern)  
**Priority:** LOW — thin DataTable render wrapper; no business logic

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `IndexShip` | `getIndex($cruiselineId)` | Render provider ship list DataTable scoped to a given Cruiseline |

---

## 🔧 Implementation

```php
class IndexShip
{
    public function getIndex($cruiselineId) {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new ShipDataTable($dataTableService, $filterService, $cruiselineId);
        // ⚠️ All three instantiated with `new` — not container-resolved, not testable

        $cruiseline = Cruiseline::find($cruiselineId);
        // ⚠️ No null guard — if $cruiselineId is invalid, $cruiseline is null
        //    Blade view receives null $cruiseline → potential null dereference in template
        // ⚠️ Cruiseline fetched AFTER DataTable is already constructed — order is illogical;
        //    should validate cruiseline existence before building the DataTable

        return $dataTable->render('admin.provider.ship.index', compact('cruiseline'));
        // ✅ Passes $cruiseline to view for display (breadcrumb, title, etc.)
        // ⚠️ $cruiselineId already passed to ShipDataTable constructor but NOT to the view —
        //    if the view needs the raw ID separately it must use $cruiseline->id
    }
}
```

### Comparison with `IndexSyncJob`

This class follows the same pattern as `IndexSyncJob` (`110_SYNC_JOB_ACTIONS.md`) but is even simpler — no raw DB query, no provider mapping. The shared issues (null guard, `new` instantiation, no auth) are identical across both.

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **`Cruiseline::find()` not null-guarded** — invalid `$cruiselineId` returns `null`; Blade template receives `null $cruiseline` → likely fatal rendering error |
| 2 | ⚠️ HIGH | **Cruiseline fetched after DataTable construction** — if the cruiseline doesn't exist, the DataTable is already wired with a bad ID before we discover the record is missing |
| 3 | ⚠️ MEDIUM | **All dependencies instantiated with `new`** — not container-resolved, not testable |
| 4 | ⚠️ MEDIUM | **No authorization check** — any caller can view ships for any cruiseline |
| 5 | ⚠️ MEDIUM | **`$cruiselineId` untyped** — no type hint on `getIndex()` parameter |
| 6 | ℹ️ LOW | **Method name `getIndex`** — misleading; renders a full view, not a data getter |

---

## 📝 Migration to Base44

Straightforward React page — fetches Ships filtered by `cruiseline_id` via entity SDK.

```tsx
// pages/ProviderShips.jsx
const urlParams = new URLSearchParams(window.location.search);
const cruiselineId = urlParams.get('cruiselineId');

const { data: cruiseline } = useQuery({
  queryKey: ['cruiseline', cruiselineId],
  queryFn: () => base44.entities.Cruiseline.get(cruiselineId),
  enabled: !!cruiselineId,
});

const { data: ships } = useQuery({
  queryKey: ['ships', cruiselineId],
  queryFn: () => base44.entities.Ship.filter({ cruiseline_id: cruiselineId }, '-created_date', 50),
  enabled: !!cruiselineId,
});

// Render: breadcrumb with cruiseline name, ships table
```

No backend function needed — direct entity SDK calls with admin-level page access controlled by route guards.

---

## Summary

**`Actions/Provider/Ship/IndexShip`** (12 lines): Minimal DataTable render wrapper that scopes `ShipDataTable` to a given `$cruiselineId` and passes the resolved `Cruiseline` model to the Blade view. **Critical bug:** `Cruiseline::find()` has no null guard — invalid ID results in `null` passed to the template. Logical ordering issue: DataTable is constructed before checking if the cruiseline even exists. Otherwise identical pattern to `IndexSyncJob` with the same shared issues (no auth, `new` instantiation, untyped parameter).

**Migration priority: LOW** — replaced by a simple React page with two parallel entity SDK queries (cruiseline + ships filtered by cruiseline_id).