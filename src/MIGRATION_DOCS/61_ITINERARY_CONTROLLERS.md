# Itinerary Controllers

**Purpose:** Manage cruise itineraries, destinations, and itinerary elements (ports/stops).  
**Namespace:** `App\Http\Controllers\Admin\Itinerary`  
**Location:** `App/Http/Controllers/Admin/Itinerary/`  
**Total Controllers:** 3  
**Type:** Core business logic — critical priority

---

## 📋 Controller Index

| Controller | Methods | Size | Purpose |
|-----------|---------|------|---------|
| ItinerariesController | 13 | 14.3 KB | Main CRUD + search/filtering for itineraries |
| ItineraryDestinationController | 7 | 1.6 KB | Link destinations to itineraries |
| ItineraryElementsController | 6 | 4.0 KB | Manage itinerary stops (ports, days) |

---

## 🔧 Detailed Controllers

### ItinerariesController (14.3 KB — Large)

**Purpose:** Core itinerary management with search, filtering, and bulk operations.

| Method | Purpose | Route |
|--------|---------|-------|
| index() | List itineraries | `GET /admin/itineraries` |
| create() | Show creation form | `GET /admin/itineraries/create` |
| store() | Create/update itinerary | `POST /admin/itineraries` |
| edit() | Show edit form | `GET /admin/itineraries/{id}/edit` |
| destroy() | Delete itinerary | `DELETE /admin/itineraries/{id}` |
| getItineraries() | Server-side DataTable search | `POST /admin/itineraries/search` |
| searchItinerariesJson() | JSON API for itinerary search | `POST /admin/itineraries/search-json` |
| createDatatable() | Helper: format DataTable response | (internal) |
| itineraryDestinations() | List destinations for itinerary | `POST /admin/itineraries/destinations` |
| addDestination() | Add destination to itinerary(ies) | `POST /admin/itineraries/add-destination` |
| deleteDestination() | Remove destination from itinerary(ies) | `DELETE /admin/itineraries/{itinId}/destinations/{destId}` |
| enabledToggle() | Toggle enabled status | `POST /admin/itineraries/toggle-enabled` |
| bestforyouToggle() | Toggle "best for you" flag | `POST /admin/itineraries/toggle-best` |
| bestForYou() | Utility method for toggle | (internal) |

**Key Methods:**

