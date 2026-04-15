# Queue Jobs

**Purpose:** Async task processing for data synchronization, lead management, email handling, and reporting.  
**Framework:** Laravel Queue with Queueable trait and configurable retry/timeout.  
**Total Jobs:** 20 (organized by category)

---

## 📋 Job Index

### Data Synchronization (7 jobs)
| Job | Source | Purpose |
|-----|--------|---------|
| SyncFibosJob | Fibos WSDL | Sync itineraries & pricing |
| FibosContentsJob | Fibos Contents | Sync ships, cabins, attributes |
| FibosMapsJob | Fibos Maps | Sync port mappings |
| AroyaSyncJob | Aroya OTA | Sync sailings & pricing |
| ExploraSyncPrices | Explora CSV | Sync pricing data |
| CostaSyncItineraries | Costa SOAP | Sync itineraries |
| CostaSyncElementsPrices | Costa SOAP | Sync pricing |

### Lead Management (3 jobs)
| Job | Purpose |
|-----|---------|
| CreateLeadFollowUpTasksJob | Auto-create follow-up tasks (24h, 72h) |
| RemoveLeadAssignmentJob | Remove stale assignments (48h no quotes) |
| UpdateWaitingLeads | Demote waiting leads to NEW |

### Itinerary & Destination (5 jobs)
| Job | Purpose |
|-----|---------|
| UpdateItineraryDestinations | Map itineraries to destinations |
| UpdatePortDestinations | Reset port destination mapping |
| GenerateItineraryMediaJob | Generate itinerary map images |
| ProcessItineraryMapImageJob | Download & attach map images |
| PortMapping | Map Fibos port codes to Port records |

### Availability & Export (3 jobs)
| Job | Purpose |
|-----|---------|
| CheckAvailabilityJob | Check cruise availability (with lock) |
| ExportMegaCruiselinesJson | Export all cruise data to JSON |
| EnableAllItineraries | Enable all itineraries (batch operation) |

### Email & Communication (1 job)
| Job | Purpose |
|-----|---------|
| ProcessInboundEmailsJob | Fetch & process support emails |

### Utility (1 job)
| Job | Purpose |
|-----|---------|
| UpdatePricesJob | Update destination pricing (stub) |

---

## 🔄 Data Synchronization Jobs

### SyncFibosJob

**Location:** `App\Jobs\SyncFibosJob`  
**Traits:** ShouldQueue, ShouldBeUnique (prevents duplicate execution)  
**Retry:** 3 attempts  
**Timeout:** 7200 seconds (2 hours)

```php
public function __construct($cruiselineCode, $market = "ita")
{
    $this->market = $market;
    $this->cruiselineCode = $cruiselineCode;
}

public function uniqueId(): string
{
    return 'sync_fibos_' . $this->cruiselineCode;
}

public function handle(FibosSyncService $syncService): void
{
    $syncService->sync($this->cruiselineCode, $this->market);
}
```

**Features:**
- Unique constraint (prevents concurrent syncs)
- Market-scoped sync (ita, eng, etc.)
- Service injection via handle()

**Issues:**
- No logging of progress
- No error context in retry

---

### FibosContentsJob

**Location:** `App\Jobs\FibosContentsJob`  
**Traits:** ShouldQueue  
**Retry:** 1 attempt  
**Timeout:** 36000 seconds (10 hours)  
**Queue:** fibos_content (custom queue)

```php
public function __construct(
    $updateCruises=true,
    $updateShips=true,
    $updatePorts=true,
    $lang="en",
    $clCode=null
) {
    $this->fibosContentsService = app(FibosContentsService::class);
    $this->updateCruises = $updateCruises;
    $this->updateShips = $updateShips;
    $this->updatePorts = $updatePorts;
    $this->lang = $lang;
    $this->clCode = $clCode;
}

public function handle(): void
{
    $this->fibosContentsService->importData(
        $this->updateCruises,
        $this->updateShips,
        $this->updatePorts,
        $this->lang,
        $this->clCode
    );
}
```

**Features:**
- Selective import (cruises, ships, ports)
- Multi-language support (en, it)
- Custom queue for isolation

**Issues:**
- Service instantiation in constructor (serialization risk)
- No selective dependency injection
- Hard-coded language defaults

---

### FibosMapsJob

