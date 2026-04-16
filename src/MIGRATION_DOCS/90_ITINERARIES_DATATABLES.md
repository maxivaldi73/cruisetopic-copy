# Itinerary DataTables (Itineraries + Elements)

**Files:** `ItinerariesDataTable.php`, `ItineraryElementsDataTable.php`  
**Namespace:** `App\DataTables\Itinerary`  
**Type:** Core cruise catalog — **HIGH priority**

---

## 📋 Overview

| DataTable | Model | Complexity | Columns | Key Feature |
|-----------|-------|------------|---------|-------------|
| `ItinerariesDataTable` | `Itinerary` | HIGH | 11 | Multi-join query, SVG icons, destination badges, map image modal |
| `ItineraryElementsDataTable` | `ItineraryElement` | LOW | 5 | Scoped by `itineraryId`, port name resolution |

---

## 1. ItinerariesDataTable

### Query (Complex multi-join)

```php
public function query(Itinerary $model): QueryBuilder {
    return $model->newQuery()
        ->join('cruiselines', 'cruiselines.id', '=', 'itineraries.cruiseline_id')
        ->join('cruises', 'cruises.itinerary_id', '=', 'itineraries.id')
        ->where('itineraries.nights', '>', 0)          // Only itineraries with >0 nights
        ->where('cruises.availability', 1)             // Only with available cruises
        ->select('itineraries.*', 'cruiselines.name as cruiseline_name')
        ->groupBy('itineraries.id')
        ->withCount('destinations')
        ->withCount('cruises');
    // ⚠️ No authorization — all itineraries visible to all users
    // ⚠️ JOIN on cruises may cause duplicate rows before groupBy
}
```

### Column Definitions (11 columns)

| Index | Column | Type | Notes |
|-------|--------|------|-------|
| 0 | `id` | Exact match filter | `WHERE itineraries.id = ?` |
| 1 | `itineraryCode` | Direct | Itinerary code string |
| 2 | `cruiseline_name` | JOIN | From cruiselines table JOIN |
| 3 | `nights` | Exact match | `WHERE nights = ?` |
| 4 | `auto_rules` | Computed SVG icon | Green/red inline SVG — no external dependency |
| 5 | `destinations` | Computed HTML badges | Inline `badge-soft-info` spans per destination |
| 6 | `destinations_count` | Computed | Subquery count from pivot table |
| 7 | `cruises_count` | Computed | Subquery count from `cruises` table |
| 8 | `sea` | Computed badge | `Marittimo` vs `Fluviale` Italian strings |
| 9 | `map_image` | Computed HTML | `<img>` with `onclick="showMapModal(url)"` |
| 10 | `action` | Blade view | `components.custom.datatables.actions.itinerary.btn-actions` |

### Notable Implementations

#### `auto_rules` — Inline SVG icon
```php
->addColumn('auto_rules', function($row) {
    return '<svg ... fill="'.(($row->auto_rules) ? 'green' : 'red').'" ...></svg>';
    // ⚠️ Inline SVG blob in PHP string — hardcoded green/red
})
```

#### `destinations` — Badge list from relationship
```php
private function getDestinazione(Itinerary $itinerary) {
    $destinazione = '';
    foreach ($itinerary->destinations as $destination) {
        $destinazione .= ' <span class="badge badge-soft-info">' . $destination->name . '</span>';
        // ⚠️ Bootstrap class, no XSS escaping on destination name
    }
    return $destinazione;
}
```

#### `sea` — Italian badge
```php
->editColumn('sea', function (Itinerary $itinerary) {
    return $itinerary->sea
        ? '<span class="badge badge-soft-info">Marittimo</span>'   // ⚠️ Italian
        : '<span class="badge badge-soft-success">Fluviale</span>'; // ⚠️ Italian
})
```

#### `map_image` — Image with JS modal trigger
```php
->addColumn('map_image', function (Itinerary $itinerary) {
    $url = $itinerary->url_image_map;
    if ($url) {
        return '<img src="' . $url . '" ... onclick="showMapModal(\'' . $url . '\')">';
        // ⚠️ Potential XSS if url_image_map is user-controlled
    }
    return '';
})
```

#### `destinations_count` filter — Raw subquery
```php
->filterColumn('destinations_count', function ($query, $keyword) {
    $query->whereRaw("(select count(*)
        from `itinerary_destination`
        where `itinerary_destination`.`itinerary_id` = `itineraries`.`id`) = ?", [$keyword]);
    // ⚠️ Raw SQL with hardcoded table name
})
```

#### `generateColumnClickScript` — Dead code
```php
// This method exists but is never called — unused utility for AJAX column click
protected function generateColumnClickScript(...): string { ... }
// Contains Italian SweetAlert strings
```

