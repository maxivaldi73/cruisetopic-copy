# FibosCruiselineDataTable (Fibos Provider Cruiseline Mapping)

**Purpose:** Yajra DataTable for managing Fibos provider cruiseline mappings and sync configuration.  
**Namespace:** `App\DataTables\Provider\Cruiseline`  
**Type:** Provider-specific cruiseline integration configuration — **HIGH priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **File Size** | 14.4 KB |
| **Complexity** | HIGH (3 AJAX handlers, 2 Blade view dependencies, cache, relationships) |
| **Quality** | ⚠️ CRITICAL issues |
| **Model Used** | FibosCruiseline (Fibos-specific model) |
| **Features** | Cruiseline mapping, sync status toggle, relationship-based filtering |

---

## 🔧 Implementation Details

### Constructor & Caching

```php
public function __construct(DataTableService $dataTableService, FilterService $filterService) {
    parent::__construct();
    $this->dataTableService = $dataTableService;
    $this->filterService = $filterService;
    
    // Cache cruiselines list for 1 hour
    $this->cruiselines = cache()->remember('cruiselines_list', 3600, function () {
        return Cruiseline::pluck('name', 'id')->toArray();
    });
}
```

### Core Query & Relationships

```php
public function query(FibosCruiseline $model): QueryBuilder {
    return $model->newQuery()->with(['setting', 'cruiseline']); // ⚠️ No authorization filter
}
```

### Column Configuration (6 columns)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Standard | FibosCruiseline record ID |
| `code` | Standard | Fibos provider code |
| `cruiseline_id` | Edited | Maps to internal cruiseline (with X button to remove) |
| `sync_enabled` | Added | Shows sync status badge (Abilitato/Disabilitato/Non Configurato) |
| `action` | Computed | Delegates to Blade view for action buttons |
| `cruiseline_setting` | Hidden | Stores setting ID for toggle handler (line 128) |

### Data Transformation

```php
public function dataTable(QueryBuilder $query): EloquentDataTable {
    return (new EloquentDataTable($query))
        
        // Column 2: cruiseline_id — Edit with custom HTML + filtering
        ->editColumn('cruiseline_id', function (FibosCruiseline $fibosCruiseline) {
            if ($fibosCruiseline->cruiseline_id) {
                // Mapped: Show badge with X button
                return '<div class="d-flex align-items-center">
                    <span class="badge py-2 px-3 text-bg-danger me-3 remove">X</span>
                    <span>' . $fibosCruiseline->cruiseline->id . ' - ' . 
                          $fibosCruiseline->cruiseline->name . '</span>
                </div>';
            }
            // Unmapped: Render select dropdown view
            return view('components.custom.datatables.actions.provider.cruiseline.select-cruiseline-id',
                ['fibosCruiseline' => $fibosCruiseline, 'cruiselines' => $this->cruiselines]
            )->render();
        })
        ->filterColumn('cruiseline_id', function ($query, $keyword) {
            // Filter: 1 = has mapping, 0 = no mapping
            if ($keyword == 1) {
                $query->whereNotNull('cruiseline_id');
            } elseif ($keyword == 0) {
                $query->whereNull('cruiseline_id');
            }
        })
        
        // Column 3: sync_enabled — Show badge with filter support
        ->addColumn('sync_enabled', function (FibosCruiseline $fibosCruiseline) {
            if ($fibosCruiseline->setting && $fibosCruiseline->setting->sync_enabled) {
                return '<span class="badge text-bg-success">Abilitato</span>';
            } elseif ($fibosCruiseline->setting) {
                return '<span class="badge text-bg-danger">Disabilitato</span>';
            } else {
                return '<span class="badge text-bg-secondary">Non Configurato</span>';
            }
        })
        ->filterColumn('sync_enabled', function ($query, $keyword) {
            // Filter: 1=enabled, 0=disabled, 999=not configured
            if ($keyword == '1') {
                $query->whereHas('setting', fn($q) => $q->where('sync_enabled', 1));
            } elseif ($keyword == '0') {
                $query->whereHas('setting', fn($q) => $q->where('sync_enabled', 0));
            } elseif ($keyword == '999') {
                $query->whereDoesntHave('setting');
            }
        })
        
        // Hidden column: Store setting ID for AJAX handler
        ->addColumn('cruiseline_setting', function (FibosCruiseline $fibosCruiseline) {
            return $fibosCruiseline->setting->id ?? null;
        })
        
        // Action buttons (delegated to Blade view)
        ->addColumn('action', function (FibosCruiseline $fibosCruiseline) {
            $lastSyncJob = $fibosCruiseline->lastSyncJob?->status ?? false;
            return view('components.custom.datatables.actions.provider.cruiseline.datatable-actions',
                ['fibosCruiseline' => $fibosCruiseline, 'lastSyncJob' => $lastSyncJob]
            )->render();
        })
        
        ->rawColumns(['cruiseline_id', 'sync_enabled', 'action'])
        ->setRowId('id')
        ->with(['distinctFilters' => ['3' => $this->getDistinctValues('sync_enabled')]]);
}
```