**Location:** `App\Jobs\FibosMapsJob`  
**Traits:** ShouldQueue  
**Timeout:** 3600 seconds (1 hour)

```php
public function __construct($cruiselineCode = null)
{
    $this->service = app(FibosMapsService::class);
    $this->cruiselineCode = $cruiselineCode;
}

public function handle(): void
{
    try {
        $this->service->run($this->cruiselineCode);
    } catch (ConfigurationException $e) {
        Log::error("Maps configuration error", ['code' => $this->cruiselineCode]);
    } catch (FibosApiException $e) {
        Log::error("Maps API error", ['code' => $this->cruiselineCode]);
    }
}
```

**Features:**
- Specific exception handling
- Optional cruiseline scoping
- Error logging

**Issues:**
- Service instantiation in constructor
- Silent exception handling (no rethrow)
- Generic error logging

---

### AroyaSyncJob

**Location:** `App\Jobs\AroyaSyncJob`  
**Traits:** ShouldQueue  
**Retry:** 3 attempts  
**Timeout:** 10800 seconds (3 hours)

```php
public function __construct(string $market = 'ALL')
{
    $this->loggingService = app(LoggingService::class);
    $this->market = $market;
}

public function handle(AroyaSyncService $syncService): void
{
    try {
        ini_set('max_execution_time', 0);
        $this->loggingService->logInfo('aroya_sync', "Starting AROYA sync for market: $this->market");
        // Sync logic (truncated)
    } catch (\Throwable $e) {
        $this->loggingService->logError('aroya_sync', $e->getMessage());
    }
}
```

**Features:**
- Market-scoped sync (ALL or specific)
- Custom logging service
- Execution time disabled

**Issues:**
- ini_set in job (should be config)
- Service in constructor (serialization issue)
- No retry logging

---

### ExploraSyncPrices

**Location:** `App\Jobs\ExploraSyncPrices`  
**Traits:** ShouldQueue  
**Retry:** 1 attempt  
**Timeout:** 30000 seconds  
**Queue:** explora_sync

```php
public function handle(ExploraSyncService $exploraService): void
{
    $jobId = $this->job->getJobId();
    $jobId = ($jobId !== '') ? $jobId : null;
    $exploraService->syncPrices($jobId);
}
```

**Features:**
- Job ID tracking
- Service injection

**Issues:**
- Minimal implementation
- No error handling
- Ternary condition could be null coalescing

---

### CostaSyncItineraries & CostaSyncElementsPrices

**Location:** `App\Jobs\CostaSyncItineraries` and `App\Jobs\CostaSyncElementsPrices`  
**Pattern:** Similar to FibosContentsJob  
**Timeout:** 10800 seconds  
**Retry:** 1-2 attempts

```php
public function handle(): void
{
    $this->costaService = app()->get(CostaService::class);
    $this->costaCruiseline = $this->costaService->getCostaCruiseline();
    $this->costaService->syncItineraries(); // or syncElementsPrices()
}
```

**Issues:**
- Service resolution in handle()
- Commented serialization note (unresolved issue)
- No error handling

---

## 👥 Lead Management Jobs

### CreateLeadFollowUpTasksJob

**Location:** `App\Jobs\CreateLeadFollowUpTasksJob`  
**Traits:** Dispatchable (no queue!)  
**Purpose:** Auto-create follow-up tasks for stale leads

```php
private const FIRST_FOLLOW_UP_THRESHOLD_HOURS = 24;
private const SECOND_FOLLOW_UP_THRESHOLD_HOURS = 72;
private const TASK_ACTIVITY_TYPE = 'follow_up';

public function uniqueId(): string
{
    return 'lead_follow_up_task_creation';
}

public function handle(): void
{
    $statusIds = LeadStatus::query()
        ->where('in_negotiation', true)
        ->pluck('id');

    if ($statusIds->isEmpty()) {
        Log::warning('No matching lead statuses...');
        return;
    }

    // Create 24h follow-up tasks for leads
    // Create 72h follow-up tasks for leads with older activity
}
```

**Features:**
- Unique job (prevents duplicates)
- Constants for thresholds
- Status-based filtering
- Two-tier follow-up (24h, 72h)

**Issues:**
- Not a queueable job (no ShouldQueue)
- Logic incomplete (truncated in preview)
- Hard-coded thresholds

---

### RemoveLeadAssignmentJob

