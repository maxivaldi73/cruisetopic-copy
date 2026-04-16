# Cruise DataTables (2 files)

**Files:**
- `DataTables/Cruise/CruisesDataTable.php`
- `DataTables/Cruise/CruisePricesDataTable.php`

**Namespace:** `App\DataTables\Cruise`  
**Priority:** HIGH — core catalog data powering search and booking

---

## 1. CruisesDataTable

### Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Cruise` |
| **Complexity** | HIGH |
| **Columns** | 15 (cruiseline_name, ship_name, code, package, itinerary_id, availability, sellability, departure_date, duration, max_occupancy, is_immediate_confirm, best_for_you, best_price, score, action) |
| **Special Features** | 4 boolean badge columns with select filters; `best_for_you` inline AJAX click-toggle; SearchBuilder enabled |

### Query

```php
public function query(Cruise $model): QueryBuilder {
    return $model->newQuery();
    // ⚠️ No authorization — ALL cruises returned
    // ⚠️ No select() — fetches all columns (potential memory issue at scale)
    // ⚠️ No eager loading declared here — N+1 risk for cruiseline_name / ship_name
    //    (relies on addColumn callbacks accessing $cruise->cruiseline->name)
}
```

### Columns (15 total)

| Index | Column | Type | Notes |
|-------|--------|------|-------|
| 0 | `cruiseline_name` | Computed | `$cruise->cruiseline->name` — N+1 risk |
| 1 | `ship_name` | Computed | `$cruise->ship->name` — N+1 risk |
| 2 | `code` | Direct | Cruise code |
| 3 | `package` | Direct | Package identifier |
| 4 | `itinerary_id` | Direct | ⚠️ Raw FK — should show itinerary code |
| 5 | `availability` | Badge | Green/Red "Abilitato"/"Disabilitato" |
| 6 | `sellability` | Badge | Green/Red "Abilitato"/"Disabilitato" |
| 7 | `departure_date` | Formatted | `d/m/Y` via Carbon |
| 8 | `duration` | Direct | Filter: exact integer match |
| 9 | `max_occupancy` | Direct | — |
| 10 | `is_immediate_confirm` | Badge | Green/Red "Abilitato"/"Disabilitato" |
| 11 | `best_for_you` | Badge | Green/Red; clickable AJAX toggle at index 12 (⚠️ off-by-one?) |
| 12 | `best_price` | Direct | Filter: exact integer match |
| 13 | `score` | Direct | — |
| 14 | `action` | Blade partial | `components.custom.datatables.actions.cruise.btn-actions` |

### `best_for_you` AJAX Toggle

```php
$bestForYouToggle = $this->dataTableService->generateColumnClickScript(
    $table,
    12,                                        // ⚠️ Script targets column 12 (best_price), not 11 (best_for_you)
    '/admin/cruises/update/bestforyou',        // ⚠️ Hardcoded GET route for state mutation
    'Il record è stato modificato con successo!', // ⚠️ Italian success message
    'Rilevato problema nella modifica del record.' // ⚠️ Italian error message
);
// ⚠️ Likely off-by-one: best_for_you is col 11 (0-based), script targets col 12 (best_price)
// ⚠️ GET request for state mutation — no CSRF protection
```

### Boolean Badge Helper

```php
private function getBoolean(Cruise $cruise, string $column): string {
    if ($cruise->$column) {
        return '<span class="badge py-2 px-3 rounded-pill text-bg-success" style="cursor: pointer">Abilitato</span>';
    } else {
        return '<span class="badge ... text-bg-danger" style="cursor: pointer">Disabilitato</span>';
    }
    // ⚠️ Italian: "Abilitato" / "Disabilitato"
    // ⚠️ Inline style: cursor:pointer
    // ⚠️ Bootstrap classes, not Tailwind
}
```

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All cruises visible to any user |
| 2 | 🔴 CRITICAL | **`best_for_you` toggle uses GET** — `/admin/cruises/update/bestforyou` (no CSRF) |
| 3 | ⚠️ HIGH | **Off-by-one on toggle script** — Column index `12` targets `best_price` not `best_for_you` (index `11`) |
| 4 | ⚠️ HIGH | **N+1 queries** — `cruiseline->name` and `ship->name` accessed without eager loading in query |
| 5 | ⚠️ HIGH | **`itinerary_id` raw FK** — Displays numeric ID, not itinerary code/name |
| 6 | ⚠️ HIGH | **Italian UI strings** — 4 badge types + 2 AJAX messages all in Italian |
| 7 | ⚠️ HIGH | **Hardcoded Blade path** — `components.custom.datatables.actions.cruise.btn-actions` |
| 8 | ⚠️ HIGH | **Hardcoded route** — `/admin/cruises/update/bestforyou` in click script |
| 9 | ⚠️ MEDIUM | **No `select()` on query** — Fetches all columns, wasteful at scale |
| 10 | ⚠️ MEDIUM | **`getCustomButtons` commented out** — `$customButtons = []` — empty button bar, likely a forgotten TODO |
| 11 | ⚠️ MEDIUM | **`distinctFilters` string indices** — `'5'`, `'6'`, `'10'`, `'11'` as string keys |
| 12 | ℹ️ LOW | **`SearchBuilder` enabled** — Global, may conflict with per-column filters |

