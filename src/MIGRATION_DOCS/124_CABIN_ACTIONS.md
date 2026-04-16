# Cabin Action Classes (6 files)

**Directory:** `App/Actions/Cabin/`  
**Namespace:** `App\Actions\Cabin`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — Cabin is a core inventory entity; mapping and experience assignment actions perform **bulk cross-cabin updates** scoped to an entire cruiseline, not just a single record

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `EnableToggle` | `updateEnabled(Request $request)` | AJAX boolean toggle for `enabled` flag on a single Cabin |
| `IndexCabinMapping` | `getCabin()` | Render CabinMapping DataTable index view |
| `RemoveCabinExperience` | `handle(Request $request)` | Bulk-clear `experience_id` on all matching cabins across a cruiseline |
| `RemoveCabinMapping` | `removeCabinMapping(Request $request)` | Bulk-clear `type` on all matching cabins across a cruiseline |
| `SetCabinExperience` | `handle(Request $request)` | Bulk-set `experience_id` on all matching cabins across a cruiseline |
| `SetCabinMapping` | `setCabinMapping(Request $request)` | Bulk-set `type` (mapping) on all matching cabins across a cruiseline (only unmapped) |

---

## 🔧 Implementation

### 1. `EnableToggle`

```php
class EnableToggle
{
    public function updateEnabled(Request $request)
    {
        $cabin = Cabin::findOrFail($request->id);
        // ⚠️ No input validation — $request->id is raw unvalidated input
        // ⚠️ No authorization — any authenticated user can toggle any cabin

        $cabin->update(['enabled' => !$cabin->enabled]);
        // ✅ Simple boolean toggle
        // ⚠️ Race condition: same read-then-write pattern as UpdateBestForYouCruise —
        //    concurrent requests can silently cancel each other
        // Fix: DB::table('cabins')->where('id',...)->update(['enabled' => DB::raw('NOT enabled')])

        return response()->json([
            'success' => true,
            'status'  => 200,
            // ⚠️ Redundant 'status' in body — HTTP status code already conveys this
            // ⚠️ New boolean value not returned — client must infer resulting state
        ]);
    }
}
```

Identical pattern to `UpdateBestForYouCruise` (documented in `122_CRUISE_ACTIONS.md`): AJAX toggle with the same race condition and missing return value.

---

### 2. `IndexCabinMapping`

```php
class IndexCabinMapping
{
    public function getCabin()
    {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new CabinMappingDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.cabins.mapping.index');
        // ⚠️ All dependencies instantiated with `new` — not DI-resolved, not testable
        // ⚠️ No authorization check
        // ⚠️ Method named `getCabin` (singular) — misleading; renders a mapping list
        // ✅ Dead import: `use App\Models\Itinerary` in EnableToggle (wrong file context)
    }
}
```

Standard minimal Index action — identical pattern to `IndexCruise`, `IndexDeal`, etc.

---

### 3. Bulk Cabin Update Pattern — `RemoveCabinExperience`, `RemoveCabinMapping`, `SetCabinExperience`, `SetCabinMapping`

All four share the same structural pattern — documented together:

