# Console Commands (28 files)

**Directory:** `Console/Commands/`  
**Namespace:** `App\Console\Commands`  
**Priority:** MEDIUM–HIGH (varies by command type)

---

## 📋 Overview

| Category | Commands | Priority |
|----------|---------|----------|
| Provider Sync | AroyaSync, CostaSync, ExploraSync, MscSync, FibosSyncCommand | HIGH |
| CRM Automation | CreateLeadFollowUpTasksCommand, RemoveLeadAssignmentCommand, UpdateLeadStatus, UpdateWaitingLeads | HIGH |
| Catalog Maintenance | ExploraItinerariesTravelInfo, UpdateItinerariesDestination, EnableAllItineraries, UpdatePricesCommand | HIGH |
| Data Import | ImportPortsCommand, ImportShipForCruiseline | MEDIUM |
| Inbound Mail | ProcessInboundEmailsCommand | HIGH |
| Data Quality | CheckEmptyFieldsCommand | MEDIUM |
| Cache Management | ClearPortsCache | LOW |
| Media | GenerateItineraryMediaCommand, ExportMegaCruiselinesCommand, MediaLibraryClean | MEDIUM |
| Provider Debug | CostaSoapCommand, ExploraSyncPrices | LOW |
| Dev/Test Scaffolding | PortGeoFake, TestEnableItineraries, TestCancellationCondition, TestInstallmentSetting | ⚠️ DO NOT MIGRATE |
| User Management | UserCreate | LOW (Base44 handles this natively) |

---

## 🔧 Commands Detail

### 1. Provider Sync Commands

#### `AroyaSync` — `aroya:sync`
```php
public function handle() {
    AroyaSyncJob::dispatch()->onQueue('aroya_sync');
}
// ✅ Simple job dispatch, correct queue
// ⚠️ No output or confirmation
// ⚠️ AroyaSyncJob not yet documented
```
**Migration:** `aroyaSync` backend function → scheduled automation (frequency unknown — not in Kernel)

---

#### `CostaSync` — `costa:sync`
```php
public function handle() {
    //CostaSyncItineraries::dispatch()->onQueue("costa_sync"); // ⚠️ COMMENTED OUT
    CostaSyncJob::dispatch()->onQueue("costa_sync");
}
// ⚠️ CostaSyncItineraries previously dispatched — now disabled, reason unknown
// ⚠️ description = 'Command description' — unfilled placeholder
```
**Migration:** `costaSync` backend function → scheduled automation (not in Kernel — manual trigger only)

---

#### `ExploraSync` — `explora:sync`
```php
ExploraSyncJob::dispatch()->onQueue('explora_sync');
// ✅ Minimal, clean
```
**Migration:** `exploraSync` backend function → scheduled automation

---

#### `MscSync` — `msc:sync`
```php
MSCSyncJob::dispatch()->onQueue('msc_sync');
// ✅ Minimal, clean
```
**Migration:** `mscSync` backend function → scheduled automation

---

#### `FibosSyncCommand` — `fibos:sync {cruiselineId}`
```php
$cruiselineCode = Cruiseline::find($cruiselineId)?->code;
if ($cruiselineCode === null) {
    throw new \Exception('errore');   // ⚠️ Italian generic exception message
}
SyncFibosJob::dispatch($cruiselineCode)->onQueue('fibos_sync');
// ⚠️ throws bare \Exception with Italian 'errore' — no user-friendly message
// ⚠️ Takes cruiselineId but needs to translate to code — extra DB query
```
**Migration:** `fibosSyncByCruiseline` backend function (takes `cruiselineId`, resolves code internally)

---

### 2. CRM Automation Commands

#### `CreateLeadFollowUpTasksCommand` — `app:create-lead-follow-up-tasks`
```php
CreateLeadFollowUpTasksJob::dispatchSync(); // ✅ Synchronous — waits for result
return self::SUCCESS;
// ✅ Registered in Kernel: hourly, withoutOverlapping
// ✅ dispatchSync() ensures task creation completes before returning
```
**Migration:** `createLeadFollowUpTasks` backend function → scheduled automation (hourly)

