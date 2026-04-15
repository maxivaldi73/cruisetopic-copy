# Event Listeners

**Purpose:** Event-driven business logic for email notifications, activity logging, state synchronization, and error handling.  
**Framework:** Laravel Events with ShouldQueue support for async processing.  
**Total Listeners:** 8 (1 stub, 7 implemented)

---

## 📋 Listener Index

| Listener | Event | Purpose |
|----------|-------|---------|
| LeadEventsListener | Generic | Stub (unused) |
| SendLeadEmailVerificationMailListener | LeadCreated | Email verification on lead creation |
| SendNewReviewEmail | ReviewSaved | Notify admins of new review |
| SendTicketAssignedEmail | TicketAssigned | Notify agent when ticket assigned |
| LogTaskActivityListener | TaskSaved | Log task changes to audit trail |
| UpdateLeadOnUpdateQuote | QuoteUpdated | Auto-promote lead quality on quote progress |
| SyncJobFailedListener | JobFailed | Notify on sync job failure |
| UserRoleChangedListener | UserRoleChangedEvent | Sync seller record with user role (mostly commented) |

---

## 📌 LeadEventsListener

**Location:** `App\Listeners\LeadEventsListener`  
**Event:** Generic (unused)  
**Status:** Stub/Empty

### Issues
- Completely empty implementation
- No functionality
- Should be removed or implemented

---

## 📧 SendLeadEmailVerificationMailListener

**Location:** `App\Listeners\SendLeadEmailVerificationMailListener`  
**Event:** `LeadCreated`  
**Purpose:** Send email verification on new lead creation  
**Queue:** Yes (uses Mail::queue)

### Handler Logic

```php
public function handle(LeadCreated $event): void
{
    $lead = $event->lead;

    // Check if same email already verified
    $existingVerifiedLead = Lead::where('email', $lead->email)
        ->whereNotNull('email_verified_at')
        ->first();

    // Auto-verify if email previously verified
    if ($existingVerifiedLead) {
        $lead->update([
            'email_verified_at' => now(),
        ]);
        return;
    }

    // Send verification email (queued)
    try {
        Mail::to($lead->email)->queue(new LeadEmailVerificationMail($lead));
    } catch (\Exception $e) {
        Log::error('Errore invio email verifica lead: ' . $e->getMessage(), [
            'lead_id' => $lead->id,
            'email' => $lead->email
        ]);
    }
}
```

### Features
- Check for existing verified email (duplication prevention)
- Auto-verify if email already confirmed
- Queue email for async delivery
- Log errors with context

### Issues

1. **Query on Every Lead:** Queries all leads with email
   - Inefficient for large datasets
   - Should use `firstOrCreate` pattern

2. **Silent Error Handling:** Catches exception but doesn't rethrow
   - User unaware email failed to send
   - No user notification

3. **Hard-coded Language:** Italian error message
   - Should use translation keys

4. **No Validation:** Assumes email valid
   - No check for email format before query

---

## 👤 SendNewReviewEmail

**Location:** `App\Listeners\SendNewReviewEmail`  
**Event:** `ReviewSaved`  
**Purpose:** Notify admins of new review  
**Channels:** Notification (mail + database)

### Handler Logic

```php
public function handle(ReviewSaved $event): void
{
    // Find all admin users
    $users = User::query()->whereHas('role', function($q){
        $q->where('name', 'admin');
    })->get();

    // Send notification to all admins
    $notification = new ReviewNotification($event->review, $event->isNew);
    Notification::send($users, $notification);
}
```

### Features
- Finds all admin users
- Sends notification to admin group
- Supports multi-channel (mail, database)

### Issues

1. **Inefficient Query:** `whereHas` + relationship query
   ```php
   // Better: Use role relationship directly
   User::role('admin')->get()
   ```

2. **No Empty Check:** Doesn't verify admins exist
   - Silently fails if no admins

3. **No Error Handling:** No try/catch
   - Notification failures unhandled

4. **Hard-coded Role Name:** 'admin' string
   - Should use constant

