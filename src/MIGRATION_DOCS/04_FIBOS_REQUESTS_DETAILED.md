# Fibos Request Classes - Detailed Analysis

## 📡 Overview

Three main SOAP request builder classes that generate XML messages for Fibos WSDL API calls.

---

## 1️⃣ HeaderRequest.php

**Purpose:** Builds the header section common to all Fibos SOAP requests.

### Properties

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `CruiseLineCode` | string | required | Cruise line identifier |
| `SubsystemId` | int | 3 | System subsystem |
| `AgencyId1` | string | '' | Primary agency ID |
| `AgencyId2` | string | '' | Secondary agency ID |
| `Currency` | string | 'EUR' | Default currency |
| `AgencyConsumer` | string | 'A' | Consumer type |
| `TransactionCounter` | int | 1 | Transaction sequence |
| `TerminalId` | string | '' | Terminal identifier |
| `PartnerName` | string | required | API partner name (credentials) |
| `PartnerPassword` | string | required | API partner password (credentials) |
| `Culture` | string | required | Language/culture code (IT/EN) |

### Methods

- `setPartnerName($name)` - Fluent setter
- `setPartnerPassword($password)` - Fluent setter
- `setCulture($culture)` - Fluent setter
- `setTerminalId($id)` - Fluent setter
- `__toArray()` - Returns all properties as associative array

### Usage Pattern
```php
$header = new HeaderRequest();
$header->CruiseLineCode = 'MSC';
$header->setPartnerName('partner_name')
        ->setPartnerPassword('partner_pwd')
        ->setCulture('IT');
```

---

## 2️⃣ RequestItinerary.php

**Purpose:** Builds XML request for fetching cruise itinerary data.

### Properties

| Property | Type | Purpose |
|----------|------|---------|
| `ShipCode` | string | Ship identifier |
| `DepartureDate` | string | Departure date |
| `PackageId` | string | Package/cruise ID |
| `header` | HeaderRequest | Required header |

### Methods

- `__construct(HeaderRequest $header, $shipCode, $departureDate, $packageId)` - Initialize
- `setHeader(HeaderRequest $header)` - Set header (fluent)
- `messageXML() : string` - Generate XML message

### XML Structure Generated

```xml
<RequestItinerary>
  <Header>
    <CruiseLineCode>...</CruiseLineCode>
    <SubsystemId>...</SubsystemId>
    <!-- Other header fields -->
    <AgencyId1 PartnerName="..." PartnerPassword="..." Culture="...">...</AgencyId1>
    <TransactionCounter TerminalId="...">...</TransactionCounter>
  </Header>
  <Itinerary>
    <ShipCode>...</ShipCode>
    <DepartureDate>...</DepartureDate>
    <PackageId>...</PackageId>
  </Itinerary>
</RequestItinerary>
```

### Key Details

- Filters out sensitive header fields from XML: PartnerName, PartnerPassword, Culture, TerminalId
- Adds these as XML attributes to AgencyId1 and TransactionCounter elements
- Returns XML string without declaration header

---

## 3️⃣ RequestSearchBySeaPricing.php

**Purpose:** Builds XML request for cruise search by sea/geographic area with pricing.

### Properties

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `Sea` | string | 'ALL' | Geographic area code (or 'ALL' for all areas) |
| `DepartureDate` | string | 'ALL' | Date range DD/MM/YYYY - DD/MM/YYYY (or 'ALL') |
| `Guests` | int | 2 | Number of passengers (1-6, varies by cruise line) |
| `Price` | string | null | Pricing filter (not actively used) |
| `Age1-Age6` | int | null | Passenger ages (required for Disney/NCL) |
| `header` | HeaderRequest | required | Required header |

### Methods

- `__construct(HeaderRequest $header, array $data)` - Initialize with header and data array
- `setHeader(HeaderRequest $header)` - Set header (fluent)
- `messageXML() : string` - Generate XML message

### XML Structure Generated

```xml
<RequestSearchBySeaPricing>
  <Header>
    <!-- Same structure as RequestItinerary -->
  </Header>
  <SearchBySea>
    <Sea>...</Sea>
    <DepartureDate>...</DepartureDate>
    <Guests>...</Guests>
    <Price>...</Price>
    <Age1>...</Age1>
    <Age2>...</Age2>
    <!-- ... Age3-Age6 ... -->
  </SearchBySea>
</RequestSearchBySeaPricing>
```

### Key Details

- Constructor accepts array of data and auto-populates matching properties
- Supports variable passenger count with flexible age parameters
- Sea parameter can be cruise-line-specific geographic codes or 'ALL'
- DepartureDate format: DD/MM/YYYY - DD/MM/YYYY or 'ALL'

---

## 🔄 Data Flow

```
HeaderRequest (setup)
    ↓
RequestItinerary / RequestSearchBySeaPricing (setup)
    ↓
messageXML() generates XML string
    ↓
FibosApi passes XML to SOAP client
    ↓
Fibos WSDL endpoint processes request
    ↓
Response parsed and returned
```

---

## 📝 Migration Notes for Base44

### XML to JSON/Object Conversion
- **Current:** XML builder pattern with SimpleXMLElement
- **Base44:** Direct object/JSON payloads preferred
- **Action:** Could simplify to data object builders

### Validation
- **Current:** Minimal validation (only header check in messageXML)
- **Action:** Add validation layer (missing required fields, date formats, guest count limits)

### Error Handling
- **Current:** Generic exception for missing header
- **Action:** Create custom exceptions (InvalidHeaderException, ValidationException)

### Integration Point
- **FibosApi** receives messageXML() output and sends via SOAP client
- These builders are pure XML generators (no API calls themselves)