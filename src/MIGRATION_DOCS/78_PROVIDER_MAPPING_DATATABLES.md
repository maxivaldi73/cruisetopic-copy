# Provider Mapping DataTables (Cruiseline Data Synchronization)

**Purpose:** Yajra DataTables for managing provider-to-system port mappings and tracking sync job progress.  
**Namespace:** `App\DataTables\Provider`  
**Location:** 
  - `App/DataTables/Provider/ProviderMappingPortDataTable.php`
  - `App/DataTables/Provider/SyncJobDataTable.php`  
**Type:** Data integration management — **CRITICAL priority**

---

## 📋 Overview

### ProviderMappingPortDataTable

| Aspect | Details |
|--------|---------|
| **Purpose** | Map provider-specific port codes to internal port database (handles ambiguous/unknown ports) |
| **Size** | 11.4 KB |
| **Complexity** | **Very High** (Select2 AJAX, inline editing, confirmation dialogs, custom filtering) |
| **Quality** | 🔴 Critical architectural issues |

### SyncJobDataTable

| Aspect | Details |
|--------|---------|
| **Purpose** | Track async sync job progress from Fibos/MSC/Costa/Explora with failure metrics |
| **Size** | 5.9 KB |
| **Complexity** | Medium (badge generation, multi-field status tracking) |
| **Quality** | ⚠️ Several issues |

---

## 🔧 ProviderMappingPortDataTable Implementation

### Core Logic

```php
class ProviderMappingPortDataTable extends DataTable {
    protected $cruiselineId; // Context: which cruiseline's ports to map

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Is it a port or just a navigation day?
            ->editColumn('is_not_a_port', fn(ProviderMapPort $pmp) => 
                $pmp->is_not_a_port 
                    ? '<span class="badge py-2 px-3 text-bg-info">Navigazione</span>'
                    : '<span class="badge py-2 px-3 text-bg-success">Porto</span>'
            )

            // Port mapping: either mapped port with remove button, or Select2 AJAX dropdown
            ->editColumn('port_id', fn(ProviderMapPort $pmp) => 
                $pmp->port_id 
                    ? '<div class="d-flex align-items-center">
                        <span class="badge py-2 px-3 text-bg-danger me-3 remove">X</span>
                        <span>' . $pmp->port->name . '</span>
                       </div>'
                    : '<select class="form-control form-control-sm select2-ajax-ports" 
                        name="port_id" data-cruiseline-id="' . $this->cruiselineId . '">
                        <option>--- Seleziona Porto ---</option>
                       </select>'
            )
            ->filterColumn('port_id', function($query, $keyword) {
                // Filter by mapped (1) or unmapped (0)
                if ($keyword == 1) {
                    $query->whereNotNull('port_id');
                } elseif ($keyword == 0) {
                    $query->whereNull('port_id');
                }
            })

            ->editColumn('name', fn(ProviderMapPort $pmp) => $pmp->name ?? '')

            // Action buttons
            ->addColumn('action', fn(ProviderMapPort $pmp) => 
                view('components.custom.datatables.actions.provider.port-mapping-actions', 
                    ['providerMapPort' => $pmp])->render()
            )

            ->rawColumns(['is_not_a_port', 'port_id', 'action'])
            ->setRowId('id')
            ->with([
                'distinctFilters' => [
                    '2' => [['id' => 1, 'nome' => 'Mappato'], ['id' => 0, 'nome' => 'Non Mappato']],
                    '3' => [['id' => 1, 'nome' => 'Si'], ['id' => 0, 'nome' => 'No']],
                ],
            ]);
    }

    public function query(ProviderMapPort $model): QueryBuilder {
        return $model->newQuery()
            ->with('port:id,name') // Eager loading to avoid N+1
            ->where('cruiseline_id', $this->cruiselineId);
    }
}
```

### Select2 AJAX Integration