```php
// Canonical pattern (SetCabinMapping shown; others differ only in field + filter):
class SetCabinMapping
{
    public function setCabinMapping(Request $request)
    {
        try {
            DB::beginTransaction();

            // Step 1: Load the "seed" cabin with its ship relationship
            $cabin = Cabin::with('ship')->findOrFail($request->input('id'));
            // ✅ Uses findOrFail — 404 if ID not found
            // ✅ Eager-loads 'ship' — avoids lazy load in the guard below
            // ⚠️ No input validation — $request->input('id') and 'selectedId' are raw unvalidated input
            // ⚠️ No authorization check

            // Step 2: Guard — cabin must have a ship with a cruiseline
            if (!$cabin->ship || !$cabin->ship->cruiseline_id) {
                DB::rollBack();
                return false;
                // ✅ Null guard for missing ship/cruiseline — safe
                // ⚠️ Returns false (boolean) not an HTTP response — controller must handle this
                //    If controller does not check return value, false is silently discarded
                // ⚠️ `DB::rollBack()` here is unnecessary — no writes have been made yet at this point
            }

            // Step 3: Bulk update all cabins matching cruiseline + category_code + name
            $updated = Cabin::whereHas('ship', function ($query) use ($cabin) {
                    $query->where('cruiseline_id', $cabin->ship->cruiseline_id);
                })
                ->where('category_code', $cabin->category_code)
                ->where('name', $cabin->name)
                ->whereNull('type')                             // SetCabinMapping only — skips already-mapped
                ->update(['type' => $request->input('selectedId')]);
            // ✅ KEY FEATURE: bulk update scoped to ALL cabins in the same cruiseline
            //    sharing the same category_code AND name — not just the clicked cabin
            //    This is the core "map once, apply everywhere" business logic
            // ⚠️ N+1 via subquery: whereHas generates a correlated subquery per row
            //    A join would be more efficient for large datasets
            // ⚠️ 'selectedId' is unvalidated — no check that it's a valid Experience/Type ID
            //    Could set experience_id/type to an arbitrary string or FK that doesn't exist

            // Step 4: Guard — at least one cabin must have been updated
            if ($updated === 0) {
                DB::rollBack();
                return false;
                // ✅ Guards against the case where no matching cabins are found
                // ⚠️ SetCabinMapping: $updated === 0 could also mean ALL matching cabins
                //    were already mapped (due to ->whereNull('type') filter) —
                //    returns false even though that's a valid state, not an error
                // ⚠️ Returns false (boolean) not an HTTP error response
            }

            DB::commit();
            return true;
            // ✅ Returns true on success — but HTTP caller gets no meaningful response data
            // ⚠️ No information on HOW MANY cabins were updated — $updated count not returned

        } catch (\Throwable $e) {
            DB::rollBack();
            return false;
            // ✅ Catches Throwable (not just Exception) — broader error capture
            // 🔴 CRITICAL: exception completely swallowed — $e is never logged
            //    Same worst-practice pattern as DestroyPort and DestroyDestination
            // ⚠️ Returns false — caller has no information about what failed
        }
    }
}
```

### Field Differences Between the Four Bulk Actions

| Class | Field Updated | Filter Added | Value Set |
|-------|--------------|-------------|-----------|
| `SetCabinMapping` | `type` | `->whereNull('type')` (only unmapped) | `$request->input('selectedId')` |
| `RemoveCabinMapping` | `type` | *(none)* | `null` |
| `SetCabinExperience` | `experience_id` | *(none)* | `$request->input('selectedId')` |
| `RemoveCabinExperience` | `experience_id` | *(none)* | `null` |

Notable: `SetCabinMapping` has an extra `->whereNull('type')` guard — it only maps **currently unmapped** cabins, leaving already-mapped ones untouched. The other three act on **all** matching cabins regardless of current value.

### Dead Import in `EnableToggle`

`EnableToggle.php` imports `use App\Models\Itinerary` — the `Itinerary` model is never referenced anywhere in the file. Dead import, likely a copy-paste artefact.

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | All 4 bulk actions | **Exception completely swallowed** — `catch (\Throwable $e)` with `DB::rollBack(); return false;` — `$e` never logged; identical to `DestroyPort`/`DestroyDestination` silent failure |
| 2 | ⚠️ HIGH | All 6 | **No authorization check** — any authenticated user can toggle cabins, view mappings, or bulk-update experience/type across an entire cruiseline |
| 3 | ⚠️ HIGH | `EnableToggle` | **Race condition on toggle** — read-then-write pattern; same bug as `UpdateBestForYouCruise` |
| 4 | ⚠️ HIGH | All 4 bulk actions | **No input validation** — `selectedId` is a raw string applied directly to DB; no FK existence check |
| 5 | ⚠️ HIGH | All 4 bulk actions | **Returns `false` (boolean) not HTTP response** — controller may silently discard the failure |
| 6 | ⚠️ MEDIUM | `SetCabinMapping` | **`$updated === 0` is not always an error** — all matching cabins may already be mapped (valid state); returns false inappropriately |
| 7 | ⚠️ MEDIUM | All 4 bulk actions | **`DB::rollBack()` before any writes** — unnecessary rollback in the ship/cruiseline guard; no writes have been issued yet |
| 8 | ⚠️ MEDIUM | All 4 bulk actions | **`$updated` count not returned** — caller/client has no feedback on how many cabins were updated |
| 9 | ⚠️ MEDIUM | All 4 bulk actions | **`whereHas` subquery** — correlated subquery per row; a JOIN would be more efficient at scale |
| 10 | ⚠️ MEDIUM | `EnableToggle` | **New toggle value not returned** — client must infer state; no `enabled` value in JSON response |
| 11 | ⚠️ MEDIUM | `IndexCabinMapping` | **All dependencies instantiated with `new`** — not DI-resolved |
| 12 | ℹ️ LOW | `EnableToggle` | **Dead import** — `use App\Models\Itinerary` never referenced |
| 13 | ℹ️ LOW | `EnableToggle` | **Redundant `status: 200` in JSON body** |
| 14 | ℹ️ LOW | `IndexCabinMapping` | **`getCabin` (singular) for mapping list** — misleading method name |