---

#### `RemoveLeadAssignmentCommand` — `app:remove-lead-assignments`
```php
RemoveLeadAssignmentJob::dispatchSync(); // ✅ Synchronous
// description: 'Remove lead assignments after 48 hours in negotiation' — ✅ clear
// ✅ Registered in Kernel: hourly, withoutOverlapping
```
**Migration:** `removeLeadAssignments` backend function → scheduled automation (hourly, +5 min offset)

---

#### `UpdateLeadStatus` — `app:update-lead-status`
```php
$leadState = LeadStatus::whereName('converted')->first();
$leads = Lead::where('id', '<>', $leadState->id)->get();  // ⚠️ BUG: comparing lead.id to leadState.id
foreach ($leads as $lead) {
    $this->leadServices->updateLeadState($lead);
}
// 🔴 CRITICAL BUG: The filter `Lead::where('id', '<>', $leadState->id)` compares Lead.id
//    to LeadStatus.id — this is a column mismatch. Should be:
//    Lead::where('lead_status_id', '<>', $leadState->id)
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ Not registered in Kernel — manual trigger only
// ⚠️ Full table scan on leads — no pagination
```
**Migration:** `updateLeadStatuses` backend function — **fix the filter bug first**

---

#### `UpdateWaitingLeads` — `app:update-waiting-leads`
```php
\App\Jobs\UpdateWaitingLeads::dispatch();
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ Was in Kernel (commented out) — purpose: move 'waiting' leads to active state
// ⚠️ No queue specified — uses default queue
```
**Migration:** `updateWaitingLeads` backend function → re-evaluate if needed (was disabled in Kernel)

---

### 3. Catalog Maintenance Commands

#### `ExploraItinerariesTravelInfo` — `app:explora-itineraries-travel-info`
```php
$cruiseline = Cruiseline::whereCode('EXP')->first(); // ⚠️ Hardcoded 'EXP' code
$itineraries = $cruiseline->itineraries;             // ⚠️ N+1 — no eager loading
foreach ($itineraries as $itinerary) {
    $itineraryElements = $itinerary->ItineraryElements()->get(); // ⚠️ N+1 per itinerary
    // Sets: departure/arrival dates, times, ports, best_price, route string, itineraryCode
    $itinerary->best_price = $itinerary->LowerPrice->lafPrice;   // ⚠️ N+1 LowerPrice relation
    $itinerary->itineraryCode = $code;
    $itinerary->save();
}
// ⚠️ Hardcoded 'EXP' cruiseline code
// ⚠️ Severe N+1: loads elements, ports, ship, cruiseline per itinerary
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ Uses $itinerary->arrival_port_name = ($arrivalPort) ? ... — inconsistent null check style
// ✅ Computes itinerary route string and serial code
```
**Migration:** `updateExploraItineraryTravelInfo` backend function — add eager loading, remove hardcoded code

---

#### `UpdateItinerariesDestination` — `app:update-itineraries-destination`
```php
UpdateItineraryDestinations::dispatch(); // No queue specified — default queue
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ Not in Kernel — manual only
```
**Migration:** `updateItineraryDestinations` backend function → on-demand trigger

---

#### `EnableAllItineraries` — `app:enable-all-itineraries`
```php
\App\Jobs\EnableAllItineraries::dispatch();
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ No queue specified
// ⚠️ Mass-enables ALL itineraries — dangerous if run accidentally
```
**Migration:** `enableAllItineraries` backend function — **add confirmation prompt / admin auth guard**

---

#### `UpdatePricesCommand` — `update:prices`
```php
UpdatePricesJob::dispatch(); // No queue specified — default queue
// ✅ description: 'Update prices of destinations'
// ⚠️ Not in Kernel — manual trigger only
```
**Migration:** `updatePrices` backend function → scheduled or on-demand

---

### 4. Data Import Commands

