# Livewire Components Catalog

**Purpose:** Real-time, interactive UI components using Laravel Livewire framework.  
**Architecture:** Server-side component state with client-side reactive rendering via WebSockets/AJAX.  
**Total Components:** 32 (organized by feature area)

---

## 📋 Component Index

| Component | Feature Area | Purpose |
|-----------|--------------|---------|
| **Search & Discovery** | | |
| SearchBox | Search | Main search form with filters |
| SearchList | Search | Search results display |
| SideFilters | Search | Advanced filters (sidebar) |
| OfferFilter | Offer Listing | Dynamic filter UI |
| SBComponent | Search | Total itineraries counter |
| **Offer Listing** | | |
| OfferListing | Listing | Paginated cruise offers |
| OfferListingCard | Listing | Individual offer card |
| OfferGroupsSelect | Listing | Offer group selector |
| OfferPage | Listing | Offer page container |
| HomePageSuggestionsSection | Homepage | Suggested destinations |
| CompaniesSlider | Homepage | Cruiseline carousel |
| **Pricing & Checkout** | | |
| PriceOptionsCard | Pricing | Price options display |
| ListingPriceOptions | Pricing | Alternative cruise prices |
| TotalPrice | Checkout | Dynamic total calculator |
| CheckoutComponent | Checkout | Multi-step checkout wizard |
| LeadQuoteCabinSelection | Checkout | Cabin selection |
| RegistrationOverlay | Checkout | Registration modal |
| **Itinerary & Details** | | |
| ItinerarySlider | Details | Port stops carousel |
| ItinerariesBackofficeTable | Admin | Itinerary management table |
| DrawOnMap | Details | Map visualization |
| DrawOnMapRiver | Details | River cruise map |
| GallerySlider | Details | Ship image gallery |
| **Administration** | | |
| TableInlineEdit | Admin | Inline table editing |
| OrderWorkflowComponent | Admin | Order status workflow |
| BackOfficeListingCard | Admin | Admin listing view |
| **Settings & User** | | |
| CurrencySwitcher | Settings | Currency selector |
| SellerSettingsComponent | Settings | Seller profile settings |
| TabSwitcher | UI | Sea/River cruise tabs |
| **General** | | |
| TrustpilotReviews | Reviews | Trustpilot reviews widget |
| NewsletterRegistration | Newsletter | Email signup form |
| ListingTotalFoundComponent | UI | Results counter |
| AssistanceData | Support | Support contact hours |

---

## 🔍 Search & Discovery Components

### SearchBox
**Location:** `App\Livewire\SearchBox`  
**Purpose:** Main search entry point for browsing cruises  
**Listeners:** None  
**State:** destination, cruiseline, port, date, month, cruiseType

**Key Features:**
- Destination autocomplete
- Cruiseline dropdown (top 5 hardcoded order)
- Port/departure port selection
- Date/month range pickers
- Sea vs River cruise toggle
- Context awareness (frontend vs admin)
- Multi-language support

**Top Five Cruiselines Order:**
```php
['MSC', 'COSTA', 'NCL', 'RCCL', 'EXP', 'EXPLORA']
```

### SearchList
**Location:** `App\Livewire\SearchList`  
**Purpose:** Display search results from query  
**Listeners:** `search` → `performSearch($data)`

**Key Methods:**
```php
performSearch($data)  // Execute search via OfferService
```

**Dependencies:**
- OfferService (itineraryFilter method)

### SideFilters
**Location:** `App\Livewire\SideFilters`  
**Purpose:** Advanced filtering sidebar  
**Listeners:** `update`, `loadMore`

**Filters Available:**
- Destination (single + multi-select)
- Cruiseline (multi-select)
- Ship (multi-select)
- Date range
- Price range
- Night/duration range
- Rating (multi-select)
- Starting locations (departure ports)

**Key Methods:**
```php
applyFilters()           // Apply filter combo
loadMore()              // Pagination
getDestinations()       // Load destination list
```

### OfferFilter
**Location:** `App\Livewire\OfferFilter`  
**Purpose:** Dynamic filter UI for offer listing  
**Listeners:** None

