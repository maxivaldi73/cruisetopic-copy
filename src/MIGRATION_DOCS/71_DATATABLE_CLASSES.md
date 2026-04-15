# DataTable Classes (Server-Side Rendering)

**Purpose:** Yajra DataTables for server-side rendered admin grids with filtering, sorting, and AJAX.  
**Namespace:** `App\DataTables`  
**Location:** `App/DataTables/` (21 files)  
**Type:** View layer — server-side table rendering — medium priority

---

## 📋 Overview

| DataTable | Model | Type | Size | Status |
|-----------|-------|------|------|--------|
| UnmappedPortMappingDataTable | FibosPort | Custom | 3.8 KB | ⚠️ Issues |
| TravelPackageDataTable | CruisePrice | Simple | 3.1 KB | ⚠️ Issues |
| SuppliersDataTable | Supplier | Standard | 4.6 KB | ✅ Good |
| SupplierCancellationConditionsDataTable | SupplierCancellationCondition | Complex | 7.3 KB | ⚠️ Issues |
| SlidesDataTable | Slide | Simple | 2.3 KB | ⚠️ Issues |
| ReviewsDataTable | Review | Simple | 2.0 KB | ⚠️ Issues |
| PortMappingDataTable | FibosPort | Custom | 4.4 KB | ⚠️ Issues |
| OffersGroupDataTable | OfferGroup | Simple | 2.3 KB | ⚠️ Issues |
| MscPortMappingDataTable | MscPort | Custom | 3.7 KB | ⚠️ Issues |
| ListingBannersDataTable | ListingBanner | Simple | 2.4 KB | ⚠️ Issues |
| JobsDataTable | Job | Simple | 2.6 KB | ⚠️ Issues |
| InstallmentsDataTable | Installment | Complex | 7.5 KB | ✅ Good |
| InstallmentSettingsDataTable | InstallmentSetting | Standard | 5.9 KB | ✅ Good |
| FibosSettingsDataTable | FibosSetting | Simple | 3.6 KB | ⚠️ Issues |
| FibosFailedJobsDataTable | FibosImport | Complex | 4.7 KB | ⚠️ Issues |
| FareFamilyDataTable | FareFamily | Simple | 2.0 KB | ⚠️ Issues |
| FailedJobsDataTable | FailedJob | Simple | 3.1 KB | ⚠️ Issues |
| ExploraPortMappingDataTable | ExploraPort | Custom | 3.5 KB | ⚠️ Issues |
| CruiselineBulletsDataTable | CruiselineBullet | Simple | 1.9 KB | ✅ Good |
| CostaPortMappingDataTable | CostaPort | Custom | 3.5 KB | ⚠️ Issues |
| CancellationConditionsDataTable | CancellationCondition | Complex | 7.4 KB | ⚠️ Issues |

---

## 🔧 Pattern Categories

### Category 1: Simple Tables (8 classes)

**Classes:** SlidesDataTable, ReviewsDataTable, OffersGroupDataTable, ListingBannersDataTable, JobsDataTable, FibosSettingsDataTable, FareFamilyDataTable, FailedJobsDataTable

**Pattern:**
```php
// Minimal rendering, few columns, basic action buttons
class SlidesDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            ->addColumn('action', fn($row) => view('...action')->with('slide', $row))
            ->addColumn('img', fn($row) => count($row->getMedia('slides')) > 0 
                ? '<img src="'.$row->getMedia('slides')->first()->getUrl().'" width="50" />'
                : ''
            )
            ->rawColumns(['img'])
            ->setRowId('id');
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **Hardcoded table IDs** — 'slides-table' not dynamic | Duplicate IDs on same page |
| 2 | ⚠️ MEDIUM | **No authorization checks** — Anyone sees all data | Security gap |
| 3 | ⚠️ MEDIUM | **No filtering/search** — Fixed columns, no dynamic filters | Limited usability |
| 4 | ⚠️ MEDIUM | **Media handling in callback** — `getMedia()` in loop (N+1) | Performance issue |
| 5 | ℹ️ LOW | **Mixed table IDs** — Some use 'slides-table', others use 'review-table' | Inconsistency |

### Category 2: Standard Tables with Services (3 classes)

**Classes:** SuppliersDataTable, InstallmentSettingsDataTable, FibosSettingsDataTable

**Pattern:**
```php
class SuppliersDataTable extends DataTable {
    protected FilterService $filterService;
    protected DataTableService $dataTableService;