#### `ImportPortsCommand` — `fibos:import:ports {--fresh}`
```php
// Reads two CSV files: fibos_ports.csv and cruisetopic_ports.csv
// --fresh flag: deletes all existing ports first (⚠️ DESTRUCTIVE)
// getOrCreatePort() has a BUG:
$filled = [
    'destination_id' => ($row['destination_id']) ?? null, // ⚠️ $row not defined here — should be $data
    'enabled' => (isset($data['is_active'])) ?? true,     // ⚠️ always true (isset returns bool)
];
// 🔴 CRITICAL BUG: uses undefined $row variable inside getOrCreatePort()
// 🔴 CRITICAL BUG: `(isset($data['is_active'])) ?? true` — the ?? operand is never null (bool)
//    — this always sets enabled=true regardless of CSV value
// ⚠️ Commented-out code: $this->fibosPorts, $this->systemPorts
```
**Migration:** Upload CSV → `importPorts` backend function — **fix $row/$data bug and isset logic**

---

#### `ImportShipForCruiseline` — `app:import-ship-for-cruiseline {cruiselineCode}`
```php
// Reads resources/csv/imports/{cruiselineCode}.csv
// Creates/updates Ship and FibosShip records
// CSV format: [?, code, name, ...]  — col 1 = code, col 2 = name
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ No error handling if CSV file missing (file_get_contents will fail silently or crash)
// ⚠️ Imports PharIo\Version\Exception — wrong namespace (leftover from copy-paste)
// ✅ Upsert logic: creates if not exists, updates name if exists
```
**Migration:** Upload CSV → `importShipsForCruiseline` backend function

---

### 5. Inbound Mail

#### `ProcessInboundEmailsCommand` — `mail:process-inbound`
```php
app(ProcessInboundEmailsJob::class)->handle(
    app(InboundMailFetcher::class),
    app(InboundMailProcessor::class)
);
// ✅ Registered in Kernel: everyMinute, withoutOverlapping
// ✅ Directly calls job->handle() synchronously (not dispatched to queue)
// ⚠️ Relies on InboundMailFetcher (IMAP) — requires IMAP credentials configured
// ⚠️ InboundMailFetcher and InboundMailProcessor not yet documented
```
**Migration:** `processInboundMail` backend function → scheduled automation (every 5 min — Base44 minimum)

---

### 6. Data Quality

#### `CheckEmptyFieldsCommand` — `check:empty-fields`
```php
// Reads config('notifications.empty_fields_check.tables')
// For 'cabins' table: only checks enabled=true records
// For all other tables: checks all records
// Calls NotificationService::sendEmptyFieldsNotification() on each field with nulls
// ✅ Registered in Kernel: daily 09:00
// ✅ Config-driven: tables and fields defined in config/notifications.php
// ⚠️ description (Italian): 'Controlla campi vuoti nelle tabelle configurate e invia notifiche'
// ⚠️ All console output in Italian
// ⚠️ Raw DB::table() — bypasses Eloquent models
```
**Migration:** `checkEmptyFields` backend function → scheduled automation (daily 09:00) — read entity configs, send notification

---

### 7. Cache Management

#### `ClearPortsCache` — `cache:clear-ports {cruiselineCode?}`
```php
// Optional arg: clears '{cruiselineCode}_ports_cache' key
// No arg: Cache::flush() — CLEARS ALL CACHE
// ⚠️ Cache::flush() clears everything, not just port caches
// ✅ Good: optional scoping by cruiseline
```
**Migration:** `clearPortsCache` backend function — **never flush all cache in production; use tagged cache or keyed delete**

---

### 8. Media Commands

#### `GenerateItineraryMediaCommand` — `itinerary:generate-media {cruiseline_id}`
```php
// Optional: --itinerary_id, --queue
// Dispatches GenerateItineraryMediaJob with cruiseline_id, itinerary_id, queue
// ✅ Flexible: per-itinerary or per-cruiseline
// ⚠️ All console output in Italian
```
**Migration:** `generateItineraryMedia` backend function (accepts cruiselineId, optional itineraryId)

