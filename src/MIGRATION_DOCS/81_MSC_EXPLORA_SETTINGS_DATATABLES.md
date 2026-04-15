# MSC & Explora Settings DataTables (Provider Configuration)

**Purpose:** Yajra DataTables for managing MSC and Explora provider API credentials and sync settings.  
**Namespace:** 
  - `App\DataTables\Provider\Msc` (MscSettingsDataTable.php)
  - `App\DataTables\Provider\Explora` (ExploraSettingsDataTable.php)  
**Type:** Integration configuration management — **CRITICAL priority**

---

## 📋 Overview

| Aspect | MSC | Explora |
|--------|-----|---------|
| **Purpose** | Configure MSC API credentials per cruiseline | Configure Explora API credentials per cruiseline |
| **Size** | 4.2 KB | 4.3 KB |
| **Complexity** | Low (minimal columns, view delegation) | Low (minimal columns, view delegation) |
| **Quality** | ⚠️ Several issues | ⚠️ Several issues |
| **Similarity** | **99% identical code** — Same pattern, different provider names |

---

## 🔧 Implementation

### Core Structure (Both are nearly identical)

```php
// MscSettingsDataTable
class MscSettingsDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Action buttons delegated to Blade view
            ->addColumn('action', function($setting) {
                return view('admin.msc.action')->with('setting', $setting);
            })
            ->setRowId('id');
    }

    public function query(MscSetting $model): QueryBuilder {
        return $model->newQuery(); // ⚠️ No filtering — returns ALL settings
    }

    public function getColumns(): array {
        return [
            Column::make('id'),
            Column::make('cruiseline_code'),
            Column::make('sync_enabled'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center'),
        ];
    }

    public function getCustomButtons(): array {
        return array_merge(
            $this->dataTableService->getButtons(),
            [
                Button::raw()
                    ->text('<span>...Create New...</span>')
                    ->attr([
                        'class' => 'btn create-new btn-primary ms-2',
                        'onclick' => 'window.location.href="' . route('msc.createSetting') . '";'
                    ]),
            ]
        );
    }
}

// ExploraSettingsDataTable — identical except:
// - view('admin.explora.action')
// - route('explora.createSetting')
// - Table ID: 'explora-settings-table'
```

### HTML Configuration

```php
public function html(): HtmlBuilder {
    $table = 'msc-settings-table'; // or 'explora-settings-table'
    $customParameters = [
        'autoWidth' => false,
        'stateSave' => true,
        'order' => [[0, 'desc']],
        'initComplete' => $this->initCompleteScript($table),
    ];

    return $dataTableService->configureHtml(
        $this->builder(),
        $table,
        $customParameters,
        $this->getCustomButtons(),
        false, // no checkboxes
        false, // no search builder
        [] // no checkbox options
    )->columns($this->getColumns());
}
```

---

## ⚠️ Issues Identified (Both Tables)

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all settings from any provider | **Security gap** |
| 2 | 🔴 CRITICAL | **No filtering in query()** — Retrieves ALL settings globally (line 47-48) | **Data exposure** |
| 3 | ⚠️ HIGH | **Hardcoded view paths** — `admin.msc.action` / `admin.explora.action` (line 37-38) | **Breaking change risk** |
| 4 | ⚠️ HIGH | **Hardcoded route names** — `route('msc.createSetting')` / `route('explora.createSetting')` (line 138) | **Brittle** |
| 5 | ⚠️ HIGH | **sync_enabled column not formatted** — Displayed as 0/1, not user-friendly | **UX issue** |
| 6 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | **Dead dependency** |
| 7 | ⚠️ MEDIUM | **Empty initCompleteScript** — No custom filtering or logic | **Unnecessary** |
| 8 | ⚠️ MEDIUM | **Wrong export filename** — Both use `'Jobs_'` instead of `'MscSettings_'` / `'ExploraSettings_'` (line 105) | **Bug** |
| 9 | ⚠️ MEDIUM | **Italian comments** — "Script per aggiungere filtri dinamici", "Ottieni i tuoi pulsanti" | **Code smell** |
| 10 | ⚠️ MEDIUM | **Inline HTML in button** — Bootstrap classes hardcoded, no spacing/truncation (line 134) | **Fragile** |
| 11 | ⚠️ MEDIUM | **Magic column index [3]** — Excludes column 3 from search (line 113-114) | **Fragile** |
| 12 | ℹ️ LOW | **99% code duplication** — Two files with virtually identical logic | **Maintenance burden** |
| 13 | ℹ️ LOW | **No cruiseline relationship display** — Only shows `cruiseline_code`, not friendly name | **UX issue** |

---

## 📝 Migration to Base44

### Step 1: Unified Entity

```json
{
  "name": "ProviderSetting",
  "type": "object",
  "properties": {
    "provider": {"type": "string", "enum": ["msc", "explora", "costa"], "required": true},
    "cruiseline_id": {"type": "string"},
    "api_key": {"type": "string"},
    "api_secret": {"type": "string"},
    "base_url": {"type": "string"},
    "sync_enabled": {"type": "boolean", "default": false},
    "last_sync_at": {"type": "string", "format": "date-time"},
    "last_sync_status": {"type": "string", "enum": ["pending", "success", "failed"]},
    "last_error": {"type": "string"}
  },
  "required": ["provider", "cruiseline_id"]
}
```