5. **isNew Flag:** Unclear if used
   - May be unused parameter

---

## 🎫 SendTicketAssignedEmail

**Location:** `App\Listeners\SendTicketAssignedEmail`  
**Event:** `TicketAssigned`  
**Purpose:** Notify agent when ticket assigned/reassigned  
**Channels:** Notification (mail + database)

### Handler Logic

```php
public function handle(TicketAssigned $event): void
{
    $sellerUser = $event->ticket
        ->loadMissing('seller.user')
        ->seller?->user;

    if (!$sellerUser) {
        return;
    }

    $sellerUser->notify(new TicketAssignedNotification(
        $event->ticket,
        $event->isReassignment
    ));
}
```

### Features
- Load ticket with seller and user relations
- Safe null handling (optional chaining)
- Pass reassignment flag to notification
- Only sends if user found

### Good Practices
- Uses null-safe operator (`?->`)
- Guards against missing relationships
- Eager loads relations (loadMissing)

### Issues

1. **Eager Load in Handler:** Loads relations on every call
   - Better: Load in event dispatch or query optimization

2. **No Error Handling:** Notification failures silently fail

---

## 📝 LogTaskActivityListener

**Location:** `App\Listeners\LogTaskActivityListener`  
**Event:** `TaskSaved`  
**Purpose:** Log task changes to activity log using Spatie ActivityLog  
**Features:** Activity tracking, change detection, date formatting

### Handler Logic

```php
public function handle(TaskSaved $event)
{
    $task = $event->task;
    $subject = $task->subject;

    // Check if subject supports activity logging
    if (!method_exists($subject, 'getActivitylogOptions')) {
        return;
    }

    // Prepare old data with date formatting
    $oldData = $event->action === 'created' ? [] : collect($event->originalData)
        ->map(function($value, $key) {
            if($key === 'due_date' && $value) {
                return Carbon::parse($value)->format('Y-m-d');
            }
            return $value;
        })
        ->toArray();

    // Log to activity log
    activity()
        ->causedBy(auth()->user())
        ->performedOn($subject)
        ->withProperties([
            'old' => $oldData,
            'attributes' => $task->getAttributes(),
        ])
        ->log($event->action === 'created' ? 'created' : 'updated');
}
```

### Features
- Spatie ActivityLog integration
- Change detection (old vs new data)
- Date formatting consistency
- User attribution (causedBy)
- Polymorphic subject support

### Issues

1. **Hard-coded Date Format:** 'Y-m-d' format fixed
   - Should be configurable

2. **Only Due Date Handling:** Only formats due_date
   - Other date fields not handled

3. **Method Check:** Checks for Spatie support at runtime
   - Should validate before event dispatch

4. **No Error Handling:** Silent fail if logging fails

5. **Auth Check:** Uses auth()->user() directly
   - Assumes user authenticated (may be CLI)

---

## 📈 UpdateLeadOnUpdateQuote

**Location:** `App\Listeners\UpdateLeadOnUpdateQuote`  
**Event:** `QuoteUpdated`  
**Purpose:** Auto-promote lead quality tier based on quote progress  
**Logic:** BRONZE → SILVER → GOLD progression

### Handler Logic

```php
public function handle(QuoteUpdated $event)
{
    $quote = $event->quote;
    $lead = $quote->lead;

    if (!$lead || !$lead->quality) {
        return;
    }

    $oldName = strtoupper($lead->quality->name);
    $mapping = [
        'BRONZE' => 'SILVER',
        'SILVER' => 'GOLD',
    ];

    if (!isset($mapping[$oldName])) {
        return;
    }

    // BRONZE → SILVER: Requires cabin selection
    if ($oldName === 'BRONZE' && is_null($quote->cabin_number)) {
        return;
    }

    // SILVER → GOLD: Requires payment method selection
    if ($newName === 'GOLD' && empty($quote->payment_method_id)) {
        return;
    }

    $newQuality = LeadQuality::where('name', $newName)->first();

    // Update lead quality
    if ($newQuality) {
        $lead->update(['quality_id' => $newQuality->id]);
    }
}
```

