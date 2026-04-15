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

## 📊 Admin Table Components

### OfferGroupsTableInline

**Location:** `App\Livewire\Tables\OfferGroupsTableInline`  
**Purpose:** Inline CRUD for offer groups per market  
**Market-Scoped:** Yes (filters by marketId)  
**Traits:** WithFileUploads

**State Variables:**
```php
$marketId               // Filter scope
$editedOfferGroupIndex  // Row edit tracking
$editedOfferGroupField  // Field-level edit tracking
$offerGroups = []       // Table data (array)
$coverInputs = []       // File upload inputs
```

**Validation:**
```php
'offerGroups.*.name' => ['required']
```

**Key Methods:**

#### `mount($marketId)`
- Load offer groups for specific market
- Convert to array for component state
- Guard: returns empty array if no records

#### `editOfferGroup($index)` / `editOfferGroupField($index, $fieldName)`
- Set edit mode on row/field
- Field tracking: `"{index}.{fieldName}"` (dot-notation)

#### `addNew()`
- Creates empty OfferGroup instance
- Converts to array
- Pushes to component state

#### `saveOfferGroup($offerGroupIndex)`
- Validates all rules
- **Update Path:** If ID exists → find & update
- **Create Path:** If no ID → fill, set market_id & enabled=false, save
- Updates local array with new ID/enabled after create
- Clears edit tracking

#### `deleteOfferGroup($index)`
- Finds by ID from array
- Deletes from DB
- Removes from local array
- Redirects back (Livewire component in page)

#### `cancel()`
- Removes last item from array (intended for new row cancellation)
- **Bug Risk:** Doesn't check if last item is the one being edited

**Features:**
- Market-specific filtering
- File uploads support (WithFileUploads trait)
- Inline create/edit/delete
- Conditional insert vs update

**Issues:**
1. **Inefficient Query:** `count() > 0` then get again
2. **Empty Constructor:** No initialization logic
3. **Array Re-indexing Missing:** `unset()` leaves gaps, not re-indexed
4. **Cancel Logic:** `array_pop()` blindly removes last, risky
5. **Redirect Pattern:** Uses redirect() in Livewire component (should emit event)

---

### PaymentMethodsTable

**Location:** `App\Livewire\Tables\PaymentMethodsTable`  
**Purpose:** Inline CRUD for payment methods (global, no market scope)

**State Variables:**
```php
$editedPaymentMethodIndex  // Row edit tracking
$editedPaymentMethodField  // Field-level edit tracking
$paymentMethods = []       // Table data (array)
```

**Validation:**
```php
'paymentMethods.*.name' => ['required'],
'paymentMethods.*.type' => ['required'],
```

**Key Methods:**

#### `mount()`
- Load all PaymentMethod records
- Convert to array

#### `editPaymentMethod($index)` / `editPaymentMethodField($index, $fieldName)`
- Set edit mode (identical to OfferGroupsTableInline)

#### `addNew()`
- Creates empty PaymentMethod instance
- Pushes to component state

#### `savePaymentMethod($paymentMethodIndex)`
- Validates all rules
- **Update Path:** If ID exists → find & update
- **Create Path:** If no ID:
  1. Fill model with data
  2. Save to DB
  3. **Inefficient:** Pop all items, update with new ID, push back
  4. Local array updated
- Clears edit tracking

#### `deletePaymentMethod($index)`
- Finds by ID
- Deletes from DB
- Removes from local array
- Redirects back

#### `cancel()`
- Removes last item (same pattern as OfferGroupsTableInline)

**Features:**
- Global payment methods (no scoping)
- Required validation on name & type
- Inline CRUD operations
- Conditional insert vs update

**Issues:**
1. **Inefficient Save:** `array_pop()` all items, then `array_push()` back
2. **No Re-indexing:** `unset()` leaves gaps after delete
3. **Redirect Pattern:** Uses redirect() in Livewire (risky)
4. **Empty Constructor:** No logic

**Differences from OfferGroupsTableInline:**
- No market scoping
- Requires `type` field (2 validations vs 1)
- No file upload support (no WithFileUploads)
- Inefficient item reassembly on create

---

