# FibosSettingDataTable (Fibos Provider Configuration)

**Purpose:** Yajra DataTable for managing Fibos provider API credentials and sync settings.  
**Namespace:** `App\DataTables\Provider\Setting`  
**Location:** `App/DataTables/Provider/Setting/FibosSettingDataTable.php`  
**Type:** Integration configuration management — **CRITICAL priority**

---

## 📋 Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | Configure Fibos API credentials per cruiseline and toggle sync enabled/disabled |
| **Size** | 6.8 KB |
| **Complexity** | High (N+1 queries, AJAX toggle, inline click handlers, view delegation) |
| **Quality** | 🔴 Critical issues |

---

## 🔧 Implementation

### Core Logic

```php
class FibosSettingDataTable extends DataTable {
    // ⚠️ No cruiselineId context — retrieves ALL Fibos settings globally

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // ❌ N+1 query: Cruiseline lookup in callback for every row
            ->addColumn('cruiseline_name', function($setting) {
                return (Cruiseline::whereCode($setting->cruiseline_code)->first())
                    ? Cruiseline::whereCode($setting->cruiseline_code)->first()->name
                    : '';
            })

            // Sync enabled badge
            ->editColumn('sync_enabled', fn(FibosSetting $fs) => 
                $fs->sync_enabled
                    ? '<span class="badge py-2 px-3 rounded-pill text-bg-success" style="cursor: pointer">Abilitato</span>'
                    : '<span class="badge py-2 px-3 rounded-pill text-bg-danger" style="cursor: pointer">Disabilitato</span>'
            )

            // Action view delegation
            ->addColumn('action', fn(FibosSetting $fs) => 
                view('components.custom.datatables.actions.provider.setting.datatable-actions',
                    ['fibosSetting' => $fs])->render()
            )

            ->rawColumns(['sync_enabled', 'action'])
            ->setRowId('id')
            ->with([
                'distinctFilters' => [
                    '3' => [
                        ['id' => 1, 'nome' => 'Abilitato'],
                        ['id' => 0, 'nome' => 'Disabilitato']
                    ],
                ],
            ]);
    }

    public function query(FibosSetting $model): QueryBuilder {
        return $model->newQuery(); // ⚠️ No filtering — returns ALL settings
    }

    public function getColumns(): array {
        return [
            Column::make('id'),
            Column::make('cruiseline_code'),
            Column::make('cruiseline_name'),
            Column::make('sync_enabled'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center'),
        ];
    }
}
```

### Click Handler Script