**Location:** `App\Jobs\RemoveLeadAssignmentJob`  
**Traits:** Dispatchable (no queue!)  
**Purpose:** Unassign leads without quotes after 48 hours

```php
private const HOURS_THRESHOLD = 48;

public function uniqueId(): string
{
    return 'lead_assignment_removal';
}

public function handle(): void
{
    $threshold = now()->subHours(self::HOURS_THRESHOLD);

    $leads = Lead::query()
        ->whereNotNull('assignee_id')
        ->where('assigned_at', '<=', $threshold)
        ->whereDoesntHave('quotes')
        ->get();

    foreach ($leads as $lead) {
        $lead->update([
            'assignee_id' => null,
            'assigned_at' => null,
            'status' => LeadStatus::query()->where('name', 'NEW')->first()->id,
        ]);
    }
}
```

**Features:**
- Hard threshold (48 hours)
- Revert to NEW status
- Only for unquoted leads

**Issues:**
- Not queueable (no ShouldQueue)
- Queries status on every iteration
- No batch update (inefficient)

---

### UpdateWaitingLeads

**Location:** `App\Jobs\UpdateWaitingLeads`  
**Traits:** ShouldQueue  
**Queue:** slow

```php
public function handle(): void
{
    $status = LeadStatus::whereName('WAITING')->firstOrFail();
    $leads = Lead::whereStatus($status->id)->get();
    $newStatus = LeadStatus::whereName('NEW')->firstOrFail();
    
    foreach ($leads as $lead) {
        if ($lead->created_at->diffInMinutes(now()) >= config('leads.lead_waiting_time')) {
            // Demote from WAITING to NEW
            $lead->update(['status_id' => $newStatus->id]);
            LeadLog::create([...]);
        }
    }
}
```

**Features:**
- Configurable waiting time (config)
- Audit logging via LeadLog
- Status downgrade

**Issues:**
- N+1 status queries
- No batch update
- Assumes WAITING/NEW statuses exist

---

## 📍 Itinerary & Destination Jobs

### UpdateItineraryDestinations

**Location:** `App\Jobs\UpdateItineraryDestinations`  
**Traits:** ShouldQueue  
**Timeout:** 600 seconds  
**Queue:** slow

```php
public function handle(ItineraryService $itineraryService, PortService $portService): void
{
    $log = Log::channel('destinations_sync');

    $time_start = microtime(true);
    // Map itineraries to destinations via ports
    // Calculate matching percentages
    // Update itinerary with primary destination
}
```

**Features:**
- Service injection
- Custom logging channel
- Performance timing

---

### GenerateItineraryMediaJob

**Location:** `App\Jobs\GenerateItineraryMediaJob`  
**Traits:** ShouldQueue  
**Timeout:** 120 seconds

```php
public function __construct(
    int $cruiselineId,
    ?int $itineraryId = null,
    ?string $queueName = null
) {
    $this->cruiselineId = $cruiselineId;
    $this->itineraryId = $itineraryId;
    $this->queueName = $queueName;

    if ($queueName) {
        $this->onQueue($queueName);
    }
}

public function handle(): void
{
    $query = Itinerary::where('cruiseline_id', $this->cruiselineId)
        ->whereNotNull('url_image_map')
        ->where('url_image_map', '!=', '');

    if ($this->itineraryId) {
        $query->where('id', $this->itineraryId);
    }

    // Process media generation
}
```

**Features:**
- Selective itinerary processing
- Dynamic queue assignment
- Image URL filtering

---

### ProcessItineraryMapImageJob

**Location:** `App\Jobs\ProcessItineraryMapImageJob`  
**Traits:** ShouldQueue  
**Timeout:** 120 seconds  
**Retry:** 3 attempts

```php
public function __construct(Itinerary $itinerary)
{
    $this->itinerary = $itinerary;
}

public function handle(): void
{
    $imageUrl = $this->itinerary->url_image_map;

    if (!$imageUrl) {
        Log::warning("Itinerario {$this->itinerary->id} non ha URL mappa.");
        return;
    }

    try {
        $this->itinerary
            ->addMediaFromUrl($imageUrl)
            ->toMediaCollection('map');
    } catch (\Exception $e) {
        Log::error("Error processing map", ['itinerary' => $this->itinerary->id]);
        throw $e;
    }
}
```

