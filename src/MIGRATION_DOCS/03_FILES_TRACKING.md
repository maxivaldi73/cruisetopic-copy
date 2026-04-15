# File Cataloging Tracker

## 📂 Already Documented

### Services (7 files)
- [x] FibosApi.php
- [x] FibosContentsApi.php  
- [x] FibosSyncService.php
- [x] FibosContentsService.php
- [x] FibosService.php
- [x] FibosMapsService.php
- [x] TranslationImportService.php

### Config (1 file)
- [x] config/fibos.php

### Total: 8 files documented

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
- [ ] Services/Fibos/Requests/HeaderRequest.php
- [ ] Services/Fibos/Requests/RequestItinerary.php
- [ ] Services/Fibos/Requests/RequestSearchBySeaPricing.php
- [ ] Form Requests (validation)

### Exceptions (Priority: MEDIUM)
- [ ] Services/Fibos/Exceptions/ConfigurationException.php
- [ ] Services/Fibos/Exceptions/FibosApiException.php

### Other Services (Priority: MEDIUM)
- [ ] Services/Fibos/SyncService.php (parent class)
- [ ] Services/Import/* (other importers)
- [ ] Services/Search/* (if exists)
- [ ] Middleware
- [ ] Jobs/Queue classes

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
| Services Documented | 7 | ✅ Done |
| Models (estimated) | 18 | ⏳ Pending |
| Controllers (estimated) | 5+ | ⏳ Pending |
| Migrations (estimated) | 15+ | ⏳ Pending |
| Routes | 2 | ⏳ Pending |
| Configuration | 1 | ✅ Done |
| **Total Known/Est** | **787+** | **~1% mapped** |

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