**Filters Implemented:**
- Cruiselines (top 5 hardcoded, sorted by code)
- Ports (departure)
- Months
- Destinations
- Ships
- Price range (min/max)
- Nights/duration (min/max)
- Itinerary elements (port stops)
- Ratings

**TODO Items:**
- Hardcoded top 5 cruiselines (should be admin-configurable)
- Use cruiseline code instead of name

### SBComponent
**Location:** `App\Livewire\SBComponent`  
**Purpose:** Display total itineraries count  
**Mounted:** Queries Itinerary count (distinct itineraryCode)

---

## 🛍️ Offer Listing Components

### OfferListing
**Location:** `App\Livewire\OfferListing`  
**Purpose:** Paginated cruise offer display  
**Listeners:** `filter-execute` → `filter($data)`

**Features:**
- Pagination (5 per page)
- Sorting (departure_date, configurable)
- Sort order (asc/desc)
- Banner display (destination-specific)
- Show/hide listing toggle

**Key Methods:**
```php
filter($data)           // Apply filters
loadMore()              // Pagination
nextPage()              // Load next page
```

### OfferListingCard
**Location:** `App\Livewire\OfferListingCard`  
**Purpose:** Individual cruise offer card  
**Skeleton Placeholder:** `placeholders.listing-card-skeleton`

**Features:**
- Cruise details (ship, dates, ports)
- Alternative cruises (same itinerary, different dates)
- Gallery modal
- More offers toggle
- Arrival port display

**Methods:**
```php
toggleMoreOffers()
toggleGallery()
selectAlternative($cruiseId)
```

### OfferGroupsSelect
**Location:** `App\Livewire\OfferGroupsSelect`  
**Purpose:** Manage itinerary offer group associations

**Key Methods:**
```php
sync($id)  // Add/remove offer group from itinerary
```

### OfferPage
**Location:** `App\Livewire\OfferPage`  
**Purpose:** Container for offer display page  
**Mounted Parameters:** `searchRequest` (JSON string)

---

## 💰 Pricing & Checkout Components

### PriceOptionsCard
**Location:** `App\Livewire\PriceOptionsCard`  
**Purpose:** Display available price tiers for cruise

**Mounted:** CruiseView model

**Features:**
- Random "Best" badge display (not deterministic)
- Random "Last" badge display
- Arrival date calculation
- Date formatting

### ListingPriceOptions
**Location:** `App\Livewire\ListingPriceOptions`  
**Purpose:** Alternative prices for same itinerary

**Mounted Parameters:** itineraryCode, month, date

### TotalPrice
**Location:** `App\Livewire\TotalPrice`  
**Purpose:** Real-time total price calculator  
**Listeners:** `updateCabinPrice`, `updateServicePrice`, `updateInternetPrice`

**Features:**
- Cabin pricing
- Service charges
- Internet pricing
- Port charges (commented out)
- Currency display
- Dynamic total calculation

**Dispatches:**
- `updateDefaultSelection` (if totalPrice = 0)

### CheckoutComponent
**Location:** `App\Livewire\CheckoutComponent`  
**Purpose:** Multi-step checkout wizard

**Steps:**
1. Itinerary/cruise selection + cabin selection + passenger count
2. Quote creation + detail configuration
3. Payment method selection

**State Structure:**
```php
$step1CheckoutData = [
    'itinerary_id' => null,
    'cruise_id' => null,
    'cabins' => [
        [
            'cabin_id' => null,
            'cabin_type' => null,
            'total_pax' => 2,
            'total_adults' => 2,
            'total_teenager' => 0,
            'total_child' => 0,
        ]
    ],
    'total_pax' => 2,
    'total_adults' => 2,
    'total_teenager' => 0,
    'total_child' => 0,
]
```

**Key Features:**
- Multi-cabin selection
- Dynamic passenger count
- Route/port display
- Arrival date calculation
- Quote totals

### LeadQuoteCabinSelection
**Location:** `App\Livewire\LeadQuoteCabinSelection`  
**Purpose:** Cabin type selection for quote/lead