## 📝 Table Components Common Issues

### Shared Problems
1. **Array Index Management:** Using `unset()` without re-indexing leaves gaps
2. **Redirect in Components:** Both use `redirect()->back()` (not Livewire pattern)
3. **Empty Constructors:** No initialization
4. **Query Inefficiency:** OfferGroupsTableInline counts then gets
5. **Cancel Logic:** `array_pop()` is unreliable (removes last, not current edit)

### Security Concerns
- No authorization checks (who can edit/delete)
- No audit trail
- Direct model fill() without mass assignment guards
- Redirect success messages empty

### Performance Issues
- Full table reload on every action
- Array operations instead of efficient DB queries
- No pagination for large datasets
- File upload state but no upload implementation visible

---

## Migration Notes for Base44 (All Table Components)

### Current Pattern
```php
// Livewire: Load → Array → Edit → Save
$items = Model::all()->toArray();
// ... edit in UI ...
Model::findOrFail($id)->update($edited);
```

### Recommended Base44 Pattern
```typescript
// Backend function for CRUD
async function saveOfferGroup(req) {
  const { id, data } = req.body;
  if (id) {
    await base44.entities.OfferGroup.update(id, data);
  } else {
    await base44.entities.OfferGroup.create(data);
  }
}

// Frontend: React component + API calls
const [offerGroups, setOfferGroups] = useState([]);
const handleSave = async (index, data) => {
  const response = await base44.functions.invoke('saveOfferGroup', data);
  setOfferGroups(prev => [...prev.slice(0, index), response, ...prev.slice(index + 1)]);
};
```

### Refactoring Benefits
1. **Cleaner State:** React handles UI state, backend handles persistence
2. **Better Error Handling:** Try/catch per operation
3. **Proper Redirects:** No server redirects, emit frontend events
4. **Authorization:** Check in backend function per action
5. **Audit Trail:** Log all changes server-side
6. **Pagination:** Lazy load large datasets
7. **Mass Assignment:** Explicit field whitelist in backend

---

## ⛴️ Ship Components

### ShipCardComponent

**Location:** `App\Livewire\Ships\ShipCardComponent`  
**Purpose:** Display ship summary card (for listing/carousel)  
**Skeleton:** None

**Mounted Properties:**
```php
public $ship              // Ship model (passed to component)
public $itinerariesCount  // Counted in mount
public $shipCoverUrl      // Media URL with fallback
```

**Key Methods:**

#### `mount()`
- Calls `$ship->itinerariesCount()` method
- Gets cover image via Spatie MediaLibrary
- **Fallback URL:** Hardcoded placeholder from creativefabrica.com
- **Double Call Issue:** Calls `getFirstMediaUrl('cover')` twice (once for check, once for assignment)

**Features:**
- Ship name (from model)
- Itinerary count display
- Cover image with fallback
- Lightweight card display

**Issues:**
1. **Hardcoded Fallback URL:** External image URL (should be app asset)
2. **Double Media Call:** Inefficient getFirstMediaUrl() called twice
3. **No Error Handling:** Media URL fetch could fail
4. **No Interactivity:** Display-only component

**Optimization:**
```php
// Instead of:
$url = $this->ship->getFirstMediaUrl('cover');
$this->shipCoverUrl = !empty($url) ? $url : 'fallback';

// Better:
$this->shipCoverUrl = $this->ship->getFirstMediaUrl('cover') ?? 'fallback';
```

---

### ShipShowComponent

**Location:** `App\Livewire\Ships\ShipShowComponent`  
**Purpose:** Detailed ship page with upcoming cruises

**Mounted Properties:**
```php
public $ship              // Ship model
public $shipCoverUrl      // Cover image URL
public $itineraryGroups   // Upcoming cruises (7 results)
public $nowMonth = 0      // Current month (unused)
public $nowDate = null    // Current date (unused)
```

**Key Methods:**

#### `mount()`
- Gets cover image via Spatie MediaLibrary
- Calls `getShipItineraryGroups()`
- `nowMonth` and `nowDate` initialized but never used

