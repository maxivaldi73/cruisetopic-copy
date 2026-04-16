# Port Action Classes (4 files)

**Directory:** `App/Actions/Port/`  
**Namespace:** `App\Actions\Port`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — Port is a core geo-catalog entity; `StorePort` triggers background jobs for coordinate-based destination recalculation across all cruiselines

---

## 📋 Overview

| Class | Method | Purpose | Status |
|-------|--------|---------|--------|
| `IndexPort` | `getPort()` | Render Port DataTable | ✅ Implemented |
| `EditPort` | `edit(Port $port)` | Return edit form with continents + countries | ✅ Implemented |
| `DestroyPort` | `destroy(Port $port)` | Hard-delete Port | ✅ Implemented |
| `StorePort` | `store(PortRequest $request)` | Create/update Port + media sync + geo job dispatch | ✅ Implemented (most complete action in codebase) |

---

## 🔧 Implementation

### 1. `IndexPort`

```php
class IndexPort
{
    public function getPort() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new PortDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.ports.index');
        // ⚠️ All dependencies instantiated with `new` — not container-resolved, not testable
        // ⚠️ No authorization check
        // ⚠️ Method name 'getPort' — misleading; renders a full index view
        // ⚠️ Dead import: `use App\DataTables\ItinerariesDataTable;` — imported but never used
    }
}
```

**Dead import:** `ItinerariesDataTable` — the same dead import seen in `IndexUser`. Suggests copy-paste from another Index action.

---

### 2. `EditPort`

```php
class EditPort
{
    public function edit(Port $port) {
        $continents = Continent::with('countries')->orderBy('name')->get();
        // ✅ Eager-loads countries via `with('countries')` — avoids N+1 in the view
        // ⚠️ Loads ALL continents and ALL countries into memory — no filtering
        //    At scale (250 countries) this is acceptable but inefficient if the view
        //    only shows countries for the selected continent via JS
        // ⚠️ No authorization check — any user can edit any Port
        // ✅ Route model binding — Laravel resolves $port automatically

        return view('admin.ports.edit', compact('port', 'continents'));
        // ✅ Passes $port (with existing data) and $continents (for dropdowns)
        // ⚠️ Tightly coupled to Blade view path
    }
}
```

Note: No `CreatePort` action class exists — the edit form (`admin.ports.edit`) likely doubles as create (standard shared form pattern), and `StorePort` handles both create and update via `$request->input('id')` presence check.

---

### 3. `DestroyPort`

```php
class DestroyPort
{
    public function destroy(Port $port) {
        try {
            $port->delete();
            return (new AlertService())->alertOperazioneEseguita('ports.index');
            // ✅ Correct redirect to 'ports.index'
            // ⚠️ Hard delete — no soft delete; port history and mapping data lost
            // ⚠️ No cascade check — Port is referenced by:
            //    - ItineraryElements (port_id)
            //    - ProviderMappingPort records (cruiseline port code → Port)
            //    - UpdatePortDestinations jobs (geo calculations)
            //    Deleting a port while mappings or itinerary elements reference it → orphaned FK

        } catch (\Exception $e) {
            return (new AlertService())->alertBackWithError();
            // 🔴 Exception swallowed with NO logging — $e is completely ignored
            //    Unlike DestroyProduct which at least calls Log::error(), this class has zero visibility
            // ⚠️ alertBackWithError() called without a message — generic error with no context
            // ⚠️ AlertService instantiated with `new` — not injected
        }
    }
}
```

**Worst logging behavior in the codebase so far** — exception is caught but `$e` is neither logged nor passed to the error handler. Silent failures on port deletion are completely invisible.

---

### 4. `StorePort` — Most Complete Action in Codebase

