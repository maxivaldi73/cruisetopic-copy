# Explora Provider Integration

**Status:** Secondary provider (alongside Fibos)  
**Provider Code:** EXP  
**Provider Name:** Explora Journeys  

---

## 🏗️ Architecture

```
ExploraClient (HTTP API)
    ↓
ExploraSyncService (Sync Orchestrator)
    ├── processItineraryRow() - CSV processing
    ├── processPriceRow() - CSV processing
    └── Map methods (Ship, Itinerary, Cruise, Price)
    
TempElementEntity (Temp storage)
```

---

## 1️⃣ ExploraClient

**Purpose:** HTTP REST client for Explora API (not SOAP like Fibos).

### Configuration

Properties are set from `config('explora.*')`:
- `url` - Authentication endpoint
- `username` - API credentials
- `password` - API credentials
- `repositoryUrl` - File repository endpoint

### Key Methods

#### `getToken(): string|null`
- **Flow:** POST to `url` with username/password
- **Returns:** `sessionToken` from JSON response
- **Error:** Returns null on failure, logs error

#### `clientRequest($url, $withAuthorization=true): ResponseInterface`
- **Private method** for internal use
- Adds Authorization header if `$withAuthorization=true`
- **Throws:** Exception if status !== 200
- Returns Guzzle ResponseInterface

#### `getItinerariesFile(): mixed`
- Downloads itineraries CSV from "Itinerary files" folder
- Uses S3 signed URLs from repository

#### `getPricingFile(): string`
- Downloads pricing CSV from "Pricing files" folder
- Uses S3 signed URLs from repository

#### `getFileFromFolder(string $folderName)`
- **Private method** - core file retrieval logic
- Queries repository, filters by folder name
- Navigates nested children structure to find S3 signed URL
- Returns file contents as string

### Data Flow

```
ExploraClient
├── getToken() → sessionToken
├── clientRequest() with token
├── getFileFromFolder() → S3 signed URL
└── download file content as string
```

### Config Example

```php
// config/explora.php
return [
    'url' => env('EXPLORA_URL'),
    'username' => env('EXPLORA_USERNAME'),
    'password' => env('EXPLORA_PASSWORD'),
    'repositoryUrl' => env('EXPLORA_REPOSITORY_URL'),
];
```

---

## 2️⃣ ExploraSyncService

**Purpose:** Sync orchestrator extending SyncService (parent class handles DB writes).

### Properties

```php
protected string $providerName = "Explora";
protected string $cruiselineCode = "EXP";
protected string $cruiselineName = "Explora Journeys";
private ExploraClient $exploraClient;
private string $download_path = '/temp/explora';
private CsvReaderService $csvReader;
```

### Main Methods

#### `importData($market): void`
- **Throws:** GuzzleException, InvalidArgumentException, Exception
- **Flow:**
  1. Download itineraries CSV
  2. Process each row → populate ports, itineraries, elements
  3. Download pricing CSV
  4. Process each row → populate ships, cabins, cruises, prices
  5. Deduplicate itineraries by code

#### `processItineraryRow(array $row): void`
- **Input:** CSV row from itineraries file
- **Actions:**
  - Extract port code & name → add to `$this->importedPorts`
  - Extract journey/cruise code
  - Build itinerary array with elements (port stops)
  - Calculate MD5 hash of port sequence → `itineraryCode`
  - Store in `$this->importedItineraries[$cruiseCode]`

#### `processPriceRow(array $row): void`
- **Input:** CSV row from pricing file
- **Actions:**
  - Extract journey code, ship, duration
  - Create/update cruise in `$this->importedCruises`
  - Create/update ship & cabins in `$this->importedShips`
  - Store price row in `$this->importedPrices`

#### Mapping Methods

| Method | Input | Output |
|--------|-------|--------|
| `mapPort($item)` | ProviderMapPort | ProviderMapPort |
| `mapShip($item)` | array | Ship model |
| `mapItinerary($item)` | array | Itinerary model |
| `mapCruise($item)` | array | Cruise model |
| `mapPrice($item)` | object | CruisePrice model |

#### Supporting Methods

