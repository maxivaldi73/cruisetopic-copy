# CruiseTopic Legacy Codebase Inventory

**Cataloging Status:** 787/327+ files processed  
**Last Updated:** 2026-04-15

---

## 📦 CODEBASE STRUCTURE

### Core Services Layer
- **Fibos Integration Services** (Priority: HIGH)
  - `FibosApi.php` - Base API client for SOAP WSDL communication
  - `FibosSyncService.php` - Cruise data synchronization (extends SyncService)
  - `FibosContentsApi.php` - Contents/translations API client
  - `FibosContentsService.php` - Contents management & import
  - `FibosService.php` - Cruiseline code management
  - `FibosMapsService.php` - Itinerary maps import

- **Import Services** (Priority: HIGH)
  - `TranslationImportService.php` - Multi-language translation import

### Configuration
- `config/fibos.php` - WSDL endpoints, agency IDs, language-specific settings

### Data Models (To Be Identified)
- Cabin
- Cruise / CruisePrice
- Ship / ShipAttribute / ShipAttributeValue
- Cruiseline
- Deck
- Port
- Itinerary / ItineraryElement
- ProviderMapPort
- Language
- FibosSetting
- FibosCruiseline
- FibosPort
- SyncJob

---

## 🔌 External Integrations

| Service | Type | Purpose | Config |
|---------|------|---------|--------|
| Fibos SOAP | WSDL | Cruise itineraries & pricing | `fibos.itineraryWSDL` |
| Fibos Contents | WSDL | Ship descriptions, translations | `fibos.contents.wsdl` |
| HTTP Client | REST | Additional API calls | - |
| Storage | File System | Temp files, sync data | `temp/FIBOS_SYNC` |

---

## 🔄 Key Workflows

### 1. Cruise Synchronization
```
FibosSyncService
├─ Connects to Fibos SOAP API
├─ Fetches cruise data by cruiseline
├─ Syncs to local: Cruises, Prices, Itineraries
└─ Manages sync jobs & logging
```

### 2. Contents Import
```
FibosContentsService + FibosContentsApi
├─ Multi-language support (IT, EN primary)
├─ Fetches ship descriptions
├─ Imports cabin data, attributes
├─ Handles media (Spatie MediaLibrary)
└─ Transaction-based rollback on errors
```

### 3. Translation Import
```
TranslationImportService
├─ Generic collection-based importer
├─ Supports multiple model types
├─ Maps columns dynamically
└─ Tracks: processed, updated, skipped
```

### 4. Itinerary Maps
```
FibosMapsService
├─ Imports port mappings
└─ Syncs itinerary maps by cruiseline
```

---

## 📊 Data Flow

```
Fibos WSDL APIs
       ↓
FibosApi / FibosContentsApi (SOAP Clients)
       ↓
FibosSyncService / FibosContentsService
       ↓
Local Database Models
       ↓
Application / Frontend
```

---

## ⚠️ Technical Considerations

- **SOAP/WSDL:** Uses CodeDredd SOAP package for requests
- **Transactions:** DB transactions for data integrity
- **Error Handling:** Custom exceptions (ConfigurationException, FibosApiException)
- **Logging:** Extensive Log::info/error throughout
- **File Storage:** Spatie MediaLibrary for ship images/media
- **Language Handling:** Primary language detection, multi-lang support

---

## 📋 Next Steps (Pending More Files)

1. **Identify all Models** - Complete list of Eloquent models
2. **Database Migrations** - Schema for all tables
3. **Controllers/Routes** - API endpoints & web routes
4. **Frontend/Views** - Blade templates or API consumers
5. **Queue/Jobs** - Async task processing
6. **Tests** - Unit/feature test coverage

---

**Note:** More files pending. This serves as foundation for migration planning.