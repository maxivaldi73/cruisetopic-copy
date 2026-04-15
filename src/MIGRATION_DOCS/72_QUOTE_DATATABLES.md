# Quote DataTable Classes (CRM Core Tables)

**Purpose:** Advanced Yajra DataTables for Quote/Order management with role-based filtering and real-time toggles.  
**Namespace:** `App\DataTables\Quote`  
**Location:** `App/DataTables/Quote/` (2 files)  
**Type:** CRM core functionality — critical tables — **HIGH priority**

---

## 📋 Overview

| DataTable | Purpose | Size | Complexity | Status |
|-----------|---------|------|------------|--------|
| QuoteDataTable | Quote/Order CRUD | 9.7 KB | **Very High** | ⚠️ Major Issues |
| QuoteStatusesDataTable | Status workflow configuration | 5.7 KB | **High** | ⚠️ Issues |

---

## 🔧 QuoteDataTable (9.7 KB)

### Features

```php
class QuoteDataTable extends DataTable {
    use DatePickerQueryFilter;  // ✅ Date filtering trait
    protected FilterService $filterService;
    protected DataTableService $dataTableService;

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Name column with avatar component
            ->editColumn('Name', $this->generateNameElement())

            // Advanced customer search (quote #, customer name/surname, lead name)
            ->filterColumn('customer_search', function($query, $keyword) { ... })

            // Passenger breakdown (adults, teens, children)
            ->editColumn('adults', function (Quote $quote) {
                return "<span>{$quote->adults} Adult</span><br>..." 
            })

            // Date range filters with custom trait
            ->filterColumn('quotes.created_at', function($query, $keyword) {
                $this->applyDateRangeFilter($query, $keyword, 'quotes.created_at');
            })

            // Currency formatting via NumberFormatter
            ->editColumn('cabin_total_price', function(Quote $quote) {
                $formatter = new \NumberFormatter($locale, \NumberFormatter::CURRENCY);
                return $formatter->formatCurrency($quote->total_amount, 'EUR');
            })

            // Action buttons
            ->addColumn('action', function(Quote $quote) {
                return view('admin.quotes.datatables.actions.btn-actions', compact('quote'));
            })

            // Status (commented out, not implemented)
            ->addColumn('status', function(Quote $quote) { /* empty */ })

            ->rawColumns(['Name', 'adults', 'action', 'status'])
            ->setRowId('id');
    }
}
```

### Query Logic

```php
public function query(Quote $model): QueryBuilder {
    $query = $model->newQuery()
        ->select('quotes.*')
        ->with(['customer', 'lead'])    // ✅ Eager loading
        ->whereNull('parent_id')        // ✅ Parent/child separation
        ->orderByDesc('quotes.created_at');

    // Route-aware filtering
    if ($this->isOrdersRoute()) {
        $query->whereNotNull('accepted_at');  // Only accepted quotes
    }

    // Authorization: role-based quote status visibility
    if (Auth::user()->isSuperAdmin() || Auth::user()->isAdmin()) {
        return $query;  // ✅ Admins see all
    }

    $user = Auth::user();
    $roleId = $user->role->id;

    // Load allowed statuses for user's role
    $statusesId = QuoteStatus::all()
        ->filter(function ($quoteStatus) use ($roleId) {
            $allowedRoles = $quoteStatus->roles ?? [];  // Roles stored as JSON array
            return is_array($allowedRoles) && in_array($roleId, $allowedRoles);
        })
        ->pluck('id')
        ->toArray();

    return $query->whereIn('quote_status_id', $statusesId);
}
```

### Issues

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **N+1 query on QuoteStatus filtering** — QuoteStatus::all() per user, not filtered at DB level | Massive performance hit |
| 2 | 🔴 CRITICAL | **Status column commented out** — Column added but empty, still rendered (wasted space) | Dead code, confusing |
| 3 | ⚠️ HIGH | **Avatar component view assumption** — '_partials.datatables.datatables-avatar' may not exist | Breaks rendering |
| 4 | ⚠️ HIGH | **DatePickerQueryFilter trait coupling** — Tightly coupled to DataPickerQueryFilter, non-portable | Framework coupling |
| 5 | ⚠️ HIGH | **Hardcoded locale via session** — `session('locale', app()->getLocale())` not i18n-safe | Fragile localization |
| 6 | ⚠️ MEDIUM | **isOrdersRoute() regex** — `request()->routeIs('orders.*')` is fragile (route rename breaks this) | Code brittleness |
| 7 | ⚠️ MEDIUM | **No null checks on relationships** — `$quote->lead?->name` safe but adults/children could be null | Potential errors |
| 8 | ⚠️ MEDIUM | **Complex passenger display** — HTML in callback, repeated for every row | Inefficient rendering |
| 9 | ⚠️ MEDIUM | **Status roles JSON** — `$quoteStatus->roles` JSON array filtering in PHP, not DB | Major N+1, bad performance |
| 10 | ℹ️ LOW | **Unused FilterService** — Injected but never used | Dead dependency |
| 11 | ℹ️ LOW | **Commented columns** — 'status', 'cruiseId' commented out but code remains | Code smell |