---

## 2. CruisePricesDataTable

### Overview

| Aspect | Value |
|--------|-------|
| **Model** | `CruisePrice` |
| **Complexity** | MEDIUM |
| **Columns** | 14 (category, lafPrice, lafPricePax1–6, taxPax1–2, fareCode, cabinPrice, totalPrice, enabled) |
| **Special Features** | Constructor-injected `$cruiseId` (sub-table); 11 price columns all EUR-formatted; `cabin_name` resolved via relationship |
| **Scope** | Sub-table scoped to a specific `cruiseId` |

### Query

```php
public function query(CruisePrice $model): QueryBuilder {
    return $model->newQuery()->where('cruise_id', $this->cruiseId);
    // ⚠️ No authorization — any user with the cruiseId can access prices
    // ⚠️ $cruiseId injected via constructor — non-standard DI pattern
    // ⚠️ No eager load for cabin relationship (used in cabin_name addColumn)
}
```

### Constructor Injection Pattern

```php
public function __construct(DataTableService $dataTableService,
                            FilterService $filterService,
                            $cruiseId)   // ⚠️ Untyped — could be null or string
{
    $this->cruiseId = $cruiseId;
    // ⚠️ No validation that $cruiseId is a valid integer
    // ⚠️ No check if cruise exists
}
```

### Price Columns (11 formatted)

```php
// All use Italian number format: comma decimal, dot thousands, hardcoded €
->editColumn('lafPrice',       fn($cp) => '€ ' . number_format($cp->lafPrice,       2, ',', '.'))
->editColumn('lafPricePax1',   fn($cp) => '€ ' . number_format($cp->lafPricePax1,   2, ',', '.'))
->editColumn('lafPricePax2',   fn($cp) => '€ ' . number_format($cp->lafPricePax2,   2, ',', '.'))
->editColumn('lafPricePax3',   fn($cp) => '€ ' . number_format($cp->lafPricePax3,   2, ',', '.'))
->editColumn('lafPricePax4',   fn($cp) => '€ ' . number_format($cp->lafPricePax4,   2, ',', '.'))
->editColumn('lafPricePax5',   fn($cp) => '€ ' . number_format($cp->lafPricePax5,   2, ',', '.'))
->editColumn('lafPricePax6',   fn($cp) => '€ ' . number_format($cp->lafPricePax6,   2, ',', '.'))
->editColumn('taxPax1',        fn($cp) => '€ ' . number_format($cp->taxPax1,        2, ',', '.'))
->editColumn('taxPax2',        fn($cp) => '€ ' . number_format($cp->taxPax2,        2, ',', '.'))
->editColumn('cabinPrice',     fn($cp) => '€ ' . number_format($cp->cabinPrice,     2, ',', '.'))
->editColumn('totalPrice',     fn($cp) => '€ ' . number_format($cp->totalPrice,     2, ',', '.'))
// ⚠️ All hardcoded Italian format + EUR symbol
// ⚠️ No null check — will throw if price is null
```

### Cabin Name (Relationship + Null-Safe)

```php
->addColumn('cabin_name', function (CruisePrice $cp) {
    return $cp->cabin_id && $cp->cabin ? $cp->cabin->name : '';
    // ✅ Null-safe: checks cabin_id AND cabin before accessing name
    // ⚠️ N+1: cabin not eager loaded in query
})
->filterColumn('cabin_name', function ($query, $keyword) {
    $query->whereHas('cabin', fn($q) => $q->where('name', 'like', "%{$keyword}%"))
          ->orWhereNull('cabin_id');
    // ⚠️ orWhereNull includes ALL unassociated prices when keyword is typed
})
```

