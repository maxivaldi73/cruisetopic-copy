# Core Models: Cruise, Itinerary, Ship, Port, Cruiseline

**Purpose:** Core data models for cruise data structure: cruiselines, ships, ports, itineraries, and cruises.

---

## 1️⃣ Cruiseline

**Location:** `App\Models\Cruiseline`  
**Purpose:** Represents a cruise company (Costa, Fibos, Explora, MSC, Royal Caribbean, etc.)  
**Traits:** HasTranslation, InteractsWithMedia, TrimsAttributes, HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Unique identifier (FIBOS, EXP, COSTA, ARY, MSC) |
| name | string | Company name (translatable) |
| description | text | Long description (translatable) |
| description_html | text | HTML formatted description |
| short_description | text | Short version |
| features | text | Feature list (translatable) |
| meta_* | string | SEO metadata (translatable) |
| enabled | boolean | Active status |
| address, phone, website | string | Contact info |

### Methods

**Accessors:**
- `getShipsCountAttribute()` - Count related ships
- `getRoutesAttribute()` - Count unique itineraries (placeholder)
- `getDeparturesAttribute()` - Count departures (placeholder)
- `getMediaUrlAttribute()` - Get logo URL with fallback

**Scopes:**
- `scopeOnlyEnabled()` - Filter enabled only

**Relations:**
- `ships()` → hasMany Ship
- `itineraries()` → hasMany Itinerary
- `CabinTypes()` → hasMany CabinType
- `sellers()` → belongsToMany Seller (with timestamps)
- `products()` → belongsToMany Product
- `informationNotes()` → hasMany InformationNote

**Media Collections:**
- logo, logo_inverse, cover (image conversions: thumb, webp)

### Utility Methods

```php
getIdByCode(string $code): ?int  // Get ID from code
shipsWithItineraries()            // Filter ships with sailings
```

---

## 2️⃣ Ship

**Location:** `App\Models\Ship`  
**Purpose:** Cruise ship details (name, cabins, amenities, attributes)  
**Traits:** HasTranslation, InteractsWithMedia, TrimsAttributes, HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Ship identifier |
| name | string | Ship name (translatable) |
| description | text | Ship description (translatable) |
| meta_* | string | SEO fields (translatable) |
| cruiseline_id | FK | Parent cruiseline |
| enabled | boolean | Active status |

### Relations

- `Cruiseline()` → belongsTo Cruiseline
- `ShipAttributes()` → hasMany ShipAttributeValue
- `ShipServices()` → hasMany ShipAmenityValue
- `Decks()` → hasMany Deck
- `Cabins()` → hasMany Cabin
- `CabinTypes()` → hasMany CabinType (confusing naming)
- `itineraries()` → hasManyThrough (via Cruise)
- `cruises()` → hasMany Cruise
- `products()` → belongsToMany Product

### Key Methods

**Attribute Management:**
```php
getAllAttributes()           // Fetch all ship attributes with values
getAllActiveShipData()       // Filter to active attributes only
getAllServices()             // Fetch all amenities/services
isAttributeActive($id)       // Check if attribute active
isServiceActive($id)         // Check if amenity active
getAttributeValueByAttributeId($id)    // Get attribute value
getServiceDescriptionByServiceId($id)  // Get service description
```

**Scopes:**
```php
scopeSearchByCode($code)     // ILIKE search
scopeSearchByName($name)     // ILIKE search
```

**Media:**
- main: single image (thumb conversion)
- cover: single image (small, thumb conversions) with fallback
- images: multiple images (thumb conversion)

### Notes

- Handles ambiguous relationship naming (CabinTypes should be via Cabin)
- Uses `getAllAttributes()` to merge static + dynamic ship data
- Media fallback paths configured for cover images

---

## 3️⃣ Port