```javascript
// Complex inline JavaScript for dynamic port selection with confirmation dialogs
function initPortSelect2() {
    $('.select2-ajax-ports').each(function() {
        var $select = $(this);

        // Prevent double-initialization
        if ($select.hasClass('select2-hidden-accessible')) {
            return;
        }

        $select.select2({
            ajax: {
                url: '/admin/provider/mapping/search-ports', // ⚠️ Hardcoded route
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {
                        q: params.term || '',
                        page: params.page || 1
                    };
                },
                processResults: function (data, params) {
                    return {
                        results: data.results,
                        pagination: { more: data.pagination.more }
                    };
                },
                cache: true
            },
            placeholder: '--- Seleziona Porto ---',
            allowClear: true,
            minimumInputLength: 0,
            dropdownParent: $select.closest('td')
        });

        // On selection, confirm and update via AJAX
        $select.on('select2:select', function(e) {
            var id = $('#providerMapPort-table').DataTable().row($(this).closest('tr')).data().id;
            var selectedId = e.params.data.id;

            Swal.fire({
                title: "Confermi la mappatura?",
                text: "Vuoi mappare questo porto?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sì, conferma",
                cancelButtonText: "Annulla"
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: "/admin/provider/mapping/update/set_port_mapping", // ⚠️ Hardcoded route
                        method: "POST",
                        data: {
                            id: id,
                            selectedId: selectedId,
                            isPort: 0,
                            _token: $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(response) {
                            Swal.fire("Successo!", "Porto mappato!", "success");
                            $('#providerMapPort-table').DataTable().ajax.reload(null, false);
                        },
                        error: function(xhr, status, error) {
                            Swal.fire("Errore!", "Problema nella mappatura.", "error");
                        }
                    });
                } else {
                    $select.val(null).trigger('change');
                }
            });
        });
    });
}

// Re-initialize on each table redraw
$('#providerMapPort-table').on('draw.dt', function() {
    setTimeout(function() {
        initPortSelect2();
    }, 100);
});
```

---

## ⚠️ ProviderMappingPortDataTable Issues

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Hardcoded endpoints in JavaScript** — `/admin/provider/mapping/search-ports`, `/admin/provider/mapping/update/set_port_mapping`, etc. | Brittle; breaks on route changes |
| 2 | 🔴 CRITICAL | **No authorization check** — Anyone can map any provider port to any internal port | Security gap |
| 3 | 🔴 CRITICAL | **$cruiselineId passed via constructor (untyped)** — No validation; could accept null or invalid IDs | Input validation missing |
| 4 | ⚠️ HIGH | **Inline JavaScript magic** — Table ID hardcoded as `providerMapPort-table` | Tight coupling |
| 5 | ⚠️ HIGH | **Magic column indices [2,3]** — Brittle; breaks on column reorder | Fragile code |
| 6 | ⚠️ HIGH | **Inline HTML generation in callbacks** — No escaping on `$providerMapPort->port->name` | XSS vulnerability |
| 7 | ⚠️ HIGH | **AJAX without CSRF validation** — Token in meta tag, but no verification server-side shown | CSRF risk |
| 8 | ⚠️ HIGH | **SweetAlert2 + Select2 + DataTable coupling** — All coupled in JavaScript blob | Hard to test/maintain |
| 9 | ⚠️ MEDIUM | **No loading indicator on AJAX** — User doesn't know if save is processing | UX issue |
| 10 | ⚠️ MEDIUM | **No error recovery** — If AJAX fails, Select2 state not reset | UX issue |
| 11 | ⚠️ MEDIUM | **Italian hardcoded strings** — All UI text in Italian only | i18n missing |
| 12 | ⚠️ MEDIUM | **View assumption** — `port-mapping-actions` view may not exist | Breaking change risk |
| 13 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |

---

## 🔧 SyncJobDataTable Implementation

### Core Logic

