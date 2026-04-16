# DestinationsDataTable

**File:** `DestinationsDataTable.php`  
**Namespace:** `App\DataTables\Destination`  
**Type:** Core catalog / geo-taxonomy — **MEDIUM priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Destination` |
| **Complexity** | MEDIUM |
| **Columns** | 8 (id, name, itineraries_count, ports_count, sorting, enabled, type, action) |
| **Special Feature** | Inline AJAX `enabled` toggle via column click, Sea/River type badge |

---

## 🔧 Implementation

### Query
```php
public function query(Destination $model): QueryBuilder {
    return $model->newQuery()->withCount(['itineraries', 'ports']);
    // ⚠️ No authorization — all destinations visible
    // ✅ Eager counts for itineraries and ports via withCount
}
```

### Column Definitions (8 total)

| Index | Column | Type | Notes |
|-------|--------|------|-------|
| 0 | `id` | Direct | — |
| 1 | `name` | Direct | Destination name |
| 2 | `itineraries_count` | Computed | From `withCount`, filterable via `has('itineraries', '=', ?)` |
| 3 | `ports_count` | Computed | From `withCount`, filterable via `has('ports', '=', ?)` |
| 4 | `sorting` | Direct | Numeric sort order |
| 5 | `enabled` | Computed badge | Green/red Bootstrap badge; clickable AJAX toggle |
| 6 | `type` | Computed badge | `river` → green "Fluviale", `sea` → info "Marittima" |
| 7 | `action` | Blade view | `components.custom.datatables.actions.destination.btn-actions` |

### Inline `enabled` Toggle (AJAX via column click)

```php
$enabledToggle = $this->dataTableService->generateColumnClickScript(
    $table,
    6,                                     // ⚠️ Magic column index
    '/admin/destinations/enabledToggle',   // ⚠️ Hardcoded GET route for state mutation
    'Il record è stato modificato con successo!',  // ⚠️ Italian
    'Rilevato problema nella modifica del record.' // ⚠️ Italian
);
// ⚠️ GET request used for a state mutation (CSRF-unprotected)
// ⚠️ Off-by-one? `enabled` is column index 5 (0-based) but script uses 6
```

### Badge Helpers

```php
private function getBoolean($row, string $column): string {
    if ($row->$column) {
        return '<span class="badge ... text-bg-success" style="cursor: pointer">Abilitato</span>';
    } else {
        return '<span class="badge ... text-bg-danger" style="cursor: pointer">Disabilitato</span>';
    }
    // ⚠️ Italian labels: "Abilitato" / "Disabilitato"
    // ⚠️ Inline style `cursor: pointer`
}

private function getRiverSea($row, string $column): string {
    if ($row->$column == 'river') {
        return '<span class="badge ... text-bg-success">Fluviale</span>';
    } else {
        return '<span class="badge ... text-bg-info">Marittima</span>';
        // ⚠️ Else branch catches all non-'river' values — 'sea' assumed, no explicit check
    }
    // ⚠️ Italian labels: "Fluviale" / "Marittima"
}
```

### Distinct Filter Values

```php
// enabled — static Italian labels
[['id' => 1, 'nome' => 'Abilitato'], ['id' => 0, 'nome' => 'Disabilitato']]  // ⚠️ Italian

// type — static Italian labels
[['id' => 'river', 'nome' => 'Fluviale'], ['id' => 'sea', 'nome' => 'Marittima']]  // ⚠️ Italian

// ports_count — full table scan to get unique values
Destination::query()->withCount('ports')->get()->pluck('ports_count')->unique()
// ⚠️ Loads ALL destination records to compute unique counts — no limit

