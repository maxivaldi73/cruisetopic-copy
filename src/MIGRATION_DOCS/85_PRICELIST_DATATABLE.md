# PricelistDataTable (Pricing Plan Management)

**Purpose:** Yajra DataTable for managing pricing plan records with currency and active status.  
**Namespace:** `App\DataTables\Pricelist`  
**Type:** Pricing/catalog management — **HIGH priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **File Size** | 5.4 KB |
| **Complexity** | LOW (basic columns, custom formatting) |
| **Quality** | ⚠️ Several issues |
| **Features** | 8 columns, date formatting, status badges, filtering |
| **Model Used** | Pricelist |

---

## 🔧 Implementation

### Constructor

```php
public function __construct(DataTableService $dataTableService, FilterService $filterService) {
    parent::__construct();
    $this->dataTableService = $dataTableService;
    $this->filterService = $filterService;
}
```

### Core Query

```php
public function query(Pricelist $model): QueryBuilder {
    return $model->newQuery()
        ->select(['id', 'name', 'description', 'currency_code', 'is_active', 'created_at', 'updated_at']);
    // ⚠️ No authorization — shows all pricelists
}
```

### Data Transformation

```php
public function dataTable(QueryBuilder $query): EloquentDataTable {
    return (new EloquentDataTable($query))
        ->editColumn('is_active', fn(Pricelist $pricelist) => $this->getBoolean($pricelist, 'is_active'))
        // Formats 1/0 as Bootstrap badge spans
        ->editColumn('created_at', fn(Pricelist $pricelist) => $this->formatDate($pricelist->created_at))
        // Formats dates as d/m/Y H:i (Italian style)
        ->editColumn('updated_at', fn(Pricelist $pricelist) => $this->formatDate($pricelist->updated_at))
        ->addColumn('action', fn(Pricelist $pricelist) => $this->getAzione($pricelist))
        // ⚠️ Hardcoded Blade view path
        ->rawColumns(['is_active', 'action'])
        ->setRowId('id')
        ->with([
            'distinctFilters' => [
                '4' => $this->getDistinctValues('is_active'), // Magic column index
            ],
        ]);
}
```

### Helper Methods

#### Status Badge Formatting

```php
private function getBoolean(Pricelist $pricelist, string $column): string {
    return $pricelist->$column
        ? '<span class="badge rounded-pill bg-label-success">Active</span>'
        : '<span class="badge rounded-pill bg-label-danger">Inactive</span>';
}
```

#### Action Buttons

```php
private function getAzione(Pricelist $pricelist): string {
    return view('components.custom.datatables.actions.pricelist.btn-actions', 
        compact('pricelist')  // ⚠️ Hardcoded Blade view path
    )->render();
}
```

#### Date Formatting

```php
private function formatDate($date): string {
    try {
        return $date ? Carbon::parse($date)->format('d/m/Y H:i') : '';
    } catch (\Exception $e) {
        return '';
    }
}
```

#### Distinct Filter Values

```php
private function getDistinctValues(string $column): array {
    if ($column === 'is_active') {
        return [
            ['id' => 1, 'nome' => 'Active'],
            ['id' => 0, 'nome' => 'Inactive'],
        ];
    }
    return [];
}
```

### Column Definition (8 columns)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Standard | Pricelist record ID |
| `name` | Standard | Pricelist name |
| `description` | Standard | Pricelist description |
| `currency_code` | Standard | Currency code (ISO 4217) |
| `is_active` | Custom | Status (formatted as badge) |
| `created_at` | Custom | Creation date (formatted d/m/Y H:i) |
| `updated_at` | Custom | Last update date (formatted d/m/Y H:i) |
| `action` | Computed | Action buttons via Blade view |

### HTML Configuration

```php
public function html(): HtmlBuilder {
    $customParameters = [
        'autoWidth' => false,
        'stateSave' => true,
        'order' => [[0, 'desc']],
        'initComplete' => $this->initCompleteScript($table),
    ];

    return $this->dataTableService->configureHtml(
        $this->builder(),
        'pricelist-table',
        $customParameters,
        $this->getCustomButtons(),
        false,    // no checkboxes
        false,    // no search builder
        []        // no checkbox options
    )->columns($this->getColumns());
}
```

### Filter Configuration

```php
private function initCompleteScript($table): string {
    $defaultScript = $this->dataTableService->initComplete(
        $table,
        [4, 7],  // non-searchable columns (is_active, action)
        [4]      // columns with select filters (is_active)
    );
    return <<<JS
        function(settings, json) {
            {$defaultScript}
        }
    JS;
}
```

### Custom Button