---

## 🔧 QuoteStatusesDataTable (5.7 KB)

### Features

```php
class QuoteStatusesDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Toggle checkbox for is_accepted
            ->addColumn('is_accepted', function(QuoteStatus $quoteStatus) {
                return $this->getBoolean($quoteStatus, 'is_accepted');
            })

            // Toggle checkbox for is_archived
            ->addColumn('is_archived', function(QuoteStatus $quoteStatus) {
                return $this->getBoolean($quoteStatus, 'is_archived');
            })

            // Action buttons
            ->addColumn('action', function(QuoteStatus $quoteStatus) {
                return view('admin.quote-statuses.datatables.actions.btn-actions', compact('quoteStatus'));
            })

            ->setRowId('id')
            ->rawColumns(['is_accepted', 'is_archived', 'action']);
    }

    // Generate Bootstrap toggle switch
    private function getBoolean(QuoteStatus $quoteStatus, string $column) {
        $checked = $quoteStatus->$column ? 'checked' : '';

        $html = <<<HTML
        <label class="switch switch-success">
            <input type="checkbox"
                   class="switch-input toggle-checkbox"
                   name="{$column}"
                   data-field="{$column}"
                   value="{$quoteStatus->$column}"
                   {$checked}>
            <span class="switch-toggle-slider">
                <span class="switch-on"><i class="icon-base ri ri-check-line"></i></span>
                <span class="switch-off"><i class="icon-base ri ri-close-line"></i></span>
            </span>
        </label>
        HTML;

        return $html;
    }
}
```

### JavaScript Handler

```php
private function initCompleteScript($table): string {
    $changeToggle = $this->dataTableService->generateCheckboxToggleScript(
        $table,
        [1, 2],  // Columns 1 & 2 are toggleable (is_accepted, is_archived)
        '/admin/quote-statuses/toggle-field',  // Hardcoded endpoint
        'Check modificato con successo!',      // Italian success message
        'Rilevato problema nel cambio del check.'  // Italian error message
    );

    return <<<JS
        function(settings, json) {
            {$changeToggle}
        }
    JS;
}
```

### Issues

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Typo in table ID** — 'quotetatuses-table' (missing 's' in quote) | Breaks JavaScript/CSS targeting |
| 2 | ⚠️ HIGH | **Hardcoded endpoint** — '/admin/quote-statuses/toggle-field' no route() helper | Breaks on route changes |
| 3 | ⚠️ HIGH | **Hardcoded Italian messages** — 'Check modificato con successo!' (not i18n) | Non-localized |
| 4 | ⚠️ HIGH | **Magic column indices** — [1, 2] brittle (changes if columns reordered) | Fragile code |
| 5 | ⚠️ MEDIUM | **Unsafe property access** — `$quoteStatus->$column` no validation of $column parameter | Potential SQL injection if misused |
| 6 | ⚠️ MEDIUM | **No authorization check** — Anyone can see/toggle statuses | Security gap |
| 7 | ⚠️ MEDIUM | **No error feedback from JavaScript** — Error message shown but no action taken | Silent failures |
| 8 | ℹ️ LOW | **Unused FilterService** — Injected but not used | Dead dependency |
| 9 | ℹ️ LOW | **Bootstrap + Remixicon mix** — 'switch switch-success' (Bootstrap) but 'ri ri-check-line' (Remixicon) | Styling inconsistency |

---

## ⚠️ Critical Issues Summary

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 CRITICAL | 3 | N+1 QuoteStatus filtering, commented status column, table ID typo |
| ⚠️ HIGH | 10 | Avatar view assumption, date picker coupling, hardcoded locale, route fragility, JSON status roles, hardcoded endpoints, Italian messages, magic column indices, unsafe property access |
| ⚠️ MEDIUM | 7 | Passenger display HTML, null checks, error feedback, authorization gap |
| ℹ️ LOW | 2 | Unused services, dead code |

---

## 📝 Migration to Base44

### Step 1: Create Quote Entity

```json
{
  "name": "Quote",
  "type": "object",
  "properties": {
    "quote_number": {"type": "string"},
    "customer_id": {"type": "string"},
    "lead_id": {"type": "string"},
    "total_amount": {"type": "number"},
    "adults": {"type": "integer"},
    "teens": {"type": "integer"},
    "children": {"type": "integer"},
    "cabin_category": {"type": "string"},
    "status_id": {"type": "string"},
    "accepted_at": {"type": "string", "format": "date-time"},
    "parent_id": {"type": "string"}
  }
}
```

