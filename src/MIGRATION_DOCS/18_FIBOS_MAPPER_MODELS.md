# Fibos Mapper Models

**Purpose:** Provider mapping models that bridge Fibos provider data with canonical application models. These models track the relationship between Fibos provider codes and internal application entities (Ships, Ports, Cabins, etc.).

---

## Overview

Fibos integration uses intermediate mapper models to:
1. **Track Provider Codes** - Store Fibos-specific identifiers (code, name)
2. **Map to Canonical Models** - Link Fibos data to internal models (Ship, Port, Cruiseline)
3. **Support Multi-Language** - Handle IT/EN variants for different cruiselines
4. **Import Tracking** - Log sync operations and failure counts

| Model | Purpose | Relation | Role |
|-------|---------|----------|------|
| FibosCruiseline | Map Fibos cruiseline code to Cruiseline | FK to Cruiseline | Parent mapper |
| FibosShip | Map Fibos ship code to Ship | FK to Ship | Per-ship tracking |
| FibosPort | Map Fibos port code to Port | FK to Port | Port destination mapping |
| FibosCabin | Store Fibos cabin type codes | None (reference) | Cabin type reference |
| FibosCabinTypology | Store Fibos cabin typology codes | None (reference) | Typology reference |
| FibosDestination | Map Fibos destination code to Destination | FK to Destination | Destination mapping |
| FibosSetting | Configuration per cruiseline | FK to Cruiseline (code) | Sync config |
| FibosImport | Track import jobs & stats | FK to Job | Import tracking |

---

## 1️⃣ FibosCruiseline

**Location:** `App\Models\Fibos\FibosCruiseline`  
**Purpose:** Master mapper linking Fibos cruiseline codes to canonical Cruiseline records.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Fibos cruiseline code (COSTA, MSC, etc.) |
| cruiseline_id | FK | Reference to Cruiseline model |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| fibosShips() | hasMany | All Fibos ships for this cruiseline |
| fibosPorts() | hasMany | All Fibos ports for this cruiseline |
| fibosPortsWithoutMapping() | hasMany | Ports without port_id mapping |
| cruiseline() | belongsTo | The canonical Cruiseline |
| setting() | belongsTo | FibosSetting config |
| syncJobs() | hasMany | Associated SyncJob records |

### Key Methods

```php
fibosShips()                    // Get Fibos ships (hasMany Ship via cruiseline_id)
fibosPorts()                    // Get Fibos ports (hasMany Port via cruiseline_id)
fibosPortsWithoutMapping()      // Get unmapped ports (whereNull port_id)
cruiseline()                    // Get parent Cruiseline
setting()                       // Get FibosSetting config
syncJobs()                      // Get related sync jobs
```

### Notes

- Acts as the parent mapper for all Fibos cruiseline data
- Used during sync to organize ships, ports, and configurations
- Enables per-cruiseline sync scheduling and configuration

---

## 2️⃣ FibosShip

**Location:** `App\Models\Fibos\FibosShip`  
**Purpose:** Map Fibos ship codes to canonical Ship records.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Fibos ship code |
| fibos_cruiseline_id | FK | Parent FibosCruiseline |
| ship_id | FK | Reference to Ship model |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| FibosCruiseline() | belongsTo | Parent cruiseline mapper |
| ship() | belongsTo | The canonical Ship |

### Notes

- Simple mapper with no custom business logic
- Links Fibos ship codes to internal Ship records
- Used during Fibos content import to reference ships

---

## 3️⃣ FibosPort

**Location:** `App\Models\Fibos\FibosPort`  
**Purpose:** Map Fibos port codes to canonical Port records with special handling for non-ports (landmarks).  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Fibos port code |
| name | string | Port name (denormalized) |
| fibos_cruiseline_id | FK | Parent FibosCruiseline |
| port_id | FK | Reference to Port model (nullable) |
| is_not_a_port | boolean | Flag for non-port stops (landmarks) |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| Port() | belongsTo | The canonical Port (nullable) |
| Fibos_Cruiseline() | belongsTo | Parent cruiseline mapper |

### Special Handling

- **Nullable port_id:** Some Fibos ports don't map to canonical ports (missing mapping)
- **is_not_a_port:** Flag for landmarks, scenic stops (not actual ports)
- **Denormalized name:** Stores Fibos port name for reference