**Features:**
- Model binding
- Media library integration
- Spatie MediaLibrary usage

**Issues:**
- Hard-coded media collection name
- Generic exception handling

---

### PortMapping

**Location:** `App\Jobs\PortMapping`  
**Traits:** ShouldQueue  
**Queue:** slow  
**Timeout:** 30000 seconds

```php
public function handle($cruiselineCode, $file): void
{
    $fibosCruiseline = FibosCruiseline::whereCode($cruiselineCode)->first();
    $data = Excel::toArray([], $file);
    $data = $data[0];
    
    foreach ($data as $key => $item) {
        if ($key != 0) {
            $fibosPort = FibosPort::whereFibosCruiselineId(...)
                ->where('code', $item['fibos_code'])
                ->first();
            
            if ($fibosPort && $item['port_id']) {
                $fibosPort->update(['port_id' => $item['port_id']]);
            }
        }
    }
}
```

**Features:**
- Excel import support
- Fibos port mapping
- Bulk updates

**Issues:**
- No header row detection
- Missing error handling
- No transaction safety

---

## 📊 Availability & Export Jobs

### CheckAvailabilityJob

**Location:** `App\Jobs\CheckAvailabilityJob`  
**Traits:** ShouldQueue  
**Queue:** slow

```php
public function __construct($cruiseId, $cruiseLineId)
{
    $this->cruiseId = $cruiseId;
    $this->cruiseLineId = $cruiseLineId;
}

public function handle(AvailabilityService $availabilityService)
{
    $lockKey = "check_availability_{$this->cruiseId}_{$this->cruiseLineId}";
    $lock = Cache::lock($lockKey, 600); // 10 minutes

    if ($lock->get()) {
        try {
            $availabilityService->checkAvailability($this->cruiseId, $this->cruiseLineId);
        } finally {
            $lock->release();
        }
    }
}
```

**Features:**
- Distributed lock (prevents concurrent checks)
- Cache-based locking
- 10-minute timeout

**Good Practices:**
- Uses finally to release lock
- Prevents race conditions

---

### ExportMegaCruiselinesJson

**Location:** `App\Jobs\ExportMegaCruiselinesJson`  
**Traits:** ShouldQueue  
**Purpose:** Export all cruise data to JSON/ZIP

```php
public function __construct(int $userId, int|array|null $cruiselineIds = null)
{
    $this->userId = $userId;
    $this->cruiselineIds = $cruiselineIds;
}

public function handle(): void
{
    ini_set('memory_limit', '-1');

    // Generate JSON files for cruiselines, ships, itineraries, elements
    // Optionally create ZIP archive
    // Send notification with download link

    $user = User::find($this->userId);
    $user->notify(new MegaJsonReadyNotification($filePath));
}
```

**Features:**
- Unlimited memory for large exports
- Optional cruiseline filtering
- User notification
- Single cruiseline ZIP naming

**Issues:**
- ini_set usage (should be config)
- No progress tracking
- Large file generation in single process

---

### EnableAllItineraries

**Location:** `App\Jobs\EnableAllItineraries`  
**Traits:** ShouldQueue  
**Queue:** slow

```php
public function handle(): void
{
    $itineraries = Itinerary::all();
    foreach ($itineraries as $itinerary) {
        $itinerary->enabled = true;
        $itinerary->save();
    }
}
```

**Issues:**
- Typo in property: `public $queu = 'slow'` (missing 'e')
- N+1 update pattern (should batch update)
- No error handling
- Loading all itineraries into memory

---

## 📧 Email & Communication

### ProcessInboundEmailsJob

**Location:** `App\Jobs\ProcessInboundEmailsJob`  
**Traits:** Queueable  
**Purpose:** Fetch & process support emails via IMAP

```php
public function handle(
    InboundMailFetcher $fetcher,
    InboundMailProcessor $processor
): void
{
    if (!config('support.imap.enabled')) {
        return;
    }

    try {
        $messages = $fetcher->fetchUnseen();
    } catch (\Throwable $exception) {
        Log::error('Inbound email fetch failed.', [
            'host' => config('support.imap.host'),
            'port' => config('support.imap.port'),
            'mailbox' => config('support.imap.mailbox'),
            'error' => $exception->getMessage(),
        ]);
        return;
    }

    foreach ($messages as $message) {
        try {
            $processor->process($message);
        } catch (\Throwable $e) {
            Log::error('Email processing failed', ['error' => $e->getMessage()]);
        }
    }
}
```

