# Costa Provider Integration

**Status:** Third provider (alongside Fibos and Explora)  
**Provider Code:** COSTA  
**Provider Name:** Costa Crociere  
**Protocol:** SOAP/WSDL (primary), REST HTTP (fallback)

---

## 🏗️ Architecture

```
CostaClient (Guzzle HTTP SOAP)
    ↓
CostaService + SoapCostaClient (Dual approach)
    ├── Catalog import (XML ZIP)
    ├── Port/Ship enumeration
    ├── Pricing export
    └── Itinerary details

CostaSyncService (Extends SyncService)
NewCostaService (Newer refactored version)
```

**Note:** Two coexisting implementations:
- **Old:** CostaService + CostaClient (HTTP SOAP)
- **New:** CostaSyncService + SoapCostaClient (Native SOAP)

---

## 1️⃣ CostaClient (HTTP SOAP)

**Purpose:** Guzzle-based SOAP client for Costa API (simpler but less robust).

### Configuration

```php
private static string $baseUri = 'https://training.costaclick.net';
private const CLIENT_TIMEOUT = 100000.0;
```

### Key Methods

#### `__construct($username, $password, $agencyCode, $baseUri)`
- Initializes HTTP client with XML content-type
- Sets static credentials

#### `getItineraries($from = null, $to = null): array`
- Fetches available cruises for date range
- Returns: array of cruise objects with ship, ports, dates
- Date format: ISO 8601 (defaults to now → now+3 years)

#### `getItinerariesDetails($cruiseId): array`
- Fetches detailed cruise data (segments, cabin categories, pricing)
- Returns: nested array with itinerary segments, cabin super-categories, fare pricing

#### `createListAvailableCruisesRequest($from, $to): string`
- Builds SOAP XML body for ListAvailableCruises action
- Includes date range, optional filters (destination, ship, port)

#### `parseItineraryDetail($xml): array`
- Parses SOAP response XML into structured array
- Extracts: segments, super-categories, fare prices

### Data Flow

```
createListAvailableCruisesRequest()
    ↓ (SOAP XML string)
client.post() → ENDPOINT_AVAILABILITY
    ↓ (XML response)
SimpleXMLElement parse
    ↓
Namespace extraction
    ↓
Array structure return
```

### Limitations

- Uses static properties (not thread-safe)
- Manual SOAP envelope construction
- Limited error handling
- Mixed HTTP responses (sometimes string errors)

---

## 2️⃣ CostaService

**Purpose:** High-level orchestration for Costa data import (legacy implementation).

### Properties

- `costaClient: CostaClient` - HTTP SOAP client
- `costaCruiseline: Cruiseline | null` - Costa cruiseline record
- `itineraryService: ItineraryService` - Itinerary helper
- `counter: array` - Import statistics (ships, ports, itineraries, prices, etc.)

### Main Methods

#### `syncItineraries($jobId): void`
- Main sync entry point
- Fetches itineraries via CostaClient
- Creates/updates Ship, Itinerary records
- Calls `syncElementsPrices()` after

#### `syncElementsPrices(): void`
- Fetches details for each itinerary
- Generates itinerary elements (port stops)
- Creates cabin categories
- Generates pricing data

#### `getOrCreateShipByCode($code, $name): Ship`
- Finds or creates ship record
- Links to Costa cruiseline

#### `generateItineraryElements($itinerary, $localItinerary): void`
- Parses port segments from itinerary
- Creates ItineraryElement records
- Links to CostaPort intermediate table

#### `generateShipCabins($cabins, $localShip): void`
- Creates Cabin records from super-categories
- Uses `updateOrCreate()` for idempotency

#### `generateTravelPackages($itinerary, $ship, $prices): void`
- Creates CruisePrice records from fare pricing
- Maps super-category codes to cabin categories
- Stores price per occupancy level

### Error Handling

- Try-catch blocks with counter tracking
- Partial failures don't stop sync
- Failed item counters for reporting

### Models Used

- Cruiseline (Costa Crociere)
- Ship, Cabin
- Itinerary, ItineraryElement
- Port, CostaPort, CostaImport
- CruisePrice