// itineraries_count — same full table scan
Destination::query()->withCount('itineraries')->get()->pluck('itineraries_count')->unique()
// ⚠️ Duplicate full-table scan, executed separately from main query
```

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All destinations visible to any user |
| 2 | 🔴 CRITICAL | **GET request for state mutation** — `/admin/destinations/enabledToggle` uses GET (no CSRF protection) |
| 3 | ⚠️ HIGH | **Magic column index** — `enabledToggle` script uses index `6` but `enabled` is column 5 (0-based) — possible off-by-one |
| 4 | ⚠️ HIGH | **Italian UI strings** — `Abilitato`, `Disabilitato`, `Fluviale`, `Marittima` hardcoded throughout |
| 5 | ⚠️ HIGH | **Hardcoded route** — `/admin/destinations/enabledToggle` and `route('destinations.create')` |
| 6 | ⚠️ HIGH | **Hardcoded Blade path** — `components.custom.datatables.actions.destination.btn-actions` |
| 7 | ⚠️ HIGH | **Full table scan for distinct counts** — Two separate `withCount + get()` queries over all rows |
| 8 | ⚠️ MEDIUM | **`getRiverSea` implicit else** — Non-'river' values silently render as "Marittima" |
| 9 | ⚠️ MEDIUM | **Inline styles** — `style="cursor: pointer"` on badges |
| 10 | ℹ️ LOW | **`sorting` column has no UI controls** — Displayed but no drag-to-reorder or inline edit |

---

## 📝 Migration to Base44

### Entity

```json
{
  "name": "Destination",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Destination display name"
    },
    "type": {
      "type": "string",
      "enum": ["sea", "river"],
      "description": "Maritime or river destination"
    },
    "sorting": {
      "type": "integer",
      "default": 0,
      "description": "Display order"
    },
    "enabled": {
      "type": "boolean",
      "default": true
    },
    "port_ids": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Ports belonging to this destination"
    },
    "image_url": {
      "type": "string",
      "description": "Optional destination banner image"
    }
  },
  "required": ["name", "type"]
}
```

### Backend Functions

```typescript
// functions/getDestinations.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { search = '', type = '', enabled = '' } = await req.json();

  const filters = {};
  if (search) filters.name = { $regex: search, $options: 'i' };
  if (type) filters.type = type;
  if (enabled !== '') filters.enabled = enabled === 'true';

  const destinations = await base44.entities.Destination.filter(filters, '+sorting');
  return Response.json({ data: destinations });
});

// functions/toggleDestinationEnabled.js — PATCH, not GET
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { destinationId } = await req.json();
  const dest = await base44.entities.Destination.get(destinationId);
  await base44.entities.Destination.update(destinationId, { enabled: !dest.enabled });
  return Response.json({ success: true, enabled: !dest.enabled });
});
```

### React UI Notes

```tsx
// enabled badge — toggle via onClick, not column-index AJAX click
const EnabledBadge = ({ enabled, onToggle }) => (
  <Badge
    variant={enabled ? 'default' : 'destructive'}
    className="cursor-pointer select-none"
    onClick={onToggle}
  >
    {enabled ? 'Active' : 'Inactive'}
  </Badge>
);

// type badge — explicit enum check, English labels
const TypeBadge = ({ type }) => (
  <Badge variant={type === 'sea' ? 'secondary' : 'outline'}>
    {type === 'sea' ? 'Maritime' : type === 'river' ? 'River' : type}
  </Badge>
);

// counts — display itinerary/port counts from related entities
// (computed server-side or via count query, not full table scan)
```

### Key Improvements

1. **Admin-only authorization**
2. **PATCH for toggle** — replaces CSRF-unprotected GET `/enabledToggle`
3. **English labels** — `Active`/`Inactive`, `Maritime`/`River`
4. **Explicit enum check** in TypeBadge — no silent else for unknown values
5. **No full table scan** for distinct count values — use paginated filters
6. **`port_ids` array on entity** — replaces pivot table `destination_port`
7. **`image_url` field** — optional banner for destination cards
8. **No magic column indices** — named field references in React
9. **Drag-to-reorder** via `@hello-pangea/dnd` for `sorting` field

---

## Summary

**DestinationsDataTable** (8.8 KB): 8-column destination catalog with Sea/River type classification. Features an inline AJAX `enabled` toggle via column click, two distinct full-table scans for count filter dropdowns, and Sea/River badge rendering. CRITICAL: no auth, GET request used for state mutation (no CSRF protection). HIGH: possible off-by-one on magic column index for toggle script, 4 Italian UI strings (`Abilitato`, `Disabilitato`, `Fluviale`, `Marittima`), hardcoded route and Blade path, two expensive full-table scans per page load. MEDIUM: implicit else in `getRiverSea` silently maps all non-'river' to "Marittima". LOW: `sorting` column displayed but no reorder UI.

**Migration priority: MEDIUM** — Core geo-taxonomy used by itineraries and ports. Auth gap + GET-for-mutation are critical security issues. Full-table scan pattern is a performance risk at scale.