```php
store(ItineraryRequest $request) {
    // Create or update
    if ($request->input('id')) {
        $itinerary = Itinerary::find($request->input('id'));
    } else {
        $itinerary = new Itinerary();
    }
    
    // Fill and save
    $itinerary->fill($request->all());
    $itinerary->auto_rules = ($request->input('auto_rules') ? true : false);
    $itinerary->sea = ($request->input('sea') ? true : false);
    $itinerary->save();
    
    // Store translations
    $itinerary->storeTranslations($request->toArray());
    
    // ⚠️ BUG: Success message says "deleted" not "created"
    return redirect()->route('itineraries.edit', ['id' => $itinerary->id])
        ->with('success', 'Itinerary successfully deleted');
}

getItineraries(Request $request) {
    // Parse search filters
    $searchRequestData = $request->input('searchRequest');
    if (is_string($searchRequestData)) {
        $searchRequestData = json_decode($searchRequestData, true);
    }
    
    // Create SearchRequest object
    $requestObj = new SearchRequest(...);
    
    // Set filters and construct query
    if (!empty($searchRequestData['search-itineraries'])) {
        $requestObj->setFilters($searchRequestData['filters'] ?? []);
    } else {
        // Default filter structure
        $requestObj->setFilters([...]);
    }
    
    // Query and format as DataTable
    $query = $this->offerService->searchCruisesQuery($requestObj);
    
    if (empty($searchRequestData['search-itineraries'])) {
        $query->groupBy('itineraryCode');
    }
    
    // ⚠️ Log query to file for debugging
    file_put_contents(storage_path('logs/search_debug.log'), ...);
    
    return $this->createDatatable($query);
}

createDatatable($query) {
    // Format query result as DataTable JSON
    return DataTables::eloquent($query)
        ->addColumn('action', fn($row) => '<button>Select</button>')
        ->addColumn('itinerary_info', fn($row) => 
            '<h4>' . $row->itinerary?->Destinations()->first()?->name . 
            ' da ' . $row->itinerary?->DeparturePort?->name . '</h4>'
        )
        // ... more columns ...
        ->rawColumns([...])
        ->toJson();
}

addDestination(Itinerary $itinerary, Request $request) {
    // Add destination to ALL itineraries with same itineraryCode
    $data = $request->all();
    $itineraries = Itinerary::where('itineraryCode', $itinerary->itineraryCode)->get();
    
    foreach ($itineraries as $matchedItinerary) {
        ItineraryDestination::updateOrCreate(
            ['itinerary_id' => $matchedItinerary->id, 'destination_id' => $data['destination_id']],
            ['matching_percentage' => $data['matching_percentage'], 'is_manual' => true]
        );
    }
    
    return redirect()->back()->with('success', 'Destination added successfully');
}

deleteDestination($destinationId, $itineraryId) {
    // Delete destination from ALL itineraries with same itineraryCode
    $itinerary = Itinerary::find($itineraryId);
    $itineraries = Itinerary::where('itineraryCode', $itinerary->itineraryCode)->get();
    
    ItineraryDestination::whereIn('itinerary_id', $itineraries->pluck('id'))
        ->where('destination_id', $destinationId)
        ->delete();
    
    return redirect()->back()->with('success', 'Destination deleted successfully...');
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Wrong success message in store()** — Says "deleted" instead of "created" | User confusion |
| 2 | ⚠️ HIGH | **No authorization checks** — anyone can create/edit/delete itineraries | Security risk |
| 3 | ⚠️ HIGH | **No input validation** — store() accepts raw $request->all() | Data integrity |
| 4 | ⚠️ HIGH | **Duplicated filter logic** — getItineraries() and searchItinerariesJson() 95% identical | DRY violation |
| 5 | ⚠️ HIGH | **Complex SearchRequest object** — manual construction of SearchRequest with many params | Fragile |
| 6 | ⚠️ MEDIUM | **File logging in controller** — file_put_contents() for debug logging in production | Performance/security |
| 7 | ⚠️ MEDIUM | **Bulk operations** — addDestination/deleteDestination modify all itineraries with same code silently | Hidden behavior |
| 8 | ⚠️ MEDIUM | **N+1 queries** — createDatatable calls getMarkerData() / relationships on each row | Performance |
| 9 | ⚠️ MEDIUM | **Magic groupBy** — groupBy('itineraryCode') changes query semantics without validation | Database risk |
| 10 | ℹ️ LOW | **Italian comments/messages** — "da partenza da", "notti" not i18n | Localization |
| 11 | ℹ️ LOW | **Commented code** — Lines 24-28 in ItineraryElementsController | Code smell |
| 12 | ℹ️ LOW | **Global website lookup** — request()->website ?? Website::first() (fallback is wrong) | Race condition |

---

### ItineraryDestinationController (1.6 KB — Minimal)

**Purpose:** Minimal controller, mostly delegates to actions.

| Method | Purpose |
|--------|---------|
| index() | Stub (empty) |
| create() | Stub (empty) |
| store() | Delegate to StoreItineraryDestination action |
| show() | Stub (empty) |
| edit() | Stub (empty) |
| update() | Stub (empty) |
| destroy() | Delegate to DestroyItineraryDestination action |

**Code:**

```php
class ItineraryDestinationController extends Controller
{
    public function index() { }
    public function create() { }
    public function store(StoreItineraryDestinationRequest $request, StoreItineraryDestination $action) {
        return $action->store($request);
    }
    public function show(ItineraryDestination $itineraryDestination) { }
    public function edit(ItineraryDestination $itineraryDestination) { }
    public function update(Request $request, ItineraryDestination $itineraryDestination) { }
    public function destroy(DestroyItineraryDestination $action, ItineraryDestination $itineraryDestination) {
        return $action->destroy($itineraryDestination);
    }
}
```

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ MEDIUM | **Only 2 of 7 methods implemented** — 5 stubs (unused) |
| 2 | ⚠️ MEDIUM | **No authorization** — delegates to action but no checks visible |
| 3 | ℹ️ LOW | **Unnecessary class** — could inline into ItinerariesController |

---

### ItineraryElementsController (4.0 KB)

**Purpose:** Manage itinerary elements (stops/ports along the cruise).

| Method | Purpose | Route |
|--------|---------|-------|
| index() | List elements for itinerary (DataTable or view) | `GET /admin/itinerary-elements/{itineraryId}` |
| create() | Show element creation form | `GET /admin/itinerary-elements/create/{itineraryId}` |
| edit() | Show element edit form | `GET /admin/itinerary-elements/{id}/edit` |
| store() | Create/update element | `POST /admin/itinerary-elements/{itineraryId}` |
| destroy() | Delete element | `DELETE /admin/itinerary-elements/{id}` |

**Key Methods:**

```php
index(Request $request, $itineraryId) {
    // If AJAX, return DataTable JSON
    if ($request->ajax()) {
        $itineraryElements = ItineraryElement::where('itinerary_id', $itineraryId)
            ->with('port')->orderBy('id')->get();
        
        return DataTables::of($itineraryElements)
            ->addColumn('port_name', fn($row) => $row->port?->name ?? '')
            ->toJson();
    }
    
    // Otherwise return view
    $itineraryElementResult = ItineraryElement::whereItineraryId($itineraryId)->get();
    return view('admin.itinerary-elements.index', [
        'itineraryElementResult' => $itineraryElementResult,
        'itineraryId' => $itineraryId
    ]);
}

