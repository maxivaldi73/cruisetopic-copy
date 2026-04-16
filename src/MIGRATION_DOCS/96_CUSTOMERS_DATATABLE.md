# CustomersDataTable

**File:** `DataTables/Customer/CustomersDataTable.php`  
**Namespace:** `App\DataTables\Customer`  
**Type:** CRM core — **HIGH priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Customer` |
| **Complexity** | MEDIUM |
| **Columns** | 4 (firstname/avatar, region_summary, created_at, action) |
| **Special Feature** | Avatar partial (`datatables-avatar`) with name + phone + email; `DatePickerQueryFilter` trait for date-range filtering |

---

## 🔧 Implementation

### Traits Used

```php
use App\Traits\DatePickerQueryFilter;
// Provides: applyDateRangeFilter($query, $keyword, $column)
// Used for: created_at date-range filter
// ⚠️ Undocumented trait — implementation unknown, potential injection risk
```

### Query

```php
public function query(Customer $model): QueryBuilder {
    return $model->newQuery()->orderByDesc('created_at');
    // ⚠️ No authorization — all customers visible to any user
    // ⚠️ No eager loading — avatar column accesses phone/email directly on $customer
    //    (these are likely direct columns, not relationships — no N+1 in this case)
    // ✅ Ordered by created_at desc
}
```

### Data Transformation

```php
// Avatar + name + contact info — via shared Blade partial
->editColumn('firstname', $this->generateNameElement())
// Note: editColumn on 'firstname' — replaces the firstname value with full HTML avatar block

private function generateNameElement() {
    return function(Customer $customer) {
        $fullName = trim(($customer->firstname ?? '') . ' ' . ($customer->lastname ?? ''));
        return view('_partials.datatables.datatables-avatar', [
            'name'     => $fullName !== '' ? $fullName : ($customer->firstname ?? 'N/A'),
            'lastname' => null,                    // ⚠️ Always null — lastname not passed!
            'phone'    => $customer->phone,
            'email'    => $customer->email,
        ]);
        // ⚠️ Returns View object — NOT calling ->render()
        // ⚠️ 'lastname' always null — probably a bug (was previously passed, now removed)
        // ⚠️ Hardcoded Blade path: _partials.datatables.datatables-avatar
    };
}

// Region summary — computed from city + country
->addColumn('region_summary', function (Customer $customer) {
    $city    = ucwords(strtolower($customer->city ?? ''));
    $country = strtoupper($customer->country ?? '');
    return trim($city . ($city && $country ? ', ' : '') . $country) ?: '-';
    // ✅ Null-safe with fallback '-'
    // ✅ Proper city/country formatting
})

// Created at — locale-aware via Carbon::isoFormat
->addColumn('created_at', function (Customer $customer) {
    return $customer->created_at
        ? Carbon::parse($customer->created_at)
            ->locale(session('locale', app()->getLocale()))
            ->isoFormat('DD MMM YYYY')
        : '';
    // ✅ Uses session locale — more i18n-aware than hardcoded Italian
    // ⚠️ Still locale-session dependent (not UTC-stored display)
})
```

### Columns (4 total)

| Index | Column | Searchable | Notes |
|-------|--------|-----------|-------|
| 0 | `firstname` | ✅ | Avatar partial with full name + phone + email |
| 1 | `region_summary` | ✅ (mapped to `city`) | `city, COUNTRY` computed |
| 2 | `created_at` | ✅ (date-range via trait) | Locale-aware `isoFormat` |
| 3 | `action` | ❌ | Blade partial |

### Date Filter

```php
->filterColumn('customers.created_at', function($query, $keyword) {
    $this->applyDateRangeFilter($query, 'customers.created_at', $keyword);
    // ⚠️ Uses table-qualified column name — OK for joins, unusual here
})

// Column definition uses date-range-filter CSS class
Column::make('created_at')
    ->name('customers.created_at')
    ->addClass('date-range-filter')
    ->orderable(true)
