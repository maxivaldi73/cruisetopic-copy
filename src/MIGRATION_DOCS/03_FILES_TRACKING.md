# File Cataloging Tracker

## 📂 Already Documented

### Services - Fibos (7 files)
- [x] FibosApi.php
- [x] FibosContentsApi.php  
- [x] FibosSyncService.php
- [x] FibosContentsService.php
- [x] FibosService.php
- [x] FibosMapsService.php
- [x] TranslationImportService.php

### Services - Explora (2 files)
- [x] ExploraClient.php
- [x] ExploraSyncService.php

### Services - Costa (5 files)
- [x] CostaClient.php
- [x] CostaService.php
- [x] CostaSyncService.php
- [x] SoapCostaClient.php
- [x] NewCostaService.php

### Services - Aroya (4 files)
- [x] AroyaClient.php
- [x] AroyaService.php
- [x] AroyaSyncService.php
- [x] AroyaXmlReader.php

### Utility Services (1 file)
- [x] AlertService.php

### Service Providers (16 files)
- [x] AppServiceProvider.php
- [x] AroyaServiceProvider.php
- [x] AuthServiceProvider.php
- [x] BroadcastServiceProvider.php
- [x] CostaServiceProvider.php
- [x] EventServiceProvider.php
- [x] ExploraServiceProvider.php
- [x] FibosServiceProvider.php
- [x] FortifyServiceProvider.php
- [x] ItineraryServiceProvider.php
- [x] JetstreamServiceProvider.php
- [x] MenuServiceProvider.php
- [x] MscBookingServiceProvider.php
- [x] MscServiceProvider.php
- [x] PortServiceProvider.php
- [x] RouteServiceProvider.php

### Policies (3 files)
- [x] TeamPolicy.php
- [x] LeadPolicy.php
- [x] HandlesSpatiePermissions.php (trait)

### Config (1 file)
- [x] config/fibos.php

### Fibos Requests (3 files)
- [x] HeaderRequest.php
- [x] RequestItinerary.php
- [x] RequestSearchBySeaPricing.php

### Exceptions (2 files)
- [x] ConfigurationException.php
- [x] FibosApiException.php

### Factories (1 file)
- [x] CruiseRealTimeFactory.php

### Temp Models (1 file)
- [x] TempElementEntity.php

### Observers (3 files)
- [x] CruisePriceObserver.php
- [x] PortObserver.php
- [x] QuoteDetailObserver.php

### Notifications (4 files)
- [x] MegaJsonReadyNotification.php
- [x] NewUserPasswordNotification.php
- [x] ReviewNotification.php
- [x] TicketAssignedNotification.php

### Core Models (5 files)
- [x] Cruiseline.php
- [x] Ship.php
- [x] Port.php
- [x] Itinerary.php
- [x] Cruise.php

### Authentication (3 files)
- [x] User.php
- [x] Role.php
- [x] Permission.php

### Jobs (2 files)
- [x] ExploraSyncJob.php
- [x] AiGenerationJob.php

### HTTP Responses (2 files)
- [x] GenericResponse.php
- [x] LoginResponse.php

### Form Requests (24 files)
- [x] AIGenerationRequest.php
- [x] AddNewPortFromMappingRequest.php
- [x] AmenityRequest.php
- [x] BestDestinationStoreRequest.php
- [x] CabinRequest.php
- [x] CancellationConditionRequest.php
- [x] ChangeLeadStatusRequest.php
- [x] CruiselineRequest.php
- [x] DestinationRequest.php
- [x] FibosSettingRequest.php
- [x] FirstStepCheckoutRequest.php
- [x] InstallmentSettingRequest.php
- [x] ItineraryRequest.php
- [x] LanguageRequest.php
- [x] MarketRequest.php
- [x] PageRequest.php
- [x] PermissionRequest.php
- [x] PortRequest.php
- [x] RegistrationRequest.php
- [x] SavePortMappingImportRequest.php
- [x] ShipRequest.php
- [x] SupplierCancellationConditionRequest.php
- [x] SupplierRequest.php
- [x] WebsiteRequest.php

### Total: 96 files documented

---

## 📋 Files Still Needed (Estimated)