---

#### `ExportMegaCruiselinesCommand` — `export:mega-cruiselines {userId} {cruiselineId?}`
```php
// Required: userId (to notify after export)
// Optional: cruiselineId (export single or all)
// Dispatches ExportMegaCruiselinesJson::dispatch($userId, $cruiselineId)->onQueue("default")
// ⚠️ All console output in Italian
// ⚠️ Returns hardcoded 0 instead of Command::SUCCESS
```
**Migration:** `exportMegaCruiselines` backend function — user gets notified via notification system

---

#### `MediaLibraryClean` — `media-library:clean`
```php
// Gets all directories from storage disk
// Compares basenames against media table file_name column
// Deletes orphaned files (not in DB)
// ⚠️ Uses allDirectories() not allFiles() — compares directories not files
//    (basename of a directory is the dir name, not a file name — likely a bug)
// ⚠️ deleteDirectory() is commented out; uses delete() — may leave empty dirs
// ⚠️ Italian output
// ⚠️ No dry-run option — deletes immediately
```
**Migration:** `cleanMediaLibrary` backend function — **fix allDirectories → allFiles bug; add dry-run flag**

---

### 9. Provider Debug Commands

#### `CostaSoapCommand` — `costa:soap {action}`
```php
// Interactive SOAP debug tool — 17 actions via switch:
// getCruise, getCruiseDetailed, listAllDestinations, listAllPorts, listAllShips,
// listAvailableCruises, listPorts, listFares, exportPorts, exportPrice,
// exportCatalog, exportFullPriceExtended, getExportAvailableFares,
// exportItineraryAndSteps, exportShipsAndCategories, exportAvailability,
// exportFare, exportPriceWithDestination
// ⚠️ Hardcoded cruise code 'PA07260308' in getCruise/getCruiseDetailed cases
// ⚠️ All output in Italian
// ⚠️ Debug/dev tool — should NOT be in production
```
**Migration:** ⚠️ Dev tool — do not migrate. Replace with a Base44 admin UI that calls Costa API directly.

---

#### `ExploraSyncPrices` — `app:explora-sync-prices`
```php
\App\Jobs\ExploraSyncPrices::dispatch(); // No queue
// ⚠️ description = 'Command description' — unfilled placeholder
// ⚠️ Not in Kernel — manual only
```
**Migration:** `exploraSyncPrices` backend function → on-demand trigger

---

### 10. Dev/Test Scaffolding (DO NOT MIGRATE)

#### `PortGeoFake` — `app:port-geo-fake`
```php
// Assigns random continent from a hand-typed array (with duplicates) to ALL ports
// ⚠️ DESTRUCTIVE: overwrites continent field on all Port records
// ⚠️ Duplicated values in the $continents array (copy-paste artifact)
// ⚠️ rand(0,20) but array only has ~40 values — but some slots are skipped
// ⚠️ Pure test data seeder — must NOT exist in production
```
**Status:** ❌ DO NOT MIGRATE — test scaffolding only

---

#### `TestEnableItineraries` — `app:test-enable-itineraries`
```php
$itineraries = Itinerary::whereCruiselineId(47)->whereHas('ItineraryElements')->get();
// Hardcoded cruiseline ID 47 — does nothing with results
// Pure skeleton — empty handle body
```
**Status:** ❌ DO NOT MIGRATE — empty test command

---

#### `TestCancellationCondition` — `test:cancellation-condition {action=check}`
```php
// 3 actions: check (counts), create (test record), list (table output)
// ✅ Well-written test scaffold with proper output formatting
// ✅ Uses CancellationConditionService — documents the service interface
// ⚠️ Creates real DB records — should not run on production
```
**Status:** ❌ DO NOT MIGRATE — use Base44 entity admin for record inspection

---

#### `TestInstallmentSetting` — `test:installment-setting {action=check}`
```php
// Same pattern as TestCancellationCondition
// ✅ Documents InstallmentSettingService interface
// ⚠️ Creates real test records
```
**Status:** ❌ DO NOT MIGRATE — use Base44 entity admin

