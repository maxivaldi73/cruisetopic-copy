# Service Dependency Map

## 🔗 Fibos Services Graph

```
FibosApi (Core SOAP Client)
    ├── itineraryWSDL config
    ├── currency, agencyId1/2, subsystemId
    └── Methods: requestItinerary(), requestSearchBySeaPricing()

FibosContentsApi (Contents SOAP Client)
    ├── contentsWSDL config
    ├── agencyId (IT/EN specific)
    └── Methods: createRequest(), private methods for requests

FibosSyncService (Orchestrator)
    ├── extends SyncService
    ├── uses FibosApi
    ├── manages: Cruises, CruisePrices, Itineraries, ItineraryElements
    ├── syncs by cruiselineCode
    └── generates SyncJob records

FibosContentsService (Import Manager)
    ├── uses FibosContentsApi
    ├── imports: Ships, Cabins, ShipAttributes
    ├── handles: Media via Spatie
    ├── supports: Multi-language (IT/EN)
    └── uses TranslationImportService

FibosService (Config Manager)
    └── getCruiselineCodes() - fetches from FibosSetting

FibosMapsService (Maps Importer)
    ├── uses FibosApi
    └── imports: ProviderMapPort, Itinerary maps

TranslationImportService (Generic Importer)
    ├── importRows(Collection)
    ├── supports: any model class
    ├── column mapping
    └── error tracking
```

---

## 🏗️ Explora Services Graph

```
ExploraClient (HTTP REST Client)
    ├── config('explora.*')
    ├── getToken() → sessionToken
    ├── clientRequest() → Guzzle response
    ├── getItinerariesFile() → CSV content
    └── getPricingFile() → CSV content

ExploraSyncService (extends SyncService)
    ├── uses ExploraClient
    ├── uses CsvReaderService
    ├── processes: Itineraries, Prices, Ports, Ships, Cabins
    ├── maps: Port, Ship, Itinerary, Cruise, Price
    ├── caches files (1 hour)
    ├── deduplicates itineraries
    └── generates SyncJob records

TempElementEntity (Temp storage model)
    └── table: explora_elements_temp
```

---

## 🏢 Costa Services Graph

```
CostaClient (Guzzle HTTP SOAP)
    ├── ENDPOINT_AVAILABILITY
    ├── getItineraries() → Guzzle POST
    ├── getItinerariesDetails()
    └── parseItineraryDetail()

CostaService (Legacy orchestrator)
    ├── uses CostaClient
    ├── syncItineraries()
    ├── syncElementsPrices()
    └── Generates models (Ship, Cabin, Itinerary, Price)

CostaSyncService (extends SyncService)
    ├── uses SoapCostaClient
    ├── importCatalog() → ZIP download
    ├── importDestinations/Itineraries/Cruises/Prices
    └── Recursive catalog parsing

SoapCostaClient (Native SOAP)
    ├── buildSoapClient() → WSDL parsing
    ├── ENDPOINT_AVAILABILITY (queries)
    ├── ENDPOINT_EXPORT (catalog/pricing)
    ├── listAllPorts/Ships/Destinations
    ├── getCruiseDetailed()
    └── exportCatalog/Price/FarePrices/etc.

NewCostaService (Incomplete refactor)
    ├── Maps Itineraries, Ships, Prices (done)
    └── Unimplemented TODOs (ports, elements)
```

---

## 🌍 Aroya Services Graph

```
AroyaClient (HTTP XML wrapper)
    ├── post() - Sends OTA request
    └── getPosXml() - Point of Sale header

AroyaService (OTA request builders)
    ├── searchSailings() - OTA_CruiseSailAvailRQ
    ├── checkFareAvailability() - OTA_CruiseFareAvailRQ
    ├── getCabinCategories() - OTA_CruiseCategoryAvailRQ
    ├── getSpecificCabins() - OTA_CruiseCabinAvailRQ
    ├── getItineraryDesc() - OTA_CruiseItineraryDescRQ
    ├── confirmPayment() - OTA_CruisePaymentRQ
    └── cancelBooking() - OTA_CancelRQ

AroyaXmlReader (OTA XML parser)
    ├── parseSailings() - Parse SelectedSailing
    ├── parseItinerary() - Parse CruiseItinInfo
    └── parsePrices() - Parse CategoryOption

AroyaSyncService (extends SyncService)
    ├── importData() - Orchestrator
    ├── processSailingMeta() - Extract ship
    ├── processItineraryData() - Parse ports/segments
    └── Mapping methods (Ship, Itinerary, Cruise, Price)
```

---

## 📊 Utility Services Graph

```
AlertService (UI feedback)
    ├── alertOperazioneEseguita() - Success toast + redirect
    ├── alertRelazioniEsistenti() - Info toast + redirect
    └── alertBackWithError() - Error toast + back with input
```

---

## 📊 DataTable Services Graph

```
DataTableService (Yajra Configuration)
    ├── configureHtml() - HTML builder setup
    ├── Multi-page selections (persistent Set storage)
    ├── Bulk actions (delete, update, custom)
    ├── Export actions (Excel, CSV, PDF, Print, Copy)
    ├── Search/filters (column + global)
    └── Event handlers (draw, select, deselect)

FilterService (Query Builder)
    ├── applyFilters() - Main entry point
    ├── processCriteria() - Recursive filter processing
    ├── processSingleCriterion() - Individual criterion
    ├── buildFilterCondition() - Condition builder
    ├── filterByDate() - Multi-format date parsing
    └── debugSearchBuilder() - Debug utility
```

---

## 📦 Models Referenced

| Model | Used By | Purpose |
|-------|---------|---------|
| FibosSetting | FibosService, FibosApi | Sync configuration per cruiseline |
| Cruise | FibosSyncService | Main cruise entity |
| CruisePrice | FibosSyncService | Pricing data |
| Itinerary | FibosSyncService, FibosMapsService | Port itinerary |
| ItineraryElement | FibosSyncService | Individual port stops |
| Ship | FibosContentsService | Ship data & metadata |
| Cabin | FibosContentsService | Cabin configurations |
| ShipAttribute | FibosContentsService | Attributes (pool, gym, etc) |
| ShipAttributeValue | FibosContentsService | Attribute values per ship |
| Cruiseline | FibosApi config | Cruise line reference |
| Port | FibosMapsService | Port reference |
| Language | FibosContentsService | Multi-lang support |
| ProviderMapPort | FibosMapsService | Port mapping |
| SyncJob | FibosSyncService | Sync history/tracking |
| Translation | TranslationImportService | Multi-language strings |
| Deck | - | Ship deck reference |

---

## 🔌 Config Dependencies

```php
fibos.php
├── itineraryWSDL (env: FIBOS_ITINERARY_WSDL)
├── contents.wsdl (env: FIBOS_CONTENTS_WSDL)
├── contents.it.agencyId (env: FIBOS_CONTENTS_AGENCY_ID_IT)
└── contents.en.agencyId (env: FIBOS_CONTENTS_AGENCY_ID_EN)
```

---

## 📡 External Dependencies (PHP Packages)

- **CodeDredd SOAP** - SOAP client wrapper
- **Spatie MediaLibrary** - File/image management
- **Guzzle HTTP** - HTTP client
- **Illuminate** (Laravel) - Database, Log, Storage, DB transactions

---

## 🎯 Critical Integration Points

1. **SOAP WSDL Endpoints** - Must remain stable or redirect
2. **Agency IDs** - Configuration per language/cruiseline
3. **Database Transactions** - Sync integrity critical
4. **Media Storage** - Spatie integration for ship images
5. **Language Detection** - Primary language logic