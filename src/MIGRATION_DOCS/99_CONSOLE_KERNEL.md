# Console Kernel

**File:** `Console/Kernel.php`  
**Namespace:** `App\Console`  
**Type:** Scheduled task orchestration — **HIGH priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Extends** | `Illuminate\Foundation\Console\Kernel` |
| **Active schedules** | 4 |
| **Commented-out schedules** | 2 |
| **Commands auto-loaded from** | `App\Console\Commands` directory |
| **Console routes** | `routes/console.php` |

---

## 🔧 Implementation

### Active Scheduled Commands

```php
protected function schedule(Schedule $schedule): void
{
    // 1. Lead follow-up task creator — hourly by default (configurable)
    $schedule->command('app:create-lead-follow-up-tasks')
        ->name('lead_follow_up_tasks')
        ->cron(config('tasks.lead_follow_up.cron', '0 * * * *'))
        ->withoutOverlapping();
    // ✅ cron configurable via config/tasks.php — flexible
    // ✅ withoutOverlapping() guards against concurrent runs
    // ⚠️ Default '0 * * * *' = every hour at :00 — may fire too frequently if tasks backlog

    // 2. Lead assignment removal — hourly by default (configurable)
    $schedule->command('app:remove-lead-assignments')
        ->name('remove_lead_assignments')
        ->cron(config('tasks.remove_lead_assignment.cron', '0 * * * *'))
        ->withoutOverlapping();
    // ✅ Same pattern as above — consistent
    // ⚠️ Both tasks default to same cron '0 * * * *' — fire simultaneously, potential DB contention

    // 3. Empty field checker — daily at 09:00
    $schedule->command('check:empty-fields')
        ->daily()
        ->at('09:00');
    // ⚠️ No withoutOverlapping() — could overlap if slow
    // ⚠️ No timezone specified — uses server timezone (may drift from business timezone)
    // ⚠️ Purpose unclear from name alone — likely a data quality/integrity check

    // 4. Inbound mail processor — every minute
    $schedule->command('mail:process-inbound')
        ->everyMinute()
        ->withoutOverlapping();
    // ✅ withoutOverlapping() prevents concurrent mail processing
    // ⚠️ Runs every minute — high frequency, must be lightweight
    // ⚠️ Failure mode unclear — no ->onFailure() handler or alerting
}
```

### Commented-Out Schedules (Dead Code)

```php
// COMMENTED OUT — Fibos catalog sync (last day of month at 23:59)
// $schedule->command("fibos:update:contents --cruises --ports --ships")
//     ->lastDayOfMonth()->at('23:59')->withoutOverlapping()->runInBackground();
// ⚠️ This was the primary Fibos provider sync — now disabled
// ⚠️ Unclear if sync is now manual, replaced, or simply forgotten
// ✅ --cruises --ports --ships flags suggest comprehensive catalog refresh

// COMMENTED OUT — Waiting lead updater (every minute)
// $schedule->command("app:update-waiting-leads")->everyMinute();
// ⚠️ No withoutOverlapping() — was missing before it was disabled
// ⚠️ Purpose: likely moves leads from 'waiting' to active state after timeout
```

### Command Loading

```php
protected function commands(): void {
    $this->load(__DIR__.'/Commands');   // Auto-discovers all Command classes
    require base_path('routes/console.php'); // Loads closure-based console routes
}
```

---

## 📊 Schedule Summary

| Command | Frequency | Configurable | withoutOverlapping | Notes |
|---------|-----------|-------------|-------------------|-------|
| `app:create-lead-follow-up-tasks` | Hourly (default) | ✅ via config | ✅ | CRM automation |
| `app:remove-lead-assignments` | Hourly (default) | ✅ via config | ✅ | CRM cleanup |
| `check:empty-fields` | Daily 09:00 | ❌ hardcoded | ❌ | Data quality |
| `mail:process-inbound` | Every minute | ❌ hardcoded | ✅ | Inbound email handler |
| ~~`fibos:update:contents`~~ | ~~Last day of month~~ | — | — | **Disabled** |
| ~~`app:update-waiting-leads`~~ | ~~Every minute~~ | — | — | **Disabled** |

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **`fibos:update:contents` commented out** — Monthly Fibos catalog sync disabled; unclear if replaced or forgotten |
| 2 | ⚠️ HIGH | **`app:update-waiting-leads` commented out** — CRM lead lifecycle step disabled |
| 3 | ⚠️ HIGH | **`check:empty-fields` has no `withoutOverlapping()`** — Could run concurrent instances if slow |
| 4 | ⚠️ MEDIUM | **No timezone specification** — All schedules use server timezone; may drift from business hours |
| 5 | ⚠️ MEDIUM | **Both hourly jobs default to same cron `0 * * * *`** — Fire simultaneously, potential DB contention |
| 6 | ⚠️ MEDIUM | **No failure alerting** — No `->onFailure()`, `->pingOnFailure()`, or email-on-failure handlers |
| 7 | ⚠️ MEDIUM | **`mail:process-inbound` runs every minute** — Must be very lightweight; no failure recovery strategy visible |
| 8 | ℹ️ LOW | **`check:empty-fields` purpose opaque** — Name doesn't describe which entity or which fields |
| 9 | ℹ️ LOW | **`routes/console.php` content unknown** — May contain additional closure-based schedules not visible here |