store($itineraryId, Request $request) {
    // Create or update
    if ($request->input('id')) {
        $itineraryElement = ItineraryElement::find($request->input('id'));
    } else {
        $itineraryElement = new ItineraryElement();
    }
    
    $itineraryElement->fill($request->all());
    // Commented line: $itineraryElement->enabled = ($request->input('enabled') ? true : false);
    $itineraryElement->save();
    
    // Store translations
    $itineraryElement->storeTranslations($request->toArray());
    
    return redirect()->route('itinerary-elements.edit', ...);
}

destroy(ItineraryElement $itineraryElement) {
    try {
        $itineraryElement->delete();
        // ⚠️ BUG: Redirects to itineraries.index instead of itinerary-elements
        return redirect()->route('itineraries.index')
            ->with('success', 'Itinerary deleted successfully!');
    } catch (\Exception $e) {
        return redirect()->back()->with('error', $e->getMessage());
    }
}
```

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 HIGH | **destroy() wrong redirect** — Goes to itineraries.index instead of itinerary-elements | User gets lost |
| 2 | ⚠️ HIGH | **No authorization** — anyone can create/delete elements | Security |
| 3 | ⚠️ HIGH | **No input validation** — raw $request->all() | Data integrity |
| 4 | ⚠️ MEDIUM | **Commented code** — Lines 24-28, 80 (incomplete features) | Code smell |
| 5 | ⚠️ MEDIUM | **No itinerary bounds check** — $itineraryId param not validated | Bypass |
| 6 | ℹ️ LOW | **Generic error handling** — exception messages not specific | Difficult to debug |
| 7 | ℹ️ LOW | **Inconsistent naming** — itineraryElementResult vs itineraryElements | Confusing |

---

## 📊 Architecture Issues

### Problem 1: itineraryCode Bulk Operations

```
Scenario: User adds destination to itinerary 5
Expected: Destination added to itinerary 5 only
Actual: Destination added to ALL itineraries where itineraryCode = itinerary(5).code

Example:
Itinerary Table:
  id  | itineraryCode | name
  --- | ------------- | -----
  1   | CARIB-001     | Caribbean
  2   | CARIB-001     | Caribbean (duplicate)
  5   | CARIB-001     | Caribbean (duplicate)

User adds destination 'Jamaica' to itinerary 5
→ Jamaica added to itineraries 1, 2, AND 5 (all with CARIB-001)
→ No user warning, silent modification
```

**Risk:** Data duplication, unexpected bulk changes, no audit trail.

### Problem 2: Duplicated Search Logic

```php
getItineraries()             // 50 lines of search logic
searchItinerariesJson()      // 50 lines, ~95% identical

Both:
1. Parse searchRequestData
2. Create SearchRequest object
3. Set filters
4. Build query
5. GroupBy if needed
6. Format response (one: DataTable, other: JSON)
```

**Solution:** Extract common search logic to service.

### Problem 3: SearchRequest Object Construction

```php
new SearchRequest(
    $searchRequestData['only_river'] ?? false,
    (isset($searchRequestData['cruiseline_id']) && $searchRequestData['cruiseline_id'] > 0) 
        ? (int)$searchRequestData['cruiseline_id'] : null,
    (isset($searchRequestData['port_id']) && $searchRequestData['port_id'] > 0) 
        ? (int)$searchRequestData['port_id'] : null,
    null,
    $searchRequestData['month'] ?? null,
    $searchRequestData['date'] ?? null,
    (isset($searchRequestData['destination_id']) && $searchRequestData['destination_id'] > 0) 
        ? (int)$searchRequestData['destination_id'] : null,
    null,
    null
);
```

**Issues:**
- Multiple defensive null checks inline
- Positional params hard to understand
- 9 params with some null/unused
- Fragile: breaks if order changes

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 2 | store() "deleted" message, destroy() wrong redirect |
| 🔴 HIGH | 10 | No authorization, no validation, bulk operations, duplicated logic |
| ⚠️ MEDIUM | 12 | File logging, N+1 queries, commented code, magic groupBy |
| ℹ️ LOW | 8 | Italian messages, global website fallback, inconsistent naming |

---

## 📝 Migration Notes for Base44

### Strategy: Refactor + Backend Functions + Entities

**Step 1: Create Itinerary Entities**

```json
// entities/Itinerary.json
{
  "code": {"type": "string", "unique": true},
  "itinerary_code": {"type": "string"},
  "name": {"type": "string"},
  "description": {"type": "string"},
  "ship_id": {"type": "string"},
  "cruiseline_id": {"type": "string"},
  "departure_date": {"type": "string", "format": "date"},
  "duration": {"type": "integer"},
  "departure_port_id": {"type": "string"},
  "best_price": {"type": "number"},
  "enabled": {"type": "boolean", "default": true},
  "best_for_you": {"type": "boolean", "default": false},
  "auto_rules": {"type": "boolean", "default": true},
  "sea": {"type": "boolean", "default": false}
}