---

## 3️⃣ CostaSyncService

**Purpose:** Refactored sync service extending SyncService parent (newer approach).

### Architecture

```
CostaSyncService extends SyncService
    ├── importData() - Recursive catalog import
    ├── importCatalog() - ZIP download/extract
    ├── importDestinations() - Parse destinations
    ├── importItineraries() - Parse itineraries
    ├── importCruises() - Process cruises & pricing
    ├── importShips() - Extract ship categories
    ├── importPrices() - Extract fare pricing
    └── Mapping methods (Ship, Itinerary, Cruise, Price)
```

### Key Methods

#### `importData($market): void`
- Entry point
- Downloads and extracts ZIP catalog
- Processes: destinations → itineraries → cruises → pricing
- Deduplicates data by code

#### `importCatalog(): void`
- Calls `SoapCostaClient.exportCatalog()`
- Downloads ZIP file
- Extracts and parses XML
- Populates itineraries array

#### `importCruises($itinerary, $itineraryCode): void`
- Iterates cruise elements
- Calls `getCruiseDetailed()` for each
- Builds ports, segments, pricing

#### `loadItineraryElementsAndPorts($getCruise, $cruiseCode): array`
- Extracts port segments from cruise detail
- Creates ProviderMapPort entries
- Returns segment array

#### Mapping Methods
- `mapShip()`, `mapItinerary()`, `mapCruise()`, `mapPrice()`
- `getCabinsFromShip()`, `getStepsFromItinerary()`

### ZIP Handling

```php
downloadAndSaveFile($fileUrl, $fileName)
    ├── Download via Http::get()
    └── Save to Storage
extractZipFile($fileName)
    ├── Open ZIP
    ├── Extract contents
    └── Rename files to original name
```

### Data Deduplication

```php
// Clean duplicate itineraries by code
$itineraryArray = [];
foreach ($this->importedItineraries as $importedItinerary) {
    $key = $importedItinerary['code'];
    if (!isset($itineraryArray[$key])) {
        $itineraryArray[$key] = $importedItinerary;
    }
}
$this->importedItineraries = $itineraryArray;
```

---

## 4️⃣ SoapCostaClient

**Purpose:** Native PHP SOAP client with robust error handling and multiple export endpoints.

### Configuration

```php
private const NAMESPACE = 'http://schemas.costacrociere.com/WebAffiliation';
private const ENDPOINT_AVAILABILITY = '/WAWS_2_1/Availability.asmx';
private const ENDPOINT_EXPORT = '/WAWS_2_1/Export.asmx';
private const WSDL_SUFFIX = '?WSDL';
```

### Core Methods

#### `buildSoapClient($endpoint): \SoapClient`
- Constructs WSDL URL
- Configures SOAP options (v1.1, trace, timeout)
- Sets cache to NONE (can change to DISK)

#### `buildSoapHeaders(): array`
- Creates Agency header (code, culture)
- Creates Partner header (username, password)
- Returns array of SoapHeader objects

#### `callSoapAction($endpoint, $action, $params = []): mixed`
- Generic SOAP call wrapper
- Sets headers before invoke
- Logs requests/responses on error
- Returns parsed response or null

### Query Methods

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `listAllPorts()` | Availability | Get all ports |
| `listAllShips()` | Availability | Get all ships |
| `listAllDestinations()` | Availability | Get all destinations |
| `listAvailableCruises()` | Availability | Get available cruises |
| `listPorts($params)` | Availability | Filter ports by destination |
| `listFares($cruiseCode)` | Availability | Get fares for a cruise |
| `getCruiseDetailed($cruiseCode)` | Availability | Full cruise details |

### Export Methods

| Method | Purpose |
|--------|---------|
| `exportCatalog()` | Full cruise catalog (ZIP) |
| `exportCatalog()` | Export full catalog with destinations/itineraries |
| `exportShipsAndCategories()` | Ship/cabin categories |
| `exportPrice()` | Base pricing data |
| `exportAvailability()` | Availability status |
| `exportPrices($params)` | Full price matrix |
| `exportFare($destinationCode)` | Fare data by destination |
| `exportPriceWithDestination()` | Pricing for destination+fare combo |
| `exportFullPriceExtended($params)` | Extended pricing with occupancy |
| `exportItineraryAndSteps($params)` | Itinerary segments/steps |