**Features:**
- Configurable IMAP support
- Individual email error handling
- Detailed error context

**Issues:**
- Silent email failure (continues on error)
- No retry logic for individual emails

---

## 🛠️ Utility Jobs

### UpdatePricesJob

**Location:** `App\Jobs\UpdatePricesJob`  
**Traits:** ShouldQueue  
**Queue:** slow  
**Timeout:** 30000 seconds

```php
public function handle(): void
{
    //TODO: implement real logic
    $destinations = $this->destinationService->findAll();
    foreach ($destinations as $destination) {
        $destination->update(['laf_price' => rand(100, 1000)]);
    }
}
```

**Issues:**
- Stub implementation with TODO
- Random pricing (not real logic)
- No-op job wasting resources

---

## 🚢 MSC-Specific Jobs (2 jobs)

### MSCSyncJob

**Location:** `App\Jobs\Msc\MSCSyncJob`  
**Traits:** ShouldQueue  
**Retry:** 1 attempt  
**Timeout:** 10800 seconds (3 hours)

```php
public function __construct($market = "ita")
{
    $this->loggingService = app(LoggingService::class);
    $this->market = $market;
}

public function handle(): void
{
    ini_set('max_execution_time', 0);
    $this->loggingService->logInfo('msc_sync', "Starting MSC sync for market: $this->market");
    
    $this->syncService = new MscSyncService();
    $jobId = $this->job?->getJobId();
    $jobId = ($jobId !== '') ? $jobId : null;
    
    $this->syncService->sync($this->market, $jobId);
    
    $this->loggingService->logInfo('msc_sync', "Completed MSC sync for market: $this->market");
}
```

**Features:**
- Market-scoped sync (ita, eng, etc.)
- Custom logging service
- Job ID tracking for audit
- Execution time unlimited

**Issues:**

1. **Service Instantiation:** Creates new MscSyncService in handle()
   - Better: Inject via dependency injection

2. **ini_set Usage:** Direct execution time manipulation
   - Better: Use job timeout property

3. **Service in Constructor:** LoggingService instantiated in constructor
   - Serialization risk

4. **Ternary Check:** `($jobId !== '') ? $jobId : null`
   - Could use null coalescing: `$jobId ?: null`

5. **No Error Handling:** Exception propagates
   - Better: Try/catch with logging

---

### ImportItineraryMapsJob

**Location:** `App\Jobs\Msc\ImportItineraryMapsJob`  
**Traits:** ShouldQueue  
**Retry:** 3 attempts with backoff [60, 300]  
**Timeout:** 300 seconds (5 minutes)  
**Queue:** msc_sync

