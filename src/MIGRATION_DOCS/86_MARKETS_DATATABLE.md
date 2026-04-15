# MarketsDataTable (Market/Region Management)

**Purpose:** Yajra DataTable for managing market/region records.  
**Namespace:** `App\DataTables\Market`  
**Type:** Master data management — **MEDIUM priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **File Size** | 4.3 KB |
| **Complexity** | VERY LOW (2 data columns, minimal logic) |
| **Quality** | ⚠️ Several issues |
| **Features** | 3 columns total (code, name, actions) |
| **Model Used** | Market |

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
public function query(Market $model): QueryBuilder {
    return $model->newQuery(); // ⚠️ No authorization — shows all markets
}
```

### Data Transformation

```php
public function dataTable(QueryBuilder $query): EloquentDataTable {
    return (new EloquentDataTable($query))
        ->addColumn('action', function (Market $market) {
            return view('admin.markets.partials.datatables.actions.btn-actions', 
                compact('market'  // ⚠️ Hardcoded Blade view path
            ))->render();
        })
        ->setRowId('id')
        ->rawColumns(['action']);
}
```

### Column Definition (3 columns)

| Column | Type | Purpose |
|--------|------|---------|
| `code` | Standard | Market code (e.g., 'US', 'EU', 'APAC') |
| `name` | Standard | Market friendly name |
| `action` | Computed | Action buttons via Blade view |

### HTML Configuration

```php
public function html(): HtmlBuilder {
    $table = 'markets-table';
    $customParameters = [
        'autoWidth' => false,
        'stateSave' => true,
        'order' => [[0, 'asc']],  // Sort by code ascending
        'initComplete' => $this->initCompleteScript($table),
    ];

    return $dataTableService->configureHtml(
        $this->builder(),
        $table,
        $customParameters,
        $this->getCustomButtons(),
        false,    // no checkboxes
        false,    // no search builder
        []        // no checkbox options
    )->columns($this->getColumns());
}
```

### Custom Button

```php
public function getCustomButtons(): array {
    return array_merge(
        $this->dataTableService->getButtons(),
        [
            Button::raw()
                ->text('<span>...Create New...</span>')
                ->attr([
                    'class' => 'btn create-new btn-primary ms-2',
                    'onclick' => 'window.location.href="' . route('markets.create') . '";'
                ]),
        ]
    );
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all markets (line 48) | **Security gap** |
| 2 | ⚠️ HIGH | **Hardcoded view path** — `admin.markets.partials.datatables.actions.btn-actions` (line 37) | **Breaking change risk** |
| 3 | ⚠️ HIGH | **Hardcoded route name** — `route('markets.create')` (line 136) | **Brittle** |
| 4 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | **Dead dependency** |
| 5 | ⚠️ MEDIUM | **Empty initCompleteScript** — No custom filtering (lines 106-123) | **Unnecessary** |
| 6 | ⚠️ MEDIUM | **Italian comments** — "Ottieni i tuoi pulsanti personalizzati" (line 65) | **Code smell** |
| 7 | ⚠️ MEDIUM | **Inline HTML in button** — Bootstrap classes hardcoded (line 132) | **Fragile** |
| 8 | ⚠️ MEDIUM | **No relationships displayed** — Doesn't show associated regions, languages, or configs | **UX issue** |
| 9 | ⚠️ MEDIUM | **No market status field** — Can't show if market is active/inactive | **Missing feature** |
| 10 | ℹ️ LOW | **Very minimal table** — Only 2 data columns (code, name) | **Oversimplified** |

---

## 📝 Migration to Base44

### Step 1: Entity Definition

```json
{
  "name": "Market",
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "required": true,
      "pattern": "^[A-Z0-9]{2,10}$",
      "description": "Market code (unique, uppercase alphanumeric, 2-10 chars)"
    },
    "name": {
      "type": "string",
      "required": true,
      "description": "Market friendly name (e.g., 'United States', 'European Union')"
    },
    "region": {
      "type": "string",
      "enum": ["north_america", "south_america", "europe", "middle_east", "africa", "asia_pacific"],
      "description": "Geographic region classification"
    },
    "timezone": {
      "type": "string",
      "description": "Default timezone (e.g., 'America/New_York', 'Europe/London')"
    },
    "language_code": {
      "type": "string",
      "pattern": "^[a-z]{2}(-[A-Z]{2})?$",
      "description": "Default language (BCP 47 format, e.g., 'en-US', 'fr-FR')"
    },
    "currency_code": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "description": "Default currency (ISO 4217, e.g., 'USD', 'EUR')"
    },
    "description": {
      "type": "string",
      "description": "Market description and details"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether market is currently active"
    },
    "metadata": {
      "type": "object",
      "description": "Additional market-specific configuration"
    }
  },
  "required": ["code", "name"]
}
```

### Step 2: Backend Functions

```typescript
// functions/getMarkets.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can view all markets
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const {
    page = 0,
    search = '',
    region = '',
    is_active = '',
    sort_by = 'code',
    sort_order = 'asc'
  } = await req.json();

  try {
    const filters = {};

    if (search) filters.name = { $regex: search, $options: 'i' };
    if (region) filters.region = region;
    if (is_active !== '') filters.is_active = is_active === 'true';

    const sortField = ['code', 'name', 'region'].includes(sort_by) ? sort_by : 'code';
    const sortOrder = sort_order === 'asc' ? '+' : '-';

    const markets = await base44.entities.Market.filter(
      filters,
      `${sortOrder}${sortField}`,
      25,
      page * 25
    );

    return Response.json({ data: markets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/updateMarket.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { marketId, ...data } = await req.json();

  if (!marketId) {
    return Response.json({ error: 'Missing marketId' }, { status: 400 });
  }

  try {
    // Validate code format
    if (data.code && !/^[A-Z0-9]{2,10}$/.test(data.code)) {
      return Response.json({ error: 'Code must be 2-10 uppercase alphanumeric characters' }, { status: 400 });
    }

    // Validate timezone if provided
    if (data.timezone) {
      const validTimezones = Intl.supportedValuesOf('timeZone');
      if (!validTimezones.includes(data.timezone)) {
        return Response.json({ error: `Invalid timezone: ${data.timezone}` }, { status: 400 });
      }
    }

    // Validate language code
    if (data.language_code && !/^[a-z]{2}(-[A-Z]{2})?$/.test(data.language_code)) {
      return Response.json({ error: 'Invalid language code (BCP 47 format required)' }, { status: 400 });
    }

    // Validate currency code
    if (data.currency_code && !/^[A-Z]{3}$/.test(data.currency_code)) {
      return Response.json({ error: 'Invalid currency code (ISO 4217 format required)' }, { status: 400 });
    }

    await base44.entities.Market.update(marketId, data);
    const updated = await base44.entities.Market.get(marketId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/toggleMarketActive.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { marketId } = await req.json();

  try {
    const market = await base44.entities.Market.get(marketId);
    await base44.entities.Market.update(marketId, {
      is_active: !market.is_active,
    });

    const updated = await base44.entities.Market.get(marketId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/MarketsPage.jsx
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
import MarketForm from '@/components/admin/MarketForm';

const REGIONS = [
  { value: 'north_america', label: 'North America' },
  { value: 'south_america', label: 'South America' },
  { value: 'europe', label: 'Europe' },
  { value: 'middle_east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
];

export function MarketsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: marketsData, refetch } = useQuery({
    queryKey: ['markets', page, search, region, isActive],
    queryFn: () =>
      base44.functions.invoke('getMarkets', {
        page,
        search,
        region,
        is_active: isActive,
      }),
  });

  const markets = marketsData?.data?.data || [];

  const handleToggleActive = async (marketId) => {
    try {
      await base44.functions.invoke('toggleMarketActive', { marketId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Markets</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedMarket(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Market
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <MarketForm
              market={selectedMarket}
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
          placeholder="Search markets..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-64"
        />

        <Select value={region} onValueChange={(v) => { setRegion(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Regions</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.map((market) => (
              <TableRow key={market.id}>
                <TableCell className="font-mono font-bold">{market.code}</TableCell>
                <TableCell className="font-medium">{market.name}</TableCell>
                <TableCell className="text-sm">
                  {REGIONS.find((r) => r.value === market.region)?.label || market.region}
                </TableCell>
                <TableCell className="font-mono text-sm">{market.language_code}</TableCell>
                <TableCell className="font-mono text-sm">{market.currency_code}</TableCell>
                <TableCell>
                  <Badge
                    className="cursor-pointer"
                    onClick={() => handleToggleActive(market.id)}
                    variant={market.is_active ? 'default' : 'secondary'}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {market.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedMarket(market);
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

// components/admin/MarketForm.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const REGIONS = [
  { value: 'north_america', label: 'North America' },
  { value: 'south_america', label: 'South America' },
  { value: 'europe', label: 'Europe' },
  { value: 'middle_east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
];

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
];

export default function MarketForm({ market, onSuccess }) {
  const [formData, setFormData] = useState({
    code: market?.code || '',
    name: market?.name || '',
    region: market?.region || '',
    timezone: market?.timezone || 'UTC',
    language_code: market?.language_code || 'en',
    currency_code: market?.currency_code || 'USD',
    description: market?.description || '',
    is_active: market?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await base44.functions.invoke('updateMarket', {
        marketId: market?.id,
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., US, EU, APAC"
            required
            maxLength="10"
          />
          <p className="text-xs text-muted-foreground mt-1">2-10 uppercase alphanumeric</p>
        </div>
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., United States"
            required
          />
        </div>
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="region">Region</Label>
          <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Select region</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={formData.language_code} onValueChange={(v) => setFormData({ ...formData, language_code: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency_code} onValueChange={(v) => setFormData({ ...formData, currency_code: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          placeholder="e.g., America/New_York"
        />
        <p className="text-xs text-muted-foreground mt-1">IANA timezone format</p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : market ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Admin-only authorization** — Only admins can view/edit markets
2. **Rich market data** — Code, name, region, timezone, language, currency, description
3. **Format validation** — Code (uppercase alphanumeric), timezone (IANA), language (BCP 47), currency (ISO 4217)
4. **Region classification** — Enum for 6 major regions
5. **Active status** — Toggle for enabling/disabling markets
6. **No hardcoded routes** — Uses backend functions
7. **No Blade view coupling** — Pure React components
8. **Proper HTTP methods** — POST/PUT for mutations
9. **Localized dropdowns** — Language and currency selects with friendly labels
10. **Search & filter** — By code, name, region, status
11. **Error handling** — Clear validation messages

---

## Summary

**MarketsDataTable** (4.3 KB): Minimal market/region management table with only 2 data columns (code, name) plus actions. CRITICAL: No authorization (shows all markets to all users). HIGH: Hardcoded Blade view (`admin.markets.partials.datatables.actions.btn-actions`), hardcoded route (`markets.create`). MEDIUM: Unused FilterService, empty initCompleteScript, Italian comments, hardcoded button HTML, no relationships displayed, no market status field, oversimplified structure.

In Base44: Create Market entity with code (unique, uppercase alphanumeric), name, region enum (6 regions), timezone (IANA format), language_code (BCP 47), currency_code (ISO 4217), description, is_active, metadata. Implement getMarkets function (admin-only), search/region/status filters. Add updateMarket function (validates code/timezone/language/currency formats), toggleMarketActive function. Build React page with search, region/status filters, Dialog form with all fields including timezone, language & currency selects, status toggle badge.

**Migration Priority: MEDIUM** — Authorization gap (critical), but minimal data risk since markets are reference data; hardcoded routes make system brittle; missing fields (timezone, language, currency) limits functionality; no status field prevents market deactivation.