### Distinct Filter Values (Scoped)

```php
// ✅ Correctly scoped to current cruise_id — does not load all prices
CruisePrice::query()->select('category','cabin_id')
    ->where('cruise_id', $this->cruiseId)
    ->distinct()->orderBy('category')->get()
    ->map(fn($item) => [
        'id'   => (string)$item->category,
        'nome' => $item->category.' - '.($item->cabin?->name ?? 'Non Associata') // ⚠️ Italian
    ])

CruisePrice::query()->select('fareCode','fareDesc')
    ->where('cruise_id', $this->cruiseId)
    ->distinct()->orderBy('fareCode')->get()
    ->map(fn($item) => [
        'id'   => (string)$item->fareCode,
        'nome' => $item->fareDesc
    ])
// ⚠️ camelCase field names (lafPrice, fareCode) — non-standard Laravel convention
```

### Columns (14 total)

| Index | Column | Notes |
|-------|--------|-------|
| 0 | `category` | Select filter (distinct scoped) |
| 1 | `lafPrice` | Best price — EUR formatted |
| 2 | `fareCode` | Select filter (distinct scoped) |
| 3–8 | `lafPricePax1–6` | Per-pax prices — EUR formatted |
| 9–10 | `taxPax1–2` | Per-pax taxes — EUR formatted |
| 11 | `cabinPrice` | EUR formatted |
| 12 | `totalPrice` | EUR formatted |
| 13 | `enabled` | ⚠️ Direct — not formatted as badge |

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — Cruise pricing data exposed without auth |
| 2 | ⚠️ HIGH | **Null crash on price columns** — `number_format(null, ...)` will throw |
| 3 | ⚠️ HIGH | **camelCase field names** — `lafPrice`, `fareCode`, `taxPax1` etc. non-standard Laravel |
| 4 | ⚠️ HIGH | **N+1 on `cabin`** — relationship not eager loaded in query |
| 5 | ⚠️ HIGH | **Italian in distinct filter** — `'Non Associata'` label |
| 6 | ⚠️ HIGH | **Hardcoded Italian EUR format** — `number_format(..., ',', '.')` |
| 7 | ⚠️ HIGH | **`enabled` column not formatted** — Displays raw boolean (1/0), no badge |
| 8 | ⚠️ MEDIUM | **Untyped `$cruiseId`** — No type hint, no validation |
| 9 | ⚠️ MEDIUM | **`orWhereNull('cabin_id')` on search** — Returns all unlinked prices alongside keyword matches |
| 10 | ℹ️ LOW | **`cabin_name` not in `getColumns()`** — The computed column has no matching Column definition |

---

## 📝 Migration to Base44

### Entities

```json
// Cruise entity (subset of key fields)
{
  "name": "Cruise",
  "type": "object",
  "properties": {
    "cruiseline_id":     { "type": "string" },
    "ship_id":           { "type": "string" },
    "itinerary_id":      { "type": "string" },
    "code":              { "type": "string" },
    "package":           { "type": "string" },
    "departure_date":    { "type": "string", "format": "date" },
    "duration":          { "type": "integer" },
    "max_occupancy":     { "type": "integer" },
    "availability":      { "type": "boolean", "default": true },
    "sellability":       { "type": "boolean", "default": true },
    "is_immediate_confirm": { "type": "boolean", "default": false },
    "best_for_you":      { "type": "boolean", "default": false },
    "best_price":        { "type": "number" },
    "score":             { "type": "number" }
  },
  "required": ["code", "departure_date"]
}

// CruisePrice entity
{
  "name": "CruisePrice",
  "type": "object",
  "properties": {
    "cruise_id":     { "type": "string" },
    "cabin_id":      { "type": "string" },
    "category":      { "type": "string" },
    "fare_code":     { "type": "string", "description": "renamed from fareCode" },
    "fare_desc":     { "type": "string", "description": "renamed from fareDesc" },
    "best_price":    { "type": "number" },
    "price_pax1":    { "type": "number" },
    "price_pax2":    { "type": "number" },
    "price_pax3":    { "type": "number" },
    "price_pax4":    { "type": "number" },
    "price_pax5":    { "type": "number" },
    "price_pax6":    { "type": "number" },
    "tax_pax1":      { "type": "number" },
    "tax_pax2":      { "type": "number" },
    "cabin_price":   { "type": "number" },
    "total_price":   { "type": "number" },
    "enabled":       { "type": "boolean", "default": true }
  },
  "required": ["cruise_id", "category"]
}
```