```php
class StorePort
{
    use DropzoneMediaSyncTrait;

    public function store(PortRequest $request) {

        // 1. Upsert: find existing port or create new one
        if ($request->input('id')) {
            $port = Port::find($request->input('id'));
            // ⚠️ Port::find() can return null if ID is invalid — no null guard
            //    If null, $port->fill() on next line throws fatal error
        } else {
            $port = new Port();
        }

        try {
            // 2. Fill fields (excluding boolean checkboxes)
            $port->fill($request->except(['visible_on_map', 'is_active']));
            // ⚠️ 'is_active' excluded from fill but then set via $request->input('enabled')
            //    — the field name mismatch ('is_active' vs 'enabled') suggests the form sends
            //    'enabled' but the model field is 'is_active'

            // 3. Resolve Continent and Country with null-safety
            $continent = Continent::find($request->input('continent_id'));
            $country = $request->filled('country_id')
                ? Country::where('continent_id', $request->input('continent_id'))->find($request->input('country_id'))
                : null;
            // ✅ Country scoped to continent — prevents cross-continent assignments
            // ✅ Nullsafe operator (?->) used correctly on $continent and $country

            // 4. Set denormalized name fields (stores name strings alongside IDs)
            $port->continent_id = $continent?->id;
            $port->continent    = $continent?->name;   // ⚠️ Denormalized — stored as string
            $port->country_id   = $country?->id;
            $port->country      = $country?->name;     // ⚠️ Denormalized — stored as string
            // ⚠️ Denormalization creates drift risk: if Continent/Country name changes,
            //    port.continent and port.country become stale

            // 5. Boolean fields
            $port->visible_on_map = $request->input('visible_on_map') ? true : false;
            $port->is_active      = $request->input('enabled') ? true : false;
            // ⚠️ Form field 'enabled' → model field 'is_active' — naming mismatch
            $port->is_not_a_port  = $request->input('is_not_a_port') ? true : false;
            $port->score          = $request->input('score');

            // 6. Coordinate change detection — triggers background geo jobs
            $coordinatesChanged = false;
            if ($port->exists) {
                $coordinatesChanged = $port->isDirty(['lat', 'lng']);
                // ✅ isDirty() called AFTER fill() — correctly detects changes vs. DB values
            } else {
                $lat = $request->input('lat');
                $lng = $request->input('lng');
                $coordinatesChanged = is_numeric($lat) && is_numeric($lng);
                // ✅ For new ports: triggers geo jobs only if valid coordinates provided
            }

            $port->save();
            $port->storeTranslations($request->toArray());
            // ⚠️ storeTranslations() passes raw request array — any field could be treated as
            //    a translation key; no filtering of non-translation keys first

            // 7. Media sync (logo + cover)
            $this->syncDropzoneMedia($port, 'logo',  $request->input('logo'));
            $this->syncDropzoneMedia($port, 'cover', $request->input('cover'));
            // ⚠️ Spatie/Dropzone coupling — replaced by Base44 UploadFile in migration

            // 8. Coordinate-triggered background jobs
            if ($coordinatesChanged) {
                UpdatePortDestinations::dispatch()->onQueue('slow');
                // ✅ Dispatches geo recalculation on 'slow' queue — doesn't block response

                $cruiselines = Cruiseline::select('code')->get();
                foreach ($cruiselines as $cruiseline) {
                    UpdateItineraryDestinations::dispatch($cruiseline->code);
                    // ⚠️ Dispatches ONE job PER cruiseline — could be many jobs simultaneously
                    // ⚠️ No onQueue() specified — uses default queue, potentially blocking faster jobs
                    // ⚠️ Cruiseline::select('code')->get() — fetches all cruiselines to loop;
                    //    if a cruiseline is added later, this list stays current automatically ✅
                }
            }

            return redirect()->route('ports.edit', ['port' => $port])->with('success', 'Port successfully saved');
            // ✅ Redirects back to edit form (not index) — allows user to continue editing
            // ✅ English success message (unlike most other actions)

        } catch (\Exception $e) {
            return redirect()->route('ports.edit', ['port' => $port])->with('error', $e->getMessage());
            // ✅ Exception message surfaced to user via flash (not swallowed)
            // ⚠️ No Log::error() — exception visible to user but not logged server-side
            // ⚠️ $port passed to ports.edit route — if $port is null (from null find()),
            //    this redirect itself throws another error
        }
    }
}
```

### Coordinate → Job Dispatch Flow

```
Port saved with changed lat/lng
    ↓
UpdatePortDestinations::dispatch()->onQueue('slow')
    ↓ (for every Cruiseline)
UpdateItineraryDestinations::dispatch($cruiseline->code)
    ↓
Background recalculation of port→destination assignments
and itinerary destination fields across all cruiselines
```

This is the **most consequential side effect** in any Action class seen so far — a single port coordinate change triggers a cascade of background jobs across all cruiselines. Already documented in `101_PORT_COMMANDS.md`.

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | `DestroyPort` | **Exception completely swallowed** — `$e` never logged, never passed to alertBackWithError(); silent failure |
| 2 | 🔴 CRITICAL | `StorePort` | **`Port::find()` not null-guarded** — invalid `$request->input('id')` returns null; next `$port->fill()` throws fatal |
| 3 | ⚠️ HIGH | `DestroyPort` | **No cascade check** — ItineraryElements and ProviderMappingPort records reference Port; orphaned on delete |
| 4 | ⚠️ HIGH | `StorePort` | **`UpdateItineraryDestinations` dispatched without `onQueue()`** — one job per cruiseline on default queue; may saturate faster job queues |
| 5 | ⚠️ HIGH | `StorePort` | **`storeTranslations($request->toArray())`** — raw request array passed; no filtering of non-translation keys |
| 6 | ⚠️ HIGH | `StorePort` | **Denormalized `continent` / `country` string fields** — drift risk if geo entity names change |
| 7 | ⚠️ MEDIUM | `StorePort` | **`'is_active'` vs `'enabled'` naming mismatch** — form field name differs from model field name |
| 8 | ⚠️ MEDIUM | `StorePort` | **No Log::error() in catch** — exception surfaced to user but not recorded server-side |
| 9 | ⚠️ MEDIUM | `IndexPort` | **Dead import `ItinerariesDataTable`** — never used |
| 10 | ⚠️ MEDIUM | All | **No authorization checks** |
| 11 | ⚠️ MEDIUM | All | **AlertService/dependencies instantiated with `new`** |
| 12 | ⚠️ MEDIUM | `DestroyPort` | **Hard delete** — no soft delete; geo mapping data lost permanently |
| 13 | ℹ️ LOW | `EditPort` | **Loads all continents + countries globally** — no scope filtering |
| 14 | ℹ️ LOW | `IndexPort` | **Method name `getPort`** — misleading (renders index view) |

