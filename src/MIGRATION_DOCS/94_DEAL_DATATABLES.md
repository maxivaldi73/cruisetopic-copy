# Deal DataTables (3 files)

**Files:**
- `DataTables/Deal/DealsDataTable.php`
- `DataTables/Deal/DealTypesDataTable.php`
- `DataTables/Deal/DealCruisesDataTable.php`

**Namespace:** `App\DataTables\Deal`  
**Priority:** HIGH — deals are core commercial logic

---

## 1. DealsDataTable

### Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Deal` |
| **Complexity** | MEDIUM |
| **Columns** | 8 (id, market, title, score, valid_from, valid_to, is_active, action) |
| **Special Feature** | `is_active` badge with clickable select filter |

### Query
```php
public function query(Deal $model): QueryBuilder {
    return $model->newQuery()
        ->select(['id', 'title', 'score', 'market_id', 'valid_from', 'valid_to', 'is_active'])
        ->with('market');
    // ⚠️ No authorization — all deals visible
    // ✅ Explicit select + eager load market (no N+1)
}
```

### Columns (8 total)

| Index | Column | Notes |
|-------|--------|-------|
| 0 | `id` | — |
| 1 | `market` | Computed from `market->name` via `optional()` |
| 2 | `title` | — |
| 3 | `score` | — |
| 4 | `valid_from` | `d/m/Y` formatted via Carbon |
| 5 | `valid_to` | `d/m/Y` formatted via Carbon |
| 6 | `is_active` | Badge: "Attivo" / "Disabilitato" — Italian labels |
| 7 | `action` | Blade partial |

### Badge / Boolean Rendering

```php
private function getBoolean(Deal $deal, string $column): string {
    if ($deal->$column) {
        return '<span class="badge ... bg-label-success" style="cursor: pointer">Attivo</span>';
    } else {
        return '<span class="badge ... bg-label-danger" style="cursor: pointer">Disabilitato</span>';
    }
    // ⚠️ Italian: "Attivo" / "Disabilitato"
    // ⚠️ Inline style cursor:pointer
}
```

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** |
| 2 | ⚠️ HIGH | **Italian UI strings** — "Attivo", "Disabilitato", "Abilitato", "Aggiungi Deals" (button) |
| 3 | ⚠️ HIGH | **Hardcoded Blade path** — `components.custom.datatables.actions.deal.btn-actions` |
| 4 | ⚠️ HIGH | **Hardcoded route** — `route('deals.create')` in onclick |
| 5 | ⚠️ MEDIUM | **`score` not explained** — Numeric field with no unit or context in UI |
| 6 | ⚠️ MEDIUM | **Date format `d/m/Y`** — Not ISO 8601; localized Italian convention |
| 7 | ⚠️ MEDIUM | **`distinctFilters` index `'6'`** — magic string-key column index for is_active |
| 8 | ℹ️ LOW | **Inline style on badge** — `style="cursor: pointer"` |

---

## 2. DealTypesDataTable

### Overview

| Aspect | Value |
|--------|-------|
| **Model** | `DealType` |
| **Complexity** | LOW |
| **Columns** | 6 (id, title, market_id, discount_amount, discount_percent, action) |
| **Special Feature** | Dual discount columns (fixed amount + percentage) |

### Query
```php
public function query(DealType $model): QueryBuilder {
    return $model->newQuery()->with('market');
    // ⚠️ No authorization — all deal types visible
    // ✅ Eager load market
}
```

### Columns (6 total)

| Index | Column | Notes |
|-------|--------|-------|
| 0 | `id` | — |
| 1 | `title` | Deal type label |
| 2 | `market_id` | Replaced by `market->title` via null-safe `?->` |
| 3 | `discount_amount` | Formatted: `number_format(2, ',', '.') . ' €'` — Italian locale |
| 4 | `discount_percent` | Formatted: `value . '%'` |
| 5 | `action` | Blade partial |

### Formatting Helpers

```php
private function formatCurrency(?float $value): string {
    return $value !== null ? number_format($value, 2, ',', '.') . ' €' : '-';
    // ⚠️ Hardcoded Italian number format (comma decimal, dot thousands)
    // ⚠️ Hardcoded EUR symbol €
}

private function formatPercent(?float $value): string {
    return $value !== null ? $value . '%' : '-';
    // ✅ Null-safe with fallback '-'
}
```

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** |
| 2 | ⚠️ HIGH | **Hardcoded Italian currency format** — comma/dot, EUR symbol |
| 3 | ⚠️ HIGH | **No market scoping** — All deal types shown regardless of market |
| 4 | ⚠️ HIGH | **Hardcoded Blade path** — `components.custom.datatables.actions.dealtype.btn-actions` |
| 5 | ⚠️ HIGH | **Hardcoded route** — `route('deal-types.create')` in onclick |
| 6 | ⚠️ MEDIUM | **`market_id` column key** — uses raw FK column name, resolved client-side to `market->title` |
| 7 | ℹ️ LOW | **No `is_active` for DealType** — Can't disable individual deal type templates |