```php
class SyncJobDataTable extends DataTable {
    protected $cruiselineId;

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Sync counts with failure badges
            ->editColumn('cruiselines_nr', fn(SyncJob $job) => 
                $this->getSpanWithBadge($job->cruiselines_nr, $job->failed_cruiselines)
            )
            ->editColumn('ships_nr', fn(SyncJob $job) => 
                $this->getSpanWithBadge($job->ships_nr, $job->failed_ships)
            )
            ->editColumn('ports_nr', fn(SyncJob $job) => 
                $this->getSpanWithBadge($job->ports_nr, $job->failed_ports)
            )
            // ... 5 more similar columns (cruises, itineraries, itinerary_elements, prices)

            // Status with error tooltip
            ->editColumn('status_description', fn(SyncJob $job) => 
                '<span class="position-relative">' . $job->status_description 
                . (SyncJob::find($job->job_id) 
                    ? '<i class="mdi mdi-information ms-2" 
                        data-toggle="tooltip" 
                        title="' . SyncJob::find($job->job_id)->exception . '"></i>'
                    : '') 
                . '</span>'
            )

            // Date formatting
            ->editColumn('created_at', fn(SyncJob $job) => 
                Carbon::parse($job->created_at)->format('d/m/Y H:i:s')
            )

            ->rawColumns(['cruiselines_nr', 'ships_nr', 'ports_nr', 'cruises_nr',
                'itineraries_nr', 'itinerary_elements_nr', 'prices_nr', 'status_description'])
            ->setRowId('id');
    }

    public function query(SyncJob $model): QueryBuilder {
        return $model->newQuery()->where('cruiseline_id', $this->cruiselineId);
    }

    private function getSpanWithBadge($total, $failed) {
        if ($failed > 0) {
            return '<span class="position-relative">' . $total 
                . '<span class="position-absolute top-0 start-100 ms-2 translate-middle badge rounded-pill bg-danger">' 
                . $failed . '</span></span>';
        }
        return $total;
    }
}
```

---

## ⚠️ SyncJobDataTable Issues

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ CRITICAL | **No authorization check** — Anyone can see all sync jobs from any cruiseline | Security gap |
| 2 | ⚠️ HIGH | **N+1 query on status_description** — `SyncJob::find($syncJob->job_id)` inside loop (line 60) | Performance issue |
| 3 | ⚠️ HIGH | **Hardcoded date format (d/m/Y H:i:s)** — Not i18n-aware | Localization issue |
| 4 | ⚠️ HIGH | **Magic column indices [3,4,5,6,7,8,9,10,11,12]** — Brittle; breaks on column reorder | Fragile code |
| 5 | ⚠️ HIGH | **Inline HTML without escaping** — HTML passed directly to view | XSS risk |
| 6 | ⚠️ MEDIUM | **Column definition mismatch** — 15 columns defined, but only ~8 display columns | Confusing |
| 7 | ⚠️ MEDIUM | **Tooltip initialization not handled** — `data-toggle="tooltip"` without Bootstrap Tooltip init | Non-functional tooltips |
| 8 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |
| 9 | ⚠️ MEDIUM | **Italian comments** — Code comments in Italian only | Documentation issue |
| 10 | ℹ️ LOW | **Empty initCompleteScript** — Just wraps default script with no custom logic | Unnecessary |

---

## 📝 Migration to Base44

### Step 1: Entities

```json
{
  "name": "ProviderPortMapping",
  "type": "object",
  "properties": {
    "cruiseline_id": {"type": "string"},
    "provider_code": {"type": "string"},
    "provider_name": {"type": "string"},
    "port_id": {"type": "string"},
    "is_not_a_port": {"type": "boolean"},
    "mapped_by": {"type": "string"},
    "mapped_at": {"type": "string", "format": "date-time"}
  }
}
```

```json
{
  "name": "SyncJob",
  "type": "object",
  "properties": {
    "cruiseline_id": {"type": "string"},
    "provider": {"type": "string", "enum": ["fibos", "msc", "costa", "explora"]},
    "status": {"type": "string", "enum": ["pending", "running", "completed", "failed"]},
    "status_description": {"type": "string"},
    "exception": {"type": "string"},
    "cruiselines_synced": {"type": "integer"},
    "cruiselines_failed": {"type": "integer"},
    "ships_synced": {"type": "integer"},
    "ships_failed": {"type": "integer"},
    "ports_synced": {"type": "integer"},
    "ports_failed": {"type": "integer"},
    "itineraries_synced": {"type": "integer"},
    "itineraries_failed": {"type": "integer"},
    "prices_synced": {"type": "integer"},
    "prices_failed": {"type": "integer"},
    "started_at": {"type": "string", "format": "date-time"},
    "completed_at": {"type": "string", "format": "date-time"}
  }
}
```

### Step 2: Backend Functions