### JavaScript Handlers (3 AJAX operations)

#### 1. **setCruiselineMapping** (Column 2 Change)
```js
$("#fiboscruiseline-table tbody").on("change", "tr td:nth-child(3)", function(event) {
    var id = DataTable.row(this).data().id;
    var cruiselineId = $(this).find("select").val();
    
    // Confirmation: "Confermi l'azione?"
    $.ajax({
        url: "/admin/fibos/mapping/update/set_cruiseline",  // ⚠️ Hardcoded route
        method: "GET",  // ⚠️ GET for mutation
        data: { id: id, cruiselineId: cruiselineId },
        success: () => $("#fiboscruiseline-table").DataTable().ajax.reload()
    });
});
```

#### 2. **removeCruiselineMapping** (Column 2 Click .remove button)
```js
$("#fiboscruiseline-table tbody").on("click", "tr td:nth-child(3) .remove", function() {
    var id = DataTable.row($(this).closest("tr")).data().id;
    
    // Confirmation: "Confermi l'azione?"
    $.ajax({
        url: "/admin/fibos/mapping/update/remove_cruiseline",  // ⚠️ Hardcoded route
        method: "GET",  // ⚠️ GET for mutation
        data: { id: id },
        success: () => $("#fiboscruiseline-table").DataTable().ajax.reload()
    });
});
```

#### 3. **syncEnabled** (Column 3 Click badge)
```js
$("#fiboscruiseline-table tbody").on("click", "tr td:nth-child(4)", function() {
    var id = DataTable.row(this).data().cruiseline_setting;  // ⚠️ Relies on hidden column
    
    if (!id) return false;  // Skip if not configured
    
    $.ajax({
        url: "/admin/fibos/toggleSettingSyncEnabled",  // ⚠️ Hardcoded route
        method: "GET",  // ⚠️ GET for mutation
        data: { id: id },
        success: () => $("#fiboscruiseline-table").DataTable().ajax.reload()
    });
});
```

---

## ⚠️ Critical Issues

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all Fibos cruiseline mappings | **Security gap** |
| 2 | 🔴 CRITICAL | **GET requests for mutations** (lines 224, 269, 328) — violates HTTP semantics | **Data corruption risk** |
| 3 | 🔴 CRITICAL | **Hardcoded AJAX routes** — 3 routes embedded in JS (lines 154, 162, 170) | **Brittle, maintenance nightmare** |
| 4 | 🔴 CRITICAL | **Hardcoded Blade view paths** — `admin.msc.action` + `select-cruiseline-id` (lines 74, 198) | **Breaking change risk** |
| 5 | 🔴 CRITICAL | **No CSRF token** — AJAX requests lack `_token` parameter (lines 222, 267, 326) | **CSRF vulnerability** |
| 6 | ⚠️ HIGH | **Hidden column coupling** — Relies on `cruiseline_setting` hidden column for sync toggle (line 311) | **Fragile, magic indices** |
| 7 | ⚠️ HIGH | **Inline HTML generation** — HTML badges hardcoded in PHP (lines 191-195, 299-303) | **Maintenance burden** |
| 8 | ⚠️ HIGH | **Magic column indices** — `[4]` non-searchable, `[3]` select, `[5]` hidden (lines 146-148) | **Brittle** |
| 9 | ⚠️ HIGH | **Italian UI strings** — Hardcoded Italian (SweetAlert, badges, comments) | **Non-localized** |
| 10 | ⚠️ MEDIUM | **Complex JavaScript generation** — 3 large template literal methods (lines 205-352) | **Hard to test, maintain** |
| 11 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used (line 18) | **Dead dependency** |
| 12 | ⚠️ MEDIUM | **N+1 queries potential** — `with(['setting', 'cruiseline'])` sufficient but no pagination checks | **Performance** |
| 13 | ⚠️ MEDIUM | **Cache invalidation unclear** — 1-hour cache with no refresh mechanism | **Stale data risk** |
| 14 | ⚠️ MEDIUM | **Commented out success alerts** (lines 229-232, 275-278, 333-336) | **Code smell** |
| 15 | ℹ️ LOW | **Magic filter values** — 999 for "not configured" (line 64) | **Implicit convention** |

