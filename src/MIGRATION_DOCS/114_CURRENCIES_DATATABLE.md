# CurrenciesDataTable (1 file)

**File:** `App/DataTables/Currency/CurrenciesDataTable.php`  
**Namespace:** `App\DataTables\Currency`  
**Type:** Yajra DataTable class  
**Priority:** LOW — simple reference data table; minimal business logic

---

## 📋 Overview

| Class | Purpose |
|-------|---------|
| `CurrenciesDataTable` | Administrative listing of Currency records — displays code, symbol, primary status badge, exchange rate, and action buttons |

---

## 🔧 Implementation

```php
class CurrenciesDataTable extends DataTable
{
    protected FilterService $filterService;
    protected DataTableService $dataTableService;

    public function __construct(
        DataTableService $dataTableService,
        FilterService $filterService
    ) {
        parent::__construct();
        $this->dataTableService = $dataTableService;
        $this->filterService = $filterService;
        // ✅ Both services injected via constructor (proper DI)
        // ⚠️ $filterService is injected but NEVER USED in this class — dead dependency
    }

    public function dataTable(QueryBuilder $query): EloquentDataTable
    {
        return (new EloquentDataTable($query))
            ->addColumn('action', function ($row) {
                return view('admin.currencies.action', compact('row'))->render();
                // ⚠️ Hardcoded Blade partial path — tightly coupled to view layer
            })
            ->editColumn('primary', function ($row) {
                return $row->primary ? '<span class="badge bg-success">Yes</span>' 
                                     : '<span class="badge bg-secondary">No</span>';
                // ✅ Simple boolean → badge transformation
                // ⚠️ Raw HTML returned — requires rawColumns() call (present below)
            })
            ->rawColumns(['primary', 'action']);
            // ✅ Correctly marks columns as raw HTML
    }

    public function query(Currency $model): QueryBuilder
    {
        return $model->newQuery();
        // ✅ Simple query — returns all currencies
        // ⚠️ No ordering applied here (handled in html() config)
        // ⚠️ No authorization check — any user can view all currencies
    }

    public function html(): HtmlBuilder
    {
        $table = 'currencies-table';
        $dataTableService = new DataTableService();  
        // 🔴 BUG: Instantiates NEW DataTableService with `new`
        //    → $this->dataTableService already exists from constructor injection
        //    → This shadows the injected service and wastes memory
        //    → Defeats the purpose of dependency injection

        $customParameters = [
            'autoWidth' => false,
            'stateSave' => true,
            'order' => [[0, 'desc']],  // Order by first column (code) descending
            'initComplete' => $this->initCompleteScript($table),
        ];

        $customButtons = $this->getCustomButtons();
        $enableCheckboxes = false;
        $enableSearchBuilder = false;
        $checkboxOptions = [];

        return $dataTableService->configureHtml(
            $this->builder(),
            $table,
            $customParameters,
            $customButtons,
            $enableCheckboxes,
            $enableSearchBuilder,
            $checkboxOptions
        )->columns($this->getColumns());
    }

    public function getColumns(): array
    {
        return [
            Column::make('code'),
            Column::make('symbol'),
            Column::make('primary')->title('Primary')->searchable(false),
            Column::make('exchange_rate')->title('Exchange Rate'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center'),
        ];
        // ✅ Clean column definitions
        // ⚠️ 'primary' marked not searchable — correct for boolean
        // ⚠️ No column for currency name/description — only code shown
    }

    protected function filename(): string
    {
        return 'Currencies_' . date('YmdHis');
        // ✅ Export filename with timestamp
    }

    private function initCompleteScript($table): string
    {
        $defaultScript = $this->dataTableService->initComplete(
            $table,
            [],  // Non-searchable columns
            []   // Select filter columns
        );
        // ⚠️ Empty arrays passed — no custom filtering configured
        // ⚠️ Uses $this->dataTableService here but html() uses `new DataTableService()`
        //    → Inconsistent service usage within same class

        return <<<JS
            function(settings, json) {
                {$defaultScript}
            }
        JS;
        // ⚠️ Italian comments in source: "Eseguo il defaultScript", "Eseguo customScript"
    }

    public function getCustomButtons(): array
    {
        return array_merge(
            $this->dataTableService->getButtons(),
            [
                Button::raw()
                    ->text('<span><span class="d-flex align-items-center"><i class="icon-base ri ri-add-line icon-18px me-sm-1"></i><span class="d-none d-sm-inline-block">Create New</span></span></span>')
                    ->attr([
                        'class' => 'btn create-new btn-primary ms-2',
                        'onclick' => 'window.location.href="' . route('currencies.create') . '";'
                    ]),
            ]
        );
        // ✅ Adds "Create New" button with icon
        // ⚠️ Hardcoded route name 'currencies.create'
        // ⚠️ Uses onclick for navigation — should be an <a> tag or proper link
    }
}
```

