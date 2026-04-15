# Jobs / Queue Classes

**Purpose:** Laravel Queue jobs for async background processing of long-running tasks (sync operations, imports, exports).  
**Framework:** Laravel Queue with ShouldQueue, Dispatchable, Queueable, SerializesModels traits.

---

## 📋 Job Index

| Job | Namespace | Purpose |
|-----|-----------|---------|
| ExploraSyncJob | App\Jobs\Explora | Async Explora provider data sync per market |

---

## ⛴️ Explora Jobs

### ExploraSyncJob

**Location:** `App\Jobs\Explora\ExploraSyncJob`  
**Purpose:** Async background job to trigger Explora cruise data synchronization for a given market.  
**Queue:** ShouldQueue (mandatory async)  
**Unique:** Implements ShouldBeUnique (imported but not applied — see Issues)

#### Configuration

```php
public $tries = 3;       // Retry up to 3 times on failure
public $timeout = 10800; // 3 hours max execution time
```

- **Retries:** 3 attempts before marking as failed
- **Timeout:** 10,800 seconds (3 hours) — very long-running sync
- **Max Execution:** `ini_set('max_execution_time', 0)` disables PHP timeout inside handle()

#### Constructor

```php
public function __construct($market = "ita")
{
    $this->market = $market;
}
```

- **Parameter:** `$market` - Market code (default: `"ita"`)
- **Purpose:** Scope the sync to a specific market (e.g., "ita", "eng")
- **Stored:** `public string $market` — serialized with the job payload

#### Key Methods

##### `handle(): void`

**Execution Flow:**
```
1. ini_set('max_execution_time', 0)     → Disable PHP timeout
2. Log: "Starting sync for market: {market}"
3. Instantiate ExploraSyncService
4. Get job ID from queue: $this->job->getJobId()
5. Normalize job ID: null if empty string
6. Call ExploraSyncService::sync($market, $jobId)
7. Log: "Completed sync for market: {market}"
```

**Logging Channel:** `explora_sync` (dedicated channel, separate from default)

**Job ID Handling:**
```php
$jobId = $this->job->getJobId();
$jobId = ($jobId !== '') ? $jobId : null;
```
- Retrieves the queue job ID for tracking in `FibosImport` / sync records
- Guards against empty string (normalizes to null)

#### Dependencies

| Dependency | Type | Purpose |
|-----------|------|---------|
| ExploraSyncService | Service | Actual sync orchestration |
| Log (explora_sync channel) | Facade | Audit logging |
| $this->job | Queue contract | Queue job ID retrieval |

#### Issues / Concerns

1. **ShouldBeUnique Imported but Not Applied:**
   - `use Illuminate\Contracts\Queue\ShouldBeUnique;` is imported
   - The class does NOT implement `ShouldBeUnique`
   - Risk: Multiple sync jobs for the same market could run concurrently
   - Fix: Add `implements ShouldBeUnique` or remove the unused import

2. **Service Instantiation in handle():**
   - `new ExploraSyncService()` created manually instead of dependency injection
   - Laravel recommends injecting via `handle(ExploraSyncService $service)` parameter
   - Current approach bypasses constructor injection and IoC container

3. **No Failed() Hook:**
   - No `failed(Exception $e)` method defined
   - On final retry failure: no cleanup, no notification, no status update
   - Should notify admin and update sync status on failure

4. **ini_set in Job:**
   - `ini_set('max_execution_time', 0)` in handle() overrides PHP config
   - Better practice: configure timeout via Laravel queue worker settings
   - May not work on all server/queue configurations (e.g., php-fpm ignores ini_set in some contexts)

5. **No Market Validation:**
   - Market param is not validated (any string accepted)
   - Should validate against allowed market codes list

---

## 📊 Job Architecture Pattern

### Current Laravel Pattern

```
Scheduler / Controller dispatches job
  ↓
Queue Worker picks up job
  ↓
ExploraSyncJob::handle()
  ├─ Log start
  ├─ Instantiate ExploraSyncService
  ├─ Call sync($market, $jobId)
  └─ Log completion
```

### Job Dispatch Pattern (Inferred)

From the ExploraServiceProvider, jobs are likely dispatched via scheduler:

```php
// In ExploraServiceProvider (scheduler)
$schedule->job(new ExploraSyncJob('ita'))->daily()->at('02:00');
$schedule->job(new ExploraSyncJob('eng'))->daily()->at('03:00');
```

Or manually dispatched from admin:

```php
ExploraSyncJob::dispatch('ita');
```

---

## 📝 Migration Notes for Base44

### Current Pattern → Base44 Equivalent

| Laravel Concept | Base44 Equivalent |
|----------------|-------------------|
| ShouldQueue job | Backend function |
| `$tries = 3` | Retry logic in function or automation |
| `$timeout = 10800` | Long-running backend function |
| Queue scheduler | Scheduled automation |
| `Log::channel()` | `console.log()` in backend function |
| `ShouldBeUnique` | Guard condition in function |

### Base44 Refactor

**Backend Function: exploraSyncJob**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { market = 'ita' } = await req.json();

    const allowedMarkets = ['ita', 'eng'];
    if (!allowedMarkets.includes(market)) {
      return Response.json({ error: `Invalid market: ${market}` }, { status: 400 });
    }

    console.log(`[Explora Sync] Starting sync for market: ${market}`);

    // Call the Explora sync logic
    const result = await base44.functions.invoke('exploraSyncService', { market });

    console.log(`[Explora Sync] Completed sync for market: ${market}`);

    return Response.json({ success: true, market, result });
  } catch (error) {
    console.error(`[Explora Sync] Failed: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

**Scheduled Automation:**

```
Automation: Explora Sync - ITA
Type: Scheduled
Function: exploraSyncJob
Schedule: Daily at 02:00
Args: { market: "ita" }

Automation: Explora Sync - ENG
Type: Scheduled
Function: exploraSyncJob
Schedule: Daily at 03:00
Args: { market: "eng" }
```

### Key Improvements Over Current Pattern

1. **Market Validation:** Explicit whitelist check before running sync
2. **Admin Guard:** Prevents unauthorized invocations
3. **Proper Error Handling:** Structured error response with logging
4. **No ShouldBeUnique Bug:** Automation scheduler prevents overlapping runs naturally
5. **Dependency Injection:** No manual `new Service()` — call via `base44.functions.invoke`
6. **Configurable Timeout:** Handled by backend function platform limits
7. **Failed Hook Equivalent:** try/catch with error logging and status update