# Cabin Type Controller

**Purpose:** Manage cabin type master data (e.g., Suite, Balcony, Interior).  
**Namespace:** `App\Http\Controllers\Admin\Setting`  
**Location:** `App/Http/Controllers/Admin/Setting/CabinTypeController.php`  
**Type:** CRUD controller for cabin type settings — medium priority

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| File Size | 3.3 KB |
| Methods | 7 (index, create, store, edit, update, destroy + 2 dev methods) |
| Auth | Likely admin-only |
| Purpose | Manage cabin types and clear/sync cabin data |
| Related Models | CabinType, Cabin, Ship |

---

## 🔧 Controller Methods

### index()
Lists all cabin types for a specific ship.

```php
public function index()
{
    $shipId = request()->route('ship');
    $ship = Ship::findOrFail($shipId);
    $cruiselineId = $ship->cruiseline_id;
    $cabintypes = CabinType::all();
    return view('admin.cabin-types.index', compact(...));
}
```

| Aspect | Detail |
|--------|--------|
| Route | `GET /admin/cabin-types` or similar |
| Parameters | shipId from route |
| Logic | Fetch ship, get cruiseline_id, load all cabin types |
| Response | View with cabintypes, shipId, cruiselineId |

**Issue:** Loads ALL cabin types globally, not filtered by ship. Data injection mismatch.

---

### create()
Display cabin type creation form.

```php
public function create()
{
    return view('admin.cabin-types.edit');
}
```

Simple view rendering, no data injection.

---

### store(Request $request)
Create new cabin type.

```php
public function store(Request $request)
{
    $data = $request->all();
    $cabintype = CabinType::create($data);
    return redirect()->route('cabintypes.edit', $cabintype->id)
        ->with('success', 'CabinType created successfully.');
}
```

| Aspect | Detail |
|--------|--------|
| Input | All request data |
| Validation | None |
| Logic | Create CabinType record |
| Response | Redirect to edit with success message |

**Issue:** No input validation, accepts all fields.

---

### edit(string $id)
Display cabin type edit form.

```php
public function edit(string $id)
{
    $cabintype = CabinType::findOrFail($id);
    return view('admin.cabin-types.edit', compact('cabintype'));
}
```

Fetch and display cabin type for editing.

---

### update(Request $request, string $id)
Update cabin type.

```php
public function update(Request $request, string $id)
{
    $cabintype = CabinType::findOrFail($id);
    $data = $request->all();
    $cabintype->update($data);
    return redirect()->route('cabintypes.edit', $cabintype->id)
        ->with('success', 'CabinType updated successfully.');
}
```

| Aspect | Detail |
|--------|--------|
| Input | All request data |
| Validation | None |
| Logic | Update record |
| Response | Redirect to edit with success |

**Issue:** No validation, accepts all fields.

---

### destroy(string $id)
Delete cabin type.

```php
public function destroy(string $id)
{
    try {
        $cabintype = CabinType::findOrFail($id);
        $cabintype->delete();
        return redirect()->route('cabintypes.index')
            ->with('success', 'CabinType deleted successfully');
    } catch (\Exception $e) {
        return redirect()->back()->with('error', $e->getMessage());
    }
}
```

| Aspect | Detail |
|--------|--------|
| Logic | Find, delete, redirect |
| Error Handling | Try/catch with generic error message |
| Response | Redirect with success/error |

**Issue:** No check for cabin associations before deleting. May cascade delete cabins.

---

### clearCabinTypeCabins(string $id) — [DEV ONLY]
**Marked as dev-only** — purges all cabins of a given type.

```php
public function clearCabinTypeCabins(string $id)
{
    $cabinType = CabinType::findOrFail($id);
    $deleted = Cabin::where('type', $cabinType->code)->delete();
    return redirect()->back()->with('success', 
        "Eliminate {$deleted} cabine per il tipo '{$cabinType->name}' ...");
}
```

| Aspect | Detail |
|--------|--------|
| Purpose | Delete all cabins of a type (destructive) |
| Input | Cabin type ID |
| Logic | Find type, delete all cabins matching code |
| Response | Redirect with count of deleted |

**Issues:**
- 🔴 **DANGEROUS** — Purges data without confirmation
- No authorization check
- No audit trail
- Italian comments (dev marker unclear if respected)

---

### syncCabinTypeData(Request $request) — [DEV ONLY]
**Marked as dev-only** — syncs cabin data by type code.

```php
public function syncCabinTypeData(Request $request)
{
    $code = $request->input('cabin_type_code');
    
    if (!$code) {
        return redirect()->back()->with('error', 'Codice tipo cabina non fornito.');
    }
    
    $cabinType = CabinType::where('code', $code)->first();
    
    if (!$cabinType) {
        return redirect()->back()->with('error', "Nessun CabinType trovato...");
    }
    
    $count = Cabin::where('type', $code)->count();
    
    return redirect()->back()->with('success', 
        "Sync completato per '{$cabinType->name}'... Cabine trovate: {$count}.");
}
```

| Aspect | Detail |
|--------|--------|
| Purpose | Count/validate cabins by type code |
| Input | cabin_type_code from request |
| Logic | Find type, count matching cabins, return count |
| Response | Redirect with count message |

