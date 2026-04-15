# WebsitesDataTable (Multi-Tenancy Configuration)

**Purpose:** Yajra DataTable for managing multiple website instances (SaaS/multi-tenant configuration).  
**Namespace:** `App\DataTables\Website`  
**Location:** `App/DataTables/Website/WebsitesDataTable.php`  
**Type:** Multi-tenancy/configuration management — medium priority

---

## 📋 Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | List websites with market, timezone, currency, and online status |
| **Size** | 5.3 KB |
| **Complexity** | Medium (relationships, status badge, nested view) |
| **Quality** | ⚠️ Several issues |

---

## 🔧 Implementation

### Core Logic

```php
class WebsitesDataTable extends DataTable {
    protected FilterService $filterService;
    protected DataTableService $dataTableService;

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Edit market relationship
            ->editColumn('market_id', function (Website $website) {
                return $website->market?->name ?? '';
            })

            // Edit currency relationship
            ->editColumn('currency_id', function (Website $website) {
                return $website->Currency?->code ?? '';
            })

            // Status badge (Bootstrap styling)
            ->editColumn('is_online', function (Website $website) {
                return $website->is_online
                    ? '<span class="badge rounded-pill bg-label-success" style="cursor: pointer">Online</span>'
                    : '<span class="badge rounded-pill bg-label-danger" style="cursor: pointer">Offline</span>';
            })

            // Action buttons
            ->addColumn('action', function (Website $website) {
                return view('components.custom.datatables.actions.website.btn-actions', compact('website'))->render();
            })

            ->rawColumns(['is_online', 'action'])
            ->setRowId('id');
    }

    public function query(Website $model): QueryBuilder {
        return $model->newQuery()->with(['market', 'Currency']);  // ✅ Eager loading
    }

    public function getColumns(): array {
        return [
            Column::make('title'),
            Column::make('hostname'),
            Column::make('market_id')->title('Market'),
            Column::make('timezone'),
            Column::make('currency_id')->title('Currency'),
            Column::make('is_online'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center'),
        ];
    }
}
```

### Custom Button

```php
public function getCustomButtons(): array {
    return array_merge(
        $this->dataTableService->getButtons(),
        [
            Button::raw()
                ->text('<span>...</span><span class="d-none d-sm-inline-block">Aggiungi Website</span></span>')  // Italian
                ->attr([
                    'class' => 'btn create-new btn-primary ms-2',
                    'onclick' => 'window.location.href="' . route('websites.create') . '";'
                ]),
        ]
    );
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **Hardcoded Italian text** — 'Aggiungi Website' not i18n | Non-localized |
| 2 | ⚠️ HIGH | **Inline CSS on badge** — `style="cursor: pointer"` hardcoded, not responsive | Style management nightmare |
| 3 | ⚠️ HIGH | **No authorization checks** — Anyone can see all websites | Multi-tenant security gap |
| 4 | ⚠️ MEDIUM | **Currency model casing inconsistency** — `$website->Currency` (capital C) | Code smell |
| 5 | ⚠️ MEDIUM | **No status toggle on click** — Badge has `cursor: pointer` but no AJAX handler | UX lie |
| 6 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |
| 7 | ⚠️ MEDIUM | **Hardcoded route in onclick** — `route('websites.create')` in onclick string | Brittle |
| 8 | ⚠️ MEDIUM | **Magic column index [6]** — Non-searchable column hardcoded as index | Fragile |
| 9 | ℹ️ LOW | **Empty initCompleteScript** — "Eseguo customScript" comment but nothing happens | Dead code |
| 10 | ℹ️ LOW | **getAzione() method** — Unnecessary wrapper around view rendering | Indirection |
| 11 | ℹ️ LOW | **Italian comments** — "Ottieni i tuoi pulsanti personalizzati" | Code smell |
| 12 | ℹ️ LOW | **Bootstrap + Remixicon mix** — `.d-flex` (Bootstrap) + `ri ri-add-line` (Remixicon) | Styling inconsistency |

---

## 📝 Migration to Base44

### Step 1: Website Entity

```json
{
  "name": "Website",
  "type": "object",
  "properties": {
    "title": {"type": "string"},
    "hostname": {"type": "string"},
    "market_id": {"type": "string"},
    "timezone": {"type": "string"},
    "currency_id": {"type": "string"},
    "is_online": {"type": "boolean", "default": false}
  },
  "required": ["title", "hostname"]
}
```

### Step 2: Backend Function

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user can see websites (admin or super admin only)
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const websites = await base44.entities.Website.list('-created_date', 100);

    // Load relationships
    const enriched = await Promise.all(
      websites.map(async (site) => {
        const market = site.market_id 
          ? await base44.entities.Market.get(site.market_id)
          : null;
        const currency = site.currency_id
          ? await base44.entities.Currency.get(site.currency_id)
          : null;

        return { ...site, market, currency };
      })
    );

    return Response.json({ data: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/WebsitesPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2 } from 'lucide-react';

export function WebsitesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.functions.invoke('getWebsites', {}),
  });

  const websites = data?.data?.data || [];

  const handleStatusToggle = async (website) => {
    try {
      await base44.entities.Website.update(website.id, {
        is_online: !website.is_online,
      });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Websites</h1>
        <Button onClick={() => window.location.href = '/websites/create'}>
          Add Website
        </Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="font-medium">{website.title}</TableCell>
                  <TableCell className="font-mono text-sm">{website.hostname}</TableCell>
                  <TableCell>{website.market?.name || '-'}</TableCell>
                  <TableCell>{website.timezone}</TableCell>
                  <TableCell>{website.currency?.code || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      className="cursor-pointer"
                      variant={website.is_online ? 'default' : 'secondary'}
                      onClick={() => handleStatusToggle(website)}
                    >
                      {website.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.location.href = `/websites/${website.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this website?')) {
                          base44.entities.Website.delete(website.id);
                          refetch();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Backend checks admin/super_admin only
2. **i18n-ready** — "Add Website" from translation system
3. **Functional status toggle** — Click badge to toggle online/offline, actually works
4. **Type-safe** — React components with proper typing
5. **No hardcoded routes** — Routes managed by React router
6. **No inline CSS** — Styling via Tailwind + shadcn/ui
7. **Eager loading** — Relationships loaded server-side
8. **Responsive** — Mobile-friendly table
9. **No dead code** — Clean implementation
10. **Localization-ready** — All UI strings from i18n

---

## Summary

WebsitesDataTable (5.3 KB): Multi-tenant website management with market/currency relationships, online/offline status badge, custom action button. **HIGH:** Hardcoded Italian text ('Aggiungi Website'), inline CSS on status badge with `cursor: pointer` but no toggle functionality (UX lie), no authorization checks (multi-tenant security gap), hardcoded route in onclick string, magic column index [6]. **MEDIUM:** Currency model casing inconsistency, unused FilterService, empty initCompleteScript. **LOW:** Dead code, unnecessary wrappers, Italian comments, Bootstrap/Remixicon styling mix.

In Base44: Create Website entity, getWebsites backend function with admin-only authorization, React component with proper status toggle via entity.update(), Badge component with click handler, all UI text from i18n system, shadcn/ui Table component, no hardcoded routes/CSS, mobile-responsive design.

**Migration Priority: MEDIUM** — Configuration table, not heavily used; relatively straightforward migration; improves multi-tenant security with authorization checks; enables functional status toggle instead of fake clickable badge.