### Features
- Lead quality auto-promotion on quote progress
- Conditional progression (requires specific fields)
- BRONZE → SILVER → GOLD pipeline
- Guards against missing relationships

### Quality Tier Progression

| From | To | Condition |
|------|----|-|
| BRONZE | SILVER | Cabin selected (cabin_number filled) |
| SILVER | GOLD | Payment method selected (payment_method_id filled) |

### Issues

1. **Field Validation:** Only checks if field filled
   - Doesn't validate field values
   - Cabin number could be invalid

2. **No Reverse Logic:** Only promotes, never demotes
   - If cabin removed, lead not reverted to BRONZE

3. **Hard-coded Mapping:** Progression rules fixed in code
   - Should be configuration or database

4. **Case Sensitivity:** Uses strtoupper() conversion
   - Assumes database names are lowercase

5. **Single Promotion:** Only one level per event
   - Can't jump BRONZE → GOLD directly

6. **No Logging:** Silent updates without audit trail

---

## 🚨 SyncJobFailedListener

**Location:** `App\Listeners\SyncJobFailedListener`  
**Event:** `Queue\Events\JobFailed`  
**Purpose:** Log sync job failures and send notifications  
**Features:** Configurable exclusions, NotificationService integration

### Handler Logic

```php
public function handle(JobFailed $event): void
{
    // Check if notifications enabled
    if (!config('notifications.job_failures.enabled')) {
        return;
    }

    $jobId = $event->job->getJobId();
    $jobName = $event->job->resolveName();

    // Skip excluded jobs
    $excludedJobs = config('notifications.job_failures.excluded_jobs', []);
    if (in_array($jobName, $excludedJobs)) {
        return;
    }

    // Log failure
    Log::error("Failed sync job for : $jobName with ID: $jobId");

    // Notify (code truncated in preview)
    // $this->notificationService->notifyJobFailure(...)
}
```

### Features
- Configurable via config file
- Exclude specific job types
- Logs job ID and name
- Uses NotificationService for multi-channel

### Configuration

```php
// config/notifications.php
'job_failures' => [
    'enabled' => true,
    'excluded_jobs' => [
        'Illuminate\Mail\SendQueuedMailable',
        'SomeOtherJob',
    ]
]
```

### Issues

1. **Incomplete Implementation:** Preview truncated
   - Doesn't show notification logic

2. **Hard-coded Log Level:** Always 'error'
   - Should vary by job type

3. **No Retry Context:** Doesn't check attempt count
   - First failure same as 10th attempt

4. **Config Keys:** Hard-coded keys in code
   - Should use constants

---

## 👥 UserRoleChangedListener

**Location:** `App\Listeners\UserRoleChangedListener`  
**Event:** `UserRoleChangedEvent`  
**Purpose:** Sync seller record when user role changes (mostly disabled)  
**Status:** 90% commented out

### Original Logic (Commented)

```php
public function handle(UserRoleChangedEvent $event): void
{
    // All code commented:
    // - Check if user assigned 'Salesperson' role
    // - Find or create seller record
    // - Auto-attach Bronze quality to new sellers
    // - Log existing sellers
}
```

### Issues

1. **Completely Disabled:** All implementation commented
   - No explanation why
   - Code serves no purpose in this state

2. **Auto-creation Pattern:** Would create seller on role change
   - Violates separation of concerns
   - Side effects in event listener

3. **Hard-coded Role Name:** 'Salesperson' string
   - Not configurable

4. **Auto-attach Quality:** Assumes Bronze exists
   - Could fail if ID invalid

---

## 🏗️ Event-Listener Architecture

### Event Flow