**Issue:** Doesn't actually "sync" anything, just counts. Name is misleading.

---

## ⚠️ Issues & Concerns

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **clearCabinTypeCabins** — Destructive dev method left in production code | Data loss |
| 2 | ⚠️ HIGH | **No Input Validation** — store() and update() accept raw $request->all() | SQL injection, invalid data |
| 3 | ⚠️ HIGH | **No Authorization** — no gate/permission checks on any method | Security risk |
| 4 | ⚠️ HIGH | **No Cascade Protection** — destroy() can orphan or cascade delete cabins | Data integrity |
| 5 | ⚠️ MEDIUM | **syncCabinTypeData** — Misleading name, doesn't sync anything (dev leftover) | Confusing API |
| 6 | ⚠️ MEDIUM | **index() Logic** — Loads all cabin types globally, not filtered by ship | Wrong data |
| 7 | ⚠️ MEDIUM | **No Soft Deletes** — destroy() is permanent, no recovery | Data loss |
| 8 | ⚠️ MEDIUM | **Italian Error Messages** — not i18n-friendly | Localization issue |
| 9 | ℹ️ LOW | **Generic Exception Handling** — catch (\Exception $e) too broad | Hard to debug |
| 10 | ℹ️ LOW | **Dev Methods in Production** — [DEV] marked but not removed/gated | Code smell |

---

## 📝 Migration Notes for Base44

### Strategy: Backend Functions + Entity

**Step 1: Create CabinType Entity**

```json
// entities/CabinType.json
{
  "code": {"type": "string", "unique": true},
  "name": {"type": "string"},
  "description": {"type": "string"},
  "ship_capacity": {"type": "integer"},
  "is_active": {"type": "boolean", "default": true}
}
```

**Step 2: Backend Functions**

**Function: listCabinTypes**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cabinTypes = await base44.entities.CabinType.list('-created_date', 100);
  return Response.json({ cabinTypes });
});
```

**Function: createCabinType**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { code, name, description, ship_capacity } = await req.json();

  // Validate
  if (!code || !name) {
    return Response.json(
      { error: 'Code and name required' },
      { status: 400 }
    );
  }

  // Check unique code
  const existing = await base44.entities.CabinType.filter({ code });
  if (existing.length > 0) {
    return Response.json(
      { error: 'Code already exists' },
      { status: 409 }
    );
  }

  const cabinType = await base44.entities.CabinType.create({
    code,
    name,
    description,
    ship_capacity,
  });

  return Response.json({ cabinType }, { status: 201 });
});
```

**Function: updateCabinType**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, code, name, description, ship_capacity } = await req.json();

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  const cabinType = await base44.entities.CabinType.update(id, {
    code,
    name,
    description,
    ship_capacity,
  });

  return Response.json({ cabinType });
});
```

**Function: deleteCabinType**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  // Check if cabin type is in use
  const cabins = await base44.entities.Cabin.filter({ type: id }, 'id', 1);
  if (cabins.length > 0) {
    return Response.json(
      { error: 'Cannot delete cabin type with associated cabins' },
      { status: 409 }
    );
  }

  await base44.entities.CabinType.delete(id);

  return Response.json({ success: true });
});
```

**Step 3: React Component**

```tsx
// pages/admin/CabinTypesPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function CabinTypesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '' });

  const { data, refetch } = useQuery({
    queryKey: ['cabinTypes'],
    queryFn: () => base44.functions.invoke('listCabinTypes', {}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createCabinType', data),
    onSuccess: () => {
      refetch();
      setOpen(false);
      setFormData({ code: '', name: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateCabinType', data),
    onSuccess: () => {
      refetch();
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteCabinType', { id }),
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ ...formData, id: editing.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cabin Types</h1>
        <Button onClick={() => setOpen(true)}>Add Cabin Type</Button>
      </div>

      <DataGrid
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setEditing(row);
                  setFormData(row);
                  setOpen(true);
                }}>Edit</Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate(row.id)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.cabinTypes || []}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Cabin Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Code (e.g., STE, BAL, INT)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              placeholder="Name (e.g., Suite, Balcony, Interior)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Button type="submit" className="w-full">
              {editing ? 'Update' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Key Improvements

1. **Input Validation** — All fields validated before database operations
2. **Authorization** — Admin-only access enforced
3. **Cascade Protection** — Delete checks for associations before removing
4. **No Destructive Dev Methods** — clearCabinTypeCabins() removed
5. **Proper HTTP Status Codes** — 201 for created, 409 for conflict, 403 for forbidden
6. **Error Messages** — English, user-friendly, actionable
7. **Audit Trail** — Creation/modification tracked via entity timestamps
8. **Soft Deletes** — Can implement via entity flags if recovery needed

---

## Summary

CabinType controller manages cabin type CRUD with 2 dev-only methods (clearCabinTypeCabins, syncCabinTypeData) left in production. Issues: no validation, no authorization, cascade delete risk, Italian messages, index logic wrong (loads all types globally). In Base44, create CabinType entity, extract to backend functions with validation/authorization, implement React component with DataGrid and dialog forms, remove destructive dev methods.

**Migration Priority: MEDIUM** — straightforward CRUD conversion, but must remove dev code and add validation.