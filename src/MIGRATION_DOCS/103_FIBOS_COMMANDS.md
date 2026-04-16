# Fibos Console Commands (2 files)

**Directory:** `Console/Commands/fibos/`  
**Namespace:** `App\Console\Commands\fibos`  
**Priority:** HIGH — Fibos is the primary provider sync pipeline

---

## 📋 Overview

| Command | Signature | Purpose | In Kernel? |
|---------|-----------|---------|------------|
| `FibosContentsCommand` | `fibos:update:contents` | Dispatch Fibos content sync jobs (cruises/ships/ports/maps) | ⚠️ Was scheduled (now **commented out** in Kernel) |
| `ParseItineraries` | `app:parse-itineraries` | Parse Fibos XML for a single ship → create Itinerary records | ❌ not scheduled |

---

## 🔧 Commands Detail

### 1. `FibosContentsCommand` — `fibos:update:contents`

```
fibos:update:contents
  {--cruises}         dispatch cruise content sync
  {--ships}           dispatch ship content sync
  {--ports}           dispatch port content sync
  {--maps}            dispatch maps sync (separate job)
  {--lang=en}         language for content (default: en)
  {--clCode=null}     restrict to a single cruiseline code
```

**Description:** `Update fibos contents` ✅ (one of the few with a real description)

#### Implementation

```php
public function handle()
{
    // Treat '--clCode=null' string as actual null
    $clCode = ($this->option('clCode') != 'null') ? $this->option('clCode') : null;
    // ⚠️ Default option value is the STRING 'null' — comparison with != 'null' works but is fragile

    Log::info("Starting Fibos contents update with options: " . json_encode([...]));
    // ✅ Logs options at start — useful for debugging

    if ($this->option('maps')) {
        FibosMapsJob::dispatch($clCode)->onQueue("fibos_content");
        // ✅ Maps dispatched to dedicated 'fibos_content' queue
    }

    if ($this->option('cruises') || $this->option('ships') || $this->option('ports')) {
        FibosContentsJob::dispatch(
            $this->option('cruises'),
            $this->option('ships'),
            $this->option('ports'),
            $this->option('lang'),
            $clCode,
        );
        // ⚠️ FibosContentsJob dispatched WITHOUT ->onQueue() — goes to 'default'
        // ⚠️ Inconsistency: FibosMapsJob uses 'fibos_content' queue; FibosContentsJob uses 'default'
    }
}
```

#### Kernel Context

This command is the **commented-out Kernel schedule** identified in `99_CONSOLE_KERNEL.md`:
```php
// COMMENTED OUT:
// $schedule->command("fibos:update:contents --cruises --ports --ships")
//     ->lastDayOfMonth()->at('23:59')->withoutOverlapping()->runInBackground();
```
The monthly Fibos catalog sync is silently disabled. Whether content is now synced via another mechanism is unknown.

#### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **Monthly sync commented out in Kernel** — Fibos catalog content not auto-refreshed |
| 2 | ⚠️ HIGH | **Queue inconsistency** — `FibosMapsJob` → `fibos_content`; `FibosContentsJob` → `default` |
| 3 | ⚠️ HIGH | **`--clCode=null` default** — option default is the literal string `'null'`; comparison with `!= 'null'` works but is a code smell |
| 4 | ⚠️ MEDIUM | **`--maps` and `--cruises/ships/ports` are independent flags** — possible to run maps without content or vice versa; no validation |
| 5 | ⚠️ MEDIUM | **`FibosContentsJob` not yet documented** — internal dispatch logic unknown |
| 6 | ℹ️ LOW | **`--lang=en` hardcoded default** — no multi-language strategy visible |

---

### 2. `ParseItineraries` — `app:parse-itineraries {cruiselineCode} {shipCode}`

A **per-ship** Fibos itinerary parser that reads an XML file from storage and delegates to `ItineraryService::parseAndCreateItineraryFromXML()`.

#### Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `cruiselineCode` | string | Fibos cruiseline code (e.g. `MSC`, `NCL`) |
| `shipCode` | string | Fibos ship code |

#### Implementation Flow

```php
public function handle(FibosService $fibos, ItineraryService $itineraryService)
{
    // 1. Resolve FibosCruiseline → internal Cruiseline
    $fibosCruiseline = FibosCruiseline::whereCode($cruiseLineCode)->first();

    if ($fibosCruiseline && $fibosCruiseline->cruiseline_id) {
        $cruiseline = Cruiseline::findOrFail($fibosCruiseline->cruiseline_id); // ✅ existing
    } elseif ($fibosCruiseline && !$fibosCruiseline->cruiseline_id) {
        $cruiseline = Cruiseline::create([...]);  // ✅ auto-create if mapped but unlinked
    }
    // ⚠️ If $fibosCruiseline is null (not found): $cruiseline is never set → undefined variable error below

    // 2. Resolve FibosShip → internal Ship (3-way branch)
    $fibosShip = FibosShip::where('fibos_cruiseline_id', $fibosCruiseline->id)
        ->whereCode($shipCode)->first();
    // ⚠️ $fibosCruiseline could be null here → null->id = fatal error

    if ($fibosShip instanceof FibosShip && $fibosShip->ship_id) {
        $ship = Ship::findOrFail($fibosShip->ship_id);          // existing
    } elseif ($fibosShip && !$fibosShip->ship_id) {
        $ship = Ship::create([...]); $fibosShip->save();        // auto-create ship, link fibosShip
    } else {
        // FibosShip not found at all — create both Ship and FibosShip from scratch
        $ship = Ship::create(['code' => $shipCode, 'name' => $shipCode, ...]);
        $fibosShip = FibosShip::create([...]);
    }

    // 3. Load XML from storage
    $itineraryData = new \SimpleXMLElement(
        Storage::get('temp/FIBOS_SYNC/' . $cruiseLineCode . '/' . $shipCode . '/Itinerary.xml')
    );
    // ⚠️ Path hardcoded: temp/FIBOS_SYNC/{code}/{ship}/Itinerary.xml
    // ⚠️ No null check: if file doesn't exist, Storage::get() returns null → SimpleXMLElement(null) throws

    // 4. Parse and create itineraries
    $result = $itineraryService->parseAndCreateItineraryFromXML($itineraryData, $fibosCruiseline, $fibosShip);

    // 5. Aggregate counters
    $this->counter['itineraries'] = count($successItineraries);
    // ...

    dd($this->counter);   // 🔴 CRITICAL: dd() left in production code — dumps and dies
    return $this->counter; // ⚠️ Dead code — never reached due to dd()
}
```

#### Counter Fields (13 total)

```php
private $counter = [
    'cruiselines', 'ships', 'ports',
    'itineraries', 'itinerary_elements', 'price_lists',
    'failed_cruiselines', 'failed_ships', 'failed_ports',
    'failed_itineraries', 'failed_itinerary_elements', 'failed_price_lists',
    'deleted_itineraries',
];
// ⚠️ 'cruiselines', 'ships', 'ports', 'price_lists' counters declared but NEVER updated in handle()
// ⚠️ counter['new_ports'] set (line 109) but not declared in initial $counter array
```

#### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **`dd($this->counter)` left in production code** — dumps output and terminates execution; `return $this->counter` is dead code |
| 2 | 🔴 CRITICAL | **Undefined `$cruiseline`** — if `FibosCruiseline::whereCode()` returns null, `$cruiseline` is never assigned but used on line 69 (`$cruiseline->id`) |
| 3 | 🔴 CRITICAL | **`$fibosCruiseline->id` called when null** — if cruiseline not found, line 62 `$fibosCruiseline->id` throws a fatal error |
| 4 | ⚠️ HIGH | **`Storage::get()` returns null if file missing** — `new \SimpleXMLElement(null)` throws `\ValueError`; no null guard |
| 5 | ⚠️ HIGH | **Hardcoded XML storage path** — `temp/FIBOS_SYNC/{code}/{ship}/Itinerary.xml`; tightly coupled to Fibos sync worker's output path |
| 6 | ⚠️ HIGH | **`FibosService $fibos` injected but never used** — dead dependency |
| 7 | ⚠️ HIGH | **Counter `new_ports` not in initial `$counter` array** — set on line 109 as ad-hoc key; inconsistent |
| 8 | ⚠️ HIGH | **5 counter fields declared but never updated** — `cruiselines`, `ships`, `ports`, `price_lists`, `failed_cruiselines` |
| 9 | ⚠️ MEDIUM | **`description = 'Command description'`** — unfilled placeholder |
| 10 | ⚠️ MEDIUM | **Auto-creates Ship with `name = shipCode`** — uses code as name when actual name unknown; pollutes Ship catalog |
| 11 | ⚠️ MEDIUM | **Not in Kernel** — manual trigger only; intended to be called per-ship from the Fibos sync pipeline |
| 12 | ℹ️ LOW | **`$counter` is instance property** — would accumulate across calls if command were somehow reused |

---

## 📊 Summary Table

| Command | Lines | State | Critical Issues | Migrate? |
|---------|-------|-------|----------------|----------|
| `FibosContentsCommand` | 54 | ✅ Complete | Monthly sync commented out; queue inconsistency | ✅ re-enable + fix queue |
| `ParseItineraries` | 115 | ⚠️ Broken | `dd()` in production, 2× null-deref crashes, dead dependency | ✅ fix all bugs |

---

## 📝 Migration to Base44

### `FibosContentsCommand` → `fibosSyncContents` backend function

```typescript
// functions/fibosSyncContents.js
// Accepts: { cruises, ships, ports, maps, lang, clCode }
// Calls the relevant Fibos API endpoints (via FibosApi credentials)
// Should be triggered by a monthly scheduled automation (last day of month, 23:59)
```

**Re-enable as automation:**
```
create_automation(
  automation_type="scheduled",
  name="Fibos Monthly Contents Sync",
  function_name="fibosSyncContents",
  schedule_type="cron",
  cron_expression="59 23 28-31 * *"  // approx last day of month
)
```

### `ParseItineraries` → `parseFibosItineraries` backend function

```typescript
// functions/parseFibosItineraries.js
// Accepts: { cruiselineCode, shipCode }
// Fetches XML from Fibos API directly (not from local storage)
// Calls ItineraryService equivalent logic in Deno
// Returns counter summary (no dd())
// Requires admin auth

// Key fixes:
// - Guard against missing FibosCruiseline (return 404)
// - Guard against null XML response
// - Remove dd() — return proper JSON response
// - Remove unused FibosService dependency
// - Consistent counter initialization
```

---

## Summary

**`FibosContentsCommand`** (54 lines): The command behind the **commented-out monthly Fibos sync** in Kernel. Dispatches `FibosContentsJob` (cruises/ships/ports) and `FibosMapsJob` (maps) based on CLI flags. Queue inconsistency: maps go to `fibos_content`, content goes to `default`. The literal string `'null'` used as the default for `--clCode` is a code smell but functionally works. **Migration priority HIGH** — re-enable as a monthly scheduled automation.

**`ParseItineraries`** (115 lines): Per-ship Fibos XML parser that resolves cruiseline/ship mappings and delegates to `ItineraryService::parseAndCreateItineraryFromXML()`. Contains **3 critical production bugs**: `dd($this->counter)` terminates every execution (return is dead code), unguarded null dereference if `FibosCruiseline` not found, unguarded `Storage::get()` null passed to `SimpleXMLElement`. Also: injected `FibosService` never used, 5 counter fields declared but never populated, `new_ports` key added ad-hoc outside the declared array. **Migration priority HIGH** — fix all null-safety issues and remove `dd()` before any production use.