// ⚠️ JS silences date inputs: window.dtSilenceDateFilters(...)
// — relies on global JS function being present at runtime
```

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All customers visible to any authenticated user |
| 2 | 🔴 CRITICAL | **PII exposed without auth** — Phone, email, city rendered in table for all users |
| 3 | ⚠️ HIGH | **Missing `->render()`** — `generateNameElement()` returns View object, not string (likely rendering bug) |
| 4 | ⚠️ HIGH | **`lastname` always null** — Avatar partial receives `null` for lastname, probably a regression |
| 5 | ⚠️ HIGH | **Hardcoded Blade path** — `_partials.datatables.datatables-avatar` and `admin.customers.partials.btn-actions` |
| 6 | ⚠️ HIGH | **Hardcoded route** — `route('customers.create')` in onclick |
| 7 | ⚠️ HIGH | **`DatePickerQueryFilter` trait undocumented** — Unknown implementation; potential query injection |
| 8 | ⚠️ MEDIUM | **`window.dtSilenceDateFilters` global dependency** — Relies on external JS function presence |
| 9 | ⚠️ MEDIUM | **Table-qualified column name `customers.created_at`** — Fragile if query/alias changes |
| 10 | ⚠️ MEDIUM | **Only 4 columns** — No email, phone, market, or status columns visible in table |
| 11 | ℹ️ LOW | **`region_summary` searchable as `city`** — Country not separately searchable |

---

## 📝 Migration to Base44

### Entity

```json
{
  "name": "Customer",
  "type": "object",
  "properties": {
    "firstname": { "type": "string" },
    "lastname": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "city": { "type": "string" },
    "country": { "type": "string", "description": "ISO 3166-1 alpha-2 country code" },
    "market_id": { "type": "string", "description": "Ref to Market entity" },
    "notes": { "type": "string" },
    "is_active": { "type": "boolean", "default": true }
  },
  "required": ["firstname", "email"]
}
```

### Backend Function

```typescript
// functions/getCustomers.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { search = '', market_id = '', dateFrom = '', dateTo = '' } = await req.json();

  const filters = {};
  if (search) {
    filters.$or = [
      { firstname: { $regex: search, $options: 'i' } },
      { lastname:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];
  }
  if (market_id) filters.market_id = market_id;
  if (dateFrom) filters.created_date = { $gte: dateFrom };
  if (dateTo)   filters.created_date = { ...filters.created_date, $lte: dateTo };

  const customers = await base44.entities.Customer.filter(filters, '-created_date');
  return Response.json({ data: customers });
});
```

### React UI Notes

```tsx
// Avatar cell — proper full name + contact info
const CustomerCell = ({ customer }) => {
  const fullName = [customer.firstname, customer.lastname].filter(Boolean).join(' ');
  const initials = [customer.firstname?.[0], customer.lastname?.[0]].filter(Boolean).join('');
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
        {initials || '?'}
      </div>
      <div>
        <p className="font-medium text-sm">{fullName || 'N/A'}</p>
        <p className="text-xs text-muted-foreground">{customer.email}</p>
        {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
      </div>
    </div>
  );
};

// Region summary
const regionSummary = (customer) => {
  const city    = customer.city    ? customer.city.charAt(0).toUpperCase() + customer.city.slice(1).toLowerCase() : '';
  const country = customer.country ? customer.country.toUpperCase() : '';
  return [city, country].filter(Boolean).join(', ') || '—';
};
```

### Key Improvements

1. **Admin-only authorization** — PII (phone, email) protected
2. **Fix `->render()` missing** — avatar cell now uses React component, not Blade partial
3. **Fix `lastname: null`** — both firstname and lastname passed correctly
4. **`market_id` field** — link customer to market for multi-tenant filtering
5. **Date range filter** — server-side via `$gte`/`$lte` on `created_date`, no trait magic
6. **Deterministic avatar initials** — computed from firstname + lastname directly
7. **`is_active` field** — soft-disable customers without deletion
8. **No global JS dependencies** — date filtering in React, no `window.dtSilenceDateFilters`

---

## Summary

**CustomersDataTable** (6.3 KB): 4-column CRM customer table with an avatar partial (name + phone + email) and locale-aware date display. Uses `DatePickerQueryFilter` trait for date-range filtering. CRITICAL: no auth + PII (phone, email, city) exposed to all users. HIGH: `generateNameElement()` returns View object without `->render()` (rendering bug), `lastname` always passed as `null` (regression), undocumented trait. MEDIUM: only 4 columns (no status, market, or additional contact info), global JS function dependency for date input silencing. LOW: country not separately searchable.

**Migration priority: HIGH** — Contains PII with no authorization. Auth gap + missing `->render()` are both production-impacting bugs.