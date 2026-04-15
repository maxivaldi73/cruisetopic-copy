# Service Providers

**Purpose:** Laravel service provider registration, dependency injection, configuration loading, event/observer binding, scheduler setup.

---

## Overview

| Provider | Purpose | Key Features |
|----------|---------|--------------|
| AppServiceProvider | Core app setup | HTTPS, Vite, migrations, observers, Blade |
| AroyaServiceProvider | Aroya provider config | Conditional scheduler, permissions |
| AuthServiceProvider | Authorization | Policy mappings, gates, permissions |
| CostaServiceProvider | Costa provider config | Client singleton, dynamic scheduler |
| BroadcastServiceProvider | WebSocket broadcasting | Channel routes |
| EventServiceProvider | Events & listeners | Event-listener mappings, observers |
| ExploraServiceProvider | Explora provider config | Dynamic scheduler |
| FortifyServiceProvider | Authentication actions | Login response, rate limiting |
| FibosServiceProvider | Fibos provider config | Singleton, config merging, scheduler |
| ItineraryServiceProvider | Itinerary service | Singleton registration |
| JetstreamServiceProvider | Team management | User actions, role configuration |
| MenuServiceProvider | Dynamic menu loading | JSON menu loader, placeholder replacement |
| MscBookingServiceProvider | MSC booking client | Singleton registration |
| MscServiceProvider | MSC provider config | Config merging, command registration, scheduler |
| PortServiceProvider | Port service | Singleton registration |
| RouteServiceProvider | Route loading & rate limiting | Route groups, rate limiters |

---

## Core Providers

### AppServiceProvider

**Responsibilities:**
1. **HTTPS Enforcement** - Set HTTPS based on config
2. **Vite Configuration** - Build directory, style tag attributes
3. **View Composer** - Version data from package.json
4. **Migration Filtering** - Skip old migrations after cutoff date
5. **Blade Components** - Anonymous component paths
6. **Log Viewer Auth** - Restrict to Super-Admin
7. **Observers** - Register QuoteDetail, CruisePrice observers

**Key Features:**

```php
// Migration filtering (production-safe upgrade)
// Skips migrations before 2026_02_05_144557
$shouldFilter based on whether old migrations already ran

// Version composer (available in all views)
$view->with('versionData', [...])

// Observer registration
QuoteDetail::observe(QuoteDetailObserver::class);
CruisePrice::observe(CruisePriceObserver::class);
```

### RouteServiceProvider

**Responsibilities:**
1. **Route Loading** - Load from web.php, api.php, api2.php, admin.php, materio.php
2. **Rate Limiting** - API rate limit: 60 per minute

### AuthServiceProvider

**Responsibilities:**
1. **Policy Mappings** - Lead model → LeadPolicy
2. **Gate Definitions** - Conditional permission registration (commented)

### FortifyServiceProvider

**Responsibilities:**
1. **Auth Actions** - User creation, password reset, profile updates
2. **Two-Factor Auth** - Redirect configuration
3. **Rate Limiting** - Login (5 per minute), 2FA (5 per minute)

### JetstreamServiceProvider

**Responsibilities:**
1. **Team Management** - Create, update, delete teams & members
2. **User Management** - Delete user action
3. **Role Configuration** - Admin, Editor roles with permissions

### BroadcastServiceProvider

**Responsibilities:**
1. **Channel Routes** - Load from routes/channels.php

### EventServiceProvider

**Responsibilities:**
1. **Event-Listener Mappings:**
   - `Registered` → `SendEmailVerificationNotification`
   - `QuoteUpdated` → `UpdateLeadOnUpdateQuote`
   - `JobFailed` → `SyncJobFailedListener`
   - `TaskSaved` → `LogTaskActivityListener`
   - `UserRoleChangedEvent` → `UserRoleChangedListener`
   - `LeadCreated` → `SendLeadEmailVerificationMailListener`
   - `TicketAssigned` → `SendTicketAssignedEmail`

2. **Observer Registration:**
   - `Port` → `PortObserver`

---

## Provider-Specific Providers

### FibosServiceProvider

**Register:**
- Singleton: 'Fibos' → FibosSyncService
- Merge config from Services/Fibos/config.php

**Boot:**
- Dynamic scheduler: Loads cron rules from FibosSetting
- Supports multiple cruiselines per setting