#### `getShipItineraryGroups()`
- **Query:** CruiseView filtered by ship_id
- **Filters Applied by CruiseView:**
  - departure_date > today (future cruises only)
  - sellability = 1 (available for booking)
  - best_price IS NOT NULL (has pricing)
- **Ordering:** By departure_date ASC
- **Limit:** 100 records initially
- **De-duplication:** `.unique('itineraryCode')` (removes same route, different dates)
- **Final Limit:** `.take(7)` (top 7 unique itineraries)
- **Re-index:** `.values()` (reset array keys)

**Features:**
- Ship details (photo, description from model)
- Upcoming cruises (7 unique routes)
- Sorted by departure date
- Pre-filtered for available/sellable cruises
- No pagination/filtering UI

**Issues:**
1. **Unused Variables:** `nowMonth` and `nowDate` never used
2. **Hardcoded Limits:** 100 then 7 (magic numbers)
3. **In-Memory De-duplication:** `.unique()` on 100 results in PHP (should be DB query)
4. **No Pagination:** Fixed 7 results, no "Load More"
5. **Empty Cover Fallback:** Falls back to empty string (no placeholder)
6. **No Sorting Options:** User can't sort by price/rating
7. **Unused Imports:** OfferService, Itinerary imports unused

**Performance Note:**
```php
// Current: Inefficient
CruiseView::where(...)->limit(100)->get()->unique('itineraryCode')->take(7)
// Loads 100, deduplicates in-memory, takes 7

// Better: Use database
CruiseView::where(...)->groupBy('itineraryCode')->limit(7)->get()
// Or join with distinct on itineraryCode
```

---

## Ship Components Comparison

| Feature | ShipCard | ShipShow |
|---------|----------|----------|
| Purpose | Card display | Detailed page |
| Data Loaded | Count only | Count + cruises |
| Itinerary Data | Count only | 7 upcoming cruises |
| Image | Cover only | Cover only |
| Interactivity | None | None |
| Filtering | None | Pre-filtered (available/sellable) |
| Pagination | N/A | Fixed 7 results |
| Sorting | N/A | By departure_date |

---

## Migration Notes for Ship Components (Base44)

### Current Architecture
```php
// Component loads ship data
$ship = Ship::find($id);
$this->itineraryGroups = CruiseView::where('ship_id', $id)->unique()->take(7)->get();
```

### Base44 Approach

**1. Backend Function: getShipDetails**
```typescript
async function getShipDetails(req) {
  const { shipId } = req.body;
  const ship = await base44.entities.Ship.get(shipId);
  const cruises = await base44.entities.CruiseView.filter({
    ship_id: shipId,
    availability: true,  // RLS or explicit filter
  });
  
  return {
    ship,
    upcomingCruises: cruises.slice(0, 7)
  };
}
```

**2. React Component: ShipShowPage**
```typescript
export default function ShipShowPage({ shipId }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    base44.functions.invoke('getShipDetails', { shipId })
      .then(setData);
  }, [shipId]);
  
  return (
    <div>
      <ShipCard ship={data?.ship} />
      <CruiseList cruises={data?.upcomingCruises} />
    </div>
  );
}
```

### Benefits
1. **Data Loading:** Decoupled from component lifecycle
2. **Reusability:** Function can be called from multiple pages
3. **Pagination:** Easy to add offset/limit parameters
4. **Filtering:** Add price/rating/duration filters
5. **Caching:** Cache results in backend (Redis)
6. **Error Handling:** Try/catch per operation
7. **Authorization:** Verify user can access ship

### Hardcoded Values to Address
- ShipCardComponent: Fallback image URL (use app asset)
- ShipShowComponent: Limits 100 and 7 (parametrize or move to config)

---

## 🌍 Port Components

### PortCard

**Location:** `App\Livewire\Ports\PortCard`  
**Purpose:** Display port summary card (for listing/carousel)

**State Variables:**
```php
public $port                 // Port model (passed to component)
public $formattedPortName    // Formatted port name
public $itinerariesCount     // Count of unique itineraries
public $portCruiselines      // Top 4 cruiselines operating from port
public $backgroundUrl        // Cover image URL with fallback
```

**Key Methods:**

