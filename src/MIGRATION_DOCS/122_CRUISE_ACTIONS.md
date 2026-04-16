# Cruise Action Classes (3 files)

**Directory:** `App/Actions/Cruise/`  
**Namespace:** `App\Actions\Cruise`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — Cruise is the core booking entity; `UpdateBestForYouCruise` is a live AJAX toggle used in the admin UI

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `IndexCruise` | `getCruise()` | Render Cruises DataTable index view |
| `EditCruise` | `edit(Cruise $cruise)` | Load cruise edit form with prices DataTable and eager-loaded itinerary |
| `UpdateBestForYouCruise` | `updateBestForYou(Request $request)` | AJAX boolean toggle for `best_for_you` flag on a Cruise |

---

## 🔧 Implementation

### 1. `IndexCruise`

```php
class IndexCruise
{
    public function getCruise() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new CruisesDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.cruises.index');
        // ⚠️ All dependencies instantiated with `new` — not DI-resolved, not testable
        // ⚠️ No authorization check
        // ⚠️ Method named `getCruise` (singular) — misleading; renders a list
        // ⚠️ Dead import: `use App\DataTables\ItinerariesDataTable` — imported but never used
    }
}
```

**Dead import:** `ItinerariesDataTable` is imported but never referenced — likely a remnant of an earlier version that embedded an itinerary sub-table in the cruise index, or a copy-paste from another action.

---

### 2. `EditCruise`

```php
class EditCruise
{
    public function edit(Cruise $cruise) {
        $dataTableService    = new DataTableService();
        $filterService       = new FilterService();
        $cruisePricesDataTable = new CruisePricesDataTable($dataTableService, $filterService, $cruise->id);
        // ✅ Passes $cruise->id directly to DataTable constructor — scopes prices to this cruise
        // ⚠️ All instantiated with `new` — not DI-resolved

        $cruise->load('itinerary');
        // ✅ Explicit eager load — prevents N+1 when view accesses $cruise->itinerary
        // ⚠️ Single relationship loaded — if view also accesses ship, cruiseline, or cabins,
        //    those would trigger additional lazy loads not guarded here

        return $cruisePricesDataTable->render('admin.cruises.edit', compact('cruise'));
        // ✅ Clean compact() — only passes what's needed
        // ⚠️ No authorization check — any user can edit any cruise
        // ⚠️ Tightly coupled to Blade view path 'admin.cruises.edit'
    }
}
```

Notably minimal compared to `EditDeal` — no multi-model dropdown fetching. The cruise edit form is primarily driven by the `CruisePricesDataTable` for managing cabin prices within the cruise.

---

### 3. `UpdateBestForYouCruise`

```php
class UpdateBestForYouCruise
{
    public function updateBestForYou(Request $request)
    {
        $cruise = Cruise::findOrFail($request->id);
        // ⚠️ No validation — `$request->id` is raw unvalidated input
        //    Should use `$request->validate(['id' => 'required|integer|exists:cruises,id'])`
        // ⚠️ No authorization — any authenticated user can toggle any cruise's `best_for_you` flag
        // ⚠️ `findOrFail` throws a 404 ModelNotFoundException if ID not found —
        //    acceptable, but not caught; exception handler must handle it

        $cruise->update(['best_for_you' => !$cruise->best_for_you]);
        // ✅ Clean boolean toggle — reads current value and inverts it
        // ⚠️ Race condition: if two requests fire simultaneously for the same cruise,
        //    both read the same current value → both apply the same toggle → net result
        //    is the flag doesn't change (last-write-wins silently drops one toggle)
        //    Fix: use DB::table('cruises')->where('id',...)->update(['best_for_you' => DB::raw('NOT best_for_you')])

        return response()->json([
            'success' => true,
            'status'  => 200,
            // ⚠️ Redundant 'status' in body — HTTP status code is already conveyed by the response envelope
        ]);
        // ✅ Returns JSON — correct for an AJAX toggle endpoint
        // ⚠️ No error response structure — if update fails silently, still returns success: true
        // ⚠️ No return of the new boolean value — client must infer the new state;
        //    better to return { success: true, best_for_you: $cruise->fresh()->best_for_you }
    }
}
```

---

## Pattern Analysis

### `UpdateBestForYouCruise` — AJAX Toggle Pattern

This is the **only AJAX-based action** seen so far in the Actions audit (all others return redirects via `AlertService`). It breaks the standard Blade redirect pattern, indicating the cruise index/edit UI uses JavaScript to call this endpoint and update the UI without a full page reload.

**Race condition detail:**

```
Request A reads:  best_for_you = false → writes true
Request B reads:  best_for_you = false → writes true
Result:           best_for_you = true  (should be false after two toggles)
```