---

### 11. User Management

#### `UserCreate` — `user:create {email?}`
```php
// Interactive: prompts for email, password, name
// Creates user via User::factory()->create() with bcrypt password
// ⚠️ Uses factory() in production — factories are seeding tools
// ⚠️ All prompts in Italian
// ⚠️ Redundant double exists() check (while + if)
```
**Migration:** ❌ Base44 handles user creation natively via invite — do not migrate

---

## 📊 Command Inventory

| Command Signature | Class | Kernel? | Queue | Priority | Migrate? |
|------------------|-------|---------|-------|----------|----------|
| `aroya:sync` | AroyaSync | ❌ | `aroya_sync` | HIGH | ✅ |
| `costa:sync` | CostaSync | ❌ | `costa_sync` | HIGH | ✅ |
| `explora:sync` | ExploraSync | ❌ | `explora_sync` | HIGH | ✅ |
| `msc:sync` | MscSync | ❌ | `msc_sync` | HIGH | ✅ |
| `fibos:sync {id}` | FibosSyncCommand | ❌ | `fibos_sync` | HIGH | ✅ fix exception msg |
| `app:create-lead-follow-up-tasks` | CreateLeadFollowUpTasksCommand | ✅ hourly | sync | HIGH | ✅ |
| `app:remove-lead-assignments` | RemoveLeadAssignmentCommand | ✅ hourly | sync | HIGH | ✅ |
| `app:update-lead-status` | UpdateLeadStatus | ❌ | none | HIGH | ✅ **fix bug** |
| `app:update-waiting-leads` | UpdateWaitingLeads | ❌ (was commented) | default | MEDIUM | ✅ re-evaluate |
| `app:explora-itineraries-travel-info` | ExploraItinerariesTravelInfo | ❌ | none | HIGH | ✅ fix N+1 |
| `app:update-itineraries-destination` | UpdateItinerariesDestination | ❌ | default | HIGH | ✅ |
| `app:enable-all-itineraries` | EnableAllItineraries | ❌ | default | MEDIUM | ✅ add guard |
| `update:prices` | UpdatePricesCommand | ❌ | default | HIGH | ✅ |
| `fibos:import:ports {--fresh}` | ImportPortsCommand | ❌ | none | MEDIUM | ✅ **fix bugs** |
| `app:import-ship-for-cruiseline` | ImportShipForCruiseline | ❌ | none | MEDIUM | ✅ |
| `mail:process-inbound` | ProcessInboundEmailsCommand | ✅ every min | none | HIGH | ✅ |
| `check:empty-fields` | CheckEmptyFieldsCommand | ✅ daily 09:00 | none | MEDIUM | ✅ |
| `cache:clear-ports {code?}` | ClearPortsCache | ❌ | n/a | LOW | ✅ fix flush scope |
| `itinerary:generate-media` | GenerateItineraryMediaCommand | ❌ | optional | MEDIUM | ✅ |
| `export:mega-cruiselines` | ExportMegaCruiselinesCommand | ❌ | default | MEDIUM | ✅ |
| `media-library:clean` | MediaLibraryClean | ❌ | n/a | MEDIUM | ✅ fix dir/file bug |
| `costa:soap {action}` | CostaSoapCommand | ❌ | n/a | LOW | ❌ dev tool |
| `app:explora-sync-prices` | ExploraSyncPrices | ❌ | default | MEDIUM | ✅ |
| `app:port-geo-fake` | PortGeoFake | ❌ | n/a | — | ❌ test seeder |
| `app:test-enable-itineraries` | TestEnableItineraries | ❌ | n/a | — | ❌ empty stub |
| `test:cancellation-condition` | TestCancellationCondition | ❌ | n/a | — | ❌ test scaffold |
| `test:installment-setting` | TestInstallmentSetting | ❌ | n/a | — | ❌ test scaffold |
| `user:create` | UserCreate | ❌ | n/a | — | ❌ Base44 native |

---