---

## 📝 Migration to Base44

### Port Entity Schema

```json
{
  "name": "Port",
  "properties": {
    "name":           { "type": "string" },
    "code":           { "type": "string", "description": "LOCODE or provider code" },
    "lat":            { "type": "number" },
    "lng":            { "type": "number" },
    "continent_id":   { "type": "string" },
    "country_id":     { "type": "string" },
    "is_active":      { "type": "boolean", "default": true },
    "visible_on_map": { "type": "boolean", "default": false },
    "is_not_a_port":  { "type": "boolean", "default": false },
    "score":          { "type": "number" },
    "logo_url":       { "type": "string" },
    "cover_url":      { "type": "string" },
    "translations":   { "type": "object", "description": "Keyed by locale" }
  }
}
```

> No denormalized `continent` / `country` string fields — resolve names from related entities at render time.

### `StorePort` → Backend function (coordinate job dispatch)

```typescript
// functions/savePort.js
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

const { portId, lat, lng, logo_file, cover_file, ...fields } = await req.json();

// 1. Upload media if provided
const [logoResult, coverResult] = await Promise.all([
  logo_file ? base44.asServiceRole.integrations.Core.UploadFile({ file: logo_file }) : null,
  cover_file ? base44.asServiceRole.integrations.Core.UploadFile({ file: cover_file }) : null,
]);

const portData = {
  ...fields,
  lat, lng,
  ...(logoResult && { logo_url: logoResult.file_url }),
  ...(coverResult && { cover_url: coverResult.file_url }),
};

// 2. Create or update
let port;
if (portId) {
  const existing = await base44.asServiceRole.entities.Port.get(portId);
  const coordsChanged = existing.lat !== lat || existing.lng !== lng;
  port = await base44.asServiceRole.entities.Port.update(portId, portData);

  // 3. Trigger geo recalculation if coordinates changed
  if (coordsChanged) {
    // Fire separate backend function for each cruiseline (parallelized)
    const cruiselines = await base44.asServiceRole.entities.Cruiseline.list();
    await Promise.all(
      cruiselines.map(cl => base44.asServiceRole.functions.invoke('updateItineraryDestinations', { cruiselineCode: cl.code }))
    );
  }
} else {
  port = await base44.asServiceRole.entities.Port.create(portData);
  if (lat && lng) {
    const cruiselines = await base44.asServiceRole.entities.Cruiseline.list();
    await Promise.all(
      cruiselines.map(cl => base44.asServiceRole.functions.invoke('updateItineraryDestinations', { cruiselineCode: cl.code }))
    );
  }
}

return Response.json({ success: true, port });
```

### `DestroyPort` → Backend function with cascade guard

```typescript
// functions/deletePort.js
const { portId } = await req.json();

// Check for ItineraryElement references
const elements = await base44.asServiceRole.entities.ItineraryElement.filter({ port_id: portId });
if (elements.length > 0) {
  return Response.json({ error: `Cannot delete: port is used in ${elements.length} itinerary elements` }, { status: 409 });
}

// Check for provider mappings
const mappings = await base44.asServiceRole.entities.ProviderMappingPort.filter({ port_id: portId });
if (mappings.length > 0) {
  return Response.json({ error: `Cannot delete: port has ${mappings.length} provider mappings` }, { status: 409 });
}

await base44.asServiceRole.entities.Port.delete(portId);
return Response.json({ success: true });
```

---

## Summary

**`Actions/Port/IndexPort`** (10 lines): Standard thin DataTable wrapper with dead `ItinerariesDataTable` import — same pattern as `IndexProduct` and `IndexUser`.

**`Actions/Port/EditPort`** (8 lines): Edit form action that eager-loads all continents with countries for dropdown population. Route model binding resolves `$port` automatically. No authorization.

**`Actions/Port/DestroyPort`** (13 lines): Hard-deletes a Port with the **worst exception handling in the codebase** — `$e` is caught but completely ignored (no logging, no message passed to error handler). No cascade guard despite Port being referenced by ItineraryElements and ProviderMappingPort records.

**`Actions/Port/StorePort`** (58 lines): The **most complete and complex action class audited so far**. Handles upsert logic, continent/country resolution with null-safety, boolean field normalization, coordinate change detection, Dropzone media sync, and conditional background job dispatch. The coordinate-triggered job cascade (`UpdatePortDestinations` + one `UpdateItineraryDestinations` per cruiseline) is the most consequential side effect in any action class. **Critical bug:** `Port::find()` result not null-guarded on update path — invalid ID causes fatal null dereference. Denormalized `continent`/`country` name fields introduce drift risk.

**Migration priority: HIGH** — Port is core geo-catalog data; `StorePort`'s coordinate→job dispatch logic must be faithfully replicated as a backend function with parallelized cruiseline updates; cascade guard is mandatory for `DestroyPort`.