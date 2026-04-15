# ShipDataTable (Ship Management)

**Purpose:** Yajra DataTable for managing cruise ships (vessels) per cruiseline.  
**Namespace:** `App\DataTables\Provider\Ship`  
**Location:** `App/DataTables/Provider/Ship/ShipDataTable.php`  
**Type:** Master data management — **MEDIUM priority**

---

## 📋 Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | List ships (vessels) with basic info: code, name, enabled status |
| **Size** | 3.2 KB |
| **Complexity** | Low (minimal columns, simple filtering, delegated actions) |
| **Quality** | ⚠️ Several issues |

---

## 🔧 Implementation

### Core Logic

```php
class ShipDataTable extends DataTable {
    protected $cruiselineId;

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Action buttons delegated to Blade view
            ->addColumn('action', 'ship.action')
            ->setRowId('id');
    }

    public function query(Ship $model): QueryBuilder {
        return $model->newQuery()->where('cruiseline_id', $this->cruiselineId);
    }

    public function getColumns(): array {
        return [
            Column::make('id'),
            Column::make('code'),
            Column::make('name'),
            Column::make('enabled'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center'),
        ];
    }
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all ships from any cruiseline | Security gap |
| 2 | ⚠️ HIGH | **Action view delegation** — `'ship.action'` Blade view may not exist | Breaking change risk |
| 3 | ⚠️ HIGH | **$cruiselineId untyped** — No validation; could be null or invalid | Input validation missing |
| 4 | ⚠️ HIGH | **Boolean column `enabled` not formatted** — Displayed as 0/1, not user-friendly | UX issue |
| 5 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |
| 6 | ⚠️ MEDIUM | **Empty initCompleteScript** — No custom filtering or logic | Unnecessary |
| 7 | ⚠️ MEDIUM | **Italian comments** — "Script per aggiungere filtri dinamici" | Code smell |
| 8 | ℹ️ LOW | **No relationships loaded** — Could use eager loading for related data | Minor optimization |

---

## 📝 Migration to Base44

### Step 1: Entity

```json
{
  "name": "Ship",
  "type": "object",
  "properties": {
    "cruiseline_id": {"type": "string"},
    "code": {"type": "string"},
    "name": {"type": "string"},
    "enabled": {"type": "boolean", "default": true},
    "image_url": {"type": "string"},
    "gross_tonnage": {"type": "number"},
    "capacity": {"type": "integer"}
  },
  "required": ["cruiseline_id", "code", "name"]
}
```

### Step 2: Backend Function

```typescript
// functions/getShips.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { cruiselineId, page = 0, search = '', enabled = '' } = await req.json();

  if (!cruiselineId) {
    return Response.json({ error: 'cruiselineId required' }, { status: 400 });
  }

  try {
    const filters = { cruiseline_id: cruiselineId };

    if (search) {
      filters.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (enabled === 'true') filters.enabled = true;
    if (enabled === 'false') filters.enabled = false;

    const ships = await base44.entities.Ship.filter(
      filters,
      'name',
      25,
      page * 25
    );

    return Response.json({ data: ships });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/ShipsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Edit2, Trash2, Plus } from 'lucide-react';
import ShipForm from '@/components/admin/ShipForm';

export function ShipsPage() {
  const params = new URLSearchParams(window.location.search);
  const cruiselineId = params.get('cruiseline_id');

  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedShip, setSelectedShip] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    enabled: '',
  });

  const { data: shipsData, refetch } = useQuery({
    queryKey: ['ships', cruiselineId, page, filters],
    queryFn: () =>
      base44.functions.invoke('getShips', {
        cruiselineId,
        page,
        ...filters,
      }),
    enabled: !!cruiselineId,
  });

  const ships = shipsData?.data?.data || [];

  const handleDelete = async (shipId) => {
    if (confirm('Delete this ship?')) {
      await base44.entities.Ship.delete(shipId);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ships</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedShip(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ShipForm
              ship={selectedShip}
              cruiselineId={cruiselineId}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search code or name..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <Select value={filters.enabled} onValueChange={(v) => setFilters({ ...filters, enabled: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value="true">Enabled</SelectItem>
            <SelectItem value="false">Disabled</SelectItem>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ships.map((ship) => (
              <TableRow key={ship.id}>
                <TableCell className="font-mono text-sm">{ship.code}</TableCell>
                <TableCell className="font-medium">{ship.name}</TableCell>
                <TableCell>
                  <Badge variant={ship.enabled ? 'default' : 'secondary'}>
                    {ship.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedShip(ship);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ship.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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

// components/admin/ShipForm.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function ShipForm({ ship, cruiselineId, onSuccess }) {
  const [formData, setFormData] = useState({
    code: ship?.code || '',
    name: ship?.name || '',
    enabled: ship?.enabled ?? true,
    image_url: ship?.image_url || '',
    gross_tonnage: ship?.gross_tonnage || '',
    capacity: ship?.capacity || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        cruiseline_id: cruiselineId,
      };

      if (ship?.id) {
        await base44.entities.Ship.update(ship.id, data);
      } else {
        await base44.entities.Ship.create(data);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., BF2023"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Beatrice"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gross_tonnage">Gross Tonnage</Label>
          <Input
            id="gross_tonnage"
            type="number"
            value={formData.gross_tonnage}
            onChange={(e) => setFormData({ ...formData, gross_tonnage: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="capacity">Passenger Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <span className="text-sm">Enabled</span>
      </label>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : ship ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Only admins can manage ships
2. **No view coupling** — React Dialog instead of delegated Blade view
3. **Boolean UI-friendly** — Badge display instead of 0/1
4. **Parameter validation** — cruiselineId required
5. **Searchable** — Can filter by code or name
6. **Status filtering** — Can show enabled/disabled only
7. **Full CRUD** — Create, read, update, delete
8. **Type-safe** — React component with proper state management
9. **Mobile-responsive** — Grid-based form layout
10. **No dead code** — Clean implementation

---

## Summary

ShipDataTable (3.2 KB): Minimal ship management with basic columns (id, code, name, enabled status). **CRITICAL:** No authorization (security gap). **HIGH:** Boolean `enabled` column displays as 0/1 (UX issue), action view assumption, untyped cruiselineId parameter. **MEDIUM:** Unused FilterService, empty initCompleteScript, Italian comments.

In Base44: Create Ship entity with code, name, enabled, image_url, capacity fields, getShips backend function with admin-only authorization, React page with Dialog-based form, Badge for status display, searchable by code/name, filterable by enabled status, full CRUD.

**Migration Priority: MEDIUM** — Master data table for ships; straightforward migration; no complex relationships; improves UX (boolean display) & security (authorization); enables ship profile management with capacity/tonnage tracking.