```
Event Dispatcher
    ├─ LeadCreated
    │   └─ SendLeadEmailVerificationMailListener
    │       └─ Mail::queue() → LeadEmailVerificationMail
    │
    ├─ ReviewSaved
    │   └─ SendNewReviewEmail
    │       └─ Notification::send() → Admin users
    │
    ├─ TicketAssigned
    │   └─ SendTicketAssignedEmail
    │       └─ $user->notify() → TicketAssignedNotification
    │
    ├─ TaskSaved
    │   └─ LogTaskActivityListener
    │       └─ activity() → Spatie ActivityLog
    │
    ├─ QuoteUpdated
    │   └─ UpdateLeadOnUpdateQuote
    │       └─ Lead::update() → Quality tier change
    │
    ├─ Queue\Events\JobFailed
    │   └─ SyncJobFailedListener
    │       └─ Log::error() + NotificationService
    │
    └─ UserRoleChangedEvent
        └─ UserRoleChangedListener (disabled)
```

### Registration

Assumed in `EventServiceProvider`:

```php
protected $listen = [
    LeadCreated::class => [SendLeadEmailVerificationMailListener::class],
    ReviewSaved::class => [SendNewReviewEmail::class],
    TicketAssigned::class => [SendTicketAssignedEmail::class],
    TaskSaved::class => [LogTaskActivityListener::class],
    QuoteUpdated::class => [UpdateLeadOnUpdateQuote::class],
    'Illuminate\Queue\Events\JobFailed' => [SyncJobFailedListener::class],
    UserRoleChangedEvent::class => [UserRoleChangedListener::class],
];
```

---

## ⚠️ Common Issues

### Shared Problems

1. **No Error Handling:** Most listeners lack try/catch
2. **Hard-coded Values:** Strings, roles, formats embedded
3. **Silent Failures:** Exceptions caught but not propagated
4. **No Logging Context:** Minimal context in log entries
5. **Eager Loading:** Relations loaded in handlers
6. **Commented Code:** UserRoleChangedListener disabled
7. **Italian Messages:** Hard-coded Italian text

### Architecture Issues

1. **Event Soup:** Multiple loose listeners
2. **Side Effects:** State changes in listeners
3. **Database Queries:** Direct DB access in handlers
4. **No Transactions:** Multi-step listeners not atomic
5. **Testing Complexity:** Hard to test event chains
6. **Configuration:** Hard-coded values vs config

---

## 📝 Migration Notes for Base44

### Current Pattern

```php
// Laravel Event → Listener → Side Effect
Event::dispatch(new LeadCreated($lead));
// Handler:
// - Check existing
// - Send email
// - Log errors
```

### Base44 Refactor: Automations + Backend Functions

**Strategy:** Replace event listeners with automations + backend functions.

#### Backend Functions

```typescript
// Function: sendLeadVerificationEmail
async function sendLeadVerificationEmail(req) {
  const base44 = createClientFromRequest(req);
  const { leadId } = req.body;

  // Fetch lead
  const lead = await base44.entities.Lead.get(leadId);

  // Check existing verified email
  const verified = await base44.entities.Lead.filter({
    email: lead.email,
    email_verified_at: { $exists: true }
  });

  if (verified.length > 0) {
    // Auto-verify
    await base44.entities.Lead.update(leadId, {
      email_verified_at: new Date().toISOString()
    });
    return { success: true, autoVerified: true };
  }

  // Send verification email
  await base44.integrations.Core.SendEmail({
    to: lead.email,
    subject: 'Verify your email',
    body: renderVerificationEmail(lead)
  });

  return { success: true, emailSent: true };
}

// Function: promoteLeadQuality
async function promoteLeadQuality(req) {
  const base44 = createClientFromRequest(req);
  const { quoteId } = req.body;

  const quote = await base44.entities.Quote.get(quoteId);
  const lead = await base44.entities.Lead.get(quote.lead_id);

  const currentQuality = lead.quality_id;
  const mapping = {
    'bronze': 'silver',
    'silver': 'gold'
  };

  const newQuality = mapping[currentQuality];
  if (!newQuality) return { promoted: false };

  // Validate conditions
  if (currentQuality === 'bronze' && !quote.cabin_number) {
    return { promoted: false, reason: 'Cabin not selected' };
  }

  if (newQuality === 'gold' && !quote.payment_method_id) {
    return { promoted: false, reason: 'Payment method not selected' };
  }

  // Promote quality
  await base44.entities.Lead.update(quote.lead_id, {
    quality_id: newQuality
  });

  return { promoted: true, newQuality };
}

// Function: logTaskActivity
async function logTaskActivity(req) {
  const base44 = createClientFromRequest(req);
  const { taskId, action, oldData } = req.body;

  // Create activity log entry
  await base44.entities.ActivityLog.create({
    subject_id: taskId,
    subject_type: 'Task',
    description: action,
    properties: { old: oldData },
    causer_id: req.user?.id
  });

  return { logged: true };
}
```