// entities/ItineraryDestination.json
{
  "itinerary_id": {"type": "string"},
  "destination_id": {"type": "string"},
  "matching_percentage": {"type": "integer"},
  "is_manual": {"type": "boolean", "default": false}
}

// entities/ItineraryElement.json
{
  "itinerary_id": {"type": "string"},
  "port_id": {"type": "string"},
  "day": {"type": "integer"},
  "description": {"type": "string"}
}
```

**Step 2: Backend Functions**

**Function: searchItineraries**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { filters, offset = 0, limit = 50 } = await req.json();

  // Build query based on filters
  const query = {};
  if (filters.cruiseline_id) query.cruiseline_id = filters.cruiseline_id;
  if (filters.ship_id) query.ship_id = filters.ship_id;
  if (filters.destination_id) query.destination_id = filters.destination_id; // via join

  const itineraries = await base44.entities.Itinerary.filter(
    query,
    '-departure_date',
    limit,
    offset
  );

  return Response.json({ itineraries, offset, limit });
});
```

**Function: createItinerary**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { code, name, ship_id, cruiseline_id, departure_date, duration } = await req.json();

  // Validate
  if (!code || !name) {
    return Response.json({ error: 'Code and name required' }, { status: 400 });
  }

  const itinerary = await base44.entities.Itinerary.create({
    code,
    itinerary_code: code.toUpperCase(),
    name,
    ship_id,
    cruiseline_id,
    departure_date,
    duration,
    enabled: true,
  });

  return Response.json({ itinerary }, { status: 201 });
});
```

**Function: addDestinationToItinerary**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { itinerary_id, destination_id, matching_percentage } = await req.json();

  if (!itinerary_id || !destination_id) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Only add to ONE itinerary (not bulk)
  const mapping = await base44.entities.ItineraryDestination.create({
    itinerary_id,
    destination_id,
    matching_percentage: matching_percentage || 100,
    is_manual: true,
  });

  return Response.json({ mapping }, { status: 201 });
});
```

**Step 3: React Component**

```tsx
// pages/admin/ItinerariesPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Button } from '@/components/ui/button';

export function ItinerariesPage() {
  const [filters, setFilters] = useState({});
  
  const { data, refetch } = useQuery({
    queryKey: ['itineraries', filters],
    queryFn: () => base44.functions.invoke('searchItineraries', { filters }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createItinerary', data),
    onSuccess: () => refetch(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteItinerary', { id }),
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Itineraries</h1>
      <DataGrid
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'duration', label: 'Duration' },
          { key: 'departure_date', label: 'Departure' },
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
        data={data?.itineraries || []}
      />
    </div>
  );
}
```

### Key Improvements

1. **Fix Critical Bugs** — Correct "deleted" message, redirect routes
2. **Authorization** — Enforce admin-only in all functions
3. **Input Validation** — Validate all fields before database operations
4. **Remove Bulk Operations** — addDestination only affects target itinerary
5. **Consolidate Search Logic** — Single searchItineraries backend function
6. **Simplify SearchRequest** — Use entity filters instead of complex object
7. **No File Logging** — Remove debug logging to storage
8. **Normalize itineraryCode** — Remove duplicate itinerary concept
9. **English Messages** — i18n-friendly
10. **Proper Error Handling** — Specific error messages

---

## Summary

3 itinerary controllers managing cruises with critical bugs: store() says "deleted", destroy() wrong redirect. Issues: no authorization/validation, duplicated search logic (50 lines in 2 methods), bulk operations silently modify all itineraries with same code, complex SearchRequest construction, file logging in production, N+1 queries, commented code.

In Base44: Fix all bugs, extract search logic to single backend function, simplify SearchRequest with entity filters, remove bulk operations (affect one itinerary only), add authorization/validation, normalize itineraryCode concept, React itinerary management page.

**Migration Priority: CRITICAL** — core business logic, multiple critical bugs, duplicated code, security gaps.