### Parsing Methods

Each export method has a corresponding parser:
- `parseListAllPortsResponse()` → array of ports
- `parseGetCruiseDetailedResponse()` → nested cruise array
- `parseExportCatalogResponse()` → URL string
- etc.

### Response Structure Example

```php
GetCruiseDetailed returns:
[
    'destination' => ['code', 'description'],
    'itinerary' => [
        'code', 'url',
        'segments' => [
            ['port' => ['code', 'description', 'sea_destination'],
             'arrival_time', 'departure_time']
        ]
    ],
    'ship' => ['code', 'name', 'cabins', 'crew', ...],
    'superCategories' => [['code', 'description'], ...],
    'farePrices' => [
        ['code', 'description', 'is_immediate_confirm',
         'prices' => [['super_category_code', 'best_price', ...]]]
    ]
]
```

---

## 5️⃣ NewCostaService

**Purpose:** Incomplete refactored version (TODO markers indicate unfinished methods).

### Status

- Maps itineraries and ships (complete)
- Maps prices with occupancy variants (complete)
- Extracts cabin categories (complete)
- Other methods: stub/TODO

### Implemented Methods

- `loadItineraries()` - Returns Items collection
- `mapItinerary()`, `mapShip()`, `mapPrice()`
- `extractCabinCategoryFromRow()`

### Unimplemented (TODO)

- `loadPrices()`, `loadItineraryElements()`
- `processItineraryElement()`, `getItineraryElements()`
- `loadPorts()`, `mapPort()`, `mapCruise()`
- `getCabinsFromShip()`, `getStepsFromItinerary()`

---

## 📊 Comparison: Old vs New Implementation

| Aspect | CostaClient/CostaService | SoapCostaClient/CostaSyncService |
|--------|--------------------------|-----------------------------------|
| HTTP Library | Guzzle + manual SOAP XML | Native PHP SOAP |
| WSDL Handling | Manual string construction | Automatic WSDL parsing |
| Error Handling | Basic try-catch | Detailed SOAP fault logging |
| Export Support | Limited | Comprehensive (10+ methods) |
| Code Organization | Monolithic | Extended parent SyncService |
| Type Safety | Mixed | Better structured arrays |
| Robustness | HTTP-dependent | SOAP protocol compliance |

---

## 🔗 Configuration

**Required .env variables:**
```
COSTA_USERNAME=...
COSTA_PASSWORD=...
COSTA_AGENCY_CODE=...
COSTA_BASE_URI=https://training.costaclick.net
```

**Config file:**
```php
// config/costa.php
return [
    'username' => env('COSTA_USERNAME'),
    'password' => env('COSTA_PASSWORD'),
    'agency_code' => env('COSTA_AGENCY_CODE'),
    'base_uri' => env('COSTA_BASE_URI', 'https://training.costaclick.net'),
];
```

---

## 📝 Migration Notes for Base44

### SOAP vs REST
- SOAP provides strong typing but requires WSDL parsing
- REST could be more maintainable (if available)
- **Base44 Approach:** Use OpenAPI/REST integration if available, otherwise create backend function wrapper

### Dual Implementations
- Old code should be deprecated
- Consider consolidating into single, clean service
- **Recommendation:** Use CostaSyncService + SoapCostaClient pattern

### XML Parsing
- SimpleXMLElement works well for structured XML
- Consider using XMLReader for large catalogs (memory efficiency)
- **Base44:** Native JSON APIs preferred

### ZIP Extraction
- Current approach: extract to file system
- **Improvement:** Stream-based or in-memory extraction
- **Base44:** Use backend function with file upload integration

### Data Modeling
- Current: Direct model creation in sync methods
- **Better:** Separate sync (transform) from persist (store)
- **Base44 Pattern:** Normalize data → validate → batch insert