### Step 2: Backend Function (getQuotes)

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { page = 0, search = '', statusId = null, onlyOrders = false } = await req.json();

  try {
    const filters = {};

    // Filter by quote number, customer name, or lead name
    if (search) {
      filters.$or = [
        { quote_number: { $regex: search, $options: 'i' } },
        // Would need customer/lead relationship filtering
      ];
    }

    // Filter to orders only (accepted quotes)
    if (onlyOrders) {
      filters.accepted_at = { $ne: null };
    }

    // Filter by status and user's role
    if (statusId) {
      const status = await base44.entities.QuoteStatus.get(statusId);
      if (!status.roles?.includes(user.role_id) && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      filters.status_id = statusId;
    }

    const quotes = await base44.entities.Quote.filter(
      filters,
      '-created_date',
      25,
      page * 25
    );

    return Response.json({ data: quotes, page });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React QuoteDataGrid

```tsx
// pages/admin/QuotesPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';

export function QuotesPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [onlyOrders, setOnlyOrders] = useState(false);

  const { data } = useQuery({
    queryKey: ['quotes', page, search, onlyOrders],
    queryFn: () =>
      base44.functions.invoke('getQuotes', {
        page,
        search,
        onlyOrders,
      }),
  });

  const quotes = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {onlyOrders ? 'Orders' : 'Quotes'}
        </h1>
        <Button onClick={() => window.location.href = '/quotes/create'}>
          Create Quote
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by quote #, customer, or lead..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Checkbox
          label="Orders only"
          checked={onlyOrders}
          onCheckedChange={setOnlyOrders}
        />
      </div>

      <DataGrid
        rows={quotes}
        columns={[
          { field: 'quote_number', headerName: onlyOrders ? 'Order #' : 'Quote #' },
          {
            field: 'lead',
            headerName: 'Customer',
            flex: 1,
            renderCell: (params) => (
              <div>
                <div className="font-semibold">{params.row.lead?.name}</div>
                <div className="text-xs text-gray-500">{params.row.lead?.email}</div>
              </div>
            ),
          },
          {
            field: 'passengers',
            headerName: 'Passengers',
            renderCell: (params) => (
              <div className="text-sm">
                <div>{params.row.adults} Adult</div>
                <div>{params.row.teens} Teen</div>
                <div>{params.row.children} Children</div>
              </div>
            ),
          },
          { field: 'cabin_category', headerName: 'Category' },
          {
            field: 'total_amount',
            headerName: 'Total',
            renderCell: (params) => formatCurrency(params.row.total_amount, 'EUR'),
          },
          {
            field: 'created_at',
            headerName: 'Date',
            type: 'dateTime',
          },
        ]}
      />
    </div>
  );
}
```

### Step 4: Status Toggle Component

```tsx
// components/QuoteStatusToggle.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export function QuoteStatusToggle({ status, field, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked) => {
    setLoading(true);
    try {
      const updated = await base44.entities.QuoteStatus.update(status.id, {
        [field]: checked,
      });
      onUpdate(updated);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Checkbox
      checked={status[field]}
      onCheckedChange={handleToggle}
      disabled={loading}
    />
  );
}
```

### Key Improvements

1. **No N+1 queries** — Backend handles relationship filtering
2. **Authorization enforced** — Status visibility checked server-side
3. **i18n-ready** — Messages from translation system
4. **Type-safe** — React component props, TypeScript
5. **No hardcoded routes** — All routes managed by base44 frontend router
6. **Better UX** — Toast notifications instead of silent errors
7. **Responsive** — Works on mobile/tablet/desktop
8. **Maintainable** — Clear separation of concerns

---

## Summary

2 advanced quote-related DataTables: **QuoteDataTable** (9.7 KB, quote/order CRUD) with role-based filtering, multi-field search, passenger breakdown, date range filters, currency formatting, avatar component. **CRITICAL:** N+1 QuoteStatus query (`QuoteStatus::all()` per user), commented status column (dead code), tight coupling to DatePickerQueryFilter. **HIGH:** Avatar view assumption, hardcoded locale, route fragility, JSON status role filtering, unsafe date filtering. **QuoteStatusesDataTable** (5.7 KB, status workflow config) with toggle switches for accepted/archived flags via AJAX. **CRITICAL:** Typo in table ID ('quotetatuses'), hardcoded endpoint and Italian messages. **HIGH:** Magic column indices [1,2] (fragile), unsafe property access, no authorization, no error feedback. Both lack authorization checks, use non-i18n hardcoded text, have route/column brittleness.

In Base44: Create Quote entity, getQuotes backend function with role-based authorization/filtering, React DataGrid component with search/filter UI, toggleable status component via entity.update(), all messages from i18n system, no hardcoded routes/columns. Fix N+1 by filtering at DB level, add server-side authorization, proper error handling with toast notifications, mobile-responsive design.

**Migration Priority: CRITICAL** — QuoteDataTable is core CRM functionality; N+1 query on status filtering causes massive performance issues; role-based access control must move to backend for security; refactoring unblocks scalability of quote system.