---

## 📝 Migration to Base44

### Scheduled Automations (replacing Kernel)

Base44 uses **Automations** (scheduled type) to replace Laravel's `Kernel::schedule()`. Each command becomes a backend function + a scheduled automation.

```
// 1. Lead follow-up task creator — hourly
create_automation(
  automation_type="scheduled",
  name="Create Lead Follow-Up Tasks",
  function_name="createLeadFollowUpTasks",
  schedule_type="cron",
  cron_expression="0 * * * *"   // hourly at :00
)

// 2. Lead assignment removal — hourly
create_automation(
  automation_type="scheduled",
  name="Remove Lead Assignments",
  function_name="removeLeadAssignments",
  schedule_type="cron",
  cron_expression="5 * * * *"   // stagger 5 min to avoid DB contention
)

// 3. Empty fields check — daily at 09:00
create_automation(
  automation_type="scheduled",
  name="Check Empty Fields",
  function_name="checkEmptyFields",
  repeat_interval=1,
  repeat_unit="days",
  start_time="09:00"
)

// 4. Inbound mail processor — every 5 minutes (Base44 minimum)
create_automation(
  automation_type="scheduled",
  name="Process Inbound Mail",
  function_name="processInboundMail",
  repeat_interval=5,
  repeat_unit="minutes"
)

// 5. Fibos catalog sync — re-enable, last day of month
create_automation(
  automation_type="scheduled",
  name="Fibos Monthly Catalog Sync",
  function_name="fibosSyncCatalog",
  repeat_unit="months",
  repeat_on_day_of_month=28,    // approx. last day — or use cron: "59 23 28-31 * *"
  start_time="23:59"
)
```

### Backend Functions Needed

| Function Name | Replaces Command | Priority |
|--------------|-----------------|----------|
| `createLeadFollowUpTasks` | `app:create-lead-follow-up-tasks` | HIGH |
| `removeLeadAssignments` | `app:remove-lead-assignments` | HIGH |
| `processInboundMail` | `mail:process-inbound` | HIGH |
| `checkEmptyFields` | `check:empty-fields` | MEDIUM |
| `fibosSyncCatalog` | `fibos:update:contents` | HIGH (re-enable) |
| `updateWaitingLeads` | `app:update-waiting-leads` | MEDIUM (re-evaluate) |

### Key Migration Notes

1. **Base44 minimum schedule interval is 5 minutes** — `mail:process-inbound` (every minute) must accept this degradation or use a connector webhook instead
2. **Stagger the two hourly jobs** — Use `0 * * * *` and `5 * * * *` to avoid simultaneous DB load
3. **Re-evaluate commented-out commands** — Especially `fibos:update:contents` which may be critical for catalog freshness
4. **All backend functions must be admin-protected** — Each should check `user.role === 'admin'` or use service role
5. **No native cron config override** — Base44 automation schedules are set at creation; no equivalent to `config('tasks.lead_follow_up.cron')`

---

## Summary

**Console/Kernel.php** (1.5 KB): Central scheduled task registry with 4 active commands (lead follow-up creation, lead assignment removal, empty field check, inbound mail processing) and 2 commented-out commands (Fibos monthly catalog sync, waiting leads updater). HIGH: `fibos:update:contents` disabled — monthly catalog sync silently removed, unclear if replaced; `app:update-waiting-leads` also disabled. MEDIUM: no failure alerting on any job, both hourly CRM jobs fire simultaneously (potential contention), no timezone specification, `check:empty-fields` missing `withoutOverlapping()`. LOW: `routes/console.php` content unknown (may contain additional schedules).

**Migration priority: HIGH** — Scheduled jobs drive core CRM automation (lead follow-ups, assignments) and inbound mail. Re-enabling the Fibos sync should be evaluated as a priority.