### Distinct Filters
```php
'distinctFilters' => [
    '4' => [['id' => 1, 'nome' => 'Attivo'], ['id' => 0, 'nome' => 'Disattivo']], // ⚠️ Italian
    '6' => Itinerary::distinct()->selectRaw('...destinations_count...')->get(),
    '8' => [['id' => 1, 'nome' => 'Marittimi'], ['id' => 0, 'nome' => 'Fluviali']], // ⚠️ Italian
]
// ⚠️ Magic column indices [4, 6, 8]
```

### Features
- ✅ `enableCheckboxes = true` — Bulk selection enabled
- ✅ `enableSearchBuilder = true` — Advanced query builder
- ✅ Date filtering via `FilterService::filterByDate`
- ✅ `itinerary_departure_date` with try/catch for malformed dates

---

## ⚠️ Issues — ItinerariesDataTable

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All itineraries visible |
| 2 | 🔴 CRITICAL | **Potential XSS** — `url_image_map` rendered unescaped in `<img onclick>` |
| 3 | ⚠️ HIGH | **Italian UI strings** — `Marittimo`, `Fluviale`, `Attivo`, `Disattivo`, `Marittimi`, `Fluviali` |
| 4 | ⚠️ HIGH | **Magic column indices** — `[9,10]`, `[4,6,8]` |
| 5 | ⚠️ HIGH | **Hardcoded Blade view** — `components.custom.datatables.actions.itinerary.btn-actions` |
| 6 | ⚠️ HIGH | **Inline SVG blob** — `auto_rules` renders inline SVG directly in PHP |
| 7 | ⚠️ HIGH | **XSS risk on destinations** — destination names not HTML-escaped in badge HTML |
| 8 | ⚠️ HIGH | **Raw SQL** — Hardcoded table name `itinerary_destination` in whereRaw |
| 9 | ⚠️ MEDIUM | **Dead code** — `generateColumnClickScript()` defined but never called |
| 10 | ⚠️ MEDIUM | **Hardcoded route format** — `route()` used inline in dead method |
| 11 | ⚠️ MEDIUM | **Italian date format** — `d/m/Y` for `itinerary_departure_date` |
| 12 | ⚠️ MEDIUM | **JOIN duplication risk** — JOIN on `cruises` before groupBy may cause count inflation |
| 13 | ℹ️ LOW | **`showMapModal` global JS function** — Not defined in this file, relies on global scope |

---

## 2. ItineraryElementsDataTable

### Purpose
Sub-table showing the day-by-day port stops for a single itinerary (scoped by `itineraryId`). Used as an embedded detail view within the itinerary edit page.

### Query
```php
protected $itineraryId; // set via constructor

public function query(ItineraryElement $model): QueryBuilder {
    return $model->newQuery()->where('itinerary_id', $this->itineraryId);
    // ⚠️ No authorization
}
```

### Columns (5 total)

| Column | Notes |
|--------|-------|
| `id` | Row ID |
| `port_name` | Resolved from `port` relationship |
| `arrival_time` | Direct |
| `departure_time` | Direct |
| `action` | Blade view `components.custom.datatables.actions.itinerary-elements.btn-actions` |

### Port Name Resolution
```php
private function getPortName(ItineraryElement $itineraryElement) {
    return $itineraryElement->port_id
        ? $itineraryElement->port->name  // ⚠️ N+1 — no eager loading
        : $itineraryElement->port_id;    // ⚠️ Falls back to ID, not '-'
}
```

### Notable Config
```php
$customParameters = [
    'paging' => false,  // No pagination — shows all elements at once
    'order' => [[1, 'asc']],  // ⚠️ Magic index — sort by port_name
];
```

### Issues — ItineraryElementsDataTable

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — Any user can view any itinerary's elements |
| 2 | ⚠️ HIGH | **N+1 on port name** — `$itineraryElement->port->name` per row |
| 3 | ⚠️ HIGH | **Hardcoded Blade view** — `components.custom.datatables.actions.itinerary-elements.btn-actions` |
| 4 | ⚠️ MEDIUM | **Magic index** — `[[1, 'asc']]` for ordering |
| 5 | ⚠️ MEDIUM | **Bad fallback** — Falls back to `port_id` integer instead of `'-'` when port missing |
| 6 | ⚠️ MEDIUM | **Italian date format** — `d/m/Y` for `departure_date` |
| 7 | ℹ️ LOW | **`paging: false`** — Could be slow for itineraries with many stops |

---

## 📝 Migration to Base44

### Entities