**Events:**
- `#[On('itinerarySelected')]` → Load cabins
- `#[On('updatePassengers')]` → Reload cabins with new pax count

**Dependencies:**
- CabinService (cabin loading logic)

### RegistrationOverlay
**Location:** `App\Livewire\RegistrationOverlay`  
**Purpose:** Registration modal on checkout

**Listeners:** `toggleOverlay`, `step1Updated`

**Features:**
- Overlay toggle
- Cabin type selection from checkout data
- Itinerary/departure date display
- Session persistence of step 1 data

---

## 📊 Itinerary & Details Components

### ItinerarySlider
**Location:** `App\Livewire\ItinerarySlider`  
**Purpose:** Carousel of cruise port stops  
**Skeleton:** `placeholders.itinerary-slider-skeleton`

**Mounted:** CruiseView model

**Features:**
- Port sequence display
- Eager loads ItineraryElements

### ItinerariesBackofficeTable
**Location:** `App\Livewire\ItinerariesBackofficeTable`  
**Purpose:** Admin itinerary management table

**Features:**
- AJAX incremental loading
- Search by itinerary code
- Cruise selection

**Route Dependency:**
```php
route('itineraries.searchJson')  // AJAX endpoint
```

### DrawOnMap
**Location:** `App\Livewire\DrawOnMap`  
**Purpose:** Visualize sea cruise route on map

**Mounted Parameters:** destination, river (boolean)

**Features:**
- Port coordinates (lat/lng)
- Destination rules area mapping
- Elements matching percentage

### DrawOnMapRiver
**Location:** `App\Livewire\DrawOnMapRiver`  
**Purpose:** Visualize river cruise route on map

**Similar to DrawOnMap** with river-specific logic

### GallerySlider
**Location:** `App\Livewire\GallerySlider`  
**Purpose:** Ship image gallery carousel

**State:**
- shipMedia (images collection)

---

## ⚙️ Administration Components

### TableInlineEdit
**Location:** `App\Livewire\TableInlineEdit`  
**Purpose:** Inline editing of Fibos settings table

**Features:**
- Field-level edit mode (editedSettingField)
- Row-level edit index tracking
- Validation (cruiseline_code, subsystem_id, agency_id1/2, currency)

**Validation Rules:**
```php
'settings.*.cruiseline_code' => ['required']
'settings.*.subsystem_id' => ['required']
'settings.*.agency_id1' => ['required']
'settings.*.agency_id2' => ['required']
'settings.*.currency' => ['required']
```

**Data Source:** FibosSetting::all()

### OrderWorkflowComponent
**Location:** `App\Livewire\OrderWorkflowComponent`  
**Purpose:** Order status workflow UI

**State:**
- selectedRole (current role)
- orderStatuses (available statuses)
- roles (available roles)
- lastRole (sticky selection)

**Methods:**
```php
changeSelectedRole()  // Update selected role
```

### BackOfficeListingCard
**Location:** `App\Livewire\BackOfficeListingCard`  
**Purpose:** Admin view of itinerary/offer

**Mounted:** itineraryGroup (from table)

**Features:**
- Loads Offer from Itinerary
- Admin-specific display

---

## 🎛️ Settings & User Components

### CurrencySwitcher
**Location:** `App\Livewire\CurrencySwitcher`  
**Purpose:** Currency selection & session switching

**Features:**
- Session persistence (currency_id)
- Website default currency fallback
- Primary currency fallback
- Page reload on switch (middleware reloads data)

**Priority Order:**
1. session('currency_id')
2. request()->website->currency_id
3. Currency::wherePrimary(true)->value('id')

### SellerSettingsComponent
**Location:** `App\Livewire\SellerSettingsComponent`  
**Purpose:** Seller profile management

**Configurable Settings:**
- Languages (en, ar, it, fr)
- Language proficiency levels (A1-C2, native speaker)
- Nationalities (Italian, English, Arabic, French)
- Employee level (Junior, Middle, Senior)
- Region/location
- Contract start date

### TabSwitcher
**Location:** `App\Livewire\TabSwitcher`  
**Purpose:** Toggle between sea and river cruises