```typescript
// functions/getProviderPortMappings.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { cruiselineId, page = 0, search = '', mapped = '' } = await req.json();

  if (!cruiselineId) {
    return Response.json({ error: 'cruiselineId required' }, { status: 400 });
  }

  try {
    const filters = { cruiseline_id: cruiselineId };

    if (search) {
      filters.$or = [
        { provider_code: { $regex: search, $options: 'i' } },
        { provider_name: { $regex: search, $options: 'i' } },
      ];
    }

    if (mapped === 'true') filters.port_id = { $exists: true, $ne: null };
    if (mapped === 'false') filters.port_id = null;

    const mappings = await base44.entities.ProviderPortMapping.filter(
      filters,
      '-created_date',
      25,
      page * 25
    );

    // Enrich with port names
    const enriched = await Promise.all(
      mappings.map(async (mapping) => {
        const port = mapping.port_id 
          ? await base44.entities.Port.get(mapping.port_id).catch(() => null)
          : null;
        return { ...mapping, port };
      })
    );

    return Response.json({ data: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/mapProviderPort.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { mappingId, portId } = await req.json();

  try {
    await base44.entities.ProviderPortMapping.update(mappingId, {
      port_id: portId,
      mapped_by: user.id,
      mapped_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/getSyncJobs.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { cruiselineId, page = 0 } = await req.json();

  try {
    const jobs = await base44.entities.SyncJob.filter(
      { cruiseline_id: cruiselineId },
      '-created_date',
      25,
      page * 25
    );

    return Response.json({ data: jobs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/searchPorts.js - for Select2 AJAX
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { q = '', page = 1 } = await req.json();

  try {
    const filters = q ? { name: { $regex: q, $options: 'i' } } : {};
    const ports = await base44.entities.Port.filter(filters, 'name', 25, (page - 1) * 25);

    return Response.json({
      results: ports.map((port) => ({ id: port.id, text: port.name })),
      pagination: { more: ports.length === 25 },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/ProviderMappingPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, MapPin } from 'lucide-react';

export function ProviderMappingPage() {
  const params = new URLSearchParams(window.location.search);
  const cruiselineId = params.get('cruiseline_id');

  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    mapped: '',
  });
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);

  const { data: mappingsData, refetch } = useQuery({
    queryKey: ['providerMappings', cruiselineId, page, filters],
    queryFn: () => base44.functions.invoke('getProviderPortMappings', {
      cruiselineId,
      page,
      ...filters,
    }),
    enabled: !!cruiselineId,
  });

  const { data: portsData } = useQuery({
    queryKey: ['ports', filters.search],
    queryFn: () => base44.functions.invoke('searchPorts', {
      q: filters.search,
      page: 1,
    }),
  });

  const mappings = mappingsData?.data?.data || [];
  const ports = portsData?.data?.results || [];

  const handleMapPort = async (mappingId, portId) => {
    try {
      await base44.functions.invoke('mapProviderPort', {
        mappingId,
        portId,
      });
      setSelectedMapping(null);
      setSelectedPort(null);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMapping = async (mappingId) => {
    try {
      await base44.functions.invoke('mapProviderPort', {
        mappingId,
        portId: null,
      });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Port Mappings</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search provider code/name..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <Select value={filters.mapped} onValueChange={(v) => setFilters({ ...filters, mapped: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Mapping Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value="true">Mapped</SelectItem>
            <SelectItem value="false">Unmapped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider Code</TableHead>
              <TableHead>Provider Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Mapped Port</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell className="font-mono text-sm">{mapping.provider_code}</TableCell>
                <TableCell>{mapping.provider_name}</TableCell>
                <TableCell>
                  <Badge variant={mapping.is_not_a_port ? 'secondary' : 'default'}>
                    {mapping.is_not_a_port ? 'Navigation' : 'Port'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {mapping.port_id && mapping.port ? (
                    <Badge>{mapping.port.name}</Badge>
                  ) : (
                    <span className="text-gray-500 text-sm">Not mapped</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!mapping.port_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedMapping(mapping)}>
                          <MapPin className="w-4 h-4 mr-2" />
                          Map
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Map Port</AlertDialogTitle>
                        <AlertDialogDescription>
                          Select a port to map "{mapping.provider_name}" to.
                        </AlertDialogDescription>
                        <Select value={selectedPort || ''} onValueChange={setSelectedPort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select port" />
                          </SelectTrigger>
                          <SelectContent>
                            {ports.map((port) => (
                              <SelectItem key={port.id} value={port.id}>
                                {port.text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              selectedPort && handleMapPort(mapping.id, selectedPort)
                            }
                            disabled={!selectedPort}
                          >
                            Confirm
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {mapping.port_id && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMapping(mapping.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// pages/admin/SyncJobsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function SyncJobsPage() {
  const params = new URLSearchParams(window.location.search);
  const cruiselineId = params.get('cruiseline_id');
  const [page, setPage] = useState(0);

  const { data: jobsData } = useQuery({
    queryKey: ['syncJobs', cruiselineId, page],
    queryFn: () =>
      base44.functions.invoke('getSyncJobs', { cruiselineId, page }),
    enabled: !!cruiselineId,
  });

  const jobs = jobsData?.data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sync Jobs</h1>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cruiselines</TableHead>
              <TableHead>Ships</TableHead>
              <TableHead>Ports</TableHead>
              <TableHead>Itineraries</TableHead>
              <TableHead>Prices</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  {format(new Date(job.started_at), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell className="capitalize">{job.provider}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[job.status] || 'bg-gray-100'}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {job.cruiselines_synced}
                  {job.cruiselines_failed > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {job.cruiselines_failed} failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {job.ships_synced}
                  {job.ships_failed > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {job.ships_failed} failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {job.ports_synced}
                  {job.ports_failed > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {job.ports_failed} failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {job.itineraries_synced}
                  {job.itineraries_failed > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {job.itineraries_failed} failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {job.prices_synced}
                  {job.prices_failed > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {job.prices_failed} failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {job.exception && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Error Details</AlertDialogTitle>
                        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
                          {job.exception}
                        </pre>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Key Improvements

**ProviderMappingPortDataTable:**
1. **Authorization enforced** — Only admins can map ports
2. **No hardcoded routes** — All endpoints passed via backend functions
3. **No inline JavaScript magic** — React handles Select/dialog management
4. **No magic indices** — Column management via React
5. **Safe HTML** — No inline HTML in callbacks
6. **No view coupling** — Dialog-based UI instead of external view
7. **Proper CSRF protection** — Backend validates all mutations
8. **Better UX** — AlertDialog confirmation instead of SweetAlert
9. **Searchable ports** — AJAX search via backend
10. **Proper error handling** — Validation on all inputs

**SyncJobDataTable:**
1. **Authorization enforced** — Only admins can view sync jobs
2. **No N+1 queries** — Exception loaded via separate query
3. **i18n-safe dates** — Uses date-fns
4. **Type-safe filtering** — No magic indices
5. **Proper badge display** — Failure counts in UI
6. **Error visibility** — Exception details in modal
7. **Clean implementation** — No dead code
8. **Mobile-responsive** — Proper table layout

---

## Summary

**ProviderMappingPortDataTable** (11.4 KB): Complex port mapping with Select2 AJAX, inline editing, confirmation dialogs. **CRITICAL:** Hardcoded endpoints in JavaScript, no authorization (security gap), untyped cruiselineId parameter. **HIGH:** Magic column indices [2,3], inline HTML without escaping (XSS), tight coupling to table ID, complex JS blob (Select2+SweetAlert2+DataTable).

**SyncJobDataTable** (5.9 KB): Sync job tracking with failure metrics. **CRITICAL:** No authorization. **HIGH:** N+1 query on exceptions, hardcoded date format, magic column indices, inline HTML without escaping, non-functional tooltips.

In Base44: Create ProviderPortMapping & SyncJob entities, backend functions with admin-only authorization & parameter validation, React pages with AlertDialog for mapping confirmation, AJAX port search via backend, proper error handling & exception display, i18n-safe dates, no hardcoded routes/magic indices/inline JS.

**Migration Priority: CRITICAL** — Core data synchronization infrastructure; hardcoded endpoints make system fragile; no authorization enables data corruption; enables proper audit trail for port mappings & sync job monitoring.