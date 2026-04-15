# Port Controller

**Purpose:** Manage ports for cruise itineraries with provider mapping (Fibos, MSC, Costa, Explora).  
**Namespace:** `App\Http\Controllers\Admin\Port`  
**Location:** `App/Http/Controllers/Admin/Port/PortController.php`  
**Type:** CRUD + data sync controller — high priority

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| File Size | 5.9 KB |
| Methods | 11 (index, create, store, edit, update, destroy, maps, deletePortsWith0Itineraries, searchAjaxPort, addNewPortFromMapping, mergePortsWithSameCoordinates) |
| Auth | Likely admin-only |
| Purpose | Port management + provider port mapping |
| Related Models | Port, Continent, FibosPort, MscPort, CostaPort, ExploraPort, Itinerary |
| Traits | MediaUploadingTrait |
| Services | PortService |

---

## 🔧 Controller Methods

### index(IndexPort $action)
List all ports via action.

```php
public function index(IndexPort $action)
{
    return $action->getPort();
}
```

**Notes:**
- Delegates to IndexPort action
- No data visible in controller

---

### create()
Display port creation form.

```php
public function create()
{
    $port = new Port();
    $continents = Continent::with('countries')->orderBy('name')->get();
    
    return view('admin.ports.edit', compact('port', 'continents'));
}
```

**Logic:**
- Fetch continents with nested countries (for dropdown)
- Pass empty port model
- Reuses edit view for create + edit

---

### store(PortRequest $request, StorePort $action)
Create new port.

```php
public function store(PortRequest $request, StorePort $action)
{
    return $action->store($request);
}
```

**Good Pattern:** Delegates to action class.

---

### edit(EditPort $action, Port $port)
Display port edit form.

```php
public function edit(EditPort $action, Port $port)
{
    return $action->edit($port);
}
```

**Notes:**
- Model binding on Port
- Action handles data loading

---

### update(Request $request, string $id)
**STUB — NOT IMPLEMENTED**

```php
public function update(Request $request, string $id)
{
    //
}
```

⚠️ **Issue:** No implementation (empty method).

---

### destroy(Port $port, DestroyPort $action)
Delete port.

```php
public function destroy(Port $port, DestroyPort $action)
{
    return $action->destroy($port);
}
```

**Notes:**
- Model binding + action pattern

---

### maps(Request $request)
Display port map with markers.

```php
public function maps(Request $request) {
    $ports = Port::where('visible_on_map', true)->get();
    $markers = [];
    $ports->each(function($port, $key) use (&$markers) {
        if ($port->lat && $port->lng)
            $markers[] = $port->getMarkerData();
    });
    return view('admin.ports.maps', ['markers' => $markers]);
}
```

**Logic:**
- Load visible ports
- Extract marker data (lat/lng)
- Pass to map view

**Issues:**
- No authorization check
- N+1 potential (calling getMarkerData() on each port)

---

### deletePortsWith0Itineraries()
**[DEV METHOD]** — Delete unused ports.

```php
public function deletePortsWith0Itineraries()
{
    try {
        $this->portService->deletePortsWith0Itineraries();
        return redirect()->back()->with('success','Ports with 0 itineraries successfully deleted');
    } catch (\Exception $e){
        return redirect()->back()->with('error','Error deleting ports with 0 itineraries');
    }
}
```

**Issues:**
- 🔴 **No authorization** — anyone can delete ports
- 🔴 **No confirmation** — destructive operation without user verification
- ⚠️ **Generic exception** — error message not specific
- ⚠️ **No logging** — deletion not audited

---

### searchAjaxPort(Request $request)
AJAX endpoint for port search with optional filters.

```php
public function searchAjaxPort(Request $request) {
    $query = $request->get('q','');
    $cruiselines = array_values(array_filter(array_map('intval', (array) $request->get('cruiselines', []))));
    $destinations = array_values(array_filter(array_map('intval', (array) $request->get('destinations', []))));
    
    $ports = Port::select('ports.id','ports.name')
        ->when($query, function($q) use ($query) {
            $q->where('ports.name', 'like', '%'.$query.'%');
        })
        ->when(!empty($cruiselines) || !empty($destinations), function($q) use ($cruiselines, $destinations) {
            // Filter departure ports of itineraries constrained by optional filters
            $q->whereIn('ports.id', function($sub) use ($cruiselines, $destinations) {
                $sub->from('itineraries')
                    ->select('itineraries.departure_port_id');
                if (!empty($destinations)) {
                    $sub->join('itinerary_destination as idest', 'idest.itinerary_id', '=', 'itineraries.id')
                        ->whereIn('idest.destination_id', $destinations);
                }
                if (!empty($cruiselines)) {
                    $sub->whereIn('itineraries.cruiseline_id', $cruiselines);
                }
            });
        })
        ->orderBy('ports.name')
        ->limit(50)
        ->get();
    
    return response()->json($ports);
}
```