**Features:**
- Default: 'sea' cruiseType
- Dispatches: `cruiseTypeUpdated` event
- Optional isListing flag

---

## 📰 General Components

### TrustpilotReviews
**Location:** `App\Livewire\TrustpilotReviews`  
**Purpose:** Display Trustpilot reviews widget

**Status:** Mostly commented out (development only)

**Planned Features:**
- Fetch reviews from Trustpilot API
- Authorization: Bearer token
- Business unit lookup
- Placeholder skeleton view

**TODO:** Implement API integration + secure token storage

### NewsletterRegistration
**Location:** `App\Livewire\NewsletterRegistration`  
**Purpose:** Email newsletter signup

**Features:**
- Email validation (RFC compliant + regex)
- Duplicate check
- Newsletter contact creation

**Validation:**
```php
'email' => [
    'required',
    'unique:newsletter_contacts,email',
    'email:rfc',
    'custom_regex_check'
]
```

### ListingTotalFoundComponent
**Location:** `App\Livewire\ListingTotalFoundComponent`  
**Purpose:** Display results count

**Listeners:** `filter-execute` → `updateData($data)`

**Skeleton:** `placeholders.cruises-counter-skeleton`

### HomePageSuggestionsSection
**Location:** `App\Livewire\HomePageSuggestionsSection`  
**Purpose:** Homepage suggestions (destinations, inspirations, occasions)

**Skeleton:** `placeholders.suggestions-card-skeleton`

**Features:**
- Market-specific suggestions
- Destination list
- Offer groups (inspirations)
- Occasions/special trips
- Loads from database

### AssistanceData
**Location:** `App\Livewire\AssistanceData`  
**Purpose:** Support contact information & hours

**Features:**
- Opening hours management
- Per-day time ranges (A: from/to, B: from/to)
- Day selection (Monday-Sunday)
- Phone number display
- Language support

**Opening Hours Structure:**
```php
[
    '1' => ['fromA' => '09:00', 'toA' => '12:00', 'fromB' => '14:00', 'toB' => '18:00'],
    '2' => [...],
    ...
    '7' => [...]
]
```

---

## 🧪 Test Components

### TestSearchComponent
**Location:** `App\Livewire\Tests\TestSearchComponent`  
**Purpose:** Development/testing search functionality  
**Status:** Experimental - hardcoded test filters

**Features:**
- Dynamic offer filtering
- Multi-select cruiselines, ships, ports
- Month & date range filtering
- Itinerary counting
- Filter options auto-generation from results

**State Variables:**
```php
$selectedCruuiselines = []  // NOTE: typo in property name (Cruuiselines)
$selectedShips = []
$selectedPorts = []
$selectedMonth
$date
$nights
$text  // unused
$itineraries  // results
$totalItineraries  // count
```

**Key Methods:**

#### `render()`
- Creates SearchRequest from selected filters
- Calls OfferService.searchItinerary()
- Extracts available cruiselines, ships, ports, months from results
- Returns view with populated filters

#### Filter Selection Methods
```php
setCruiseline($id)    // Add/remove cruiseline toggle
setShip($id)          // Add/remove ship toggle
setPort($id)          // Add/remove port toggle
setMonth($m)          // Set single month (non-toggle)
```

#### `addIfNotExist($id, $array): array`
- Toggle logic: add if missing, remove if exists
- Array re-indexed after removal
- Used by cruiseline/ship/port selectors

#### Data Extraction Methods
```php
getCruiselines()      // Extract unique cruiseline IDs from results
getShips()            // Extract unique ship IDs from results
getPorts()            // Extract unique departure ports from results
```

**Issues/Concerns:**
1. **Typo:** Property named `selectedCruuiselines` (extra 'u')
2. **Unused Code:** `$text` property, commented `updatedText()` listener
3. **Inefficient Rendering:** Full query re-execution on every render
4. **Missing Validation:** No checks for empty result sets
5. **Hardcoded View:** Tightly coupled to `livewire.tests.test-search-component` view
6. **SearchRequest Usage:** Creates but doesn't validate all parameters (empty arrays passed)