#### `mount()`
- Get top 4 cruiselines via `port->Cruiselines()` (array_slice)
- Count unique itineraries via `port->Itineraries()->groupBy('itineraryCode')->get()->count()`
- Get cover image with hardcoded fallback (lighthouse icon from vecteezy.com)
- Format port name via `fixAndFormatPortName()`

#### `fixAndFormatPortName($name)`
- HTML entity decode (UTF-8)
- Capitalize first letter of each word and special characters
- Returns formatted port name

**Features:**
- Port name formatting
- Itinerary count
- Top 4 cruiselines display
- Cover image with fallback

**Issues:**
1. **Hardcoded Fallback URL:** External image (should be app asset)
2. **Double Media Call:** getFirstMediaUrl() called twice in condition
3. **Cruiselines Method Call:** Calls `port->Cruiselines()` method (performance concern if large dataset)
4. **Itinerary Grouping:** In-memory groupBy after fetch (should be DB query)

---

### PortsDestinationsTab

**Location:** `App\Livewire\Ports\PortsDestinationsTab`  
**Purpose:** Render ports for a specific destination tab

**State Variables:**
```php
public $destination     // Destination model (passed to component)
public $loop            // Blade @foreach loop variable (unused?)
public $destinationId   // Stored destination ID (set in mount)
```

**Key Methods:**

#### `mount($destination)`
- Receives destination model
- Stores only `destination->id` (not the full destination)
- **Issue:** Destination model passed but not stored

#### `render()`
- Returns view with destination context

**Features:**
- Per-destination port display
- Minimal logic

**Issues:**
1. **Unused Parameter:** Destination passed but not stored
2. **Unused Variables:** `$loop` property never used
3. **Missing Data Fetching:** No ports loaded in component
4. **Incomplete Implementation:** View likely handles port loading

---

### PortShowComponent

**Location:** `App\Livewire\Ports\PortShowComponent`  
**Purpose:** Detailed port page display

**State Variables:**
```php
public $port             // Port model (passed to component)
public $backgroundUrl    // Cover image URL
```

**Key Methods:**

#### `render()`
- Sets background URL (cover image with hardcoded fallback)
- **Issue:** Logic runs in render() instead of mount()
- Gets called on every re-render (inefficient)

**Features:**
- Port detail display
- Background image

**Issues:**
1. **Logic in render():** Should be in mount() for performance
2. **Hardcoded Fallback URL:** External image (same lighthouse icon as PortCard)
3. **Double Media Call:** getFirstMediaUrl() called twice in condition
4. **No Additional Logic:** Display-only component

---

### PortsList

**Location:** `App\Livewire\Ports\PortsList`  
**Purpose:** Paginated list of ports with destination-based filtering and tabs

**State Variables:**
```php
public $perPage = 12                // Ports per page
public $destinations = []           // All enabled destinations (parent_id = null)
public $activeTab = null            // Current tab ('all' or destination ID)
public $portsByTab = []             // Ports per tab (cached, keyed by tabId)
public $pageByTab = []              // Current page per tab
public $hasMoreByTab = []           // Has more results per tab
public $loadingTab = false          // Loading state
```

**Key Methods:**

#### `mount()`
- Load enabled parent destinations only
- Order by name
- Initialize 'all' tab (all ports)
- Load first page of ports for 'all' tab

#### `initTab($tabId)`
- Initialize page=1, empty ports array, hasMore=true for new tab
- Guard: only initialize if not already initialized

#### `selectTab($tabId)`
- Change active tab
- Initialize tab if needed
- Load ports only if not already cached

#### `loadMorePorts()`
- Load next page for active tab
- Increment page counter

#### `loadPortsForTab($tabId)`
- **Query Building:**
  - Select: id, name, score, sunny_days, temperature_avg
  - Filter: whereHas('itineraries') (only ports with cruises)
  - Eager load: media (cover), itineraries with cruiselines + logos
  - Count: itineraries_count via withCount
  - Order: by score DESC, then name ASC
  - Filter by destination: if tabId !== 'all', whereHas Destinations with id
  
- **Pagination:**
  - Offset: (page - 1) * perPage
  - Fetch: perPage + 1 (to detect if more results)
  - hasMore flag set if results > perPage
  
