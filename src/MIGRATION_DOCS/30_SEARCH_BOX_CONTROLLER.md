# SearchBoxController

**Purpose:** AJAX endpoint to dynamically refresh search box filter options (destinations, ports, cruiselines, months) and cruise count when the user changes a filter value.  
**Location:** `App\Http\Controllers\SearchBoxController`  
**Extends:** `App\Http\Controllers\Controller`  
**Namespace:** `App\Http\Controllers`

---

## Overview

Provides a single `GET` endpoint consumed by the frontend search box UI. Each time the user changes a filter (e.g., selects a destination or cruiseline), the frontend calls this endpoint to receive updated, context-aware option lists for all other filters, plus a live count of matching cruises.

---

## Dependencies

| Dependency | Type | Purpose |
|-----------|------|---------|
| `NewOfferService` | Service | Query builder for destinations, ports, cruiselines, months, and cruise count |
| `SearchRequest` | Model/DTO | Encapsulates filter parameters into a typed request object |
| `Carbon` | Library | Date/time handling (imported but not used directly in controller) |
| `Illuminate\Http\JsonResponse` | Framework | Typed JSON response |

---

## Configuration

### `$topFiveOrderCruiselines`

```php
private array $topFiveOrderCruiselines = [
    'MSC', 'MSC CROCIERE', 'MSC CRUISES',
    'COSTA', 'COSTA CROCIERE', 'COSTA CRUISES',
    'NCL', 'NORWEGIAN', 'NORWEGIAN CRUISE LINE', 'NORWEGIAN CRUISES',
    'RCCL', 'ROYAL CARIBBEAN', 'ROYAL CARIBBEAN INTERNATIONAL', 'ROYAL CARIBBEAN CRUISES',
    'EXP', 'EXPLORA', 'EXPLORA CRUISES',
];
```

- Defines priority ordering for cruiselines displayed at the top of the dropdown.
- Hard-coded list of name variants for MSC, Costa, NCL, Royal Caribbean, and Explora.
- Matching is case-insensitive (via `strtoupper()`).

---

## Endpoint

### `GET /search-box/data`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `only_river` | bool | `false` | Filter for river cruises only |
| `destination_id` | int\|null | `null` | Selected destination ID (0 = null) |
| `port_id` | int\|null | `null` | Selected departure port ID (0 = null) |
| `cruiseline_id` | int\|null | `null` | Selected cruiseline ID (0 = null) |
| `month` | string\|null | `null` | Selected month |
| `date` | string\|null | `null` | Selected specific date |
| `changed` | string\|null | `null` | Which field the user just changed (used to clear that field from its own filter query) |

**Example:**
```
GET /search-box/data?only_river=0&destination_id=&port_id=&cruiseline_id=&month=&date=&changed=destination
```

---

## Response

```json
{
  "destinations": [
    { "id": 1, "name": "Mediterranean", "parent_id": null },
    { "id": 5, "name": "Western Med", "parent_id": 1 }
  ],
  "ports": [
    { "id": 10, "name": "civitavecchia" }
  ],
  "cruiselines": [
    { "id": 3, "name": "msc crociere" }
  ],
  "months": [
    { "departure_month": "2025-06", "departure_month_text": "June 2025" }
  ],
  "total": 142
}
```

---

## Logic: `data(Request $request): JsonResponse`

### Step 1 — Parse Inputs

```php
$onlyRiver    = filter_var($request->input('only_river', false), FILTER_VALIDATE_BOOLEAN);
$destinationId = ($v = $request->input('destination_id')) && $v > 0 ? (int)$v : null;
$portId        = ...
$cruiselineId  = ...
$month         = $request->input('month') ?: null;
$date          = $request->input('date')  ?: null;
$changed       = $request->input('changed');
```

- All ID fields normalize `0` or empty string to `null`.
- Month/date fallback text `"Quando vuoi partire?"` (Italian placeholder) is treated as `null`.

### Step 2 — Build Base `SearchRequest`

```php
$base = new SearchRequest(
    $onlyRiver, $cruiselineId, $portId, null,
    ($month && $month !== 'Quando vuoi partire?') ? $month : null,
    ($date  && $date  !== 'Quando vuoi partire?') ? $date  : null,
    $destinationId, 0, null
);
```

### Step 3 — Query Each Filter Group

Each filter group uses a **copy** of the base request with the group's own field cleared, so the dropdown shows all valid options given the other active filters (not just the selected value itself).

| Data | Field Cleared | Extra Logic |
|------|--------------|-------------|
| Destinations | `destination_id` | Always exclude own filter |
| Ports | `port_id` | Only if `$changed === 'port'` |
| Cruiselines | `cruiseline_id` | Always exclude own filter |
| Months | `month` + `date` | Always exclude own filter |

### Step 4 — Post-Processing

**Destinations:** `organizeDestinations()` — parent records appear before their children.

**Cruiselines:** `sortCruiselines()` — priority brands appear first; rest sorted alphabetically. Names lowercased.

**Ports:** Sorted by name via SQL `orderBy`. Names lowercased.

**Months:** Sorted by `departure_month` value.

**Total:** `countCruisesByFilter($base)` — full filter applied (including selected destination/port/cruiseline).

---

## Helper Methods

### `organizeDestinations(array $destinations): array`

```php
// Groups children directly after their parent
foreach ($destinations as $destination) {
    if ($destination['parent_id'] === null) {
        $organized[] = $destination;        // parent first
        foreach ($destinations as $child) {
            if ($child['parent_id'] === $destination['id']) {
                $organized[] = $child;      // children follow
            }
        }
    }
}
```

**Result:** Flat ordered array with parent–child hierarchy preserved via insertion order.