```javascript
// Inline AJAX toggle for sync_enabled column (column index 4)
$("#fibossetting-table tbody").on("click", "tr td:nth-child(4)", function(event) {
    var id = $("#fibossetting-table").DataTable().row(this).data().id;

    Swal.fire({
        title: "Confermi l'azione?",
        text: "Vuoi continuare con l'operazione?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sì, conferma",
        cancelButtonText: "Annulla"
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: "/admin/fibos/toggleSettingSyncEnabled", // ⚠️ Hardcoded route
                method: "GET",
                data: { id: id },
                success: function(response) {
                    $("#fibossetting-table").DataTable().ajax.reload();
                },
                error: function(xhr, status, error) {
                    Swal.fire("Errore!", "Problema nella modifica.", "error");
                }
            });
        }
    });
});
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all Fibos credentials across all cruiselines | **Security gap** |
| 2 | 🔴 CRITICAL | **No cruiselineId context** — Retrieves ALL Fibos settings globally (line 61) | **Data exposure** |
| 3 | 🔴 CRITICAL | **N+1 query on cruiseline lookup** — Calls `Cruiseline::whereCode()` twice per row (line 39) | **Performance** |
| 4 | 🔴 CRITICAL | **Hardcoded route in JavaScript** — `/admin/fibos/toggleSettingSyncEnabled` (line 175) | **Brittle** |
| 5 | 🔴 CRITICAL | **GET request for state mutation** — Toggle via `GET /admin/fibos/toggleSettingSyncEnabled?id=X` (line 176) | **REST violation, CSRF risk** |
| 6 | ⚠️ HIGH | **Magic column index [4]** — Click handler tied to column 4 hardcoded in JS (line 161) | **Fragile** |
| 7 | ⚠️ HIGH | **Inline HTML without escaping** — Badge HTML hardcoded in callback (lines 150-152) | **XSS risk** |
| 8 | ⚠️ HIGH | **Action view assumption** — `datatable-actions` view may not exist | **Breaking change risk** |
| 9 | ⚠️ HIGH | **Credentials exposure** — FibosSetting likely stores API keys; no filtering by user role | **Data leak** |
| 10 | ⚠️ HIGH | **Commented success message** — Success SweetAlert2 commented out (lines 181-185) | **UX issue** |
| 11 | ⚠️ MEDIUM | **Magic column index [3]** — Distinct filter tied to column 3 (line 51) | **Fragile** |
| 12 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | **Dead dependency** |
| 13 | ⚠️ MEDIUM | **Italian hardcoded strings** — All UI text in Italian only | **i18n missing** |
| 14 | ⚠️ MEDIUM | **Missing CSRF token** — AJAX GET request doesn't include CSRF protection (line 176) | **CSRF vulnerability** |
| 15 | ⚠️ MEDIUM | **Empty eager loading** — No relationship optimization in query | **Minor performance** |

---

## 📝 Migration to Base44

### Step 1: Entity

```json
{
  "name": "FibosSetting",
  "type": "object",
  "properties": {
    "cruiseline_id": {"type": "string"},
    "api_key": {"type": "string"},
    "api_secret": {"type": "string"},
    "base_url": {"type": "string"},
    "sync_enabled": {"type": "boolean", "default": false},
    "last_sync_at": {"type": "string", "format": "date-time"},
    "last_sync_status": {"type": "string", "enum": ["pending", "success", "failed"]},
    "last_error": {"type": "string"}
  },
  "required": ["cruiseline_id"]
}
```

### Step 2: Backend Functions

```typescript
// functions/getFibosSettings.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { cruiselineId, page = 0, syncStatus = '' } = await req.json();

  try {
    const filters = {};
    
    if (cruiselineId) {
      filters.cruiseline_id = cruiselineId;
    }

    if (syncStatus === 'enabled') filters.sync_enabled = true;
    if (syncStatus === 'disabled') filters.sync_enabled = false;

    const settings = await base44.entities.FibosSetting.filter(
      filters,
      '-updated_date',
      25,
      page * 25
    );

    // Enrich with cruiseline data
    const enriched = await Promise.all(
      settings.map(async (setting) => {
        const cruiseline = await base44.entities.Cruiseline.get(setting.cruiseline_id)
          .catch(() => null);
        return { ...setting, cruiseline };
      })
    );

    return Response.json({ data: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/toggleFibosSyncEnabled.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { settingId } = await req.json();

  if (!settingId) {
    return Response.json({ error: 'settingId required' }, { status: 400 });
  }

  try {
    const setting = await base44.entities.FibosSetting.get(settingId);
    
    await base44.entities.FibosSetting.update(settingId, {
      sync_enabled: !setting.sync_enabled,
    });

    const updated = await base44.entities.FibosSetting.get(settingId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/updateFibosSetting.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { settingId, cruiselineId, apiKey, apiSecret, baseUrl, syncEnabled } = 
    await req.json();

  if (!cruiselineId || !apiKey || !apiSecret || !baseUrl) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const data = {
      cruiseline_id: cruiselineId,
      api_key: apiKey,
      api_secret: apiSecret,
      base_url: baseUrl,
      sync_enabled: syncEnabled ?? false,
    };

    if (settingId) {
      await base44.entities.FibosSetting.update(settingId, data);
    } else {
      await base44.entities.FibosSetting.create(data);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/FibosSettingsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit2, Plus, Power } from 'lucide-react';
import FibosSettingForm from '@/components/admin/FibosSettingForm';

export function FibosSettingsPage() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [filters, setFilters] = useState({ syncStatus: '' });

  const { data: settingsData, refetch } = useQuery({
    queryKey: ['fibosSettings', page, filters],
    queryFn: () =>
      base44.functions.invoke('getFibosSettings', {
        page,
        ...filters,
      }),
  });

  const settings = settingsData?.data?.data || [];

  const handleToggleSync = async (settingId) => {
    try {
      await base44.functions.invoke('toggleFibosSyncEnabled', { settingId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fibos Settings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSetting(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <FibosSettingForm
              setting={selectedSetting}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div>
        <Select value={filters.syncStatus} onValueChange={(v) => setFilters({ ...filters, syncStatus: v })}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sync Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cruiseline</TableHead>
              <TableHead>Base URL</TableHead>
              <TableHead>Sync Status</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-medium">
                  {setting.cruiseline?.name || 'Unknown'}
                </TableCell>
                <TableCell className="font-mono text-sm">{setting.base_url}</TableCell>
                <TableCell>
                  <Badge 
                    variant={setting.sync_enabled ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => handleToggleSync(setting.id)}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {setting.sync_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {setting.last_sync_at 
                    ? new Date(setting.last_sync_at).toLocaleString()
                    : 'Never'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSetting(setting);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  {setting.last_error && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-600">
                          ⚠️
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Last Error</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
                            {setting.last_error}
                          </pre>
                        </AlertDialogDescription>
                        <AlertDialogAction>Close</AlertDialogAction>
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

// components/admin/FibosSettingForm.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FibosSettingForm({ setting, onSuccess }) {
  const [formData, setFormData] = useState({
    cruiseline_id: setting?.cruiseline_id || '',
    api_key: setting?.api_key || '',
    api_secret: setting?.api_secret || '',
    base_url: setting?.base_url || '',
    sync_enabled: setting?.sync_enabled ?? false,
  });
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
      await base44.functions.invoke('updateFibosSetting', {
        settingId: setting?.id,
        ...formData,
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
        <Label htmlFor="cruiseline">Cruiseline *</Label>
        <Select 
          value={formData.cruiseline_id} 
          onValueChange={(v) => setFormData({ ...formData, cruiseline_id: v })}
        >
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

      <div>
        <Label htmlFor="base_url">Base URL *</Label>
        <Input
          id="base_url"
          value={formData.base_url}
          onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
          placeholder="https://api.fibos.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="api_key">API Key *</Label>
          <Input
            id="api_key"
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="Your API key"
            required
          />
        </div>
        <div>
          <Label htmlFor="api_secret">API Secret *</Label>
          <Input
            id="api_secret"
            type="password"
            value={formData.api_secret}
            onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
            placeholder="Your API secret"
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={formData.sync_enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, sync_enabled: checked })}
        />
        <span className="text-sm">Enable sync</span>
      </label>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : setting ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Only admins can manage Fibos settings
2. **Scoped data retrieval** — Can filter by cruiseline; optional global view for admins
3. **No N+1 queries** — Cruiseline data fetched in enrichment step
4. **No hardcoded routes** — All endpoints via backend functions
5. **Proper HTTP verbs** — POST for state mutations, not GET
6. **CSRF protection** — Backend handles all mutations
7. **No magic indices** — React handles column management
8. **Safe HTML** — Badge component instead of inline HTML
9. **Better UX** — Badge toggle with confirmation dialog
10. **Error visibility** — Last error shown in alert dialog
11. **Proper validation** — Required fields enforced
12. **i18n-ready** — No hardcoded Italian strings

---

## Summary

FibosSettingDataTable (6.8 KB): Fibos API configuration management. **CRITICAL:** No authorization (security gap), no cruiselineId context (data exposure), N+1 cruiseline queries (line 39), hardcoded route in JavaScript (REST violation), GET request for state mutation (CSRF risk). **HIGH:** Magic column indices, inline HTML without escaping (XSS), action view assumption, credentials exposed, commented success message. **MEDIUM:** Missing CSRF token, Italian hardcoded strings, unused FilterService.

In Base44: Create FibosSetting entity (api_key, api_secret, base_url, sync_enabled, last_sync_at, last_error), getFibosSettings backend function with admin-only authorization & optional cruiseline filtering, toggleFibosSyncEnabled function with POST, updateFibosSetting with validation, React page with Dialog-based form, Badge toggle with confirmation, error display modal, cruiseline selector, i18n-safe dates.

**Migration Priority: CRITICAL** — Integration configuration; hardcoded routes make system fragile; no authorization enables credential exposure; GET mutation is REST violation; enables secure credential management & sync orchestration.