**Scheduler Pattern:**
```php
// Dynamic cron generation
// Format: "minute hour-23/recurrence * * *"
// Example: sync_from="10:30", hourly_recurrence=2
// Result: "30 10-23/2 * * *"
```

### CostaServiceProvider

**Register:**
- (empty)

**Boot:**
- Singleton: CostaClient (configured from config)
- Dynamic scheduler: Load from CostaSetting if sync_enabled=true

### ExploraServiceProvider

**Boot:**
- Dynamic scheduler: Load from ExploraSetting if sync_enabled=true

### AroyaServiceProvider

**Boot:**
- Conditional: Only if Cruiseline with code 'ARY' exists
- Loads scheduler (currently commented out)
- Calls permissionsSetup() (not shown)

### MscServiceProvider

**Register:**
- Merge config from Services/Msc/config.php
- Register MscSync command

**Boot:**
- Dynamic scheduler: Load from MscSetting if sync_enabled=true

### MscBookingServiceProvider

**Register:**
- Singleton: MscBookingClient

### MenuServiceProvider

**Boot:**
- Load vertical/horizontal menus from JSON
- Dynamic ID resolution: MSC, Explora, Costa, Aroya by code
- Recursive placeholder replacement:
  - `{mscId}`, `{exploraId}`, `{costaId}`, `{aroyaId}` → IDs
  - `{mscId}`, `{exploraId}`, `{costaId}` → slug codes

### Simple Providers

- **ItineraryServiceProvider** - Singleton: ItineraryService
- **PortServiceProvider** - Singleton: PortService

---

## Scheduler Pattern

**Dynamic Scheduler:**
Used by Fibos, Costa, Explora, MSC, (Aroya commented)

**Setting Model:**
```
sync_enabled: boolean
sync_schedule: JSON {
    sync_from: "HH:MM",
    hourly_recurrence: integer
}
```

**Cron Generation:**
```php
private function generateSchedule($syncFromTime, $hourlyRecurrence)
{
    // sync_from="10:30", hourly_recurrence=2
    // → minute=30, hour=10, recurrence=2
    // → "30 10-23/2 * * *"
    
    $explodedTime = explode(':', $syncFromTime);
    $minute = $explodedTime[1];
    $hour = $explodedTime[0];
    return "$minute $hour-23/$hourlyRecurrence * * *";
}
```

**Job Dispatch:**
```php
// Each provider dispatches to its queue
SyncFibosJob::dispatch(...)->onQueue('fibos_sync');
CostaSyncJob::dispatch()->onQueue('costa_sync');
ExploraSyncJob::dispatch()->onQueue('explora_sync');
MSCSyncJob::dispatch()->onQueue('msc_sync');
```

---

## 📝 Migration Notes for Base44

### Service Registration
- **Current:** Large AppServiceProvider doing everything
- **Better:** Separate providers per feature (best practice)
- **Base44 Approach:** Use backend functions instead of Laravel providers

### Scheduler Pattern
- **Current:** Dynamic cron from database settings
- **Better:** Centralized configuration
- **Base44:** Use automations instead of Laravel scheduler

### DI/Singletons
- **Current:** Mix of singletons and global registration
- **Better:** Interface-based DI, dependency factories
- **Base44:** Use backend function arguments/parameters

### Migration Filtering
- **Current:** Custom Migrator extension (clever but fragile)
- **Better:** Separate migration paths or version control
- **Base44:** Seed separate data vs schema (schema immutable)

### Config Merging
- **Current:** $this->mergeConfigFrom() from local paths
- **Better:** Environment-based config files
- **Base44:** Use environment variables + secrets

### Menu System
- **Current:** JSON files + recursive placeholder replacement
- **Complex:** Maintains multiple menu definitions
- **Base44:** Generate menu from database + component UI

---

## Dependency Injection Summary

| Service | Type | Used By |
|---------|------|---------|
| CostaClient | Singleton | CostaServiceProvider |
| ItineraryService | Singleton | ItineraryServiceProvider |
| PortService | Singleton | PortServiceProvider |
| FibosSyncService | Singleton (Fibos facade) | FibosServiceProvider |
| MscBookingClient | Singleton | MscBookingServiceProvider |
| InboundMailFetcher | Binding | AppServiceProvider |
| LoginResponse | Singleton | FortifyServiceProvider |