- `downloadItineraries(): string` - Download with 1-hour cache
- `downloadPrices(): string` - Download with 1-hour cache
- `getCabinsFromShip($ship): Collection` - Extract cabin data
- `getStepsFromItinerary($itinerary): Collection` - Extract port stops
- `loadPrices($market): Items` - Load as JSON machine items
- `decodeCsv($path): Collection` - CSV to array conversion

### CSV Format

**Itineraries CSV Columns:**
- Port Code, Commercial Port Name
- Journey code, Ship code, Date
- Nights, ETA (hh:mm), ETD (hh:mm)

**Pricing CSV Columns:**
- Journey Code, Ship, Length (duration)
- Category, Category Name
- Departure Date, Per Person Fare
- 3rd & 4th Adult, Solo Fare
- Offer Type Code, Offer Type

### Data Deduplication

```php
// Lines 66-74: Clean duplicate itineraries
$itineraryArray = [];
foreach ($this->importedItineraries as $importedItinerary) {
    $key = $importedItinerary['itineraryCode'];
    if (!isset($itineraryArray[$key])) {
        $itineraryArray[$key] = $importedItinerary;
    }
}
$this->importedItineraries = $itineraryArray;
```

---

## 3️⃣ TempElementEntity

**Purpose:** Temporary storage model for itinerary elements during sync.

### Table

```
Table: explora_elements_temp

Columns:
- id (PK)
- ship_code
- jurney_code (note: typo - should be journey_code)
- date
- destination
- nights
- country_code
- port_code
- commercial_port_name
- eta
- etd
- created_at, updated_at
```

### Fillable Fields

```php
$fillable = [
    'ship_code',
    'jurney_code',
    'date',
    'destination',
    'nights',
    'country_code',
    'port_code',
    'commercial_port_name',
    'eta',
    'etd'
];
```

### Usage

- Intermediate storage during CSV processing
- Can be cleared between syncs
- Simple Eloquent model with no custom methods

---

## 📊 Data Flow Diagram

```
S3 Repository (Explora)
    ↓
ExploraClient.getItinerariesFile() ← CSV download
ExploraClient.getPricingFile() ← CSV download
    ↓
Local Storage (/temp/explora)
    ├── explora_itineraries.csv (cached 1 hour)
    └── explora_prices.csv (cached 1 hour)
    ↓
ExploraSyncService.importData()
    ├── processItineraryRow() → Ports, Itineraries, ItineraryElements
    ├── processPriceRow() → Ships, Cabins, Cruises, Prices
    └── Deduplication → Clean itineraries by code
    ↓
Database Models
    ├── Port, Ship, Cabin, Cruiseline
    ├── Itinerary, ItineraryElement
    ├── Cruise, CruisePrice
    └── ProviderMapPort, SyncJob
```

---

## 🔧 Configuration Files

**Needed:**
```php
// config/explora.php
return [
    'url' => env('EXPLORA_URL'),
    'username' => env('EXPLORA_USERNAME'),
    'password' => env('EXPLORA_PASSWORD'),
    'repositoryUrl' => env('EXPLORA_REPOSITORY_URL'),
];
```

**Environment Variables:**
```
EXPLORA_URL=https://...
EXPLORA_USERNAME=...
EXPLORA_PASSWORD=...
EXPLORA_REPOSITORY_URL=https://...
```

---

## 📝 Migration Notes for Base44

### Provider Pattern
- Explora uses REST/HTTP (not SOAP)
- File-based CSV imports (not real-time API queries)
- S3-backed file storage
- Caching strategy (1-hour TTL)

### Key Differences vs Fibos
| Aspect | Fibos | Explora |
|--------|-------|---------|
| Protocol | SOAP/WSDL | REST HTTP |
| Data Format | XML | CSV |
| Real-time | Live queries | File snapshots |
| Auth | Partner credentials | Username/password |
| File Storage | Direct HTTP | S3 signed URLs |
| Caching | Per-request | File-based (1h) |

### Base44 Migration Approach
- Create separate backend functions per provider
- Use event-driven sync (scheduled automation)
- Store credentials as secrets
- Implement provider interface pattern
- Database remains abstracted (same models)