**Location:** `App\Models\Port`  
**Purpose:** Geographic ports for cruise itineraries (embark, debark, port stops)  
**Traits:** HasTranslation, InteractsWithMedia, HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Port name (translatable) |
| lat, lng | decimal(10) | Map coordinates |
| continent_id, country_id | FK | Geographic location |
| continent, country, region, district, city | string | Location text |
| address | text | Physical address |
| description | text | Port description (translatable) |
| meta_* | string | SEO metadata (translatable) |
| visible_on_map | boolean | Show on map (default: true) |
| is_active | boolean | Active status (default: true) |
| sunny_days, temperature_avg | int | Climate data |
| is_not_a_port | boolean | Flag for non-port stops (landmarks) |
| score | int | Rating/preference score |
| sorting | int | Display order |

### Relations

- `itineraries()` → belongsToMany Itinerary (via itinerary_elements)
- `itineraryElements()` → hasMany ItineraryElement
- `continentRelation()` → belongsTo Continent
- `countryRelation()` → belongsTo Country
- `Destinations()` → belongsToMany Destination
- `FibosPorts()` → hasMany FibosPort (provider mapping)
- `ExploraPorts()` → hasMany ExploraPort
- `MscPorts()` → hasMany MscPort
- `CostaPorts()` → hasMany CostaPort

### Key Methods

```php
getMarkerData($zIndex)       // Return map marker data (lat, lng, title, icon)
getCoverAttribute()          // Get cover images with conversion URLs
getLogoAttribute()           // Get logo with conversion URLs
Cruiselines()                // Get unique cruiselines from itineraries
getImageUrl()                // Get first cover image or fallback
scopeWithDistinctItinerariesCount()  // Subquery for itinerary count
```

### Media Collections

- logo: single image (thumb, preview, medium, large conversions)
- cover: single image (same conversions)

### Provider Mapping

Uses intermediate tables (FibosPort, ExploraPort, MscPort, CostaPort) to map provider-specific port codes to canonical Port records.

---

## 4️⃣ Itinerary

**Location:** `App\Models\Itinerary`  
**Purpose:** Route template (list of ports in sequence, shared by multiple cruises)  
**Traits:** InteractsWithMedia, SoftDeletes, TrimsAttributes, HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| itineraryCode | string | Unique route identifier (hash of port sequence) |
| cruiseline_id | FK | Associated cruiseline |
| nights | int | Duration (usually = ports - 1) |
| auto_rules | boolean | Auto-generate pricing rules (default: true) |
| departure_port_id, arrival_port_id | FK | Start/end ports |
| departure_port_name, arrival_port_name | string | Port names (denormalized) |
| sea | boolean | Includes sea days (default: true) |

### Relations

- `Destinations()` → belongsToMany Destination (with matching_percentage pivot)
- `OfferGroups()` → belongsToMany OfferGroup
- `ItineraryElements()` → hasMany ItineraryElement (ordered by sequence)
- `itineraryDestinations()` → hasMany ItineraryDestination
- `MainElement()` → hasOne ItineraryElement (first port)
- `DeparturePort()` → hasOne Port (via departure_port_id)
- `ArrivalPort()` → hasOne Port (via arrival_port_id)
- `DepartureElement()` → hasOne ItineraryElement (sequence=0)
- `ArrivalElement()` → hasOne ItineraryElement (last)
- `Ship()` → hasOne Ship (confusing, should be via Cruise)
- `Cruiseline()` → hasOne Cruiseline (should be belongsTo)
- `reviews()` → hasMany Review
- `Prices()` → hasMany CruisePrice (via Cruise)
- `LowerPrice()` → hasOne CruisePrice (lowest price)
- `cruises()` → hasMany Cruise

### Key Methods

```php
findByCode($code)                    // Static finder
getDepartureElement()                // First stop
getArrivalElement()                  // Last stop
averageRating()                      // Average review rating
storeTranslations($array)            // Persist translations to Translation table
getTitle()                           // Format as "Destination from Port"
getUrlImageMapAttribute()            // Get/generate map image (with fallback generation)
getBestOfferCabinAttribute()         // Find cheapest cabin (legacy)
```

### Media

- map: single image (generated or uploaded itinerary map)

### Notes

- SoftDeletes for safe removal
- `getUrlImageMapAttribute()` auto-generates maps via MapsService if missing
- Prices accessed via Cruise relation (should be direct hasMany)
- Multiple relationship naming inconsistencies (Ship, Cruiseline should use different relationship types)