### Notes

- Maps Fibos port codes to Port records
- Supports unmapped ports (port_id = null) with tracking
- Used during itinerary import to link port stops

---

## 4️⃣ FibosCabin

**Location:** `App\Models\Fibos\FibosCabin`  
**Purpose:** Reference table for Fibos cabin type codes.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Fibos cabin code |
| name | string | Cabin type name |

### Relations

- None (reference-only, no foreign keys)

### Purpose

- Store cabin type codes from Fibos API
- Used as reference during cabin import
- No bidirectional sync (read-only from Fibos)

---

## 5️⃣ FibosCabinTypology

**Location:** `App\Models\Fibos\FibosCabinTypology`  
**Purpose:** Reference table for Fibos cabin typology codes.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Fibos typology code |
| name | string | Typology name |

### Relations

- None (reference-only)

### Purpose

- Store cabin typology classifications from Fibos
- Used as reference during cabin import
- Maps Fibos typology system to internal cabin categorization

---

## 6️⃣ FibosDestination

**Location:** `App\Models\Fibos\FibosDestination`  
**Purpose:** Map Fibos destination codes to canonical Destination records.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Fibos destination code |
| name | string | Destination name (denormalized) |
| destination_id | FK | Reference to Destination model |

### Relations

- Implied: `belongsTo Destination`

### Purpose

- Track destination code mappings
- Support multi-language destination handling (IT/EN)
- Used during itinerary import to categorize cruises

---

## 7️⃣ FibosSetting

**Location:** `App\Models\Fibos\FibosSetting`  
**Purpose:** Configuration and credentials for Fibos sync per cruiseline.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| cruiseline_code | string | Cruiseline code (FIBOS, COSTA, etc.) |
| ship_code | string | Ship-specific code (optional) |
| subsystem_id | string | Fibos subsystem identifier |
| partner_name | string | Fibos partner username |
| partner_password | string | Fibos partner password (encrypted in production) |
| agency_id1, agency_id2 | string | Agency IDs for different languages |
| currency | string | Currency code for pricing |
| agency_or_consumer | string | Account type (agency vs consumer) |
| terminal_id | string | Terminal identifier |
| transaction_counter | int | Transaction counter for requests |
| wsdl_itinerary, wsdl_itinerary_test | string | WSDL endpoints (itinerary) |
| wsdl_pricing, wsdl_pricing_test | string | WSDL endpoints (pricing) |
| sync_schedule | JSON | Schedule configuration (cron, interval) |
| sync_enabled | boolean | Enable/disable sync for this cruiseline |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| cruiseline() | belongsTo | The Cruiseline |

### Casts

```php
'sync_enabled' => 'bool'
```

### Purpose

- Centralize credentials and configuration per cruiseline
- Support different WSDL endpoints (test vs production)
- Configure sync schedule and enable/disable
- Store agency IDs for multi-language support (IT/EN)

### Security Notes

- Contains sensitive credentials (partner_name, partner_password)
- Should be encrypted at rest in production
- Access should be restricted to admin users and sync processes

---

## 8️⃣ FibosImport

**Location:** `App\Models\Fibos\FibosImport`  
**Purpose:** Track and log Fibos import/sync operations with statistics and failure counts.  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| description | string | Import description |
| job_id | FK | Related Job (async task) |
| cruiseline_code | string | Cruiseline code |
| ship_code | string | Ship code (optional, single-ship import) |
| with_pricings | boolean | Include pricing data |

### Statistics Fields

| Field | Type | Purpose |
|-------|------|---------|
| cruiselines_nr | int | Number of cruiselines processed |
| ships_nr | int | Number of ships processed |
| ports_nr | int | Number of ports processed |
| itineraries_nr | int | Number of itineraries processed |
| itinerary_elements_nr | int | Number of port stops processed |
| price_list_nr | int | Number of price lists processed |

### Status Fields

| Field | Type | Purpose |
|-------|------|---------|
| status | string | Import status (pending, running, completed, failed) |
| status_description | string | Human-readable status message |
| error | string | Error message if status = failed |

### Failure Counts