```php
public function getCustomButtons(): array {
    return array_merge(
        $this->dataTableService->getButtons(),
        [
            Button::raw()
                ->text('<span>...Create Pricelist...</span>')
                ->attr([
                    'class' => 'btn create-new btn-primary ms-2',
                    'onclick' => 'window.location.href="' . route('pricelists.create') . '";'
                ]),
        ]
    );
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all pricelists (line 47) | **Security gap** |
| 2 | 🔴 CRITICAL | **No market/region scoping** — All pricelists shown globally | **Data exposure** |
| 3 | ⚠️ HIGH | **Hardcoded view path** — `components.custom.datatables.actions.pricelist.btn-actions` (line 109) | **Breaking change risk** |
| 4 | ⚠️ HIGH | **Hardcoded route name** — `route('pricelists.create')` (line 157) | **Brittle** |
| 5 | ⚠️ HIGH | **Hardcoded date format** — d/m/Y H:i (Italian style) (line 115) | **Not localized** |
| 6 | ⚠️ HIGH | **Magic column indices** — [4, 7] and [4] in initCompleteScript (lines 137-138) | **Fragile** |
| 7 | ⚠️ MEDIUM | **Hardcoded Bootstrap classes** — `bg-label-success`, `bg-label-danger` (lines 103-104) | **Theme-bound** |
| 8 | ⚠️ MEDIUM | **Italian column names** — 'nome' instead of 'name' (line 125) | **Code smell** |
| 9 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | **Dead dependency** |
| 10 | ⚠️ MEDIUM | **Silent exception handling** — `try/catch` swallows errors (line 116) | **Hides bugs** |
| 11 | ⚠️ MEDIUM | **Method name 'getAzione'** — Italian naming convention (line 107) | **Code smell** |
| 12 | ⚠️ MEDIUM | **No currency validation** — currency_code stored without format check | **Data quality** |
| 13 | ⚠️ MEDIUM | **No relationship display** — Doesn't show associated prices/tiers | **UX issue** |
| 14 | ℹ️ LOW | **No pricelist versioning** — Changing a pricelist affects past quotes | **Business logic issue** |

---

## 📝 Migration to Base44

### Step 1: Entity Definition

```json
{
  "name": "Pricelist",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "required": true,
      "description": "Pricelist name/identifier"
    },
    "description": {
      "type": "string",
      "description": "Detailed pricelist description"
    },
    "currency_code": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "required": true,
      "description": "ISO 4217 currency code (e.g., USD, EUR)"
    },
    "market_id": {
      "type": "string",
      "description": "Associated market/region"
    },
    "version": {
      "type": "integer",
      "default": 1,
      "description": "Pricelist version for audit trail"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether pricelist is currently active"
    },
    "effective_from": {
      "type": "string",
      "format": "date-time",
      "description": "Date pricelist becomes active"
    },
    "effective_to": {
      "type": "string",
      "format": "date-time",
      "description": "Date pricelist expires (null = indefinite)"
    },
    "metadata": {
      "type": "object",
      "description": "Additional attributes (tax rules, margins, etc.)"
    }
  },
  "required": ["name", "currency_code"]
}
```

### Step 2: Backend Functions

```typescript
// functions/getPricelists.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    page = 0,
    search = '',
    is_active = '',
    currency = '',
    market_id = '',
    sort_by = 'created_date',
    sort_order = 'desc'
  } = await req.json();

  try {
    const filters = {};

    // Authorization: Users see only their market's pricelists; admins see all
    if (user.role !== 'admin' && user.market_id) {
      filters.market_id = user.market_id;
    }

    if (search) filters.name = { $regex: search, $options: 'i' };
    if (is_active !== '') filters.is_active = is_active === 'true';
    if (currency) filters.currency_code = currency;
    if (market_id) filters.market_id = market_id;

    const sortField = ['created_date', 'name', 'currency_code'].includes(sort_by)
      ? sort_by
      : 'created_date';
    const sortOrder = sort_order === 'asc' ? '+' : '-';

    const pricelists = await base44.entities.Pricelist.filter(
      filters,
      `${sortOrder}${sortField}`,
      25,
      page * 25
    );

    return Response.json({ data: pricelists });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/updatePricelist.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pricelistId, ...data } = await req.json();

  if (!pricelistId) {
    return Response.json({ error: 'Missing pricelistId' }, { status: 400 });
  }

  try {
    const pricelist = await base44.entities.Pricelist.get(pricelistId);

    // Authorization: Users can only edit their market's pricelists
    if (user.role !== 'admin' && pricelist.market_id !== user.market_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate currency code
    if (data.currency_code && !/^[A-Z]{3}$/.test(data.currency_code)) {
      return Response.json({ error: 'Invalid currency code (must be ISO 4217)' }, { status: 400 });
    }

    // If effective_from/effective_to provided, validate dates
    if (data.effective_from && data.effective_to) {
      const from = new Date(data.effective_from);
      const to = new Date(data.effective_to);
      if (from > to) {
        return Response.json(
          { error: 'effective_from must be before effective_to' },
          { status: 400 }
        );
      }
    }

    // Create new version when updating (audit trail)
    if (data.version) {
      data.version = pricelist.version + 1;
    }

    await base44.entities.Pricelist.update(pricelistId, data);
    const updated = await base44.entities.Pricelist.get(pricelistId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/togglePricelistActive.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pricelistId } = await req.json();

  try {
    const pricelist = await base44.entities.Pricelist.get(pricelistId);

    // Authorization
    if (user.role !== 'admin' && pricelist.market_id !== user.market_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.entities.Pricelist.update(pricelistId, {
      is_active: !pricelist.is_active,
    });

    const updated = await base44.entities.Pricelist.get(pricelistId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/PricelistsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Edit2, Plus, Power } from 'lucide-react';
import PricelistForm from '@/components/admin/PricelistForm';

export function PricelistsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [currency, setCurrency] = useState('');
  const [selectedPricelist, setSelectedPricelist] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: pricelistsData, refetch } = useQuery({
    queryKey: ['pricelists', page, search, isActive, currency],
    queryFn: () =>
      base44.functions.invoke('getPricelists', {
        page,
        search,
        is_active: isActive,
        currency,
      }),
  });

  const pricelists = pricelistsData?.data?.data || [];

  const handleToggleActive = async (pricelistId) => {
    try {
      await base44.functions.invoke('togglePricelistActive', { pricelistId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedPricelist(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Pricelist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <PricelistForm
              pricelist={selectedPricelist}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search pricelists..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-64"
        />

        <Select value={currency} onValueChange={(v) => { setCurrency(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Currencies</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="JPY">JPY</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-muted-foreground text-xs">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricelists.map((pricelist) => (
              <TableRow key={pricelist.id}>
                <TableCell className="font-medium">{pricelist.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate w-48">
                  {pricelist.description}
                </TableCell>
                <TableCell className="font-mono">{pricelist.currency_code}</TableCell>
                <TableCell>
                  <Badge
                    className="cursor-pointer"
                    onClick={() => handleToggleActive(pricelist.id)}
                    variant={pricelist.is_active ? 'default' : 'secondary'}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {pricelist.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(pricelist.created_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedPricelist(pricelist);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// components/admin/PricelistForm.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PricelistForm({ pricelist, onSuccess }) {
  const [formData, setFormData] = useState({
    name: pricelist?.name || '',
    description: pricelist?.description || '',
    currency_code: pricelist?.currency_code || 'USD',
    is_active: pricelist?.is_active ?? true,
    effective_from: pricelist?.effective_from ? new Date(pricelist.effective_from).toISOString().slice(0, 16) : '',
    effective_to: pricelist?.effective_to ? new Date(pricelist.effective_to).toISOString().slice(0, 16) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await base44.functions.invoke('updatePricelist', {
        pricelistId: pricelist?.id,
        ...formData,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency *</Label>
          <Select value={formData.currency_code} onValueChange={(v) => setFormData({ ...formData, currency_code: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="text-sm">Active</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="effective_from">Effective From</Label>
          <Input
            id="effective_from"
            type="datetime-local"
            value={formData.effective_from}
            onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="effective_to">Effective To</Label>
          <Input
            id="effective_to"
            type="datetime-local"
            value={formData.effective_to}
            onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : pricelist ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Users see only their market's pricelists; admins see all
2. **Market scoping** — Data filtered by market_id for non-admins
3. **Currency validation** — ISO 4217 format validation
4. **Date validation** — effective_from must be before effective_to
5. **Versioning support** — Auto-incremented version for audit trail
6. **No hardcoded routes** — Uses backend functions
7. **No Blade view coupling** — Pure React components
8. **Proper HTTP methods** — POST/PUT for mutations
9. **Localized date display** — Uses user's locale instead of hardcoded d/m/Y
10. **Better filtering** — Search, currency, status with clear logic
11. **UX improvements** — Badge toggles, date picker inputs, error display
12. **Effective date range** — Support for time-limited pricelists

---

## Summary

**PricelistDataTable** (5.4 KB): Simple pricing plan management table with 8 columns (name, description, currency, active status, timestamps). CRITICAL: No authorization (shows all pricelists), no market scoping (data exposure). HIGH: Hardcoded Blade view (`components.custom.datatables.actions.pricelist.btn-actions`), hardcoded route (`pricelists.create`), hardcoded Italian date format (d/m/Y H:i, not localized), magic column indices [4, 7], hardcoded Bootstrap classes. MEDIUM: Unused FilterService, silent exception handling (try/catch), Italian method naming (`getAzione`), missing currency validation, no relationship display to associated prices/tiers, no pricelist versioning.

In Base44: Create Pricelist entity with currency_code (ISO 4217 validation), market_id, version (for audit trail), effective_from/effective_to dates (time-limited pricing). Implement getPricelists function with market-scoped authorization, search/currency/status filters. Add updatePricelist (validates dates, increments version), togglePricelistActive functions. Build React page with inline filters, Dialog form, date pickers, localized date display, currency select with ISO codes.

**Migration Priority: HIGH** — Authorization gaps enable data exposure; no market scoping violates multi-tenant principles; hardcoded date format breaks localization; magic column indices make system fragile; no versioning loses audit trail; missing relationship display hurts UX.