---

## 3. DealCruisesDataTable

### Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Cruise` |
| **Complexity** | HIGH |
| **Columns** | 7 (checkbox, cruiseline_name, ship_name, code, itinerary_id, departure_date, duration) |
| **Special Feature** | Checkbox-driven AJAX cruise association, deal filter application, "associated only" toggle |

### Query — Complex Multi-Join with Deal Filter Context

```php
public function query(Cruise $model): QueryBuilder {
    $query = $model->newQuery()
        ->select('cruises.*')
        ->with(['cruiseline', 'ship']); // ✅ Eager load

    // Dynamic joins based on dealFilters
    if (!empty($ports)) {
        $query->join('itineraries', 'itineraries.id', '=', 'cruises.itinerary_id')
              ->whereIn('itineraries.departure_port_id', $ports);
    }

    if (!empty($destinations)) {
        // Re-join itineraries if not already joined
        $query->join('itinerary_destination as idest', 'idest.itinerary_id', '=', 'itineraries.id')
              ->whereIn('idest.destination_id', $destinations);
    }

    // distinct to avoid duplicates from pivot joins
    if ($joinedItineraries) { $query->distinct('cruises.id'); }

    // "Only associated" filter via request param
    if (request()->input('filter') === 'associated') { ... }
    // ⚠️ No authorization
    // ⚠️ Dead code: $dealId read but commented out (dd($dealId))
}
```

### Columns (7 total)

| Index | Column | Notes |
|-------|--------|-------|
| 0 | `checkbox` | HTML checkbox, pre-checked from `dealFilters['cruises']` |
| 1 | `cruiseline_name` | From `cruise->cruiseline->name` — ⚠️ N+1 if eager load fails |
| 2 | `ship_name` | From `cruise->ship->name` — ⚠️ N+1 if eager load fails |
| 3 | `code` | Cruise code |
| 4 | `itinerary_id` | Raw FK — ⚠️ should show itinerary name/code |
| 5 | `departure_date` | `d/m/Y` formatted via Carbon |
| 6 | `duration` | Duration (days?) |

### AJAX Checkbox Toggle (Cruise Association)

```javascript
// Checkbox change → POST to deals.toggle-cruise
$.ajax({
    url: '{$toggleUrl}',  // route('deals.toggle-cruise', ['dealId' => $dealId])
    method: 'POST',       // ✅ POST with CSRF token
    headers: { 'X-CSRF-TOKEN': csrfToken },
    data: { cruise_id: cruiseId, attach: attach },
    success: function() {
        associatedCount = attach ? associatedCount + 1 : Math.max(0, associatedCount - 1);
        document.dispatchEvent(new CustomEvent('cruiseToggled', { detail: { count: associatedCount } }));
        // ✅ Emits custom DOM event for counter sync
        // ✅ Reloads table when "associated only" filter is active and removing
    },
    error: function() {
        $(checkbox).prop('checked', !attach);
        Swal.fire('Errore', 'Impossibile aggiornare il deal', 'error');
        // ⚠️ Italian error string in SweetAlert
    }
});
```

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — Any user can see all cruise associations |
| 2 | ⚠️ HIGH | **Dead code** — `$dealId` fetched via `getDealId()` but commented out with `dd()` left in |
| 3 | ⚠️ HIGH | **`itinerary_id` raw FK** — Shows numeric ID instead of itinerary name/code |
| 4 | ⚠️ HIGH | **Italian SweetAlert error** — `'Errore', 'Impossibile aggiornare il deal'` |
| 5 | ⚠️ HIGH | **Date format `d/m/Y`** — Italian locale, not ISO |
| 6 | ⚠️ MEDIUM | **Potential N+1** — `cruise->cruiseline->name` and `cruise->ship->name` depend on `with()` chain not being stripped |
| 7 | ⚠️ MEDIUM | **`distinct('cruises.id')`** — MySQL-specific; may not work correctly in all DB engines |
| 8 | ⚠️ MEDIUM | **`request()->input('filter')`** — Direct request access inside query scope (not injected) |
| 9 | ℹ️ LOW | **`setDealId` / `getDealId` unused** — The accessor is never actually used in final logic |

---

## 📝 Migration to Base44

### Entities