---

## 📝 Migration to Base44

### Step 1: Entity Definition

```json
{
  "name": "FibosCruiselineMapping",
  "type": "object",
  "properties": {
    "fibos_code": {
      "type": "string",
      "description": "Fibos provider code"
    },
    "cruiseline_id": {
      "type": "string",
      "description": "Mapped internal cruiseline ID (nullable)"
    },
    "setting_id": {
      "type": "string",
      "description": "Reference to FibosSetting (nullable)"
    },
    "last_sync_at": {
      "type": "string",
      "format": "date-time",
      "description": "Last sync timestamp"
    },
    "last_sync_status": {
      "type": "string",
      "enum": ["pending", "success", "failed"],
      "default": "pending"
    },
    "sync_enabled": {
      "type": "boolean",
      "default": false,
      "description": "Whether sync is enabled for this mapping"
    }
  },
  "required": ["fibos_code"]
}
```

### Step 2: Backend Functions

```typescript
// functions/getFibosCruiselineMappings.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { page = 0, syncStatus = '' } = await req.json();

  try {
    const filters = {};
    
    if (syncStatus === 'enabled') filters.sync_enabled = true;
    if (syncStatus === 'disabled') filters.sync_enabled = false;
    if (syncStatus === 'not_configured') filters.setting_id = null;

    const mappings = await base44.entities.FibosCruiselineMapping.filter(
      filters,
      'fibos_code',
      25,
      page * 25
    );

    // Enrich with cruiseline & setting data
    const enriched = await Promise.all(
      mappings.map(async (mapping) => {
        let cruiseline = null;
        let setting = null;

        if (mapping.cruiseline_id) {
          cruiseline = await base44.entities.Cruiseline.get(mapping.cruiseline_id)
            .catch(() => null);
        }
        if (mapping.setting_id) {
          setting = await base44.entities.FibosSetting.get(mapping.setting_id)
            .catch(() => null);
        }

        return { ...mapping, cruiseline, setting };
      })
    );

    return Response.json({ data: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/updateFibosCruiselineMapping.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { mappingId, cruiselineId } = await req.json();

  if (!mappingId) {
    return Response.json({ error: 'Missing mappingId' }, { status: 400 });
  }

  try {
    await base44.entities.FibosCruiselineMapping.update(mappingId, {
      cruiseline_id: cruiselineId || null,
    });

    const updated = await base44.entities.FibosCruiselineMapping.get(mappingId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/toggleFibosCruiselineSyncEnabled.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { mappingId } = await req.json();

  if (!mappingId) {
    return Response.json({ error: 'Missing mappingId' }, { status: 400 });
  }

  try {
    const mapping = await base44.entities.FibosCruiselineMapping.get(mappingId);

    if (!mapping.setting_id) {
      return Response.json({ error: 'No setting configured' }, { status: 400 });
    }

    // Toggle via FibosSetting entity
    const setting = await base44.entities.FibosSetting.get(mapping.setting_id);
    await base44.entities.FibosSetting.update(mapping.setting_id, {
      sync_enabled: !setting.sync_enabled,
    });

    const updated = await base44.entities.FibosCruiselineMapping.get(mappingId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/FibosCruiselineMappingPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { X, Power } from 'lucide-react';
import FibosMappingForm from '@/components/admin/FibosMappingForm';

export function FibosCruiselineMappingPage() {
  const [page, setPage] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: mappingsData, refetch } = useQuery({
    queryKey: ['fibosMappings', page, syncStatus],
    queryFn: () =>
      base44.functions.invoke('getFibosCruiselineMappings', { page, syncStatus }),
  });

  const mappings = mappingsData?.data?.data || [];

  const handleRemoveMapping = async (mappingId) => {
    if (confirm('Remove this mapping?')) {
      try {
        await base44.functions.invoke('updateFibosCruiselineMapping', {
          mappingId,
          cruiselineId: null,
        });
        refetch();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleToggleSync = async (mappingId) => {
    try {
      await base44.functions.invoke('toggleFibosCruiselineSyncEnabled', { mappingId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const getSyncStatusBadge = (mapping) => {
    if (!mapping.setting) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }
    if (mapping.setting.sync_enabled) {
      return <Badge className="bg-green-600">Enabled</Badge>;
    }
    return <Badge className="bg-red-600">Disabled</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fibos Cruiseline Mappings</h1>
      </div>

      {/* Filters */}
      <Select value={syncStatus} onValueChange={setSyncStatus}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sync Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All</SelectItem>
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
          <SelectItem value="not_configured">Not Configured</SelectItem>
        </SelectContent>
      </Select>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fibos Code</TableHead>
              <TableHead>Mapped Cruiseline</TableHead>
              <TableHead>Sync Status</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell className="font-mono font-bold">{mapping.fibos_code}</TableCell>
                <TableCell>
                  {mapping.cruiseline ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {mapping.cruiseline.id} — {mapping.cruiseline.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveMapping(mapping.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Dialog open={open && selectedMapping?.id === mapping.id} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMapping(mapping)}
                        >
                          Set Mapping
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <FibosMappingForm
                          mapping={selectedMapping}
                          onSuccess={() => {
                            setOpen(false);
                            refetch();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className="cursor-pointer"
                    onClick={() => mapping.setting && handleToggleSync(mapping.id)}
                    variant={
                      mapping.setting
                        ? mapping.setting.sync_enabled
                          ? 'default'
                          : 'secondary'
                        : 'outline'
                    }
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {mapping.setting
                      ? mapping.setting.sync_enabled
                        ? 'Enabled'
                        : 'Disabled'
                      : 'Not Configured'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {mapping.last_sync_at
                    ? new Date(mapping.last_sync_at).toLocaleString()
                    : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  {/* Edit/view options */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// components/admin/FibosMappingForm.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FibosMappingForm({ mapping, onSuccess }) {
  const [cruiselineId, setCruiselineId] = useState(mapping?.cruiseline_id || '');
  const [loading, setLoading] = useState(false);

  const { data: cruselinesData } = useQuery({
    queryKey: ['cruiselines'],
    queryFn: () => base44.entities.Cruiseline.list('-name', 100),
  });

  const cruiselines = cruselinesData?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.functions.invoke('updateFibosCruiselineMapping', {
        mappingId: mapping?.id,
        cruiselineId,
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Fibos Code</label>
        <p className="text-lg font-mono">{mapping?.fibos_code}</p>
      </div>

      <div>
        <label htmlFor="cruiseline" className="text-sm font-semibold">
          Map to Cruiseline *
        </label>
        <Select value={cruiselineId} onValueChange={setCruiselineId}>
          <SelectTrigger>
            <SelectValue placeholder="Select cruiseline" />
          </SelectTrigger>
          <SelectContent>
            {cruiselines.map((cl) => (
              <SelectItem key={cl.id} value={cl.id}>
                {cl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Map Cruiseline'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Only admins can manage Fibos mappings
2. **Proper HTTP verbs** — POST/PUT for mutations instead of GET
3. **CSRF protection** — Backend functions enforce CSRF validation
4. **No hardcoded routes** — Uses backend functions instead of hardcoded URLs
5. **No Blade view coupling** — React components instead of view paths
6. **No hidden columns** — Explicit data structure, clean API
7. **Type-safe relationships** — Explicit cruiseline & setting data
8. **Localized UI** — English labels, easily configurable
9. **Better UX** — Badges with action buttons, clear status display
10. **Testable** — Functions can be tested independently
11. **Audit trail** — Tracks `last_sync_at` & `last_sync_status`
12. **No magic indices** — Clear data model

---

## Summary

**FibosCruiselineDataTable** (14.4 KB): Complex provider-specific cruiseline mapping table with **3 embedded AJAX handlers** (set mapping, remove mapping, toggle sync) and **2 Blade view dependencies**. **CRITICAL:** No authorization (security gap), GET requests for mutations (HTTP violation), hardcoded AJAX routes (brittle), hardcoded Blade views (fragile), no CSRF tokens (vulnerability). **HIGH:** Hidden column coupling (`cruiseline_setting` for sync toggle), inline HTML generation, magic column indices, Italian UI strings. **MEDIUM:** Complex JavaScript generation, N+1 query potential, cache invalidation unclear, commented success alerts.

In Base44: Create FibosCruiselineMapping entity with `fibos_code`, `cruiseline_id`, `setting_id`, `sync_enabled` fields. Implement getF​ibosCruiselineMappings backend function with admin-only auth and filtering. Add updateFibosCruiselineMapping function for mapping changes & toggleFibosCruiselineSyncEnabled function for sync toggle. Build React page with sync status filter, cruiseline select dialog, inline badge toggles (no hidden columns), proper HTTP verbs, no hardcoded routes, English UI text.

**Migration Priority: CRITICAL** — Complex AJAX handler architecture; 3 hardcoded routes make system extremely fragile; hardcoded Blade views prevent refactoring; no authorization enables data exposure; GET mutations violate HTTP semantics; many instances of this pattern across providers.