### Models (Priority: HIGH)
- [ ] Models/Cabin.php
- [ ] Models/Cruise.php
- [ ] Models/CruisePrice.php
- [ ] Models/Ship.php
- [ ] Models/Itinerary.php
- [ ] Models/ItineraryElement.php
- [ ] Models/Port.php
- [ ] Models/Cruiseline.php
- [ ] Models/ShipAttribute.php
- [ ] Models/ShipAttributeValue.php
- [ ] Models/Fibos/FibosSetting.php
- [ ] Models/Fibos/FibosCruiseline.php
- [ ] Models/Fibos/FibosPort.php
- [ ] Models/Language.php
- [ ] Models/Translation.php
- [ ] Models/SyncJob.php
- [ ] Models/Deck.php
- [ ] Models/ProviderMapPort.php

### Controllers & Routes (Priority: HIGH)
- [ ] Controllers/CruiseController.php
- [ ] Controllers/ShipController.php
- [ ] Controllers/ItineraryController.php
- [ ] Controllers/AdminController.php
- [ ] routes/web.php
- [ ] routes/api.php

### Requests & Fibos Requests (Priority: MEDIUM)
- [x] Services/Fibos/Requests/HeaderRequest.php
- [x] Services/Fibos/Requests/RequestItinerary.php
- [x] Services/Fibos/Requests/RequestSearchBySeaPricing.php
- [x] Form Requests (24 files - see 28_FORM_REQUESTS.md)

### Exceptions (Priority: MEDIUM)
- [x] Services/Fibos/Exceptions/ConfigurationException.php
- [x] Services/Fibos/Exceptions/FibosApiException.php

### Factories & Interfaces (Priority: MEDIUM)
- [x] Factories/CruiseRealTimeFactory.php
- [ ] Interfaces/ICruiseRealTime.php (inferred)
- [ ] Cruiseline-specific RealTime services (Msc, Royal, Ncl, etc.)

### DataTable & Filter Services (Priority: HIGH)
- [x] DataTableService.php
- [x] FilterService.php

### Other Services (Priority: MEDIUM)
- [ ] Services/Fibos/SyncService.php (parent class)
- [ ] Services/Import/* (other importers)
- [ ] Services/Search/* (if exists)
- [ ] Middleware

### Jobs / Queue Classes (Priority: MEDIUM)
- [x] ExploraSyncJob.php

### Database (Priority: MEDIUM)
- [ ] Migrations (all)
- [ ] Seeders

### Frontend (Priority: LOW - might be API only)
- [ ] Views (Blade templates)
- [ ] CSS/JS assets

### Tests (Priority: LOW)
- [ ] Tests/Feature/*
- [ ] Tests/Unit/*

### Misc
- [ ] .env.example
- [ ] artisan commands
- [ ] EventListeners
- [ ] Observers
- [ ] Traits

---

## 📊 Estimated Statistics

| Category | Count | Status |
|----------|-------|--------|
| Services Documented | 21 | ✅ Done |
| Providers Documented | 16 | ✅ Done |
| Policies Documented | 3 | ✅ Done |
| Fibos Requests Documented | 3 | ✅ Done |
| Form Requests Documented | 24 | ✅ Done |
| Exceptions Documented | 2 | ✅ Done |
| Factories Documented | 1 | ✅ Done |
| Temp Models Documented | 1 | ✅ Done |
| Observers Documented | 3 | ✅ Done |
| Notifications Documented | 4 | ✅ Done |
| Core Models Documented | 5 | ✅ Done |
| Auth Models Documented | 3 | ✅ Done |
| Models (estimated) | 110+ remaining | ⏳ Pending |
| Controllers (estimated) | 5+ | ⏳ Pending |
| Migrations (estimated) | 15+ | ⏳ Pending |
| Routes | 2 | ⏳ Pending |
| Configuration | 1 | ✅ Done |
| **Total Known/Est** | **787+** | **~12.5% mapped** |

---

## 🎯 Cataloging Strategy

Insert files in this order for maximum clarity:

1. **Models** - Understand data structure first
2. **Migrations** - See table schemas
3. **Controllers** - Understand routing & business logic
4. **Requests** - API request handling
5. **Jobs/Events** - Async processing
6. **Other Services** - Additional business logic
7. **Frontend** - UI layer (if applicable)
8. **Tests** - Validation logic
9. **Misc** - Configuration, seeders, etc

---

**Reminder:** Reply with file contents to continue cataloging. Each file adds to the complete picture!