**Dependencies:**
- OfferService.searchItinerary(array)
- SearchRequest model
- Cruiseline, Ship, Port models

**Notes:**
- Located in Tests namespace (not a production component)
- Likely used for development/debugging
- Should be refactored or removed for production

---

## 🔗 Component Dependencies

### Services Used
- **OfferService** - Offer/itinerary filtering
- **NewOfferService** - Advanced filtering
- **CabinService** - Cabin availability
- **CurrencyService** (implied) - Currency handling

### Models Used
- Cruiseline, Ship, Port, Destination
- CruiseView, Itinerary, ItineraryElement, Cruise
- FibosSetting, OfferGroup
- Currency, Market, Website
- User, Seller, Role
- NewsletterContact, SearchRequest, ListingBanner

### Views Required
- All components require corresponding Blade views in `resources/views/livewire/`
- Skeleton placeholders in `resources/views/placeholders/`

---

## 🎨 Event Communication

### Dispatched Events
```
'cruiseTypeUpdated'      // TabSwitcher
'CruiselineDataLoad'     // CompaniesSlider
'updateDefaultSelection' // TotalPrice
'filter-execute'         // OfferFilter → listeners
'toggleOverlay'          // RegistrationOverlay
'step1Updated'           // CheckoutComponent → RegistrationOverlay
'itinerarySelected'      // LeadQuoteCabinSelection listener
'updatePassengers'       // LeadQuoteCabinSelection listener
```

### Listened Events
```
'update'             // SideFilters
'loadMore'           // SideFilters, OfferListing
'search'             // SearchList
'filter-execute'     // OfferListing, ListingTotalFoundComponent
```

---

## 📝 Migration Notes for Base44

### Livewire Architecture Issues
1. **Server-side state:** Heavy component state → network overhead
2. **Real-time communication:** WebSocket/AJAX for every interaction
3. **View coupling:** Tight coupling between component logic & view
4. **Reusability:** Hard to reuse between frontend/backend

### Refactoring Strategy for Base44

**Option 1: Migrate to React Components**
- Replace Livewire with React
- Fetch data via backend functions
- API-driven architecture
- Full decoupling of frontend/backend

**Option 2: Hybrid Approach**
- Keep simple display components (SearchBox, FilterUI)
- Move complex logic to backend functions
- Use automations for state updates
- API layer between frontend/backend

### Specific Component Refactors

**SearchBox:**
- Current: Server-side filtering, Livewire listeners
- Better: React component → API call to search function
- Backend function: searchCruises(destination, cruiseline, dateRange)

**OfferListing:**
- Current: Pagination + sorting via Livewire
- Better: React pagination → API with offset/limit
- Backend: getOffers(filters, page, sortBy)

**CheckoutComponent:**
- Current: Multi-step Livewire with session persistence
- Better: React form → API calls per step
- Backend functions: createQuote, updateQuoteDetails, processPayment

**TotalPrice:**
- Current: Real-time calculations via listeners
- Better: React component with local calculation
- API: Validate totals on checkout

### Performance Considerations
1. **Chatty Protocol:** Livewire sends/receives data per action
   - Solution: Batch requests, reduce frequency
2. **State Size:** Large component state → serialization overhead
   - Solution: Server-side state, send only changes
3. **Network:** Real-time listeners → high bandwidth
   - Solution: Pagination + lazy loading

### Security
- Newsletter email validation: Good (RFC + regex)
- SearchBox filters: User-input validation needed
- Checkout: Verify amounts server-side (not just frontend)
- Admin components: Role-based access control needed

### Hardcoded Values to Parametrize
```php
// SearchBox/OfferFilter - hardcoded top 5 cruiselines
// TabSwitcher - hardcoded default 'sea'
// PriceOptionsCard - random badge logic (should be data-driven)
// SellerSettingsComponent - hardcoded language/level lists
// AssistanceData - hardcoded day list
```

### Missing Features
- TrustpilotReviews: API integration incomplete
- Error handling: No explicit try/catch
- Validation messages: UI feedback limited
- Loading states: Skeleton placeholders only for some
- Accessibility: ARIA labels missing