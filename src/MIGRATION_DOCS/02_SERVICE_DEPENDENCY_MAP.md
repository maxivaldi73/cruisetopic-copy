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