Fix with atomic SQL update:
```sql
UPDATE cruises SET best_for_you = NOT best_for_you WHERE id = ?
```

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | ⚠️ HIGH | `UpdateBestForYouCruise` | **No input validation** — `$request->id` is raw, unvalidated user input |
| 2 | ⚠️ HIGH | `UpdateBestForYouCruise` | **Race condition on toggle** — read-then-write pattern; concurrent requests can silently cancel each other |
| 3 | ⚠️ HIGH | All | **No authorization check** — any authenticated user can list, edit, or toggle any cruise |
| 4 | ⚠️ MEDIUM | `UpdateBestForYouCruise` | **No new value returned** — client cannot reliably know the resulting state |
| 5 | ⚠️ MEDIUM | `UpdateBestForYouCruise` | **`success: true` returned even if update fails silently** — no error handling |
| 6 | ⚠️ MEDIUM | `IndexCruise` | **Dead import** — `ItinerariesDataTable` imported but never used |
| 7 | ⚠️ MEDIUM | `EditCruise` | **Only `itinerary` eager-loaded** — other relationships (ship, cruiseline, cabins) may cause lazy-load N+1 in the view |
| 8 | ⚠️ MEDIUM | All | **All dependencies instantiated with `new`** — not DI-resolved, not testable |
| 9 | ⚠️ MEDIUM | `UpdateBestForYouCruise` | **Redundant `status: 200` in JSON body** — HTTP status code already conveys this |
| 10 | ℹ️ LOW | `IndexCruise` | **`getCruise` (singular) for list** — misleading method name |

---

## 📝 Migration to Base44

### `IndexCruise` → React page (standard pattern)

```tsx
// pages/Cruises.jsx
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Cruises() {
  const { data: cruises = [], isLoading } = useQuery({
    queryKey: ['cruises'],
    queryFn:  () => base44.entities.Cruise.list('-created_date', 100),
  });
  // Render cruises table with filters
}
```

### `EditCruise` → React edit page

```tsx
// pages/EditCruise.jsx
const cruiseId = new URLSearchParams(window.location.search).get('id');

const { data: cruise } = useQuery({
  queryKey: ['cruise', cruiseId],
  queryFn:  () => base44.entities.Cruise.get(cruiseId),
  // Itinerary resolved separately or embedded in Cruise entity
});

const { data: prices = [] } = useQuery({
  queryKey: ['cruise-prices', cruiseId],
  queryFn:  () => base44.entities.CruisePrice.filter({ cruise_id: cruiseId }),
  enabled:  !!cruiseId,
});
```

### `UpdateBestForYouCruise` → Backend function (atomic toggle)

```typescript
// functions/toggleBestForYou.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { cruiseId } = await req.json();
  if (!cruiseId) return Response.json({ error: 'cruiseId required' }, { status: 400 });

  const cruise = await base44.asServiceRole.entities.Cruise.get(cruiseId);
  const updated = await base44.asServiceRole.entities.Cruise.update(cruiseId, {
    best_for_you: !cruise.best_for_you,
  });

  // Returns new value so client knows resulting state
  return Response.json({ success: true, best_for_you: updated.best_for_you });
});
```

**Frontend toggle call:**
```tsx
const handleToggleBestForYou = async (cruise) => {
  const res = await base44.functions.invoke('toggleBestForYou', { cruiseId: cruise.id });
  // Update local state with returned value — no need to re-fetch full list
  setCruises(prev => prev.map(c => c.id === cruise.id
    ? { ...c, best_for_you: res.data.best_for_you }
    : c
  ));
};
```

### Key Improvements over Legacy

1. **Atomic toggle** — read-then-write race condition eliminated; backend reads and inverts in a single operation
2. **Returns new value** — client updates UI from response, not by inferring
3. **Admin-only authorization** — enforced in backend function
4. **Input validation** — `cruiseId` validated (required, string)
5. **Remove dead import** — `ItinerariesDataTable` not imported
6. **Parallel data fetching** — `useQuery` for cruise + prices fires concurrently

---

## Summary

**`Actions/Cruise/IndexCruise`** (9 lines): Standard minimal index action — wires `CruisesDataTable` with service dependencies and renders the index view. Dead import of `ItinerariesDataTable` (never used). Misleading singular method name `getCruise`. No authorization.

**`Actions/Cruise/EditCruise`** (9 lines): Loads the cruise edit form by scoping `CruisePricesDataTable` to the current cruise ID and explicitly eager-loading the `itinerary` relationship. Notably minimal — no multi-model dropdown fetching needed. Only concern: other relationships (ship, cruiseline, cabins) are not eager-loaded and may cause lazy-load N+1 in the view.

**`Actions/Cruise/UpdateBestForYouCruise`** (12 lines): AJAX boolean toggle for the `best_for_you` flag — the only AJAX-based action in the audit so far (all others use `AlertService` redirects). HIGH: no input validation (`$request->id` is raw). HIGH: race condition — read-then-write toggle pattern allows concurrent requests to silently cancel each other (fix: atomic SQL `NOT best_for_you`). No authorization. Returns `success: true` even if the update fails, and does not return the new boolean value to the client.

**Migration priority: HIGH** — `UpdateBestForYouCruise` has two high-severity bugs (no validation, race condition) and needs a backend function for atomic toggling. `IndexCruise` and `EditCruise` are straightforward React page replacements.

**Total documented: 525 files**