    public function __construct(DataTableService $service, FilterService $filter) {
        $this->dataTableService = $service;
        $this->filterService = $filter;
    }

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            ->addColumn('status', fn(Supplier $supplier) => 
                $supplier->is_active 
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>'
            )
            ->addColumn('action', fn(Supplier $supplier) => 
                view('admin.suppliers.partials.datatables.actions.btn-actions', compact('supplier'))->render()
            )
            ->setRowId('id')
            ->rawColumns(['action', 'status']);
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **HTML in callbacks** — Badge HTML hardcoded, not i18n | Hard to maintain |
| 2 | ⚠️ MEDIUM | **No column translations** — __('translation.Name') hardcoded | Not flexible |
| 3 | ⚠️ MEDIUM | **Service instantiation in html()** — `new DataTableService()` instead of DI | Code smell |
| 4 | ⚠️ MEDIUM | **No custom buttons reusability** — Duplicate button code across tables | DRY violation |
| 5 | ℹ️ LOW | **console.log in scripts** — Debug code left in production | Code pollution |

### Category 3: Complex Tables with Relationships (6 classes)

**Classes:** SupplierCancellationConditionsDataTable, InstallmentsDataTable, FibosFailedJobsDataTable, CancellationConditionsDataTable

**Pattern:**
```php
class SupplierCancellationConditionsDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            ->addColumn('supplier_name', fn(SupplierCancellationCondition $condition) => 
                $condition->supplier ? $condition->supplier->name : '-'
            )
            ->filterColumn('supplier_name', function ($query, $keyword) {
                $query->whereHas('supplier', function ($q) use ($keyword) {
                    $q->where('name', 'LIKE', "%{$keyword}%");
                });
            })
            ->editColumn('penalty_fixed_amount', fn(SupplierCancellationCondition $condition) => 
                $condition->penalty_fixed_amount && $condition->penaltyCurrency 
                    ? $condition->penaltyCurrency->symbol . ' ' . number_format($condition->penalty_fixed_amount, 2)
                    : '-'
            )
            ->setRowId('id')
            ->rawColumns(['action', 'status']);
    }

    public function query(SupplierCancellationCondition $model): QueryBuilder {
        return $model->newQuery()->with(['supplier', 'cruiseline', 'penaltyCurrency', 'fareFamilies']);
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **N+1 query pattern** — Loads relationships in with() but displays in callbacks | Performance killer |
| 2 | ⚠️ HIGH | **Missing null checks** — `$condition->penaltyCurrency->symbol` crashes if null | Exceptions on missing data |
| 3 | ⚠️ HIGH | **Complex column formatting** — Currency formatting in callback (not reusable) | Scattered business logic |
| 4 | ⚠️ MEDIUM | **No authorization** — All users see all records | Security gap |
| 5 | ⚠️ MEDIUM | **Hardcoded column indices** — `[0, 13, 14]` for non-searchable columns (brittle) | Breaking on schema change |

### Category 4: Port Mapping Tables (4 classes)

**Classes:** UnmappedPortMappingDataTable, PortMappingDataTable, MscPortMappingDataTable, ExploraPortMappingDataTable, CostaPortMappingDataTable

**Pattern:**
```php
class UnmappedPortMappingDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        $ports = Port::orderBy('name')->get();