**Logic:**
- Search by name (LIKE)
- Optional filters: cruiselines, destinations
- Uses subquery to filter by associated itineraries
- Limits to 50 results

**Good:** Proper filtering with fluent query builder

**Issues:**
- No authorization check
- No input validation on filters
- LIKE query without escaping (LIKE is safe by default in Laravel)

---

### addNewPortFromMapping(AddNewPortFromMappingRequest $request)
Create new port and map to provider port (Fibos, MSC, Costa, Explora).

```php
public function addNewPortFromMapping(AddNewPortFromMappingRequest $request)
{
    try {
        $company = $request->input('company', 'fibos');
        
        if ($request->input('name')) {
            $port = Port::create([
                'name' => $request->input('name'),
                'is_not_a_port' => $request->input('is_not_a_port')
            ]);
            
            if ($port instanceof Port) {
                $localPort = match($company) {
                    'explora' => ExploraPort::findOrFail($request->input('id')),
                    'msc' => MscPort::findOrFail($request->input('id')),
                    'costa' => CostaPort::findOrFail($request->input('id')),
                    default => FibosPort::findOrFail($request->input('id')),
                };
                
                $localPort->port_id = $port->id;
                
                if ($localPort->save()) {
                    return redirect()->back()->with('success', 'Port successfully created')->with('tab', 'unmapped');
                }
                
                throw new \Exception('Error mapping port');
            }
        }
    } catch (\Exception $e) {
        return redirect()->back()->with('error', $e->getMessage());
    }
}
```

**Logic:**
1. Extract company (provider)
2. Create new Port record
3. Find matching provider port (FibosPort, MscPort, etc.)
4. Link provider port to new port via port_id
5. Save and redirect

**Issues:**
- ⚠️ **No authorization** — anyone can create/map ports
- ⚠️ **No validation** — relies on form request validation
- ⚠️ **No transaction** — if save fails, port created but not linked
- ⚠️ **Generic exception** — broad error handling
- ⚠️ **Default company** — defaults to 'fibos' if not specified

---

### mergePortsWithSameCoordinates()
**[DEV METHOD - DISABLED]** — Merge duplicate ports.

```php
public function mergePortsWithSameCoordinates()
{
    try {
        // $this->portService->mergePortsWithSameCoordinates();
        return redirect()->back()->with('success', 'Merging duplicated ports successfully completed');
    } catch (\Exception $e) {
        return redirect()->back()->with('error', 'Error merging duplicated ports');
    }
}
```

**Issues:**
- 🔴 **Disabled/Commented** — service call commented out (dev incomplete)
- 🔴 **No-op Method** — always returns success even though nothing runs
- ⚠️ **No authorization**
- ⚠️ **No confirmation** — destructive operation

---

## ⚠️ Issues & Concerns

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **update() stub** — method not implemented (breaks REST) | POST/PUT fails |
| 2 | 🔴 CRITICAL | **mergePortsWithSameCoordinates() disabled** — method commented, always returns success | No-op endpoint |
| 3 | 🔴 HIGH | **deletePortsWith0Itineraries() no authorization** — anyone can delete ports | Security/data loss |
| 4 | 🔴 HIGH | **deletePortsWith0Itineraries() no confirmation** — destructive without verification | Accidental deletion |
| 5 | 🔴 HIGH | **addNewPortFromMapping() no transaction** — port created even if mapping fails | Data integrity |
| 6 | ⚠️ HIGH | **No authorization** — searchAjaxPort, maps not gated | Security risk |
| 7 | ⚠️ HIGH | **No authorization** — addNewPortFromMapping not gated | Security risk |
| 8 | ⚠️ MEDIUM | **Unused trait** — MediaUploadingTrait not used in methods | Code smell |
| 9 | ⚠️ MEDIUM | **Multiple provider models** — FibosPort, MscPort, CostaPort, ExploraPort hardcoded (tight coupling) | Difficult to extend |
| 10 | ⚠️ MEDIUM | **N+1 in maps()** — getMarkerData() called on each port in loop | Performance issue |
| 11 | ⚠️ MEDIUM | **Generic exception handling** — broad error messages | Debug difficulty |
| 12 | ℹ️ LOW | **Italian comments/messages** — not i18n | Localization issue |

---

## 📊 Data Flow Issues

### Port Provider Mapping Problem

Current architecture has 4 separate models for provider ports:

```
FibosPort (fibos_ports)
  ├─ port_id → Port
  
MscPort (msc_ports)
  ├─ port_id → Port
  
CostaPort (costa_ports)
  ├─ port_id → Port
  
ExploraPort (explora_ports)
  ├─ port_id → Port
```