---

## 📝 Migration to Base44

### `Cabin` Entity Schema (reference)

```json
{
  "name": "Cabin",
  "type": "object",
  "properties": {
    "ship_id":        { "type": "string" },
    "category_code":  { "type": "string", "description": "Provider category code — used as bulk-update key" },
    "name":           { "type": "string", "description": "Cabin name — used as bulk-update key" },
    "type":           { "type": "string", "description": "Mapped cabin type ID (CabinType); null = unmapped" },
    "experience_id":  { "type": "string", "description": "Assigned Experience ID; null = unassigned" },
    "enabled":        { "type": "boolean", "default": true },
    "deck":           { "type": "string" },
    "capacity":       { "type": "number" }
  },
  "required": ["ship_id", "category_code", "name"]
}
```

### `EnableToggle` → Backend function (atomic toggle)

```typescript
// functions/toggleCabinEnabled.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { cabinId } = await req.json();
  if (!cabinId) return Response.json({ error: 'cabinId required' }, { status: 400 });

  const cabin = await base44.asServiceRole.entities.Cabin.get(cabinId);
  const updated = await base44.asServiceRole.entities.Cabin.update(cabinId, {
    enabled: !cabin.enabled,
  });

  return Response.json({ success: true, enabled: updated.enabled });
  // ✅ Returns new value — client updates UI from response
});
```

### Bulk Cabin Update → Backend function (shared pattern)

```typescript
// functions/bulkUpdateCabins.js
// Handles all 4 bulk operations: setCabinMapping, removeCabinMapping,
//                                  setCabinExperience, removeCabinExperience
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { cabinId, operation, selectedId } = await req.json();
  // operation: "set_mapping" | "remove_mapping" | "set_experience" | "remove_experience"

  if (!cabinId || !operation) return Response.json({ error: 'cabinId and operation required' }, { status: 400 });

  // Step 1: Load seed cabin with its ship
  const cabin = await base44.asServiceRole.entities.Cabin.get(cabinId);
  const ship  = cabin.ship_id
    ? await base44.asServiceRole.entities.Ship.get(cabin.ship_id)
    : null;

  if (!ship?.cruiseline_id) {
    return Response.json({ error: 'Cabin has no associated ship or cruiseline' }, { status: 409 });
  }

  // Step 2: Find all ships in the same cruiseline
  const ships = await base44.asServiceRole.entities.Ship.filter({ cruiseline_id: ship.cruiseline_id });
  const shipIds = ships.map(s => s.id);

  // Step 3: Find all matching cabins (same category_code + name across cruiseline)
  const matchFilters = {
    ship_id:       { $in: shipIds },
    category_code: cabin.category_code,
    name:          cabin.name,
  };

  // SetCabinMapping only: restrict to unmapped cabins
  if (operation === 'set_mapping') matchFilters.type = null;

  const matchingCabins = await base44.asServiceRole.entities.Cabin.filter(matchFilters);

  if (matchingCabins.length === 0 && operation !== 'set_mapping') {
    return Response.json({ error: 'No matching cabins found' }, { status: 404 });
  }

  // Step 4: Bulk update
  const fieldMap = {
    set_mapping:       { type:          selectedId ?? null },
    remove_mapping:    { type:          null },
    set_experience:    { experience_id: selectedId ?? null },
    remove_experience: { experience_id: null },
  };
  const updateData = fieldMap[operation];
  if (!updateData) return Response.json({ error: 'Unknown operation' }, { status: 400 });

  await Promise.all(
    matchingCabins.map(c => base44.asServiceRole.entities.Cabin.update(c.id, updateData))
  );

  return Response.json({ success: true, updated_count: matchingCabins.length });
  // ✅ Returns count — client knows how many cabins were affected
});
```