```php
public function __construct(string $path, bool $dryRun = false)
{
    $this->path = $path;
    $this->dryRun = $dryRun;
    $this->onQueue('msc_sync');
}

public function handle(): void
{
    // 1. Validate file exists
    if (!is_file($this->path)) {
        Log::warning("[ImportItineraryMapsJob] File non trovato: {$this->path}");
        return;
    }

    // 2. Parse XML with streaming reader
    $reader = new \XMLReader();
    if (!$reader->open($this->path, null, LIBXML_NONET | LIBXML_COMPACT)) {
        Log::error("[ImportItineraryMapsJob] Impossibile aprire XML: {$this->path}");
        return;
    }

    $ns = 'http://tempuri.org/';
    $found = 0;
    $pairs = [];  // itineraryCode => url mapping

    // 3. Stream-read XML <List> elements
    try {
        while ($reader->read()) {
            if ($reader->nodeType === \XMLReader::ELEMENT
                && $reader->localName === 'List'
                && ($reader->namespaceURI === $ns || $reader->namespaceURI === '')
            ) {
                $outer = $reader->readOuterXML();
                if (!$outer) continue;
                
                $listNode = new \SimpleXMLElement($outer);
                $listNode->registerXPathNamespace('t', $ns);

                $itineraryCode = (string) ($listNode['ItineraryCode'] ?? '');
                $mapBigSize = (string) ($listNode['MapBigSize'] ?? '');

                if ($itineraryCode !== '' && $mapBigSize !== '') {
                    $pairs[$itineraryCode] = $mapBigSize;
                    $found++;
                }

                $reader->next();
            }
        }
    } finally {
        $reader->close();
    }

    // 4. Dry-run mode
    if ($this->dryRun) {
        Log::info("[ImportItineraryMapsJob] DRY RUN: trovati {$found} itinerari con MapBigSize.");
        return;
    }

    if ($found === 0) {
        Log::warning("[ImportItineraryMapsJob] Nessun <List> valido trovato nel file.");
        return;
    }

    // 5. Update database in chunks
    $codes = array_keys($pairs);
    $now = now();

    foreach (array_chunk($codes, 500) as $chunk) {
        // Only update existing records
        $existing = DB::table('itineraries')
            ->whereIn('itineraryCode', $chunk)
            ->pluck('itineraryCode')
            ->all();

        if (empty($existing)) continue;

        foreach ($existing as $code) {
            DB::table('itineraries')
                ->where('itineraryCode', $code)
                ->update([
                    'url_image_map' => $pairs[$code],
                    'updated_at' => $now,
                ]);
        }
    }

    Log::info("[ImportItineraryMapsJob] Aggiornati fino a {$found} itinerari (solo esistenti).");

    // 6. Dispatch media generation job
    if ($found > 0) {
        $cruiseLineId = 47;  // MSC hard-coded ID
        GenerateItineraryMediaJob::dispatch($cruiseLineId, null, 'media_conversion')
            ->onQueue('media_conversion');
        
        Log::info("[ImportItineraryMapsJob] Dispatchato GenerateItineraryMediaJob per CruiseLine {$cruiseLineId}");
    }
}
```

**Features:**

1. **XML Streaming:** Uses XMLReader (memory-efficient)
   - Doesn't load entire file into memory
   - Processes <List> elements one at a time
   - Good practice for large XML files

2. **Dry-Run Mode:** Optional test execution
   - Logs findings without persisting
   - Useful for validation

3. **Chunk Updates:** Batch database operations
   - 500 records per chunk
   - Prevents memory exhaustion

4. **Job Chaining:** Dispatches media generation after update
   - Generates maps in separate job
   - Decoupled processing

5. **Namespace Handling:** Supports XML namespaces
   - Validates namespace URI
   - Fallback for empty namespace

6. **Retry with Backoff:** 3 attempts with backoff [60, 300] seconds
   - Waits 1 min, then 5 min before retry
   - Handles transient failures

**Issues:**

1. **Hard-coded Cruiseline ID:** `$cruiseLineId = 47`
   - Should be configurable or derived from file
   - Brittle if ID changes

2. **Hard-coded Namespace:** `http://tempuri.org/`
   - Could be parameterized

3. **Commented Code:** Line 135 has commented log statement
   - Cleanup needed

4. **Duplicate Update Logic:** Lines 115-130
   - Builds array then iterates separately
   - Could combine into single loop

5. **No Validation:** Doesn't check if URL is valid
   - Could add URL format validation

---

## ⚠️ Common Issues Across All Jobs

### Shared Problems

1. **Service Instantiation in Constructor:** Multiple jobs instantiate services
   - Causes serialization issues
   - Better: Inject in handle()

2. **No Batch Updates:** Jobs use N+1 pattern
   - Load all, update in loop
   - Better: Use batch/chunk updates

3. **Hard-coded Values:** Thresholds, language codes, status names
   - Not configurable
   - Better: Use config or constants

4. **Silent Failures:** Exceptions caught but not propagated
   - User unaware of failure
   - Better: Rethrow or handle properly

5. **No Logging:** Minimal logging context
   - Difficult to debug
   - Better: Detailed logging with context

6. **Not Queueable:** Some jobs don't implement ShouldQueue
   - Won't be async
   - Better: Use ShouldQueue consistently

7. **ini_set Usage:** Direct execution time manipulation
   - Should be environment config
   - Better: Use config or job timeout

8. **Hard-coded Strings:** Status names, queue names, formats
   - Not DRY
   - Better: Constants or config

### Architecture Issues

1. **Large Jobs:** Some jobs do too much (export, sync, processing)
2. **No Transactions:** Multi-step jobs not atomic
3. **No Progress Tracking:** Can't see job progress
4. **Testing Difficulty:** Complex dependencies hard to test
5. **No Retry Logic:** Some jobs fail once and give up