---

## 5️⃣ Cruise

**Location:** `App\Models\Cruise`  
**Purpose:** Specific sailing departure (itinerary + date + ship)  
**Traits:** TrimsAttributes, HasFactory  
**Casts:** LocalDateTime

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| code | string | Unique sailing code |
| package | string | Package identifier |
| cruiseline_id | FK | Cruise company |
| itinerary_id | FK | Route template |
| ship_id | FK | Ship used |
| departure_date | date | Sailing date (timezone-aware) |
| duration | int | Days (usually = itinerary nights + 1) |
| availability | boolean | Available for search |
| sellability | boolean | Available for booking |
| max_occupancy | int | Passenger capacity |
| is_immediate_confirm | boolean | Instant confirmation possible |
| best_for_you | decimal | Recommendation score |
| best_price | decimal | Lowest cabin price |
| score | int | Overall score |
| to_disabled | boolean | Wheelchair accessible |

### Relations

- `cruiseline()` → belongsTo Cruiseline
- `itinerary()` → belongsTo Itinerary
- `ship()` → belongsTo Ship
- `prices()` → hasMany CruisePrice
- `availablePrices()` → hasMany CruisePrice (filtered + grouped by cabin type)
- `departurePort()` → hasOneThrough Port
- `arrivalPort()` → hasOneThrough Port
- `Orders()` → hasMany Quote
- `deals()` → belongsToMany Deal (with score pivot)
- `products()` → belongsToMany Product (complex pivot: ProductCruisePrice)

### Key Methods

```php
// Accessors
getDepartureDateAttribute()          // Parse to app timezone
setDepartureDateAttribute()          // Store as date only (no time)
getArrivalDateAttribute()            // Get arrival from itinerary

// Scopes
scopeAvailable()                     // availability = true
scopeSellable()                      // sellability = true
scopeDepartureAfter($date)           // departure_date >= date
scopeDurationBetween($min, $max)     // duration BETWEEN min AND max

// Checkers
isSellable()                         // sellability && departure_date >= now()
isAvailable()                        // availability && departure_date >= now()
isAvailableForBooking()              // isSellable() && best_price > 0 && prices exist

// Finders
findCabinPrices($cabinTypeCode, $pricelistId)
```

### Notes

- Timezone handling: `LocalDateTime` custom cast for created/updated
- `departure_date` accessor/mutator handles timezone conversion
- `availablePrices()` joins with enabled Cabins and groups by type
- `products()` uses complex pivot (ProductCruisePrice) with multiple fields
- **WARNING:** Departure_date attribute getter/setter has logic that might cause issues with re-saves

---

## Summary: Data Model Hierarchy

```
Cruiseline (company)
    ├─ Ship (vessel)
    │   ├─ Cabin (room type)
    │   ├─ Deck
    │   └─ ShipAmenity (amenity value)
    │
    └─ Itinerary (route template)
        ├─ ItineraryElement (port stop sequence)
        │   └─ Port (geographic location)
        │       └─ PortDestination (geographic region)
        │
        └─ Cruise (specific departure)
            ├─ CruisePrice (pricing per cabin)
            ├─ ProductCruisePrice (product pricing)
            └─ Quote (customer booking)
```

---

## 📝 Migration Notes for Base44

### Naming Issues
- Multiple ambiguous relationship names (Ship.CabinTypes, Itinerary.Ship)
- Inconsistent use of hasOne vs belongsTo

### Denormalization
- Port names denormalized on Itinerary (sync risk)
- Cruiseline info denormalized on Cruise

### Complex Pivots
- ProductCruisePrice has 20+ fields (should be separate model or jsonb)
- Deal.cruises uses pivot with score

### Missing Constraints
- No explicit foreign key constraints in schema (inferred from code)
- SoftDeletes on Itinerary (audit trail needed)

### Timezone Handling
- LocalDateTime custom cast (app-specific)
- departure_date has custom accessor/mutator

### Media Management
- Extensive use of Spatie MediaLibrary
- Auto-generation of map images (expensive operation in accessor)