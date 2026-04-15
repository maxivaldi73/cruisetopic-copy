# Cruise Controller

**Purpose:** Manage cruise records (incomplete stub controller).  
**Namespace:** `App\Http\Controllers\Admin\Cruise`  
**Location:** `App/Http/Controllers/Admin/Cruise/CruiseController.php`  
**Type:** Minimal controller — low priority (mostly stubs)

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| File Size | 1.3 KB |
| Methods | 7 (index, create, store, edit, update, destroy, bestforyouToggle) |
| Auth | Likely admin-only |
| Purpose | CRUD for cruise records (master data) |
| Related Models | Cruise |
| Related Actions | IndexCruise, EditCruise, UpdateBestForYouCruise |
| Status | **INCOMPLETE — 4 of 7 methods are stubs** |

---

## 🔧 Controller Methods

### index(IndexCruise $action)
List all cruises via action.

```php
public function index(IndexCruise $action)
{
    return $action->getCruise();
}
```

**Notes:**
- Delegates to action
- No data visible in controller

---

### create()
**STUB — NOT IMPLEMENTED**

```php
public function create()
{
    //
}
```

No implementation.

---

### store(Request $request)
**STUB — NOT IMPLEMENTED**

```php
public function store(Request $request)
{
    //
}
```

No implementation.

---

### edit(EditCruise $action, Cruise $cruise)
Display cruise edit form.

```php
public function edit(EditCruise $action, Cruise $cruise)
{
    return $action->edit($cruise);
}
```

**Notes:**
- Model binding on Cruise
- Delegates to action

---

### update(Request $request, string $id)
**STUB — NOT IMPLEMENTED**

```php
public function update(Request $request, string $id)
{
    //
}
```

No implementation.

---

### destroy(string $id)
**STUB — NOT IMPLEMENTED**

```php
public function destroy(string $id)
{
    //
}
```

No implementation.

---

### bestforyouToggle(Request $request, UpdateBestForYouCruise $action)
Toggle "best for you" flag on cruise.

```php
public function bestforyouToggle(Request $request, UpdateBestForYouCruise $action)
{
    return $action->updateBestForYou($request);
}
```

**Notes:**
- Delegates to action
- Likely AJAX endpoint

---

## ⚠️ Issues & Concerns

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 HIGH | **4 of 7 methods are stubs** — create, store, update, destroy not implemented | CRUD incomplete |
| 2 | ⚠️ HIGH | **No authorization checks** — visible from controller | Security risk |
| 3 | ⚠️ MEDIUM | **No validation** — stubs accept Request but don't validate | Data integrity |
| 4 | ⚠️ MEDIUM | **Inconsistent pattern** — some use actions, bestforyouToggle also uses action | Mixed patterns |
| 5 | ℹ️ LOW | **Dead code** — stub methods add nothing | Code smell |

---

## 📝 Migration Notes for Base44

### Strategy: Implement via Backend Functions

**Step 1: Create Cruise Entity**

```json
// entities/Cruise.json
{
  "code": {"type": "string", "unique": true},
  "itinerary_id": {"type": "string"},
  "ship_id": {"type": "string"},
  "cruiseline_id": {"type": "string"},
  "departure_date": {"type": "string", "format": "date"},
  "arrival_date": {"type": "string", "format": "date"},
  "duration": {"type": "integer"},
  "best_price": {"type": "number"},
  "enabled": {"type": "boolean", "default": true},
  "best_for_you": {"type": "boolean", "default": false}
}
```

**Step 2: Backend Functions**

**Function: listCruises**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cruises = await base44.entities.Cruise.list('-departure_date', 100);
  return Response.json({ cruises });
});
```

**Function: createCruise**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { code, itinerary_id, ship_id, cruiseline_id, departure_date, duration } = await req.json();

  if (!code || !itinerary_id) {
    return Response.json({ error: 'Code and itinerary_id required' }, { status: 400 });
  }

  const cruise = await base44.entities.Cruise.create({
    code,
    itinerary_id,
    ship_id,
    cruiseline_id,
    departure_date,
    duration,
    enabled: true,
  });

  return Response.json({ cruise }, { status: 201 });
});
```

**Function: updateCruise**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, ...data } = await req.json();

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  const cruise = await base44.entities.Cruise.update(id, data);
  return Response.json({ cruise });
});
```

**Function: deleteCruise**

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

  await base44.entities.Cruise.delete(id);
  return Response.json({ success: true });
});
```

**Function: toggleCruiseBestForYou**

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

  const cruise = await base44.entities.Cruise.get('Cruise', id);
  const updated = await base44.entities.Cruise.update(id, {
    best_for_you: !cruise.best_for_you,
  });

  return Response.json({ cruise: updated });
});
```

**Step 3: React Component**

```tsx
// pages/admin/CruisesPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function CruisesPage() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    itinerary_id: '',
    ship_id: '',
  });

  const { data, refetch } = useQuery({
    queryKey: ['cruises'],
    queryFn: () => base44.functions.invoke('listCruises', {}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createCruise', data),
    onSuccess: () => {
      refetch();
      setOpen(false);
      setFormData({ code: '', itinerary_id: '', ship_id: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteCruise', { id }),
    onSuccess: () => refetch(),
  });

  const bestForYouMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('toggleCruiseBestForYou', { id }),
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cruises</h1>
        <Button onClick={() => setOpen(true)}>Add Cruise</Button>
      </div>

      <DataGrid
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'departure_date', label: 'Departure' },
          { key: 'duration', label: 'Duration' },
          { key: 'best_for_you', label: 'Best For You', render: (row) => row.best_for_you ? '✓' : '✗' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => bestForYouMutation.mutate(row.id)}>
                  Toggle Best
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.id)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.cruises || []}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cruise</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              placeholder="Itinerary ID"
              value={formData.itinerary_id}
              onChange={(e) => setFormData({ ...formData, itinerary_id: e.target.value })}
              required
            />
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Key Improvements

1. **Complete Implementation** — All CRUD methods fully implemented
2. **Authorization** — Admin-only enforced
3. **Input Validation** — Validate all fields
4. **Consistent Pattern** — All methods use backend functions
5. **Error Handling** — Proper HTTP status codes
6. **No Stubs** — All methods functional

---

## Summary

CruiseController (1.3KB) is mostly stub—4 of 7 methods unimplemented (create, store, update, destroy). Only index, edit, and bestforyouToggle delegate to actions. No authorization, validation, or implementation of core CRUD.

In Base44: Implement all CRUD via backend functions with authorization/validation, create Cruise entity with relevant fields, React management page with DataGrid and dialog forms.

**Migration Priority: LOW** — simple CRUD, minimal complexity, but currently incomplete/non-functional.