---

## 📝 Migration Notes for Base44

### Current Pattern

```php
// Laravel Queue
Job::dispatch($params);
// Queue processes job asynchronously
// Service performs work
```

### Base44 Refactor: Scheduled Automations

**Strategy:** Replace queue jobs with automations (scheduled or entity-based).

#### Backend Functions

```typescript
// Function: syncFibosData
async function syncFibosData(req) {
  const base44 = createClientFromRequest(req);
  const { cruiselineCode, market } = req.body;

  try {
    // Fetch from Fibos API
    const data = await fibosClient.getItineraries(cruiselineCode);
    
    // Persist to entities
    const result = await base44.entities.Cruise.bulkCreate(data);
    
    return {
      success: true,
      synced: result.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Function: createLeadFollowUpTasks
async function createLeadFollowUpTasks(req) {
  const base44 = createClientFromRequest(req);

  // Get leads in negotiation without recent follow-up
  const leads = await base44.entities.Lead.filter({
    status: 'in_negotiation',
    last_activity: { $lt: 24h_ago }
  });

  // Create tasks for each
  const tasks = await Promise.all(
    leads.map(lead =>
      base44.entities.Task.create({
        lead_id: lead.id,
        type: 'follow_up',
        due_date: new Date(),
        assignee_id: lead.assignee_id
      })
    )
  );

  return { created: tasks.length };
}

// Function: processInboundEmails
async function processInboundEmails(req) {
  // Fetch from IMAP
  const messages = await imapClient.fetchUnseen();
  
  // Process each
  for (const message of messages) {
    try {
      // Create ticket entity
      const ticket = await base44.entities.Ticket.create({
        subject: message.subject,
        description: message.body,
        email: message.from
      });
      
      await imapClient.markAsRead(message.id);
    } catch (error) {
      console.error('Email processing failed', error);
      // Continue with next
    }
  }
  
  return { processed: messages.length };
}
```

#### Automations Configuration

```typescript
// Scheduled: Daily Fibos sync at 2am
create_automation({
  automation_type: "scheduled",
  name: "Daily Fibos Sync",
  function_name: "syncFibosData",
  schedule_type: "cron",
  cron_expression: "0 2 * * *",  // 2am UTC
  function_args: {
    cruiselineCode: "ALL",
    market: "ita"
  }
});

// Scheduled: Hourly lead follow-up task creation
create_automation({
  automation_type: "scheduled",
  name: "Create Lead Follow-up Tasks",
  function_name: "createLeadFollowUpTasks",
  repeat_interval: 1,
  repeat_unit: "hours"
});

// Scheduled: Every 5 minutes inbound email processing
create_automation({
  automation_type: "scheduled",
  name: "Process Inbound Emails",
  function_name: "processInboundEmails",
  repeat_interval: 5,
  repeat_unit: "minutes"
});

// Entity: Create follow-up task when quote updated
create_automation({
  automation_type: "entity",
  name: "Lead Activity on Quote Update",
  function_name: "logLeadActivity",
  entity_name: "Quote",
  event_types: ["update"]
});
```

#### Benefits

1. **Visibility:** All automations listed in UI
2. **No Queue Management:** Base44 handles scheduling
3. **Error Tracking:** Execution logs per automation
4. **Type Safety:** TypeScript functions
5. **Testable:** Functions independently testable
6. **Flexible:** Enable/disable via UI
7. **Configuration:** Change via UI, no code

### Job Elimination

| Job | Type | Refactor To |
|-----|------|------------|
| SyncFibosJob | Queue | Scheduled automation + function |
| CreateLeadFollowUpTasksJob | Queue | Scheduled automation + function |
| ProcessInboundEmailsJob | Queue | Scheduled automation + function |
| CheckAvailabilityJob | Queue | Entity automation (on cruise change) |
| ExportMegaCruiselinesJson | Queue | Backend function (trigger on demand) |

### Code Size Reduction

All 20 jobs eliminated:
- Current: ~50KB total
- Functions: ~10KB total (backend functions replace job logic)

### Benefits

- **No Queue Infrastructure:** No separate queue workers needed
- **Central Logging:** All automation logs in dashboard
- **Better Error Handling:** Proper exception handling per execution
- **Easier Testing:** Functions testable without queue setup
- **Simpler Deployment:** No queue worker process management