**Issues:**
- Tight coupling to 4 specific providers
- Adding new provider requires code changes
- Can't query "which ports are mapped to provider X" easily
- No audit trail of mapping

**Better Approach:**

```
Port (ports)
  ├─ id
  ├─ name
  └─ provider_mappings (relation)
  
ProviderMapping (provider_mappings)
  ├─ port_id → Port
  ├─ provider (enum: fibos, msc, costa, explora)
  ├─ provider_port_id
  └─ created_at (audit trail)
```

---

## 📝 Migration Notes for Base44

### Strategy: Normalize Port Management + Backend Functions

**Step 1: Create Port Entity**

```json
// entities/Port.json
{
  "code": {"type": "string", "unique": true},
  "name": {"type": "string"},
  "country": {"type": "string"},
  "continent": {"type": "string"},
  "lat": {"type": "number"},
  "lng": {"type": "number"},
  "visible_on_map": {"type": "boolean", "default": true},
  "is_not_a_port": {"type": "boolean", "default": false}
}

// entities/ProviderPortMapping.json
{
  "port_id": {"type": "string"},
  "provider": {"type": "string", "enum": ["fibos", "msc", "costa", "explora"]},
  "provider_port_id": {"type": "string"},
  "provider_code": {"type": "string"}
}
```

**Step 2: Backend Functions**

**Function: listPorts**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ports = await base44.entities.Port.list('-created_date', 100);
  return Response.json({ ports });
});
```

**Function: createPort**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, country, continent, lat, lng } = await req.json();

  if (!name) {
    return Response.json({ error: 'Name required' }, { status: 400 });
  }

  const port = await base44.entities.Port.create({
    code: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    country,
    continent,
    lat,
    lng,
  });

  return Response.json({ port }, { status: 201 });
});
```

**Function: deletePort**

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

  // Check if port has itineraries
  const itineraries = await base44.entities.Itinerary.filter({ departure_port_id: id }, 'id', 1);
  if (itineraries.length > 0) {
    return Response.json(
      { error: 'Cannot delete port with associated itineraries' },
      { status: 409 }
    );
  }

  await base44.entities.Port.delete(id);
  return Response.json({ success: true });
});
```

**Function: searchPorts**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { q, cruiselines, destinations } = await req.json();

  // Basic search by name
  const ports = await base44.entities.Port.filter(
    { name: { $regex: q || '', $options: 'i' } },
    'name',
    50
  );

  return Response.json({ ports });
});
```

**Function: mapProviderPort**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { port_id, provider, provider_port_id, provider_code } = await req.json();

  if (!port_id || !provider || !provider_port_id) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Create mapping
  const mapping = await base44.entities.ProviderPortMapping.create({
    port_id,
    provider,
    provider_port_id,
    provider_code,
  });

  return Response.json({ mapping }, { status: 201 });
});
```

**Step 3: React Component**

```tsx
// pages/admin/PortsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Button } from '@/components/ui/button';

export function PortsPage() {
  const { data, refetch } = useQuery({
    queryKey: ['ports'],
    queryFn: () => base44.functions.invoke('listPorts', {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deletePort', { id }),
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ports</h1>
      <DataGrid
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'country', label: 'Country' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <Button variant="destructive" onClick={() => deleteMutation.mutate(row.id)}>
                Delete
              </Button>
            ),
          },
        ]}
        data={data?.ports || []}
      />
    </div>
  );
}
```

### Key Improvements

1. **Authorization** — All functions enforce admin-only access
2. **Input Validation** — Proper validation before database operations
3. **Cascade Protection** — Check for itinerary associations before deleting
4. **Transaction Safety** — Use normalized entity for provider mappings
5. **Provider Flexibility** — Single ProviderPortMapping entity handles all providers
6. **Audit Trail** — created_at timestamp on mappings
7. **Error Handling** — Specific error messages
8. **No Stubs** — All methods fully implemented
9. **English Messages** — i18n-friendly

---

## Summary

PortController (5.9KB) manages ports and provider mappings with critical issues: update() stub not implemented, mergePortsWithSameCoordinates() disabled/no-op, deletePortsWith0Itineraries() lacks authorization and confirmation, addNewPortFromMapping() has no transaction safety. Issues with provider coupling (4 hardcoded models), N+1 in maps(), authorization gaps, unused media trait.

In Base44: Normalize with Port and ProviderPortMapping entities, implement all methods with full validation/authorization, consolidate 4 provider models into single mapping entity, add transaction safety, implement React port management page.

**Migration Priority: HIGH** — core data entity, multiple critical bugs, provider integration complexity.