```json
// Itinerary entity
{
  "name": "Itinerary",
  "properties": {
    "code": { "type": "string" },
    "cruiseline_id": { "type": "string" },
    "nights": { "type": "integer" },
    "sea": { "type": "boolean", "description": "true=maritime, false=river" },
    "auto_rules": { "type": "boolean", "default": false },
    "url_image_map": { "type": "string", "description": "URL to map image" },
    "itinerary_departure_date": { "type": "string", "format": "date" },
    "destination_ids": { "type": "array", "items": { "type": "string" } },
    "is_active": { "type": "boolean", "default": true }
  }
}

// ItineraryElement entity  
{
  "name": "ItineraryElement",
  "properties": {
    "itinerary_id": { "type": "string" },
    "port_id": { "type": "string" },
    "day_number": { "type": "integer" },
    "arrival_time": { "type": "string" },
    "departure_time": { "type": "string" },
    "is_overnight": { "type": "boolean", "default": false }
  }
}
```

### Backend Functions

```typescript
// functions/getItineraries.js — admin only
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const {
    page = 0,
    search = '',
    sea = '',
    auto_rules = '',
    cruiseline_id = '',
  } = await req.json();

  const filters = {};
  if (search) filters.$or = [
    { code: { $regex: search, $options: 'i' } },
  ];
  if (sea !== '') filters.sea = sea === 'true';
  if (auto_rules !== '') filters.auto_rules = auto_rules === 'true';
  if (cruiseline_id) filters.cruiseline_id = cruiseline_id;

  const itineraries = await base44.entities.Itinerary.filter(filters, '-created_date', 25, page * 25);
  return Response.json({ data: itineraries });
});

// functions/getItineraryElements.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { itineraryId } = await req.json();
  if (!itineraryId) return Response.json({ error: 'Missing itineraryId' }, { status: 400 });

  const elements = await base44.entities.ItineraryElement.filter(
    { itinerary_id: itineraryId },
    '+day_number'
  );

  return Response.json({ data: elements });
});
```

### React Key Improvements

```tsx
// auto_rules — React icon (no inline SVG blob)
import { Link2, Link2Off } from 'lucide-react';
const AutoRulesBadge = ({ active }) => active
  ? <Link2 className="text-green-500 w-5 h-5" />
  : <Link2Off className="text-red-500 w-5 h-5" />;

// sea — English labels, not Italian
const SeaBadge = ({ isMaritime }) => (
  <Badge variant={isMaritime ? 'default' : 'secondary'}>
    {isMaritime ? 'Maritime' : 'River'}
  </Badge>
);

// map_image — safe rendering with Dialog
const MapImageCell = ({ url }) => url ? (
  <Dialog>
    <DialogTrigger>
      <img src={url} alt="Map" className="w-20 h-14 object-cover rounded cursor-pointer" />
    </DialogTrigger>
    <DialogContent>
      <img src={url} alt="Itinerary Map" className="w-full" />
    </DialogContent>
  </Dialog>
) : null;

// destinations — safe badge list
const DestinationBadges = ({ destinations }) => (
  <div className="flex flex-wrap gap-1">
    {destinations.map(d => (
      <Badge key={d.id} variant="outline">{d.name}</Badge>
    ))}
  </div>
);
```

### Key Improvements

1. **Admin authorization** on both tables
2. **No inline SVG blobs** — use Lucide React icons for `auto_rules`
3. **English labels** — `Maritime`/`River` instead of `Marittimo`/`Fluviale`
4. **XSS-safe** — destination names escaped via React, map URL in Dialog not inline onclick
5. **No magic column indices** — named field references
6. **Eager loading for port names** — no N+1 in ItineraryElements
7. **`day_number` field** — explicit sort, replaces magic index `[[1, 'asc']]`
8. **Map image via Dialog** — replaces global `showMapModal()` JS function
9. **`is_overnight` on elements** — useful feature for sea itinerary planning
10. **Remove dead `generateColumnClickScript`** — unused utility method

---

## Summary

**ItinerariesDataTable** (12.9 KB): Core cruise catalog table with 11 columns. Complex multi-join query (cruiselines + cruises). Notable features: inline SVG for `auto_rules` status, destination badge list, subquery counts for destinations/cruises, map image with JS modal trigger, date range filter, SearchBuilder + checkboxes enabled. CRITICAL: no auth, XSS risk on `url_image_map` (unescaped onclick), XSS on destination names in badge HTML. HIGH: 6 Italian UI strings, magic column indices, dead `generateColumnClickScript` method, raw SQL for destination count filter.

**ItineraryElementsDataTable** (3.8 KB): Simple sub-table scoped by `itineraryId`. Shows day-by-day port stops (port_name, arrival_time, departure_time). CRITICAL: no auth. HIGH: N+1 on port name resolution (no eager loading), hardcoded Blade view. MEDIUM: bad fallback (returns port_id integer instead of '-'), Italian date format, magic sort index.

**Migration priority: HIGH** — Core catalog data, itineraries are the backbone of cruise product management. Auth gap is critical and XSS vulnerability in map_image is a direct security risk.