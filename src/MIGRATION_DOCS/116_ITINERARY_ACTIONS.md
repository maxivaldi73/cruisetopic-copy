# Itinerary Action Classes (3 files)

**Directory:** `App/Actions/Itinerary/`  
**Namespace:** `App\Actions\Itinerary`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — itinerary catalog is core product data; powers cruise browsing, pricing, and provider sync

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `IndexItinerary` | `getItinerary()` | Render DataTable of all Itineraries |
| `EditItinerary` | `getDataTable($id)` | Render edit form with itinerary elements DataTable + related Cruiselines and Ships |
| `UpdateEnabledItinerary` | `updateEnabled(Request $request)` | Toggle `enabled` boolean on a single Itinerary via AJAX |

---

## 🔧 Implementation

### 1. `IndexItinerary`

```php
class IndexItinerary
{
    public function getItinerary() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new ItinerariesDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.itineraries.index');
        // ✅ Consistent with other Index action classes (IndexShip, IndexFibosSetting, etc.)
        // ⚠️ All dependencies instantiated with `new` — not container-resolved, not testable
        // ⚠️ No authorization check — any caller can list all itineraries
        // ⚠️ Method name 'getItinerary' — misleading; renders full index view, not a single record
    }
}
```

---

### 2. `EditItinerary`

```php
class EditItinerary
{
    public function getDataTable($id) {
        // 1. Wire DataTable dependencies
        $dataTableService         = new DataTableService();
        $filterService            = new FilterService();
        $itineraryElementDataTable = new ItineraryElementsDataTable($dataTableService, $filterService, $id);
        // ⚠️ All three instantiated with `new` — not container-resolved, not testable
        // ⚠️ DataTable constructed before verifying the itinerary exists — same logical inversion
        //    as IndexShip / ProviderMappingPort

        // 2. Load related data
        $cruiselines = Cruiseline::all();
        $ships       = Ship::all();
        // ⚠️ Cruiseline::all() and Ship::all() — full table loads with NO filtering or pagination
        //    These could be very large tables; passing everything to the view is a memory risk
        // ⚠️ Two separate queries run sequentially — could be parallelised

        // 3. Resolve itinerary
        $itinerary = Itinerary::findOrFail($id);
        // ✅ Uses findOrFail — will throw ModelNotFoundException (404) for invalid $id
        //    This is better than ::find() used elsewhere (e.g. IndexShip, ProviderMappingPort)
        //    However, the DataTable is already wired with $id before this check runs

        return $itineraryElementDataTable->render(
            'admin.itineraries.edit',
            compact('itinerary', 'ships', 'cruiselines')
        );
        // ⚠️ No authorization check — any caller can access the edit view for any itinerary
        // ⚠️ Method name 'getDataTable' — misleading; renders a full Blade edit view
        // ✅ Passes all three context vars needed by the edit form
    }
}
```

---

### 3. `UpdateEnabledItinerary`

```php
class UpdateEnabledItinerary
{
    public function updateEnabled(Request $request) {
        $itinerary = Itinerary::findOrFail($request->id);
        // ✅ findOrFail — returns 404 JSON automatically for AJAX callers on invalid ID
        // ⚠️ $request->id — reading ID from request body (not route parameter); conventional REST
        //    would use a route parameter (e.g. PUT /itineraries/{id}/enabled)
        // ⚠️ No authorization check — any authenticated (or even unauthenticated) user can
        //    toggle enabled status on any itinerary

        $itinerary->update(['enabled' => !$itinerary->enabled]);
        // ✅ Simple boolean toggle — clean and correct
        // ⚠️ No observer/event fired — toggling enabled may affect cruise availability,
        //    provider sync, or search indexing but no side effects are triggered here

        return response()->json([
            'success' => true,
            'status'  => 200
        ]);
        // ⚠️ Returns { success: true, status: 200 } — `status` in the body is redundant
        //    (HTTP status code is already 200); callers should use the HTTP status, not the body field
        // ⚠️ Does not return the new enabled state — callers must infer from toggle logic
    }
}
```

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | ⚠️ HIGH | `EditItinerary` | **`Cruiseline::all()` and `Ship::all()` load full tables** — no filtering, no pagination; memory risk at scale |
| 2 | ⚠️ HIGH | `EditItinerary` | **DataTable wired before `findOrFail`** — same logical inversion as `IndexShip`/`ProviderMappingPort`; DataTable receives an ID that may resolve to nothing |
| 3 | ⚠️ HIGH | `UpdateEnabledItinerary` | **No authorization check** — any caller can toggle `enabled` on any itinerary via AJAX |
| 4 | ⚠️ HIGH | `UpdateEnabledItinerary` | **No side effects on toggle** — disabling an itinerary may need to propagate to search index, provider sync, or deal availability; no event fired |
| 5 | ⚠️ MEDIUM | All | **No authorization check** — any authenticated user can list, edit, or toggle itineraries |
| 6 | ⚠️ MEDIUM | All | **All DataTable dependencies instantiated with `new`** — not container-resolved, not testable |
| 7 | ⚠️ MEDIUM | `UpdateEnabledItinerary` | **ID from request body instead of route parameter** — non-RESTful; `$request->id` is fragile |
| 8 | ⚠️ MEDIUM | `UpdateEnabledItinerary` | **Response body includes redundant `status: 200`** — HTTP status code already conveys this; new enabled value not returned |
| 9 | ℹ️ LOW | `IndexItinerary` | **Method name `getItinerary`** — misleading; renders an index view, not a single record |
| 10 | ℹ️ LOW | `EditItinerary` | **Method name `getDataTable`** — misleading; renders a full Blade edit view, not just a DataTable |
| 11 | ℹ️ LOW | `EditItinerary` | **`$id` parameter is untyped** — no type hint |