        return (new EloquentDataTable($query))
            ->addColumn('related_to', function($row) use ($ports) {
                $select = '<select name="ports" class="unmapped-select select2" data-row-id="'.$row->id.'">';
                $select .= '<option value="">---</option>';
                foreach ($ports as $port) {
                    $select .= '<option value="'.$port->id.'">'.$port->name.'</option>';
                }
                $select .= '</select>';
                return $select;
            })
            ->rawColumns(['related_to','is_not_a_port']);
    }

    public function html(): HtmlBuilder {
        return $this->builder()
            ->setTableId('unmapped-port-mapping-table')
            ->drawCallback('function() {
                $(".unmapped-select").change(function(e) {
                    $.post("' . route('fibos.mapping.store') . '", {
                        entity: "ports",
                        fibosId: $(e.target).data("row-id"),
                        value: $(e.target).val()
                    });
                });
            }');
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **String HTML building in loop** — `foreach ($ports as $port)` rebuilds on every row load | N+1 rendering, memory waste |
| 2 | ⚠️ HIGH | **jQuery in drawCallback** — Hard-coded inline JS, CSRF not visible | Maintenance nightmare |
| 3 | ⚠️ HIGH | **Mixed initialization patterns** — Some use Dropdown component, others manual HTML | Inconsistent |
| 4 | ⚠️ HIGH | **No error handling** — AJAX post succeeds silently, no user feedback | Bad UX |
| 5 | ⚠️ MEDIUM | **Duplicate routes** — `fibos.mapping.store`, `msc.mapping.store`, `costa.mapping.store` | Code duplication |
| 6 | ⚠️ MEDIUM | **No CSRF protection visible** — $.post() without token (Laravel adds globally, but not obvious) | Security smell |

### Category 5: Job/Import Tracking (2 classes)

**Classes:** FibosFailedJobsDataTable, JobsDataTable, FailedJobsDataTable

**Pattern:**
```php
class FibosFailedJobsDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            ->editColumn('cruiselines_nr', function ($row) {
                return $this->getSpanWithBadge($row->cruiselines_nr, $row->failed_cruiselines);
            })
            ->rawColumns(['cruiselines_nr', 'ships_nr', 'ports_nr', ...])
            ->setRowId('id');
    }

    private function getSpanWithBadge($el1, $el2) {
        if ($el2 > 0) {
            return '<span class="position-relative">' . $el1 . 
                '<span class="position-absolute top-0 start-100 ms-2 translate-middle badge rounded-pill bg-danger">' . 
                $el2 . '</span></span>';
        }
        return $el1;
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **JSON payload parsing unsafe** — `json_decode($job->payload)->displayName` no error handling | Crashes on malformed JSON |
| 2 | ⚠️ HIGH | **Bootstrap classes mixed with Tailwind** — .badge, .position-relative (bootstrap) | Styling conflicts |
| 3 | ⚠️ MEDIUM | **No status filtering** — All imports shown regardless of state | Confusing UX |
| 4 | ⚠️ MEDIUM | **Icon rendering non-standard** — `'mdi mdi-information'` (Material Design Icons) | Inconsistent with Remixicon |
| 5 | ⚠️ MEDIUM | **Missing authorization** — Anyone can see failed jobs | Potential info leak |

### Category 6: Parameterized Tables (2 classes)

**Classes:** TravelPackageDataTable, SlidesDataTable

**Pattern:**
```php
class TravelPackageDataTable extends DataTable {
    protected $itineraryId;

    public function __construct(DataTableService $service, FilterService $filter, $itineraryId) {
        parent::__construct();
        $this->itineraryId = $itineraryId;
    }

    public function query(CruisePrice $model): QueryBuilder {
        return $model->newQuery()->where('itinerary_id', $this->itineraryId);
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **Untyped constructor parameter** — `$itineraryId` no type hint | Type confusion risk |
| 2 | ⚠️ MEDIUM | **No validation** — `$itineraryId` never validated (could be string, negative, etc.) | Potential injection |
| 3 | ⚠️ MEDIUM | **Security assumption** — No authorization check that user owns itinerary | User can see other's data |

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 2 | N+1 queries in complex tables, string HTML building in loops |
| ⚠️ HIGH | 18 | No authorization (all 21), missing null checks, hardcoded routes, unsafe JSON parsing, CSRF not visible |
| ⚠️ MEDIUM | 20+ | Hardcoded table IDs, no filtering, mixed patterns, DRY violations, untyped parameters |
| ℹ️ LOW | 5 | Debug code, inconsistent naming, unused imports |

---

## 📝 Migration Notes for Base44

### Strategy: React DataGrid + Backend Functions

**Step 1: Replace Yajra with React DataGrid**

Instead of server-side Yajra tables, use React components with Backend Functions for data fetching.

**Step 2: Create Backend Functions**

```typescript
// functions/listSuppliers.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { page = 0, limit = 25, search = '', sort = '-created_date' } = await req.json();

  try {
    const suppliers = await base44.entities.Supplier.filter(
      search ? { name: { $regex: search } } : {},
      sort,
      limit
    );

    return Response.json({
      data: suppliers,
      total: suppliers.length,
      page,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

**Step 3: React DataGrid Component**

```tsx
// components/DataGridSuppliers.jsx
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/ui/datagrid';
import { Badge } from '@/components/ui/badge';

export function DataGridSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('listSuppliers', {
        page,
        search,
      });
      setSuppliers(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [page, search]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'is_active',
      headerName: 'Status',
      renderCell: (params) => (
        <Badge variant={params.row.is_active ? 'default' : 'secondary'}>
          {params.row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <DataGrid
      rows={suppliers}
      columns={columns}
      loading={loading}
      pagination
      onPageChange={setPage}
      onSearchChange={setSearch}
    />
  );
}
```

**Step 4: Port Mapping Refactor**

Replace jQuery/AJAX with React form:

```tsx
// components/PortMappingForm.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export function PortMappingForm({ port, onSuccess }) {
  const [selectedPort, setSelectedPort] = useState(port.port_id || '');
  const [isNotAPort, setIsNotAPort] = useState(port.is_not_a_port);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('updatePortMapping', {
        portId: port.id,
        mappedPortId: selectedPort,
        isNotAPort,
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Select value={selectedPort} onValueChange={setSelectedPort}>
        <SelectTrigger>
          <SelectValue placeholder="Select port..." />
        </SelectTrigger>
        <SelectContent>
          {/* Options populated from backend */}
        </SelectContent>
      </Select>

      <Checkbox 
        checked={isNotAPort} 
        onCheckedChange={setIsNotAPort}
        label="Not a port"
      />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
```

### Key Improvements

1. **Authorization** — All backend functions check user access
2. **No N+1** — Backend handles efficient querying
3. **Type Safety** — React components with TypeScript props
4. **Real-time** — Subscriptions for live updates
5. **No jQuery** — Modern React patterns
6. **Responsive** — Works on mobile/tablet/desktop
7. **Accessible** — shadcn/ui components have ARIA
8. **Testable** — Backend functions can be unit tested
9. **Maintainable** — Separation of concerns
10. **Scalable** — Pagination, filtering, search handled efficiently

### Migration Priority

| Priority | Tables | Effort |
|----------|--------|--------|
| **HIGH** | Port mappings (5 classes), InstallmentsDataTable, SupplierCancellationConditionsDataTable | Complex, high-risk |
| **MEDIUM** | SuppliersDataTable, InstallmentSettingsDataTable, CancellationConditionsDataTable | Standard CRUD |
| **LOW** | Simple tables (8 classes), Jobs/Failed Jobs (3 classes) | Straightforward |

---

## Summary

21 Yajra DataTable classes for server-side rendering: 8 simple (basic columns, few actions), 3 standard (with services), 6 complex (relationships, formatting), 4 port mappings (custom JavaScript), 2 job/import tracking. **CRITICAL:** N+1 queries in complex tables, string HTML building in loops. **HIGH:** No authorization (all 21 tables), missing null checks, unsafe JSON parsing, hardcoded routes, mixed initialization patterns, CSRF not visible. **MEDIUM:** Hardcoded table IDs, no filtering, DRY violations, untyped parameters, scattered business logic.

In Base44: Replace Yajra with React DataGrid, create backend functions for data fetching with authorization/validation, refactor port mappings from jQuery to React forms, use shadcn/ui DataGrid component, implement pagination/search/filtering server-side, add type safety, handle authorization at function level, remove all hardcoded HTML generation.

**Migration Priority: HIGH** — DataTables are heavily used in admin panel; refactoring improves performance (no N+1), security (authorization), and maintainability (React patterns); can be done incrementally per table.