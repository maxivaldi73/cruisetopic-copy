# Aroya Provider Integration

**Status:** Fourth provider (alongside Fibos, Explora, Costa)  
**Provider Code:** ARY  
**Provider Name:** Aroya Cruises  
**Protocol:** OTA (OpenTravel Alliance) XML over HTTP  
**Standard:** OTA 2003.05

---

## 🏗️ Architecture

```
AroyaClient (HTTP XML wrapper)
    ↓
AroyaService (OTA request builders)
    ├── searchSailings() - OTA_CruiseSailAvailRQ
    ├── checkFareAvailability() - OTA_CruiseFareAvailRQ
    ├── getCabinCategories() - OTA_CruiseCategoryAvailRQ
    ├── getSpecificCabins() - OTA_CruiseCabinAvailRQ
    ├── getItineraryDesc() - OTA_CruiseItineraryDescRQ
    └── cancelBooking()/confirmPayment() - Booking/Payment RQ

AroyaXmlReader (XML response parser)
    ├── parseSailings() - Parse SelectedSailing nodes
    ├── parseItinerary() - Parse CruiseItinInfo segments
    └── parsePrices() - Parse CategoryOption pricing

AroyaSyncService (extends SyncService)
    └── importData() - Orchestrate full sync
```

---

## 1️⃣ AroyaClient

**Purpose:** Low-level HTTP client handling OTA XML envelope and POS/Header authentication.

### Configuration

```php
// From config('aroya.*')
protected string $baseUrl;           // API endpoint
protected string $pseudoCityCode;    // Booking system code
protected string $companyName;       // Agency name
protected string $currency;          // Currency code (e.g., SAR)
```

### Key Methods

#### `post($method, $xmlBody): StreamInterface`
- Wraps XML body in POS envelope
- Sends POST request to `baseUrl/{method}`
- Sets timeouts: 120s total, 30s connect, 120s read
- Throws Exception on HTTP error
- Returns response stream for parsing

#### `getPosXml(): string`
- Generates mandatory OTA POS (Point of Sale) block
- Contains agency code, currency, booking channel
- Used in all requests

### Headers & Options

```php
'Content-Type' => 'application/xml',
'Accept' => 'application/xml',
'timeout' => 120,
'connect_timeout' => 30,
'read_timeout' => 120
```

---

## 2️⃣ AroyaService

**Purpose:** High-level OTA request builders following OpenTravel Alliance standard.

### Configuration & Setup

- Dependency injection of AroyaClient
- Uses Carbon for date formatting
- Generates UUIDs for correlation IDs (traceability)

### OTA Request Methods

#### Search & Discovery

| Method | OTA Action | Purpose |
|--------|-----------|---------|
| `searchSailings()` | OTA_CruiseSailAvailRQ | Find cruises by date range |
| `checkFareAvailability()` | OTA_CruiseFareAvailRQ | Get all fares for voyage |
| `getCabinCategories()` | OTA_CruiseCategoryAvailRQ | Get categories with pricing |
| `getSpecificCabins()` | OTA_CruiseCabinAvailRQ | Find specific cabin numbers |

#### Itinerary & Details

| Method | OTA Action | Purpose |
|--------|-----------|---------|
| `getItineraryDesc()` | OTA_CruiseItineraryDescRQ | Get day-by-day port stops |

#### Booking & Payment

| Method | OTA Action | Purpose |
|--------|-----------|---------|
| `getMultiCabinPricing()` | OTA_CruisePriceBookingRQ | Pre-booking price calc (TODO) |
| `createBooking()` | OTA_CruiseBookRQ | Create reservation (TODO) |
| `confirmPayment()` | OTA_CruisePaymentRQ | Confirm with payment |
| `cancelBooking()` | OTA_CancelRQ | Cancel reservation |

### Request Structure Example