| Field | Type | Purpose |
|-------|------|---------|
| failed_cruiselines | int | Count of failed cruiseline imports |
| failed_ships | int | Count of failed ship imports |
| failed_ports | int | Count of failed port imports |
| failed_itineraries | int | Count of failed itinerary imports |
| failed_itinerary_elements | int | Count of failed port stop imports |
| failed_price_lists | int | Count of failed price list imports |
| deleted_itineraries | int | Count of deleted itineraries |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| RelatedJob() | belongsTo | The async Job that ran this import |

### Eager Loading

```php
protected $with = ['RelatedJob'];
```

- Automatically loads related Job on every query
- Ensures job status is available without separate query

### Purpose

- Create audit trail of all Fibos imports
- Track success/failure statistics per import
- Link to async Job for monitoring
- Enable troubleshooting and retry logic

### Usage Pattern

```
FibosSync job starts
  → Create FibosImport record with job_id
  → Process cruiselines, ships, ports, itineraries, prices
  → Track failures in failed_* fields
  → Update status (completed/failed) and statistics
  → FibosImport available for audit trail
```

---

## Mapper Architecture

```
FibosCruiseline (master mapper)
    ├─ FibosShip
    │   └─ Ship (canonical)
    │
    ├─ FibosPort
    │   └─ Port (canonical)
    │
    ├─ FibosDestination
    │   └─ Destination (canonical)
    │
    └─ FibosSetting (config)
        └─ Sync schedule & credentials

FibosImport (tracking)
    ├─ Job (async task)
    ├─ Statistics (counters)
    └─ Failure tracking

Reference Tables (no relations):
    ├─ FibosCabin
    └─ FibosCabinTypology
```

---

## Data Flow During Sync

```
1. FibosServiceProvider registers scheduler with FibosSetting config
   
2. FibosSyncJob dispatched → FibosSync starts
   
3. FibosImport created with job_id
   
4. FibosApi.requestItinerary() → XML response
   
5. For each cruiseline in response:
   a) Find/create FibosCruiseline mapping
   b) For each ship:
      - Find/create FibosShip mapping
      - Import Ship data
   c) For each port:
      - Find/create FibosPort mapping
      - Map to Port (or track unmapped)
   d) For each itinerary:
      - Import Itinerary + ItineraryElements
      
6. Update FibosImport with statistics & status
   
7. SyncJob record created with results
```

---

## 📝 Migration Notes for Base44

### Mapper Pattern
- **Current:** Separate mapper models for provider codes
- **Alternative:** Store provider codes directly on canonical models
- **Base44 Approach:** Simple FK relationships in single models
  ```typescript
  // Instead of FibosPort + Port, use:
  interface Port {
    id: string;
    name: string;
    fibos_code?: string;  // Store Fibos code directly
    provider_mappings?: {  // Or store as JSONB
      fibos?: string;
      explora?: string;
    }
  }
  ```

### Configuration Management
- **Current:** FibosSetting stores credentials in database
- **Better:** Use environment variables / secrets management
- **Base44 Approach:** Use secrets service
  ```typescript
  // Set via dashboard
  const fibosConfig = await base44.auth.getSecret('FIBOS_PARTNER_PASSWORD');
  ```

### Import Tracking
- **Current:** FibosImport logs statistics
- **Better:** Use structured logging / events
- **Base44:** Backend function logging + analytics
  ```typescript
  base44.analytics.track({
    eventName: 'fibos_sync_completed',
    properties: {
      cruiselines: 10,
      ships: 50,
      failed_ships: 2
    }
  });
  ```

### Multi-Language Support
- **Current:** agency_id1 (IT), agency_id2 (EN) per cruiseline
- **Better:** Generic language_id array or config object
- **Base44:** Store language preferences as JSONB
  ```typescript
  interface FibosSetting {
    agencies: {
      'it': string,
      'en': string
    }
  }
  ```

### Async Job Tracking
- **Current:** FK to Job table (Laravel queue)
- **Base44:** Use automations + backend function logs
  - No separate Job model needed
  - Use automation execution logs for status
  - Store results in dedicated entities

### Security Considerations
- Credentials in database (FibosSetting) - encrypt at rest
- Access control needed for admin only
- API keys should rotate periodically
- Consider using Vault/secrets manager instead