**Issues:**
- O(n²) nested loop — inefficient for large destination lists.
- Orphan children (parent not in results) are silently dropped.

---

### `sortCruiselines($cruiselines)`

```php
return $cruiselines->sortBy(function ($c) {
    $pos = array_search(strtoupper($c->name), $this->topFiveOrderCruiselines);
    return $pos !== false ? $pos : count($this->topFiveOrderCruiselines);
});
```

- Priority brands: sort key = their index in `$topFiveOrderCruiselines` (0–17).
- All others: sort key = 18 (end of list, preserve alphabetical order from SQL).

---

## Base Controller

**Location:** `App\Http\Controllers\Controller`  
**Extends:** `Illuminate\Routing\Controller`  
**Traits:** `AuthorizesRequests`, `ValidatesRequests`

Provides standard Laravel authorization (`$this->authorize()`) and validation (`$this->validate()`) helpers to all child controllers. No custom logic.

---

## Issues / Concerns

1. **Hard-coded Cruiseline Names:** `$topFiveOrderCruiselines` is a static list of string variants.
   - Risk: New cruiseline names (e.g., MSC in a new language) won't be promoted automatically.
   - Better: Store priority order in database (e.g., a `priority` field on the `Cruiseline` model).

2. **Italian Placeholder Guard:** `$month !== 'Quando vuoi partire?'` is a hard-coded Italian UI string embedded in controller logic.
   - Risk: Breaks if UI text changes or is translated.
   - Better: Frontend should send `null` for empty selections, not the placeholder text.

3. **Carbon Imported but Unused:** `use Carbon\Carbon;` is imported but not used in the controller.

4. **O(n²) Destination Loop:** `organizeDestinations()` uses nested loops — acceptable for small datasets but inefficient at scale.

5. **Ports Field Clearing Logic:** Ports only clear `port_id` if `$changed === 'port'`, while destinations and cruiselines always clear their own field. This asymmetry is intentional but not documented.

6. **No Authentication:** Endpoint has no auth middleware — publicly accessible.
   - May be intentional (search box is on a public page).

7. **No Input Validation:** Raw request inputs are cast but not formally validated.

---

## Migration Notes for Base44

### Strategy

Replace the AJAX controller with a **backend function** that accepts the same parameters and returns the same JSON shape.

### Backend Function: `getSearchBoxData`

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOP_CRUISELINES = ['MSC', 'COSTA', 'NCL', 'RCCL', 'EXP', 'EXPLORA'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const params = await req.json();

    const {
      onlyRiver = false,
      destinationId = null,
      portId = null,
      cruiselineId = null,
      month = null,
      date = null,
      changed = null,
    } = params;

    // Query each filter group in parallel
    const [destinations, ports, cruiselines, months, total] = await Promise.all([
      base44.entities.Destination.filter({ parent_id: null }),      // or with river filter
      base44.entities.Port.list('name'),
      base44.entities.Cruiseline.list('name'),
      base44.entities.Cruise.filter({ available: true }),            // distinct months
      base44.entities.Cruise.filter({                                // full filter for count
        destination_id: destinationId,
        port_id: portId,
        cruiseline_id: cruiselineId,
        month,
        date,
        only_river: onlyRiver,
      }),
    ]);

    // Sort cruiselines: priority brands first
    const sortedCruiselines = [...cruiselines].sort((a, b) => {
      const aIdx = TOP_CRUISELINES.findIndex(t => a.name.toUpperCase().includes(t));
      const bIdx = TOP_CRUISELINES.findIndex(t => b.name.toUpperCase().includes(t));
      const aPos = aIdx === -1 ? 999 : aIdx;
      const bPos = bIdx === -1 ? 999 : bIdx;
      return aPos - bPos;
    });

    // Organize destinations: parents before children
    const organized = organizeDestinations(destinations);

    return Response.json({
      destinations: organized,
      ports: ports.map(p => ({ id: p.id, name: p.name.toLowerCase() })),
      cruiselines: sortedCruiselines.map(c => ({ id: c.id, name: c.name.toLowerCase() })),
      months: months,
      total: total.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function organizeDestinations(destinations) {
  const parents = destinations.filter(d => !d.parent_id);
  const children = destinations.filter(d => d.parent_id);
  const result = [];
  for (const parent of parents) {
    result.push(parent);
    result.push(...children.filter(c => c.parent_id === parent.id));
  }
  return result;
}
```

### Frontend Usage

```typescript
import { base44 } from "@/api/base44Client";

const fetchSearchBoxData = async (filters) => {
  const res = await base44.functions.invoke('getSearchBoxData', filters);
  return res.data; // { destinations, ports, cruiselines, months, total }
};

// Call on each filter change
const handleFilterChange = async (changed, value) => {
  setFilters(prev => ({ ...prev, [changed]: value, changedField: changed }));
  const data = await fetchSearchBoxData({ ...filters, [changed]: value, changed });
  setSearchBoxOptions(data);
};
```

### Key Improvements

1. **Database-driven priority:** Move cruiseline ordering to a `priority` field in the entity.
2. **No placeholder text in backend:** Frontend sends `null`, not Italian placeholder strings.
3. **Parallel queries:** Use `Promise.all()` to fetch all filter data concurrently.
4. **Cleaner destination grouping:** Single-pass O(n) organization instead of O(n²).
5. **Public endpoint:** No auth required (search box is public), but rate limiting applies via Base44 platform.

### Entities Required

- `Destination` — `id`, `name`, `parent_id`, `enabled`
- `Port` — `id`, `name`, `is_river`
- `Cruiseline` — `id`, `name`, `priority` (new field)
- `Cruise` / `CruiseView` — `departure_month`, `destination_id`, `port_id`, `cruiseline_id`, `only_river