---

## 📊 Columns

| # | Column | Source | Searchable | Notes |
|---|--------|--------|------------|-------|
| 1 | `code` | `Currency.code` | ✅ Yes | ISO currency code (e.g., USD, EUR) |
| 2 | `symbol` | `Currency.symbol` | ✅ Yes | Display symbol (e.g., $, €) |
| 3 | `primary` | `Currency.primary` | ❌ No | Boolean → badge ("Yes"/"No") |
| 4 | `exchange_rate` | `Currency.exchange_rate` | ✅ Yes | Numeric rate relative to primary |
| 5 | `action` | Computed | ❌ N/A | Edit/delete buttons via Blade partial |

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 HIGH | **`new DataTableService()` in `html()` shadows injected service** — constructor injects `$this->dataTableService` but `html()` creates a new instance, defeating DI and wasting memory |
| 2 | ⚠️ MEDIUM | **`$filterService` injected but never used** — dead dependency; entire service unused |
| 3 | ⚠️ MEDIUM | **Inconsistent service usage** — `initCompleteScript()` uses `$this->dataTableService` while `html()` uses locally instantiated one |
| 4 | ⚠️ MEDIUM | **No authorization check** — any authenticated user can view all currencies |
| 5 | ⚠️ MEDIUM | **Hardcoded route `currencies.create`** — tight coupling to Laravel routing |
| 6 | ⚠️ MEDIUM | **`onclick` navigation** — should use proper anchor tag for accessibility |
| 7 | ℹ️ LOW | **Italian comments** — "Eseguo il defaultScript", "Eseguo customScript", "Ottieni i tuoi pulsanti personalizzati" |
| 8 | ℹ️ LOW | **No currency name column** — only code displayed; users must know ISO codes |
| 9 | ℹ️ LOW | **Empty filter configuration** — `initComplete()` called with empty arrays |

---

## 📝 Migration to Base44

### Currency Entity Schema

```json
{
  "name": "Currency",
  "properties": {
    "code": {
      "type": "string",
      "description": "ISO 4217 currency code (e.g., USD, EUR)",
      "pattern": "^[A-Z]{3}$"
    },
    "name": {
      "type": "string",
      "description": "Full currency name (e.g., US Dollar)"
    },
    "symbol": {
      "type": "string",
      "description": "Display symbol (e.g., $, €, £)"
    },
    "is_primary": {
      "type": "boolean",
      "default": false,
      "description": "Whether this is the primary/base currency"
    },
    "exchange_rate": {
      "type": "number",
      "description": "Exchange rate relative to primary currency"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether currency is available for use"
    }
  },
  "required": ["code", "symbol"]
}
```

### React Page Implementation

```tsx
// pages/Currencies.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Currencies() {
  const queryClient = useQueryClient();

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list('code', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Currency.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['currencies']),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Currencies</h1>
        <Button onClick={() => navigate('/currencies/new')}>
          <Plus className="w-4 h-4 mr-2" /> Create New
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Primary</TableHead>
            <TableHead>Exchange Rate</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies.map((currency) => (
            <TableRow key={currency.id}>
              <TableCell className="font-mono">{currency.code}</TableCell>
              <TableCell>{currency.symbol}</TableCell>
              <TableCell>
                <Badge variant={currency.is_primary ? 'default' : 'secondary'}>
                  {currency.is_primary ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell>
                {currency.is_primary ? '1.00' : currency.exchange_rate?.toFixed(4)}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/currencies/${currency.id}`)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(currency.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Primary Currency Enforcement (Backend Function)

To ensure only one currency can be primary at a time:

```typescript
// functions/setPrimaryCurrency.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { currencyId } = await req.json();

  // Clear existing primary
  const currencies = await base44.asServiceRole.entities.Currency.filter({ is_primary: true });
  for (const c of currencies) {
    await base44.asServiceRole.entities.Currency.update(c.id, { is_primary: false });
  }

  // Set new primary
  await base44.asServiceRole.entities.Currency.update(currencyId, { 
    is_primary: true,
    exchange_rate: 1.0 
  });

  return Response.json({ success: true });
});
```

---

## Summary

**`CurrenciesDataTable`** (146 lines): Simple 5-column administrative listing of Currency records displaying code, symbol, primary status badge, exchange rate, and action buttons. **Key bug:** `html()` method instantiates `new DataTableService()` despite already having an injected instance via constructor — defeats dependency injection and creates inconsistent service usage within the same class. `$filterService` is injected but never used (dead dependency). No authorization checks. Italian comments scattered throughout.

**Migration priority: LOW** — straightforward entity SDK CRUD in Base44. Add a backend function to enforce unique primary currency constraint (clear existing primary before setting new one). Consider adding a `name` field to the entity for better UX (currently only ISO code is shown).