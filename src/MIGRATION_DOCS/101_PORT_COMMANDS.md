# Port Console Commands (4 files)

**Directory:** `Console/Commands/ports/`  
**Namespace:** `App\Console\Commands\ports`  
**Priority:** MEDIUM — geo-enrichment and port catalog maintenance

---

## 📋 Overview

| Command | Signature | Purpose | Not in Kernel |
|---------|-----------|---------|---------------|
| `RemovePortsWithNoItineraries` | `app:remove-ports-with-no-itineraries` | Delete unused ports | ❌ not scheduled |
| `SetPortCountry` | `ports:set-country` | Google Geocoding → country/continent | ❌ not scheduled |
| `UpdatePortDestinations` | `app:update-port-destinations` | Point-in-polygon → sync port→destination | ❌ not scheduled |
| `UpdatePortItineraries` | `app:update-port-itineraries` | Count itineraries per port, set map visibility | ❌ not scheduled |

None of these commands are registered in `Console/Kernel.php` — all are manual triggers only.

---

## 🔧 Commands Detail

### 1. `RemovePortsWithNoItineraries` — `app:remove-ports-with-no-itineraries`

```php
public function handle()
{
    //   ← completely empty body
}
// ⚠️ STUB: handle() is entirely empty — command does nothing
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ namespace: App\Console\Commands\ports — sub-namespace, different from other commands
// ✅ Intent clear from name: remove Port records with no associated itineraries
```

**Status:** ❌ **Unimplemented stub** — never actually deletes anything.  
**Intended logic (inferred):** `Port::doesntHave('itineraries')->delete()`

**Migration note:** Implement in Base44 as `removeUnusedPorts` backend function. Add a dry-run mode and require admin auth before performing destructive delete.

---

### 2. `SetPortCountry` — `ports:set-country {--port-id=*}`

**The most well-written command in the codebase.** Resolves `country_id` and `continent_id` on Port records via Google Geocoding API.

```php
protected $signature = 'ports:set-country {--port-id=* : Restrict the update to one or more port IDs}';
// ✅ Optional --port-id=* allows targeting specific ports or running on all
```

#### Flow

```
1. Check GOOGLE_MAPS_API_KEY configured          ✅ fails fast with clear error
2. Load all Country records with continent       ✅ keyed by ISO code — single query
3. Guard: Countries table must not be empty      ✅ fails fast
4. Build Port query: whereNotNull lat+lng        ✅ skips ports without coordinates
5. Filter by --port-id if provided               ✅ validates numeric only
6. chunkById(100) — paginated processing         ✅ memory-safe for large tables
7. Per port: call Google Geocoding API           ⚠️ 1 HTTP call per port — rate limit risk
8. Parse response → get country ISO code        ✅ robust null-safe parsing
9. Lookup Country in in-memory collection        ✅ no extra DB queries
10. Update country_id and continent_id if dirty  ✅ dirty-check — skips unchanged
11. Summarise: updated / skipped / failed        ✅ clean table output
12. Return FAILURE if any port failed            ✅ correct exit code
```

#### `resolveCountry()` method

```php
protected function resolveCountry(Port $port, Collection $countriesByCode): ?Country
{
    $response = json_decode(
        GoogleMaps::load('geocoding')
            ->setParamByKey('latlng', "{$port->lat},{$port->lng}")
            ->setParamByKey('language', 'en')
            ->get(),
        true
    );
    // ✅ Uses GoogleMaps Facade (googlemaps/php-google-maps-api-v3-php package)
    // ✅ language=en — returns English country names
    // ✅ Parses all address_components, finds type='country'
    // ✅ Null-safe at every level
    // ⚠️ No rate limit / backoff handling — Google has 50 req/sec limit
    // ⚠️ No caching — same lat/lng will re-query on re-run
}
```

#### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **No rate limiting** — 1 Google API call per port; large datasets will hit 50 req/s limit |
| 2 | ⚠️ HIGH | **No response caching** — re-running on same ports re-queries Google |
| 3 | ⚠️ MEDIUM | **Not in Kernel** — manual trigger only; should run after import operations |
| 4 | ⚠️ MEDIUM | **Requires `Country` + `continent` tables populated** — undocumented prerequisite |
| 5 | ⚠️ MEDIUM | **Depends on `googlemaps/php-google-maps-api-v3-php` package** — external dep |
| 6 | ℹ️ LOW | **`port->continent` field** — separate from `continent_id` relation; may be duplicated storage |

**Migration to Base44:**
```typescript
// functions/setPortCountry.js
// Uses Google Maps Geocoding API directly via fetch()
// Accepts optional portIds array; falls back to all ports with lat/lng
// Batches requests with 50ms delay between calls to respect rate limits
// Stores country_id and continent_id on Port entity
```

---

### 3. `UpdatePortDestinations` — `app:update-port-destinations`