## ⚠️ Critical Issues Across Commands

| # | Severity | Command | Issue |
|---|----------|---------|-------|
| 1 | 🔴 CRITICAL | `UpdateLeadStatus` | **`Lead::where('id', '<>', $leadState->id)`** — compares Lead.id to LeadStatus.id (wrong column) |
| 2 | 🔴 CRITICAL | `ImportPortsCommand` | **`$row` undefined** in `getOrCreatePort()` — should be `$data` |
| 3 | 🔴 CRITICAL | `ImportPortsCommand` | **`(isset($data['is_active'])) ?? true`** — always `true` (bool ?? true = bool) |
| 4 | 🔴 CRITICAL | `PortGeoFake` | **Overwrites continent on ALL ports** — dangerous if run accidentally in production |
| 5 | ⚠️ HIGH | `MediaLibraryClean` | `allDirectories()` vs `allFiles()` — compares directory names not file names |
| 6 | ⚠️ HIGH | `ExploraItinerariesTravelInfo` | Severe N+1 — elements, ports, ship, cruiseline loaded per itinerary |
| 7 | ⚠️ HIGH | `CostaSoapCommand` | Hardcoded cruise code `'PA07260308'` — should be an argument |
| 8 | ⚠️ HIGH | `ClearPortsCache` | `Cache::flush()` without `cruiselineCode` clears ALL application cache |
| 9 | ⚠️ HIGH | `UserCreate` | Uses `User::factory()` in production — factories are seeding tools |
| 10 | ⚠️ MEDIUM | Multiple | `description = 'Command description'` — 9 commands with unfilled placeholders |
| 11 | ⚠️ MEDIUM | `FibosSyncCommand` | Throws `\Exception('errore')` — Italian, non-descriptive |
| 12 | ⚠️ MEDIUM | `ImportShipForCruiseline` | Imports `PharIo\Version\Exception` — wrong namespace (copy-paste artifact) |

---

## 📝 Migration to Base44

### Scheduled Automations needed (from this command set)

```
// Already covered in Kernel doc — CRM commands
createLeadFollowUpTasks   → hourly
removeLeadAssignments     → hourly +5min offset
processInboundMail        → every 5min (Base44 minimum)
checkEmptyFields          → daily 09:00

// New from this set — all manual triggers, exposed as backend functions
aroyaSync
costaSync
exploraSync
mscSync
fibosSyncByCruiseline
updateLeadStatuses        (fix filter bug first)
updateExploraItineraryTravelInfo
updateItineraryDestinations
enableAllItineraries      (add admin auth guard)
updatePrices
exploraSyncPrices
generateItineraryMedia
exportMegaCruiselines
cleanMediaLibrary         (fix allDirectories bug)
clearPortsCache           (scope to specific key only)
importPorts               (fix $row/$data + isset bugs)
importShipsForCruiseline
```

### Do NOT migrate (test/dev tools)
- `PortGeoFake`, `TestEnableItineraries`, `TestCancellationCondition`, `TestInstallmentSetting`, `UserCreate`, `CostaSoapCommand`

---

## Summary

**28 Console Commands** across provider sync, CRM automation, catalog maintenance, data import, media, and test scaffolding. 

**3 critical production bugs identified:**
1. `UpdateLeadStatus`: `Lead::where('id', '<>', $leadState->id)` — wrong column, filters by wrong field
2. `ImportPortsCommand`: undefined `$row` variable in `getOrCreatePort()` + `enabled` always `true` due to isset/?? logic
3. `MediaLibraryClean`: `allDirectories()` instead of `allFiles()` — compares dir names to file names, so no orphans ever match

**6 commands to explicitly NOT migrate:** `PortGeoFake` (destructive seeder), `TestEnableItineraries` (empty stub), `TestCancellationCondition`/`TestInstallmentSetting` (test scaffolds that create DB records), `UserCreate` (Base44 handles natively), `CostaSoapCommand` (hardcoded dev tool).

**9 commands with `description = 'Command description'`** — unfilled placeholder text throughout.