- **Data Processing:**
  - Map ports to array format
  - Extract unique cruiselines (up to 5) with logos
  - Format port names via fixAndFormatPortName()
  - Add computed properties (formatted_name, cover_url, cruiselines)
  
- **State Management:**
  - Merge with existing ports (pagination accumulation)
  - Increment page counter
  - Update hasMore flag

#### `fixAndFormatPortName($name)`
- HTML entity decode + capitalize
- Same as PortCard method

**Features:**
- Multi-tab filtering (All + per-destination tabs)
- Lazy-loaded pagination per tab
- Eager loading optimization
- Cruiseline logos display (up to 5)
- Port scoring and sorting
- Climate data (sunny_days, temperature_avg)

**Issues:**
1. **Hardcoded Fallback URLs:** Multiple hardcoded image URLs (lighthouse, cruiseline logo)
2. **Duplicate Method:** fixAndFormatPortName() exists in PortCard + PortsList (code duplication)
3. **In-Memory Uniquing:** `.unique('id')` on itineraries (should use DB distinct)
4. **Static Limit:** 5 cruiselines hardcoded
5. **Media Double-Call:** Not in query but post-processing via getFirstMediaUrl()

---

## Port Components Comparison

| Feature | PortCard | PortsDestinationsTab | PortShowComponent | PortsList |
|---------|----------|---------------------|-------------------|-----------|
| Purpose | Card display | Destination tab | Detail page | Full list/pagination |
| Data Loaded | Count + cruiselines | None | Image only | Full ports with filters |
| Filtering | None | Destination | None | By destination (tabbed) |
| Pagination | N/A | N/A | N/A | Yes (per-tab) |
| Cruiselines | Top 4 | None | None | Top 5 (post-process) |
| Interactivity | Display | Display | Display | Tab switch + Load More |

---

## Port Components Common Issues

### Shared Problems
1. **Hardcoded Fallback URLs:** 3 different hardcoded URLs (lighthouse, cruiseline logo) → should be config constants
2. **Code Duplication:** fixAndFormatPortName() in both PortCard and PortsList
3. **Media Efficiency:** getFirstMediaUrl() called multiple times (double-call pattern)
4. **In-Memory Processing:** unique(), filtering done in PHP after fetch (should be DB queries)
5. **Incomplete Implementation:** PortsDestinationsTab has minimal logic, likely incomplete

### Security Concerns
- No authorization checks
- Direct model access via properties

### Performance Issues
- PortCard: Full Cruiselines() relation loaded
- PortsList: 5 cruiselines extracted post-fetch (in-memory unique)
- Media queries in eager loading could be optimized

---

## Migration Notes for Port Components (Base44)

### Hardcoded Assets to Move to Config
```php
// Current: Scattered throughout
'https://static.vecteezy.com/...'
'https://ih1.redbubble.net/...'

// Better: Config constant
config('app.fallback_images.port_cover')
config('app.fallback_images.cruiseline_logo')
```

### Method Extraction
- Move `fixAndFormatPortName()` to dedicated PortFormatter utility
- Use shared utility from all components

### Base44 Refactor

**Backend Function: getPortsList**
```typescript
async function getPortsList(req) {
  const { tabId, page, perPage } = req.body;
  const ports = await base44.entities.Port.filter({
    destination_id: tabId !== 'all' ? tabId : null,
  });
  
  return {
    ports: ports.slice((page - 1) * perPage, page * perPage),
    hasMore: ports.length > page * perPage,
    total: ports.length
  };
}
```

**React Component Pattern:**
```typescript
const [activeTab, setActiveTab] = useState('all');
const [ports, setPorts] = useState([]);

const loadPorts = async (tabId) => {
  const data = await base44.functions.invoke('getPortsList', 
    { tabId, page: 1, perPage: 12 }
  );
  setPorts(data.ports);
};
```

### Benefits
1. **Shared Constants:** Centralized fallback URLs
2. **No Duplication:** Single formatter utility
3. **Clean Separation:** Backend handles DB, frontend handles UI
4. **Easier Testing:** Functions testable independently
5. **Reusability:** Function callable from multiple pages

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