Point-in-polygon geographic assignment: determines which Destination each Port belongs to by checking if the port's lat/lng falls inside any destination's polygon boundary.

```php
public function handle()
{
    $ports = Port::where('is_not_a_port', false)->get();
    // ⚠️ Full table load — no pagination (Port::all() equivalent)
    // ⚠️ No eager loading of lat/lng or destination relation

    $rules = DestinationRule::whereHas('Destination', fn($q) => $q->where('enabled', true))->get();
    // ✅ Only active destinations' rules
    // ⚠️ Full rules table load — no chunking

    foreach ($ports as $port) {
        $destinationIdsArray = [];
        $port->Destinations()->sync($destinationIdsArray); // ⚠️ sync([]) first — wipes all existing relations
        foreach ($rules as $rule) {
            $area = json_decode($rule->area);   // ⚠️ area is JSON-encoded polygon(s) stored as text

            // Handles both single polygon (array of {lat,lng} objects)
            // and multi-polygon (array of JSON strings representing polygons)
            $polygonGroups = [];
            if (is_object($area[0])) {
                // Single polygon
                $polygonGroups[] = array_map(fn($p) => json_decode(json_encode($p), true), (array)$area);
            } else {
                // Multi-polygon
                foreach ($area as $a) {
                    $polygonGroups[] = array_map(fn($p) => json_decode(json_encode($p), true), json_decode($a));
                }
            }

            $point = ['lat' => $port->lat, 'lng' => $port->lng];
            foreach ($polygonGroups as $polygonArray) {
                if ($this->itineraryService->isPointInsidePolygon($point, $polygonArray)) {
                    $destinationIdsArray[] = $rule->destination_id;
                    break; // ✅ stops after first matching polygon for this rule
                }
            }
        }
        $port->Destinations()->sync($destinationIdsArray); // ✅ final sync with matched destinations
    }
}
```

#### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **Redundant sync([]) before loop** — wipes all destinations for the port before re-assigning; unnecessary DB write per port |
| 2 | ⚠️ HIGH | **No pagination** — loads all ports into memory; fails at scale |
| 3 | ⚠️ HIGH | **No null check on `$port->lat` / `$port->lng`** — ports without coords will pass `['lat' => null, 'lng' => null]` to `isPointInsidePolygon()` |
| 4 | ⚠️ HIGH | **Nested JSON decode** — `$rule->area` is doubly-encoded in multi-polygon case; fragile parsing |
| 5 | ⚠️ MEDIUM | **`description = 'Command description'`** — unfilled placeholder |
| 6 | ⚠️ MEDIUM | **`ItineraryService` injected** — uses `isPointInsidePolygon()` method from it; coupling to a service whose scope isn't port geometry |
| 7 | ⚠️ MEDIUM | **`is_object($area[0])`** — relies on stdClass detection; fragile for edge cases (empty polygons, malformed JSON) |
| 8 | ℹ️ LOW | **Italian inline comment** — `// Gestione uniforme dei poligoni` |

**Migration to Base44:**
- Store polygon definitions as `destination_rules` entity with a `polygon` field (GeoJSON array)
- Use a `updatePortDestinations` backend function with chunked processing and null-guard on lat/lng
- Replace `isPointInsidePolygon` with a self-contained ray-casting implementation in Deno (no service dependency)

---

### 4. `UpdatePortItineraries` — `app:update-port-itineraries`

Counts how many itineraries each port appears in and updates the `itineraries` counter + `visible_on_map` flag.

```php
public function handle()
{
    $ports = Port::query()
        ->selectRaw('ports.*, (lat IS NULL OR lng IS NULL) as missing_data')
        ->having('missing_data', false)    // ⚠️ HAVING without GROUP BY — non-standard SQL
        ->where('is_not_a_port', false)
        ->get();                           // ⚠️ Full table load — no pagination

    foreach ($ports as $port) {
        $count = $port->itineraries()->distinct('itinerary_id')->count();
        // ⚠️ N+1: 1 COUNT query per port

        if ($count > 0) {
            $port->update(['itineraries' => $count, 'visible_on_map' => true]);
        } else {
            // $port->delete(); ← COMMENTED OUT
            // ⚠️ Port deletion was disabled — empty else block remains
        }
    }
}
```

#### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **N+1 query** — 1 COUNT per port; use a subquery or join to compute counts in a single query |
| 2 | ⚠️ HIGH | **`HAVING` without `GROUP BY`** — `->having('missing_data', false)` applied to a computed column without grouping; non-standard and DB-engine-dependent behavior |
| 3 | ⚠️ HIGH | **Full table load** — no chunking; fails at scale |
| 4 | ⚠️ MEDIUM | **Ports with `count = 0` not reset** — `visible_on_map` set to `true` but never reset to `false` if itineraries are removed |
| 5 | ⚠️ MEDIUM | **`$port->delete()` commented out** — decision to not clean up ports with 0 itineraries was made but left as dead code |
| 6 | ⚠️ MEDIUM | **`description = 'Command description'`** — unfilled placeholder |
| 7 | ℹ️ LOW | **`itineraries` field** — stores denormalized count; risk of drift vs. actual relation |