#### Automations Configuration

```typescript
// Automation 1: Lead Created → Send Verification Email
create_automation({
  automation_type: "entity",
  name: "Send Lead Verification Email",
  function_name: "sendLeadVerificationEmail",
  entity_name: "Lead",
  event_types: ["create"],
  function_args: { leadId: "$entity.id" }
});

// Automation 2: Quote Updated → Promote Lead Quality
create_automation({
  automation_type: "entity",
  name: "Promote Lead Quality on Quote Update",
  function_name: "promoteLeadQuality",
  entity_name: "Quote",
  event_types: ["update"],
  trigger_conditions: {
    logic: "or",
    conditions: [
      { field: "changed_fields", operator: "contains", value: "cabin_number" },
      { field: "changed_fields", operator: "contains", value: "payment_method_id" }
    ]
  },
  function_args: { quoteId: "$entity.id" }
});

// Automation 3: Task Saved → Log Activity
create_automation({
  automation_type: "entity",
  name: "Log Task Activity",
  function_name: "logTaskActivity",
  entity_name: "Task",
  event_types: ["create", "update"],
  function_args: {
    taskId: "$entity.id",
    action: "$event.type"
  }
});
```

#### Benefits

1. **Visibility:** Automations listed in UI
2. **Control:** Enable/disable without code
3. **Observability:** Logs execution per automation
4. **Type Safety:** TypeScript functions
5. **Testing:** Functions independently testable
6. **Reusability:** Functions used from multiple triggers
7. **Error Handling:** Proper exception handling
8. **Configuration:** Via UI, no code changes

### Error Handling Comparison

```typescript
// Before: Silent failures
try {
  Mail::to($lead->email)->queue(...);
} catch (\Exception $e) {
  Log::error('Error: ' . $e->getMessage());
  // User unaware
}

// After: Explicit error responses
async function sendLeadVerificationEmail(req) {
  try {
    await base44.integrations.Core.SendEmail({...});
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
// Caller can handle failure
```

### Configuration Management

```typescript
// Before: Hard-coded in code
const mapping = ['BRONZE' => 'SILVER', 'SILVER' => 'GOLD'];

// After: Configuration-driven
const qualityProgression = await base44.auth.getSecret('LEAD_QUALITY_PROGRESSION');
// Or store in config entity
const config = await base44.entities.SystemConfig.get('lead_quality_progression');
```

### Code Size Reduction

| Listener | Current | Target | Reason |
|----------|---------|--------|--------|
| SendLeadEmailVerification | 28 lines | Function only | Use automation |
| SendNewReviewEmail | 13 lines | Function only | Use automation |
| SendTicketAssignedEmail | 14 lines | Function only | Use automation |
| LogTaskActivityListener | 40+ lines | Function only | Use automation |
| UpdateLeadOnUpdateQuote | 34 lines | Function only | Use automation |
| SyncJobFailedListener | 26+ lines | Function only | Use automation |

### Benefits

- **No Event Listeners:** Remove entire listener pattern
- **Central Registry:** All automations visible
- **Better Debugging:** Execution logs per automation
- **Type Safety:** TypeScript throughout
- **Easier Testing:** Functions testable independently
- **Flexible Configuration:** Change triggers via UI