```json
// Deal entity
{
  "name": "Deal",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "market_id": { "type": "string", "description": "Ref to Market entity" },
    "score": { "type": "number", "description": "Numeric ranking/quality score" },
    "valid_from": { "type": "string", "format": "date" },
    "valid_to": { "type": "string", "format": "date" },
    "is_active": { "type": "boolean", "default": true },
    "cruise_ids": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Associated cruise IDs (replaces deal_cruise pivot)"
    },
    "deal_type_id": { "type": "string", "description": "Ref to DealType entity" }
  },
  "required": ["title"]
}

// DealType entity
{
  "name": "DealType",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "market_id": { "type": "string", "description": "Ref to Market entity" },
    "discount_amount": { "type": "number", "description": "Fixed discount in EUR" },
    "discount_percent": { "type": "number", "description": "Percentage discount (0-100)" },
    "is_active": { "type": "boolean", "default": true }
  },
  "required": ["title"]
}
```

### Backend Functions

```typescript
// functions/getDeals.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { search = '', market_id = '', is_active = '' } = await req.json();
  const filters = {};
  if (search) filters.title = { $regex: search, $options: 'i' };
  if (market_id) filters.market_id = market_id;
  if (is_active !== '') filters.is_active = is_active === 'true';

  const deals = await base44.entities.Deal.filter(filters, '-created_date');
  return Response.json({ data: deals });
});

// functions/toggleDealCruise.js — replaces AJAX toggle
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { dealId, cruiseId, attach } = await req.json();
  const deal = await base44.entities.Deal.get(dealId);
  const current = deal.cruise_ids ?? [];
  const updated = attach
    ? [...new Set([...current, cruiseId])]
    : current.filter(id => id !== cruiseId);

  await base44.entities.Deal.update(dealId, { cruise_ids: updated });
  return Response.json({ success: true, count: updated.length });
});
```

### React UI Notes

```tsx
// DealCruises — replace checkbox column with toggle approach
const CruiseRow = ({ cruise, isAssociated, onToggle }) => (
  <TableRow>
    <TableCell>
      <Checkbox checked={isAssociated} onCheckedChange={() => onToggle(cruise.id)} />
    </TableCell>
    <TableCell>{cruise.cruiseline?.name}</TableCell>
    <TableCell>{cruise.ship?.name}</TableCell>
    <TableCell>{cruise.code}</TableCell>
    <TableCell>{cruise.itinerary?.code ?? cruise.itinerary_id}</TableCell>  {/* Show code, not raw ID */}
    <TableCell>{format(new Date(cruise.departure_date), 'dd/MM/yyyy')}</TableCell>
    <TableCell>{cruise.duration}d</TableCell>
  </TableRow>
);

// DealTypes — currency formatter (use Intl, not hardcoded Italian format)
const formatCurrency = (amount, currency = 'EUR') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount ?? 0);
```

### Key Improvements

1. **Admin-only authorization** on all three
2. **`cruise_ids` array on Deal** — replaces `deal_cruise` pivot table; toggles via array update
3. **`Intl.NumberFormat`** replaces hardcoded `number_format(..., ',', '.')` Italian locale
4. **English UI labels** — replaces all Italian strings
5. **`itinerary_id` → show itinerary code** — join/lookup to display human-readable value
6. **Dead code removed** — `$dealId` / `getDealId()` not carried forward
7. **Custom event → React state** — `cruiseToggled` DOM event replaced by React state update
8. **`is_active` on DealType** — ability to soft-disable deal type templates
9. **ISO 8601 dates** — `yyyy-MM-dd` storage, locale formatting via `date-fns`

---

## Summary

**DealsDataTable** (5.8 KB): 8-column deal listing with market, date range, score, and active status. CRITICAL: no auth. HIGH: Italian strings ("Attivo", "Disabilitato", "Aggiungi Deals"), hardcoded Blade/route. MEDIUM: magic column index for `distinctFilters`, Italian date format.

**DealTypesDataTable** (4.8 KB): 6-column deal type templates with fixed/percent discount display. Very simple. CRITICAL: no auth. HIGH: hardcoded Italian EUR format, no market scoping, hardcoded Blade/route.

**DealCruisesDataTable** (10.4 KB): Most complex of the three. Checkbox-driven cruise-to-deal association with AJAX POST toggle, "associated only" toggle, multi-join filtering by cruiseline/port/destination. CRITICAL: no auth. HIGH: dead `dd()` code, raw `itinerary_id` FK shown, Italian error string. MEDIUM: N+1 risk, MySQL-specific `distinct()`, direct `request()` injection in query.

**Migration priority: HIGH** — Deals are core commercial/promotional logic with active AJAX state mutation and no auth layer.