**Migration to Base44:**
```typescript
// functions/updatePortItineraries.js — efficient version
// Single aggregation query replaces N+1
// Also resets visible_on_map=false for ports with count=0
```

---

## 📊 Command Summary

| Command | Lines | State | Critical Issues | Migrate? |
|---------|-------|-------|----------------|----------|
| `RemovePortsWithNoItineraries` | 30 | ❌ Empty stub | Handle is `//` — does nothing | ✅ implement from scratch |
| `SetPortCountry` | 155 | ✅ Complete | No rate limiting, no caching | ✅ port to Deno |
| `UpdatePortDestinations` | 81 | ✅ Complete | Redundant sync, no null guard on coords, no pagination | ✅ fix issues |
| `UpdatePortItineraries` | 46 | ✅ Complete | N+1, non-standard HAVING, no reset for count=0 | ✅ rewrite as aggregation |

---

## ⚠️ Issues Across All Port Commands

| # | Severity | Command | Issue |
|---|----------|---------|-------|
| 1 | 🔴 CRITICAL | `RemovePortsWithNoItineraries` | **Empty `handle()` — does nothing** |
| 2 | ⚠️ HIGH | `UpdatePortItineraries` | **`HAVING` without `GROUP BY`** — non-standard SQL; behavior varies by DB engine |
| 3 | ⚠️ HIGH | `UpdatePortItineraries` | **N+1** — 1 COUNT query per port |
| 4 | ⚠️ HIGH | `UpdatePortDestinations` | **No null check on lat/lng** before `isPointInsidePolygon()` |
| 5 | ⚠️ HIGH | `UpdatePortDestinations` | **Redundant `sync([])` at start of loop** — unnecessary DB write per port |
| 6 | ⚠️ HIGH | `SetPortCountry` | **No Google API rate limiting** — will hit 50 req/s cap on large datasets |
| 7 | ⚠️ HIGH | `UpdatePortDestinations` | **Full table load** with no pagination |
| 8 | ⚠️ MEDIUM | `UpdatePortItineraries` | **`visible_on_map` never reset** when itinerary count drops to 0 |
| 9 | ⚠️ MEDIUM | `UpdatePortDestinations` | **Doubly-nested JSON decode** for multi-polygon areas — fragile |
| 10 | ⚠️ MEDIUM | 3 of 4 | **`description = 'Command description'`** — unfilled placeholders |

---

## 📝 Migration to Base44

### Backend Functions

```typescript
// 1. removeUnusedPorts — implement the empty stub
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { dryRun = true } = await req.json();  // safe default: dry-run
  // Find Port records with no ItineraryElement references
  // If !dryRun: delete them
  // Return { deleted: n, dryRun }
});

// 2. setPortCountry — geocoding enrichment
// - Accept optional portIds array
// - For each port: call Google Maps Geocoding API
// - Throttle: await delay(200ms) between calls
// - Update country_id, continent_id
// - Return { updated, skipped, failed }

// 3. updatePortDestinations — point-in-polygon
// - Filter: is_not_a_port=false, lat/lng not null
// - Process in chunks of 100
// - Self-contained ray-casting isPointInsidePolygon()
// - Sync port.destination_ids array field

// 4. updatePortItineraries — aggregate count
// - Use single query with count of itinerary_elements per port
// - Update itineraries count AND reset visible_on_map correctly:
//   - count > 0 → visible_on_map = true
//   - count = 0 → visible_on_map = false  ← FIX
```

### Port Entity additions needed

```json
{
  "country_id":     { "type": "string" },
  "continent_id":   { "type": "string" },
  "is_not_a_port":  { "type": "boolean", "default": false },
  "itineraries":    { "type": "integer", "description": "Denormalized count — updated by updatePortItineraries" },
  "visible_on_map": { "type": "boolean", "default": false }
}
```

---

## Summary

**4 port maintenance commands** in `Console/Commands/ports/` sub-namespace — none registered in Kernel (manual triggers only).

`RemovePortsWithNoItineraries` is a **complete stub** — `handle()` is empty, never executes. `SetPortCountry` is the **best-written command** in the codebase (chunked, dirty-check, progress bar, fail-fast guards) but lacks rate limiting against the Google API. `UpdatePortDestinations` has a **redundant sync([]) wipe** at the start of each port's loop and no null guard on lat/lng. `UpdatePortItineraries` uses a **non-standard `HAVING` without `GROUP BY`** and an **N+1 count query** — should be rewritten as a single aggregation. All three implemented commands also fail to paginate, loading entire Port tables into memory.