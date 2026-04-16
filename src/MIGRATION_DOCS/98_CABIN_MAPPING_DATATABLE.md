# CabinMappingDataTable

**File:** `DataTables/Cabin/CabinMappingDataTable.php`  
**Namespace:** `App\DataTables\Cabin`  
**Type:** Catalog configuration / provider data enrichment — **HIGH priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Cabin` |
| **Complexity** | HIGH |
| **Columns** | 11 (cruiseline_name, ship_id→name, name, category_code, type, experience, mapped, enabled, min_occupants, max_occupants, action) |
| **Special Features** | 4 inline-edit AJAX operations (set/remove cabin type, set/remove experience); inline `<select>` dropdowns rendered in cells; `enabled` click-toggle; `mapped` computed badge |

---

## 🔧 Implementation

### Constructor — Eager Data Preload

```php
public function __construct(DataTableService $dataTableService, FilterService $filterService) {
    $this->cabin_type = Cabin::CABIN_TYPE;                    // ⚠️ First assigned (from constant)
    $this->cabin_type = CabinType::all(['code', 'name', 'description'])
        ->keyBy('code')
        ->toArray();                                           // ⚠️ Immediately overwritten — first assignment is dead code
    $this->experiences = Experience::all(['id', 'title'])
        ->keyBy('id')
        ->toArray();
    // ⚠️ Full table loads in constructor — blocking, no pagination
    // ⚠️ If CabinType or Experience tables are large, this is an O(n) startup cost
    // ✅ keyBy() gives O(1) lookup in getCabinType() / getCabinExperience()
}
```

### Query

```php
public function query(Cabin $model): QueryBuilder {
    return $model->newQuery();
    // ⚠️ No authorization — all cabins from all ships/cruiselines
    // ⚠️ No eager loading — cruiseline_name accesses $cabin->ship->cruiseline->name (3-level chain)
    //    This is a severe N+1: 2 queries per row (ship + cruiseline)
    // ⚠️ No select() — fetches all columns
}
```

### Data Transformation

#### `cruiseline_name` — 3-level relationship chain
```php
->addColumn('cruiseline_name', function (Cabin $cabin) {
    return $cabin->ship->cruiseline->name;
    // ⚠️ CRITICAL N+1: $cabin->ship loads Ship, then ->cruiseline loads Cruiseline
    // ⚠️ No null-safety — crashes if ship or cruiseline is null
})
```

#### `ship_id` → `ship_name`
```php
->editColumn('ship_id', function (Cabin $cabin) {
    return $cabin->ship->name;
    // ⚠️ N+1 (same ship load as above, but separate query if not cached)
    // ⚠️ No null-safety
})
```

#### `type` — Inline Select or Badge+Remove

```php
private function getCabinType(Cabin $cabin): string {
    if ($cabin->type) {
        // Already mapped: show type name badge + red "X" remove button
        $trimmedType = trim($cabin->type);
        $cabinTypeName = $this->cabin_type[$trimmedType]['name'] ?? $cabin->type; // ✅ fallback to raw
        $badge = '<span class="badge ... text-bg-danger ... remove" style="cursor: pointer">X</span>';
        return '<div class="d-flex align-items-center">' . $badge . '<span>' . $cabinTypeName . '</span></div>';
        // ⚠️ Potential XSS: $cabinTypeName from DB rendered without escaping
    }
    // Not mapped: render <select> via Blade partial
    return view('components.custom.datatables.actions.cabins.mapping.select-cabin_type', [
        'cabin'      => $cabin,
        'cabin_type' => $this->cabin_type,
    ])->render();
    // ✅ ->render() called correctly here
}
```

#### `experience` — Inline Select or Badge+Remove

```php
private function getCabinExperience(Cabin $cabin): string {
    if ($cabin->experience_id) {
        $experienceName = $this->experiences[$cabin->experience_id]['title'] ?? 'Non trovato';
        // ⚠️ Italian fallback: 'Non trovato'
        $badge = '<span class="badge ... text-bg-danger ... remove">X</span>';
        return '<div ...>' . $badge . '<span>' . $experienceName . '</span></div>';
        // ⚠️ Potential XSS: $experienceName from DB rendered without escaping
    }
    return view('components.custom.datatables.actions.cabins.mapping.select-cabin_experience', [
        'cabin'       => $cabin,
        'experiences' => $this->experiences,
    ])->render(); // ✅ ->render() called
}
```

#### `mapped` — Computed Badge

```php
private function getCabinMapped(Cabin $cabin): string {
    return $cabin->type
        ? '<span class="badge ... text-bg-info">Mappata</span>'   // ⚠️ Italian
        : '<span class="badge ... text-bg-warning">Da mappare</span>'; // ⚠️ Italian
    // ✅ Simple ternary — no null risk
}
```

### Columns (11 total)

| Index | Column | Filter Type | Notes |
|-------|--------|------------|-------|
| 0 | `cruiseline_name` | Text search | 3-level N+1 |
| 1 | `ship_id` | Text search (maps to ship name) | 1-level N+1 |
| 2 | `name` | Text search | Cabin name |
| 3 | `category_code` | Text search | Provider cabin code |
| 4 | `type` | Select (CabinType from DB) | Inline edit: select dropdown or badge+remove |
| 5 | `experience` | Select (Experience from DB) | Inline edit: select dropdown or badge+remove |
| 6 | `mapped` | Select (Mappata / Da mappare) | Computed: type IS NOT NULL |
| 7 | `enabled` | Select (Abilitato / Disabilitato) | Click-toggle AJAX; ⚠️ column index mismatch (see below) |
| 8 | `min_occupants` | Text search | — |
| 9 | `max_occupants` | Text search | — |
| 10 | `action` | Non-searchable | Blade partial |

### AJAX Operations (5 total)

| Operation | Method | Route | CSRF | Notes |
|-----------|--------|-------|------|-------|
| `enabled` toggle | GET (via click script) | `/admin/cabin-mappings/update/enabled` | ❌ | ⚠️ GET for mutation |
| Set cabin type | POST | `/admin/cabin-mappings/update/set_cabin_mapping` | ✅ | Select change event |
| Remove cabin type | POST (via buttonClickScript) | `/admin/cabin-mappings/update/remove_cabin_mapping` | ❌? | `.remove` badge click |
| Set experience | POST | `/admin/cabin-mappings/update/set_experience` | ✅ | Select change event |
| Remove experience | POST (via buttonClickScript) | `/admin/cabin-mappings/update/remove_experience` | ❌? | `.remove` badge click |

### Column Index Mismatch — `enabled` toggle

```php
$enabled = $this->dataTableService->generateColumnClickScript(
    $table,
    8,                                            // ⚠️ Index 8 = min_occupants, NOT enabled (index 7)
    '/admin/cabin-mappings/update/enabled',
    'Il record è stato modificato con successo!', // ⚠️ Italian
    'Rilevato problema nella modifica del record.' // ⚠️ Italian
);
// ⚠️ Off-by-one: enabled is at index 7, script targets index 8 (min_occupants)
// This means clicking min_occupants triggers enabled toggle — a bug
```

### `removeCabinMapping` — Column Index Bug

```php
$removeCabinMapping = $this->dataTableService->buttonClickScript(
    $table,
    5,                                            // ⚠️ Index 5 = experience, NOT type (index 4)
    '/admin/cabin-mappings/update/remove_cabin_mapping',
    ...
);
// ⚠️ Column 5 is 'experience', not 'type'. The remove button for cabin type
//    is in column 4 (type), but the click script listens on column 5
```

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All cabins from all ships/cruiselines visible |
| 2 | 🔴 CRITICAL | **`enabled` toggle off-by-one** — Script targets col 8 (`min_occupants`), not col 7 (`enabled`) |
| 3 | 🔴 CRITICAL | **`removeCabinMapping` off-by-one** — buttonClickScript targets col 5 (`experience`), not col 4 (`type`) |
| 4 | 🔴 CRITICAL | **`enabled` toggle uses GET** — `/admin/cabin-mappings/update/enabled` (no CSRF) |
| 5 | ⚠️ HIGH | **Severe N+1** — `$cabin->ship->cruiseline->name` = 2 queries per row (ship + cruiseline) |
| 6 | ⚠️ HIGH | **No null-safety on relationships** — `$cabin->ship->cruiseline->name` crashes if ship or cruiseline is null |
| 7 | ⚠️ HIGH | **Dead code in constructor** — `Cabin::CABIN_TYPE` assigned then immediately overwritten |
| 8 | ⚠️ HIGH | **Potential XSS** — `$cabinTypeName` and `$experienceName` from DB rendered as raw HTML without `e()` escaping |
| 9 | ⚠️ HIGH | **Full table loads in constructor** — `CabinType::all()` + `Experience::all()` on every DataTable instantiation |
| 10 | ⚠️ HIGH | **Italian UI strings** — "Abilitato", "Disabilitato", "Mappata", "Da mappare", "Non trovato", "Salvato!", "Errore!" etc. |
| 11 | ⚠️ HIGH | **Hardcoded routes** — 5 AJAX endpoints hardcoded (`/admin/cabin-mappings/update/*`) |
| 12 | ⚠️ HIGH | **Hardcoded Blade paths** — 3 Blade partials (`select-cabin_type`, `select-cabin_experience`, `action`) |
| 13 | ⚠️ MEDIUM | **`distinctFilters` string indices** — `'4'`, `'5'`, `'6'`, `'7'` as string keys |
| 14 | ⚠️ MEDIUM | **Inline styles on columns** — `style="min-width: 150px"` on type/experience columns |
| 15 | ℹ️ LOW | **`$customButtons = []`** — Commented out, empty button bar |

---

## 📝 Migration to Base44

### Entities

```json
// Cabin entity (core)
{
  "name": "Cabin",
  "type": "object",
  "properties": {
    "ship_id":         { "type": "string", "description": "Ref to Ship entity" },
    "name":            { "type": "string" },
    "category_code":   { "type": "string", "description": "Provider cabin code" },
    "type":            { "type": "string", "description": "Ref to CabinType.code (null = unmapped)" },
    "experience_id":   { "type": "string", "description": "Ref to Experience entity" },
    "min_occupants":   { "type": "integer" },
    "max_occupants":   { "type": "integer" },
    "enabled":         { "type": "boolean", "default": true }
  },
  "required": ["ship_id", "category_code"]
}
```

### Backend Functions

```typescript
// functions/getCabins.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { search = '', type = '', experience_id = '', mapped = '' } = await req.json();
  const filters = {};
  if (search) filters.name = { $regex: search, $options: 'i' };
  if (type) filters.type = type;
  if (experience_id) filters.experience_id = experience_id;
  if (mapped === '1') filters.type = { $exists: true, $ne: null };
  if (mapped === '0') filters.type = null;

  const cabins = await base44.entities.Cabin.filter(filters, 'name');
  return Response.json({ data: cabins });
});

// functions/updateCabinMapping.js — replaces 4 separate AJAX routes
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { cabinId, action, type, experience_id, enabled } = await req.json();

  const updates = {};
  if (action === 'set_type')          updates.type = type;
  if (action === 'remove_type')       updates.type = null;
  if (action === 'set_experience')    updates.experience_id = experience_id;
  if (action === 'remove_experience') updates.experience_id = null;
  if (action === 'toggle_enabled') {
    const cabin = await base44.entities.Cabin.get(cabinId);
    updates.enabled = !cabin.enabled;
  }

  await base44.entities.Cabin.update(cabinId, updates);
  return Response.json({ success: true });
});
```

### React UI Notes

```tsx
// Mapped badge — computed from type field
const MappedBadge = ({ type }) => (
  <Badge variant={type ? 'default' : 'secondary'}>
    {type ? 'Mapped' : 'Unmapped'}
  </Badge>
);

// Type cell — Select or badge+remove button
const TypeCell = ({ cabin, cabinTypes, onUpdate }) => {
  if (cabin.type) {
    const typeName = cabinTypes.find(t => t.code === cabin.type)?.name ?? cabin.type;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{typeName}</span>
        <Button size="sm" variant="destructive" onClick={() => onUpdate(cabin.id, 'remove_type')}>
          ✕
        </Button>
      </div>
    );
  }
  return (
    <Select onValueChange={(val) => onUpdate(cabin.id, 'set_type', val)}>
      <SelectTrigger className="w-40"><SelectValue placeholder="Select type..." /></SelectTrigger>
      <SelectContent>
        {cabinTypes.map(t => <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
};

// Experience cell — same pattern as TypeCell
const ExperienceCell = ({ cabin, experiences, onUpdate }) => { /* identical pattern */ };
```

### Key Improvements

1. **Admin-only authorization**
2. **Fix `enabled` off-by-one** — toggle correctly wired to `enabled` column (index 7)
3. **Fix `removeCabinMapping` off-by-one** — button click script targets `type` column (index 4)
4. **Eager loading** — resolve ship + cruiseline in a single query, not per-row
5. **Unified `updateCabinMapping` backend function** — replaces 5 separate AJAX routes
6. **PATCH for all mutations** — no GET-for-mutation, proper CSRF equivalents
7. **XSS prevention** — React JSX handles escaping automatically (no raw HTML injection)
8. **Remove full-table constructor loads** — fetch CabinType + Experience lazily, or once via API
9. **Remove dead `Cabin::CABIN_TYPE` assignment** — overwritten immediately in constructor
10. **English UI labels** — all Italian strings replaced
11. **Null-safe relationship access** — `cabin.ship?.cruiseline?.name ?? '—'`

---

## Summary

**CabinMappingDataTable** (15.1 KB): Most complex cabin-related DataTable. 11-column cabin catalog with 5 inline AJAX operations: set/remove cabin type (with inline `<select>` dropdown that replaces itself post-save), set/remove experience (same pattern), and `enabled` click-toggle. CRITICAL: no auth; 2 confirmed off-by-one bugs — `enabled` toggle fires on `min_occupants` column (index 8 vs 7) and `removeCabinMapping` fires on `experience` column (index 5 vs 4); `enabled` toggle uses GET (no CSRF). HIGH: severe N+1 on `$cabin->ship->cruiseline->name` (3-level chain, 2 queries/row), dead code in constructor (`Cabin::CABIN_TYPE` immediately overwritten), potential XSS on cabinTypeName/experienceName rendered as raw HTML, full `CabinType::all()` + `Experience::all()` loaded on every instantiation, 5 hardcoded AJAX routes + 3 hardcoded Blade paths, all-Italian UI strings.

**Migration priority: HIGH** — Multiple active production bugs (off-by-one click handlers) plus no auth and XSS vectors.