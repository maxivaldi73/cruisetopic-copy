# CurrenciesDataTable

**File:** `DataTables/Currency/CurrenciesDataTable.php`  
**Namespace:** `App\DataTables\Currency`  
**Type:** Financial configuration / lookup — **MEDIUM priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Currency` |
| **Complexity** | VERY LOW |
| **Columns** | 5 (code, symbol, primary, exchange_rate, action) |
| **Special Feature** | `primary` badge (Yes/No), `exchange_rate` field |

---

## 🔧 Implementation

### Query
```php
public function query(Currency $model): QueryBuilder {
    return $model->newQuery();
    // ⚠️ No authorization — all currencies visible
    // ⚠️ No ordering enforced in query (relies on DataTable order [[0, 'desc']])
    // ⚠️ No relationships; model is standalone
}
```

### Columns (5 total)

| Index | Column | Searchable | Notes |
|-------|--------|-----------|-------|
| 0 | `code` | ✅ | ISO 4217 currency code (e.g. EUR, USD) |
| 1 | `symbol` | ✅ | Currency symbol (e.g. €, $) |
| 2 | `primary` | ❌ | Badge: green "Yes" / grey "No" — `searchable(false)` |
| 3 | `exchange_rate` | ✅ | Numeric rate — no formatting |
| 4 | `action` | ❌ | Blade partial |

### Badge Rendering

```php
->editColumn('primary', function ($row) {
    return $row->primary
        ? '<span class="badge bg-success">Yes</span>'
        : '<span class="badge bg-secondary">No</span>';
    // ✅ English labels (Yes/No) — rare in this codebase
    // ⚠️ Bootstrap class `bg-success`/`bg-secondary` — not Tailwind
    // ⚠️ No click-to-toggle for primary currency
})
```

### Action Column

```php
->addColumn('action', function ($row) {
    return view('admin.currencies.action', compact('row'))->render();
    // ✅ Correct use of ->render()
    // ⚠️ Passes $row (not $currency) — inconsistent naming convention
    // ⚠️ Hardcoded Blade path: admin.currencies.action
})
```

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All currencies visible to any user |
| 2 | ⚠️ HIGH | **No primary-currency enforcement** — Multiple currencies could have `primary=true` with no uniqueness guard |
| 3 | ⚠️ HIGH | **`exchange_rate` unformatted** — Raw float; no decimal precision or base currency label |
| 4 | ⚠️ HIGH | **Hardcoded Blade path** — `admin.currencies.action` |
| 5 | ⚠️ HIGH | **Hardcoded route** — `route('currencies.create')` in onclick button |
| 6 | ⚠️ MEDIUM | **Variable naming** — Action compact passes `$row` instead of `$currency` |
| 7 | ⚠️ MEDIUM | **No `is_active` field** — Can't disable a currency without deleting it |
| 8 | ⚠️ MEDIUM | **`exchange_rate` has no base currency reference** — Rate relative to what? (EUR? USD?) |
| 9 | ⚠️ MEDIUM | **Unused `FilterService`** — Injected but never called |
| 10 | ℹ️ LOW | **Bootstrap badge classes** — `bg-success`/`bg-secondary` not Tailwind |

---

## 📝 Migration to Base44

### Entity

```json
{
  "name": "Currency",
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "description": "ISO 4217 currency code (e.g. EUR, USD)"
    },
    "symbol": {
      "type": "string",
      "description": "Currency symbol (e.g. €, $)"
    },
    "name": {
      "type": "string",
      "description": "Full currency name (e.g. Euro, US Dollar)"
    },
    "is_primary": {
      "type": "boolean",
      "default": false,
      "description": "Whether this is the base/primary currency"
    },
    "exchange_rate": {
      "type": "number",
      "description": "Exchange rate relative to the primary currency"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["code", "symbol"]
}
```

### Backend Function

```typescript
// functions/getCurrencies.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const currencies = await base44.entities.Currency.list('-created_date');
  return Response.json({ data: currencies });
});

// functions/setPrimaryCurrency.js — enforce single primary
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { currencyId } = await req.json();

  // Unset all existing primaries first
  const all = await base44.asServiceRole.entities.Currency.list();
  await Promise.all(
    all.filter(c => c.is_primary).map(c =>
      base44.asServiceRole.entities.Currency.update(c.id, { is_primary: false })
    )
  );
  await base44.asServiceRole.entities.Currency.update(currencyId, { is_primary: true });
  return Response.json({ success: true });
});
```

### React UI Notes

```tsx
// Primary badge — show base currency prominently, allow click to set primary
const PrimaryBadge = ({ isPrimary, onSetPrimary }) => isPrimary
  ? <Badge variant="default">Primary</Badge>
  : <Badge variant="outline" className="cursor-pointer" onClick={onSetPrimary}>Set Primary</Badge>;

// Exchange rate — display with 4 decimal places and base currency label
const ExchangeRateCell = ({ rate, primaryCode }) => (
  <span className="font-mono text-sm">
    {rate != null ? `1 ${primaryCode} = ${rate.toFixed(4)}` : '—'}
  </span>
);
```

### Key Improvements

1. **Admin-only authorization**
2. **`setPrimaryCurrency` backend function** — atomically unsets all others before setting new primary (enforces uniqueness)
3. **`is_active` field** — soft-disable currencies without deleting them
4. **`name` field** — full currency name alongside code/symbol
5. **ISO 4217 code validation** — regex `^[A-Z]{3}$`
6. **Exchange rate display** — contextual label showing base currency
7. **Consistent variable naming** — `currency` not `row`

---

## Summary

**CurrenciesDataTable** (4.6 KB): Very simple 5-column financial lookup table (code, symbol, primary flag, exchange rate, action). English badge labels (rare in this codebase — "Yes"/"No"). CRITICAL: no auth. HIGH: no uniqueness enforcement for `primary` currency (multiple primaries possible), `exchange_rate` raw float with no base currency context, hardcoded Blade/route. MEDIUM: no `is_active`, unused FilterService, inconsistent `$row` variable naming.

**Migration priority: MEDIUM** — Small lookup table but underpins all pricing/currency logic. Lack of primary uniqueness enforcement is a data integrity risk.