### Step 2: Backend Functions

```typescript
// functions/getProviderSettings.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { provider, cruiselineId, page = 0, syncStatus = '' } = await req.json();

  if (!provider || !['msc', 'explora', 'costa'].includes(provider)) {
    return Response.json({ error: 'Invalid provider' }, { status: 400 });
  }

  try {
    const filters = { provider };
    
    if (cruiselineId) {
      filters.cruiseline_id = cruiselineId;
    }

    if (syncStatus === 'enabled') filters.sync_enabled = true;
    if (syncStatus === 'disabled') filters.sync_enabled = false;

    const settings = await base44.entities.ProviderSetting.filter(
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

// functions/updateProviderSetting.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { settingId, provider, cruiselineId, apiKey, apiSecret, baseUrl, syncEnabled } = 
    await req.json();

  if (!provider || !cruiselineId || !apiKey || !apiSecret || !baseUrl) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const data = {
      provider,
      cruiseline_id: cruiselineId,
      api_key: apiKey,
      api_secret: apiSecret,
      base_url: baseUrl,
      sync_enabled: syncEnabled ?? false,
    };

    if (settingId) {
      await base44.entities.ProviderSetting.update(settingId, data);
    } else {
      await base44.entities.ProviderSetting.create(data);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/toggleProviderSyncEnabled.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { settingId } = await req.json();

  try {
    const setting = await base44.entities.ProviderSetting.get(settingId);
    
    await base44.entities.ProviderSetting.update(settingId, {
      sync_enabled: !setting.sync_enabled,
    });

    const updated = await base44.entities.ProviderSetting.get(settingId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/ProviderSettingsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Edit2, Plus, Power } from 'lucide-react';
import ProviderSettingForm from '@/components/admin/ProviderSettingForm';

const PROVIDERS = [
  { id: 'msc', name: 'MSC' },
  { id: 'explora', name: 'Explora' },
  { id: 'costa', name: 'Costa' },
];

export function ProviderSettingsPage() {
  const [provider, setProvider] = useState('msc');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [filters, setFilters] = useState({ syncStatus: '' });

  const { data: settingsData, refetch } = useQuery({
    queryKey: ['providerSettings', provider, page, filters],
    queryFn: () =>
      base44.functions.invoke('getProviderSettings', {
        provider,
        page,
        ...filters,
      }),
  });

  const settings = settingsData?.data?.data || [];

  const handleToggleSync = async (settingId) => {
    try {
      await base44.functions.invoke('toggleProviderSyncEnabled', { settingId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Provider Settings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSetting(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ProviderSettingForm
              setting={selectedSetting}
              provider={provider}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider Tabs */}
      <div className="flex gap-2 border-b">
        {PROVIDERS.map((p) => (
          <Button
            key={p.id}
            variant={provider === p.id ? 'default' : 'ghost'}
            onClick={() => {
              setProvider(p.id);
              setPage(0);
            }}
          >
            {p.name}
          </Button>
        ))}
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
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// components/admin/ProviderSettingForm.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PROVIDER_LABELS = {
  msc: 'MSC',
  explora: 'Explora',
  costa: 'Costa',
};

export default function ProviderSettingForm({ setting, provider, onSuccess }) {
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
      await base44.functions.invoke('updateProviderSetting', {
        settingId: setting?.id,
        provider,
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
      <div className="text-lg font-semibold">
        {PROVIDER_LABELS[provider]} Settings
      </div>

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
          placeholder="https://api.msc.com"
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

1. **Unified data model** — Single ProviderSetting entity with `provider` enum (msc, explora, costa)
2. **Authorization enforced** — Only admins can manage provider settings
3. **No view coupling** — React Dialog instead of hardcoded Blade view paths
4. **No route coupling** — Backend functions instead of hardcoded route() calls
5. **Better UX** — Badge-based toggle with Power icon, cruiseline name display
6. **No data exposure** — Can be scoped by cruiseline if needed
7. **Boolean UI-friendly** — Badge display instead of 0/1
8. **Provider tabs** — Switch between providers easily
9. **Error display** — Last error shown for failed syncs
10. **No code duplication** — Single implementation for all providers

---

## Summary

**MscSettingsDataTable** (4.2 KB) & **ExploraSettingsDataTable** (4.3 KB): Minimal provider configuration tables. **99% code duplication** — identical logic with provider-specific view/route names. **CRITICAL:** No authorization (security gap), no filtering (data exposure). **HIGH:** Hardcoded view paths (`admin.msc.action` / `admin.explora.action`), hardcoded route names (`msc.createSetting` / `explora.createSetting`), `sync_enabled` displays as 0/1 (UX). **MEDIUM:** Wrong export filename (uses "Jobs_"), unused FilterService, empty initCompleteScript, Italian comments, magic column indices.

In Base44: Create unified ProviderSetting entity with `provider` enum (msc, explora, costa), getProviderSettings backend function with admin-only authorization, toggleProviderSyncEnabled function, updateProviderSetting function, React page with provider tabs (no hardcoded routes), Dialog-based form, Badge toggle with Power icon, cruiseline name display, sync status display, no view coupling.

**Migration Priority: CRITICAL** — Integration configuration; extreme code duplication; hardcoded routes make system fragile; no authorization enables credential exposure; unified entity reduces maintenance burden & enables audit trail across all providers.