---

## 📝 Migration to Base44

### `Itinerary` Entity (relevant fields for this context)

```json
{
  "name": "Itinerary",
  "properties": {
    "cruiseline_id": { "type": "string" },
    "ship_id":       { "type": "string" },
    "name":          { "type": "string" },
    "code":          { "type": "string" },
    "enabled":       { "type": "boolean", "default": true },
    "nights":        { "type": "integer" },
    "departure_port_id": { "type": "string" },
    "map_url":       { "type": "string" }
  }
}
```

---

### `IndexItinerary` → React page with entity SDK

```tsx
// pages/Itineraries.jsx
const { data: itineraries } = useQuery({
  queryKey: ['itineraries'],
  queryFn: () => base44.entities.Itinerary.list('-created_date', 50),
});
// Render table with enabled badge, cruiseline, ship, nights, actions
```

No backend function needed — direct entity SDK call.

---

### `EditItinerary` → React page with parallel queries

Replace `Cruiseline::all()` + `Ship::all()` + `Itinerary::findOrFail()` with three **parallel** SDK calls:

```tsx
// pages/EditItinerary.jsx
const urlParams  = new URLSearchParams(window.location.search);
const itineraryId = urlParams.get('id');

const [{ data: itinerary }, { data: cruiselines }, { data: ships }, { data: elements }] =
  await Promise.all([
    base44.entities.Itinerary.get(itineraryId),
    base44.entities.Cruiseline.list('name'),          // ordered, no full-table risk in Base44
    base44.entities.Ship.list('name'),
    base44.entities.ItineraryElement.filter(
      { itinerary_id: itineraryId },
      'day_number'
    ),
  ]);

// Render: itinerary form (cruiseline/ship selects from loaded lists) +
//         itinerary elements table (day, port, arrival, departure)
```

All four queries run in parallel — no sequential waterfall.

---

### `UpdateEnabledItinerary` → Inline entity SDK update

```tsx
// In ItineraryRow component (or Itineraries page):
const handleToggleEnabled = async (itinerary) => {
  await base44.entities.Itinerary.update(itinerary.id, { enabled: !itinerary.enabled });
  refetch(); // or optimistic update
};
```

No backend function needed. Return the new `enabled` state to the caller directly from the SDK response.

If toggling `enabled` must trigger side effects (e.g. invalidate search cache, pause sync jobs), wrap in a backend function:

```typescript
// functions/toggleItineraryEnabled.js
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

const { itineraryId } = await req.json();
const itinerary = await base44.asServiceRole.entities.Itinerary.get(itineraryId);
const updated = await base44.asServiceRole.entities.Itinerary.update(itineraryId, {
  enabled: !itinerary.enabled
});

// TODO: fire side effects here (search index, sync job pause, deal availability)

return Response.json({ success: true, enabled: updated.enabled });
```

---

## Summary

**`Actions/Itinerary/IndexItinerary`** (10 lines): Thin DataTable wrapper rendering the full itinerary index view. Follows the identical pattern as `IndexShip`, `IndexFibosSetting`, and `ProviderMappingPort` — all dependencies wired with `new`, no authorization, misleading method name.

**`Actions/Itinerary/EditItinerary`** (16 lines): Renders the itinerary edit form with an `ItineraryElementsDataTable` scoped to `$id`. Uses `findOrFail` (improvement over bare `find()` used elsewhere), but the DataTable is wired before the itinerary is validated. **High issue:** `Cruiseline::all()` and `Ship::all()` load full tables into memory to populate dropdowns — no filtering or pagination. No authorization check.

**`Actions/Itinerary/UpdateEnabledItinerary`** (13 lines): AJAX toggle for the `enabled` boolean on an `Itinerary`. Clean toggle logic using `findOrFail`. **High issue:** no authorization — any caller can disable/enable any itinerary. No events fired on toggle — side effects (search index, sync, deals) silently skipped. ID passed via request body rather than route parameter; response body includes a redundant `status: 200` field without returning the new `enabled` value.

**Migration priority: HIGH** — itineraries are core catalog data. In Base44: `IndexItinerary` and `EditItinerary` become React pages with parallel entity SDK queries (eliminating full `Cruiseline::all()`/`Ship::all()` loads); `UpdateEnabledItinerary` becomes an inline SDK update, optionally wrapped in an admin-only backend function if side effects are required.