**searchSailings()**
```xml
<OTA_CruiseSailAvailRQ xmlns="http://www.opentravel.org/OTA/2003/05" ...>
    <POS>
        <Source ISOCurrency="SAR" PseudoCityCode="...">
            <BookingChannel Type="1">
                <CompanyName>...</CompanyName>
            </BookingChannel>
        </Source>
    </POS>
    <GuestCounts>
        <GuestCount Quantity="2"/>
    </GuestCounts>
    <SailingDateRange>
        <StartDateWindow EarliestDate="2025-01-01" LatestDate="2025-12-31"/>
    </SailingDateRange>
</OTA_CruiseSailAvailRQ>
```

### Guest Codes (Age-based)

```
Adult (18+)  → Code 10
Child (2-17) → Code 8
Infant (<2)  → Code 7
```

### Date Handling

- Environment-aware: local env = 10 days, production = 10 years
- ISO 8601 format: `YYYY-MM-DD`

---

## 3️⃣ AroyaXmlReader

**Purpose:** Parse OTA XML responses into structured arrays.

### OTA Namespace

```php
protected string $ns = 'http://www.opentravel.org/OTA/2003/05';
```

### Parse Methods

#### `parseSailings($xml): array`
- Extracts `//SelectedSailing` nodes
- Returns: VoyageID, Start, Duration, ShipCode, ShipName, DeparturePortCode

**Example output:**
```php
[
    'VoyageID' => 'ARMSEA010225',
    'Start' => '2025-02-01',
    'Duration' => 7,
    'ShipCode' => 'AC01',
    'ShipName' => 'Aroya Ship',
    'DeparturePortCode' => 'JED'
]
```

#### `parseItinerary($xml): array`
- Extracts `//CruiseItinInfo` nodes
- Parses DateTimeDescription qualifiers: `arrival`, `departure`, `stay`
- Returns: PortCode, PortName, ETA, ETD

**Example output:**
```php
[
    ['PortCode' => 'JED', 'PortName' => 'Jeddah', 
     'ETA' => '2025-02-01T08:00:00', 'ETD' => '2025-02-01T18:00:00'],
    ['PortCode' => 'AQA', 'PortName' => 'Aqaba',
     'ETA' => '2025-02-02T10:00:00', 'ETD' => '2025-02-02T16:00:00'],
]
```

#### `parsePrices($xml, $voyageId): array`
- Extracts `//CategoryOption` nodes
- Filters for PriceInfo with BreakdownType="DBL" (double occupancy)
- Returns: voyage_id, category_code, category_name, amount, fare_code, ship_code

**Example output:**
```php
[
    ['voyage_id' => 'ARMSEA010225', 'category_code' => 'IS', 
     'category_name' => 'Interior Stateroom', 'amount' => 1500.00,
     'fare_code' => 'BESTPRICE', 'ship_code' => 'AC01'],
]
```

### Utility Methods

#### `parseIsoDuration($duration): int`
- Converts ISO 8601 duration: `P7D` → `7`
- Fallback: strip non-numeric characters
- Calculates: days + (months × 30) + (years × 365)

#### `loadXml($xml): SimpleXMLElement`
- Wraps XML string in SimpleXMLElement
- Logs errors
- Throws exception on malformed XML

---

## 4️⃣ AroyaSyncService

**Purpose:** Orchestrate full sync: fetch sailings → itineraries → pricing.

### Sync Flow

```
importData()
    ├── searchSailings() → list of voyages
    ├── For each voyage:
    │   ├── getItineraryDesc() → port stops
    │   ├── getCabinCategories() → cabin pricing
    │   ├── processSailingMeta() → save ship
    │   ├── processItineraryData() → parse ports & segments
    │   └── Store prices
    └── Bulk map & persist
```

### Key Methods

#### `importData($market): void`
- Main entry point
- Resets buffers
- Fetches sailings from Aroya API
- Processes each voyage with error isolation
- Logs progress and failures

#### `resetBuffers(): void`
- Clears: ports, ships, itineraries, cruises, prices
- Called at start of sync

#### `processSailingMeta($sailing): void`
- Extracts ship info from sailing metadata
- Creates ship record in importedShips

#### `processItineraryData($voyageId, $sailing, $itinElements): void`
- Iterates port stops (itinerary elements)
- Creates ProviderMapPort entries
- Calculates nights: `Duration - 1`
- Generates itinerary code from port sequence