### Backend Functions

```typescript
// functions/getCruises.js — with eager resolution of names
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { search = '', availability = '', sellability = '', dateFrom = '' } = await req.json();
  const filters = {};
  if (search) filters.code = { $regex: search, $options: 'i' };
  if (availability !== '') filters.availability = availability === 'true';
  if (sellability  !== '') filters.sellability  = sellability  === 'true';
  if (dateFrom) filters.departure_date = { $gte: dateFrom };

  const cruises = await base44.entities.Cruise.filter(filters, '-departure_date');
  return Response.json({ data: cruises });
});

// functions/toggleBestForYou.js — PATCH, not GET
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { cruiseId } = await req.json();
  const cruise = await base44.entities.Cruise.get(cruiseId);
  await base44.entities.Cruise.update(cruiseId, { best_for_you: !cruise.best_for_you });
  return Response.json({ success: true, best_for_you: !cruise.best_for_you });
});

// functions/getCruisePrices.js
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { cruise_id, category = '', fare_code = '' } = await req.json();
  if (!cruise_id) return Response.json({ error: 'cruise_id required' }, { status: 400 });

  const filters = { cruise_id };
  if (category)  filters.category  = category;
  if (fare_code) filters.fare_code = fare_code;

  const prices = await base44.entities.CruisePrice.filter(filters);
  return Response.json({ data: prices });
});
```

### React UI Notes

```tsx
// Boolean badge columns — English, Tailwind, no inline style
const BooleanBadge = ({ value, onClick }) => (
  <Badge
    variant={value ? 'default' : 'destructive'}
    className="cursor-pointer select-none"
    onClick={onClick}
  >
    {value ? 'Active' : 'Inactive'}
  </Badge>
);

// Price cell — use Intl, null-safe
const PriceCell = ({ amount, currency = 'EUR' }) =>
  amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    : '—';

// CruisePrices sub-table — passed cruiseId as prop, no constructor injection
const CruisePricesTable = ({ cruiseId }) => { /* fetch via getCruisePrices */ };
```

### Key Improvements

1. **Admin-only authorization** on both
2. **PATCH for `best_for_you` toggle** — replaces CSRF-unprotected GET
3. **Fix off-by-one** — toggle correctly wired to `best_for_you` column
4. **Eager loading** — resolve cruiseline/ship/cabin names server-side
5. **snake_case field names** — `fare_code`, `best_price`, `price_pax1` etc. (replaces camelCase)
6. **Null-safe price formatting** — `Intl.NumberFormat` with `?? '—'` fallback
7. **English UI** — all badge labels and error messages
8. **`best_for_you` as clickable badge** — React `onClick` replaces column-click AJAX pattern
9. **`itinerary_id` → show itinerary code** — lookup from Itinerary entity

---

## Summary

**CruisesDataTable** (8.7 KB): 15-column master cruise catalog with 4 boolean badge columns (availability, sellability, immediate confirm, best_for_you) and a `best_for_you` AJAX click-toggle. CRITICAL: no auth, GET-for-mutation on toggle. HIGH: probable off-by-one (script targets column 12 / `best_price` instead of 11 / `best_for_you`), N+1 on cruiseline/ship names, raw `itinerary_id` FK, Italian strings, empty `$customButtons = []` (TODO left). SearchBuilder enabled.

**CruisePricesDataTable** (7.7 KB): 14-column pricing sub-table scoped to a `cruiseId` injected via constructor. 11 price columns all formatted with hardcoded Italian EUR format. CRITICAL: no auth (pricing data exposed). HIGH: null crash risk on `number_format(null)`, non-standard camelCase field names (`lafPrice`, `fareCode`), N+1 on cabin, Italian "Non Associata" label. MEDIUM: untyped `$cruiseId`, `enabled` column displayed as raw boolean.

**Migration priority: HIGH** — Core catalog + pricing data powering all booking/search flows. Auth gaps expose sensitive pricing to any user.