### Frontend usage

```tsx
// Toggle enabled
const handleToggle = async (cabin) => {
  const res = await base44.functions.invoke('toggleCabinEnabled', { cabinId: cabin.id });
  setCabins(prev => prev.map(c => c.id === cabin.id
    ? { ...c, enabled: res.data.enabled }
    : c
  ));
};

// Bulk operations
const handleSetMapping = async (cabin, selectedTypeId) => {
  const res = await base44.functions.invoke('bulkUpdateCabins', {
    cabinId: cabin.id,
    operation: 'set_mapping',
    selectedId: selectedTypeId,
  });
  toast.success(`Mapped ${res.data.updated_count} cabin(s)`);
  queryClient.invalidateQueries(['cabins']);
};

const handleRemoveMapping = async (cabin) => {
  const res = await base44.functions.invoke('bulkUpdateCabins', {
    cabinId: cabin.id,
    operation: 'remove_mapping',
  });
  toast.success(`Unmapped ${res.data.updated_count} cabin(s)`);
  queryClient.invalidateQueries(['cabins']);
};
// ... same pattern for set_experience / remove_experience
```

### `IndexCabinMapping` → React page (standard pattern)

```tsx
// pages/CabinMapping.jsx
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CabinMapping() {
  const { data: cabins = [], isLoading } = useQuery({
    queryKey: ['cabin-mappings'],
    queryFn:  () => base44.entities.Cabin.filter({ type: null }, '-created_date', 200),
    // Show unmapped cabins by default — mirrors the mapping workflow
  });
  // Render mapping table
}
```

### Key Improvements over Legacy

1. **Fix race condition** — `EnableToggle` atomic toggle via read-then-write in backend function (Base44 has no `DB::raw('NOT enabled')` but the sequential read+write is safe in a single-threaded Deno handler)
2. **Fix silent exception swallowing** — all errors returned as JSON with appropriate HTTP status codes
3. **Fix `false` return** — all operations return proper HTTP responses instead of booleans
4. **Return updated count** — `updated_count` in response; client can show "12 cabins updated"
5. **Return new toggle value** — `enabled: updated.enabled` in response
6. **Admin-only authorization** — enforced in all backend functions
7. **Input validation** — `cabinId`, `operation`, `selectedId` validated before use
8. **Consolidate 4 bulk actions into 1 function** — `bulkUpdateCabins` with `operation` enum replaces 4 nearly-identical classes
9. **Remove unnecessary `DB::rollBack()`** before writes

---

## Summary

**`Actions/Cabin/EnableToggle`** (14 lines): AJAX boolean toggle for a Cabin's `enabled` flag — identical pattern to `UpdateBestForYouCruise`: same race condition (read-then-write), no input validation, no authorization, no return of new value, redundant `status: 200` in body. Dead import of `Itinerary` (never used).

**`Actions/Cabin/IndexCabinMapping`** (9 lines): Standard minimal Index action wiring `CabinMappingDataTable` — identical to `IndexCruise`, `IndexDeal`, etc. No authorization, no DI. Misleading singular method name `getCabin`.

**`Actions/Cabin/RemoveCabinExperience`, `RemoveCabinMapping`, `SetCabinExperience`, `SetCabinMapping`** (~20 lines each): Four near-identical bulk-update actions implementing a **"map once, apply to all cabins across the cruiseline"** pattern — the core business logic for cabin type and experience assignment. Given a seed cabin ID, each action finds all cabins sharing the same `category_code` + `name` within the same cruiseline and bulk-updates the target field. `SetCabinMapping` uniquely adds `->whereNull('type')` to skip already-mapped cabins. CRITICAL: exceptions are caught via `\Throwable` but **completely swallowed** — `$e` never logged, caller receives `false` with no error information. HIGH: no input validation, no authorization, returns `boolean` not HTTP response, `$updated` count not surfaced. `DB::rollBack()` before any writes in the guard block is pointless.

**Migration priority: HIGH** — The bulk update business logic is sound and must be preserved exactly (cruiseline-scoped, category_code + name matched). The four nearly-identical action classes should be consolidated into a single `bulkUpdateCabins` backend function with an `operation` parameter. Race condition on `EnableToggle` and silent exception swallowing in all four bulk actions are the most critical technical debt items.

**Total documented: 533 files**