### Mapping Methods

#### `mapPort($item): ProviderMapPort`
- Simple pass-through (already ProviderMapPort)

#### `mapShip($item): Ship`
- Maps code, name

#### `mapItinerary($item): Itinerary`
- Sets: itineraryCode, nights, departure/arrival ports
- Flags: auto_rules=true, sea=true

#### `mapCruise($item): Cruise`
- Maps: code, ship_id, itinerary_id, departure_date, duration
- Sets: availability=true, sellability=true
- Date parsing with strtotime fallback

#### `mapPrice($item): CruisePrice`
- Maps: category code, cabin, amount
- Sets: lafPrice, lafPricePax1/2 = amount
- Flags: enabled=true

#### `getStepsFromItinerary($itinerary): Collection`
- Iterates elements
- Parses ETA/ETD timestamps
- Creates ItineraryElement with: arrival_date, arrival_time, departure_date, departure_time, sequence

#### `getCabinsFromShip($ship): Collection`
- Converts cabin array to Cabin models
- Maps: category_code, name

---

## 📊 Data Flow

```
Aroya API (OTA HTTP)
    ↓
AroyaClient.post()
    ↓
OTA XML Response
    ↓
AroyaXmlReader.parse*()
    ↓
Structured PHP Arrays
    ↓
AroyaSyncService.importData()
    ├── processSailingMeta()
    ├── processItineraryData()
    └── Store in importedPorts/Ships/Itineraries/Cruises/Prices
    ↓
Parent SyncService.importData() → Bulk map & persist
    ↓
Database Models
```

---

## 🔧 Configuration

**Required .env variables:**
```
AROYA_URL=https://api.aroya.com/api/ota
AROYA_PSEUDO_CITY_CODE=...
AROYA_COMPANY_NAME=...
AROYA_CURRENCY=SAR
```

**Config file:**
```php
// config/aroya.php
return [
    'url' => env('AROYA_URL'),
    'pseudo_city_code' => env('AROYA_PSEUDO_CITY_CODE'),
    'company_name' => env('AROYA_COMPANY_NAME'),
    'currency' => env('AROYA_CURRENCY', 'SAR'),
];
```

---

## ⚠️ Implementation Notes

### XML Namespace
- OTA 2003.05: `http://www.opentravel.org/OTA/2003/05`
- Must register XPath namespace as `vx` for queries

### Correlation IDs
- UUID generated per request for traceability
- Helps match requests to responses in logs

### Error Handling
- Per-voyage try-catch: single failure doesn't stop sync
- Logs warnings for skipped voyages
- Critical errors re-thrown

### Date/Time Parsing
- ISO 8601 timestamps: `2025-02-01T08:00:00`
- Fallback to strtotime() for flexibility
- Nights calculation: Duration - 1 (not Duration)

### Pricing
- Filtered for DBL (double occupancy) prices only
- Per-category, not per-cabin
- Amount applied to all occupancy levels

---

## 📝 Migration Notes for Base44

### OTA Standard Complexity
- OTA 2003.05 is well-standardized but verbose
- XML is necessary for this API
- **Base44 Approach:** Create backend function wrapper with JSON in/out

### Request Building
- Current: String concatenation
- **Better:** Use XML builder library (XMLWriter)
- Prevents injection issues

### Response Parsing
- SimpleXMLElement + XPath works well
- **Alternative:** Consider XMLReader for large responses

### Missing Implementations
- `getMultiCabinPricing()` - TODO (complex guest/cabin mapping)
- `createBooking()` - TODO (booking creation)

### Date Handling
- Current: env() check for local vs prod date range
- **Better:** Use configuration-based date ranges

### Error Messages
- Currently generic HTTP exceptions
- **Improvement:** Parse OTA ErrorInfo nodes for details

---

## 🔗 OTA Standard References

- OTA BookingChannelType: 1 = GDS (Global Distribution System)
- DateTimeQualifier: arrival, departure, stay
- BreakdownType: DBL (double), SGL (single), CHD (child), etc.
- CategoryCode: IS (Interior), OB (Oceanview), VD (Veranda), SUI (Suite), etc.