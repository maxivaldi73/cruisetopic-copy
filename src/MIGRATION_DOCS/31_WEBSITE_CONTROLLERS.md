# Website Controllers

**Purpose:** Blade view rendering controllers for public-facing website pages (home, search, booking, destination details, etc.).  
**Namespace:** `App\Http\Controllers\Website`  
**Total Controllers:** 15

---

## 📋 Controller Index

| Controller | Primary Routes | Purpose |
|-----------|----------------|---------|
| AuthController | `/login`, `/register`, `/logout`, `/password-reset` | User authentication (login, registration, password reset) |
| CruiseController | `/cruise/{id}` | Display cruise detail page with cabin types and pricing |
| CabinController | `/cabin/{id}` | Display cabin specification details |
| CruiselineController | `/cruiseline/{id}`, `/ship/{id}` | Cruiseline and ship detail pages |
| DestinationController | `/destination`, `/destination/{id}` | Destination listing and detail pages |
| CustomPageController | `/{slug}` | Dynamic CMS page rendering by slug |
| ItineraryElementController | `/itinerary-element/{id}` | Port/itinerary stop detail page |
| HomeController | `/` | Homepage with deals and sliders |
| FinalConfigurationController | `/checkout/*` | Multi-step checkout/booking wizard (cabin selection, services, passengers) |
| ItineraryOfferController | `/search` | Cruise search with filters |
| LeadEmailVerificationController | `/verify-email/{id}/{hash}` | Email verification link for leads |
| NewOfferController | Empty (stub) | Placeholder, no active methods |
| OfferController | `/offers`, `/offer/{id}` | Offers/deals listing and detail |
| PortController | `/ports`, `/port/{id}` | Port listing and detail pages |
| QuoteController | `/quote/*` | Quote creation, customization, and retrieval |

---

## 🔐 AuthController

**Location:** `App\Http\Controllers\Website\AuthController`  
**Extends:** `Controller`

### Methods

#### `showLoginForm()` → View
Returns `website.pages.auth.login` view.

#### `login(Request $request)` → JsonResponse | RedirectResponse
- **Validation:** Requires `email` and `password`
- **Auth:** Attempts `Auth::attempt($credentials)`
- **Success:** Redirects to `route('customer.home')`
- **Failure:** Returns back with error: _"Le credenziali non sono corrette."_ (Italian)

#### `register()` → View
Returns `website.pages.auth.register` view.

#### `saveRegistration(RegistrationRequest $request)` → RedirectResponse
- **Input:** Uses `RegistrationRequest` form validation
- **Flow:**
  1. Create User with role = 'customer'
  2. Create associated Customer record
  3. Auto-login via `Auth::login($user)`
  4. Redirect to `customer.home` with success message
- **Error:** Catches exceptions, returns with error message

#### `sendResetLink(Request $request)` → RedirectResponse
- **Validation:** Email must exist in users table
- **Action:** `Password::sendResetLink($request->only('email'))`
- **Messages:** Success or failure flash message

#### `showResetPasswordForm($token, $email)` → View
Returns password reset form view with pre-filled email.

#### `resetPassword(Request $request)` → RedirectResponse
- **Validation:** Email, password, password_confirmation, token required
- **Action:** `Password::reset()` with callback to hash password
- **Redirect:** Login page on success

---

## ⛴️ CruiseController

**Location:** `App\Http\Controllers\Website\CruiseController`  
**Dependencies:** `ShipAmenityService`, `CabinService`

### Methods

#### `show($id)` → View
**Display:** Cruise detail page with cabin types and alternative departure dates.

**Key Operations:**
1. Load cruise via `CruiseView::findOrFail($id)`
2. Availability check: `abort(404)` if not available for booking
3. Fetch alternative cruises (same itinerary, future dates)
4. Get correct arrival port from last itinerary element
5. Load ship amenities via `ShipAmenityService`
6. Load available cabin types (enabled, with cabins)
7. **Merge cabin types:** Create comprehensive list of all possible types (`i`, `o`, `b`, `s`, `yc`)
   - Available: Pull from cruise pricing
   - Unavailable: Use cabin type dictionary (names, images)
   - Sort: Available first, then unavailable

**Returns:** View `website.pages.cruises.cruise-info` with:
- `cruise`, `cruiseline`, `ship` details
- `mergedCabinTypes` (comprehensive cabin list)
- `alternativeCruises` (same itinerary, different dates)
- `amenities` (ship facilities)

#### `show_2($id)` → View
Duplicate/legacy version of `show()` with simplified cabin loading (no merged types).

---

## 🛏️ CabinController

**Location:** `App\Http\Controllers\Website\CabinController`

### Methods

#### `show($id)` → View
Simple cabin detail page.
- Loads `Cabin::findOrFail($id)`
- Sets SEO metadata: title = `"Cabina{name}"`, description = `"Cabina {name} {description}"`
- Returns view `website.pages.cabins.show`

---

## 🚢 CruiselineController

**Location:** `App\Http\Controllers\Website\CruiselineController`  
**Dependencies:** `CruiselineService`, `DestinationService`, `ShipService`, `CabinService`

### Methods

#### `index(Request $request)` → View
Cruiseline listing page.
- Returns view `website.pages.cruiselines.index` with title = _"Compagnie"_
- **Note:** Actual cruiseline list likely loaded via Livewire component (data not queried here)

#### `show($id)` → View
Cruiseline detail page.
- Sets title = cruiseline name
- Returns view `website.pages.cruiselines.show`

#### `shipShow($id)` → View
Ship detail page.
- Loads `Ship::findOrFail($id)`
- Returns view `website.pages.ships.show`
- **Note:** Extensive commented code suggests legacy logic for cabin/itinerary/service relationships

---

## 🌍 DestinationController

**Location:** `App\Http\Controllers\Website\DestinationController`  
**Dependencies:** `DestinationService`, `OfferService`

### Methods

#### `index(Request $request)` → View
Destination listing page.
- Groups destinations by type
- Loads parent destinations separately
- Returns view with grouped and parent destination lists

#### `show($id)` → View
Destination detail page.
- Loads destination details
- Fetches website context from `request()->website`
- Returns view `website.pages.destinations.show`
- **Note:** Extensive commented legacy code for offer searching

#### `showCruisesIndex($id)` → View
Cruise listing for specific itinerary (legacy).
- **Hard-coded cabin data:** Contains static arrays of cabin types with sample pricing (inline `(object)` arrays)
- **No dynamic pricing:** Prices hard-coded to "1.558"
- **Status:** Appears to be for development/demo purposes

---

## 📄 CustomPageController

**Location:** `App\Http\Controllers\Website\CustomPageController`

### Methods

#### `show(Request $request, string $slug)` → View
Dynamic CMS page renderer.
- **Website scoping:** `$request->website` (from middleware context)
- **Page lookup:** `Page::where('slug', $slug)->where('website_id', $website->id)`
- **Blocks loading:** Eager loads and orders blocks by `sort_order` and `id`
- **Error:** `abort(404)` if page not found
- **View:** `website.pages.custom-page` with page data

---

## 🗺️ ItineraryElementController

**Location:** `App\Http\Controllers\Website\ItineraryElementController`

### Methods

#### `show($id)` → View
Itinerary element (port/stop) detail page.
- Loads `ItineraryElement::findOrFail($id)`
- Sets SEO metadata from destination: title = _"Tappa {destination}"_, description from destination
- Returns view `website.pages.itinerary-elements.show`

---

## 🏠 HomeController

**Location:** `App\Http\Controllers\Website\HomeController`  
**Dependencies:** `DestinationService`, `CruiselineService`, `OfferService`

### Methods

#### `index(Request $request)` → View
Homepage.
- **Page context:** `request()->page`, `request()->website->market_id`
- **Homepage deals:** Queries `Deal` where `is_homepage = true` for current market, ordered by `score DESC`
- **Slider logic:** Loads slider by page title, then loads slides for current market
- **Returns:** View `website.pages.home` with deals, slides, and market data

#### `redirectToMaintenancePage()` → View
Returns maintenance page view (likely for scheduled downtime).

---

## 🛒 FinalConfigurationController

**Location:** `App\Http\Controllers\Website\FinalConfigurationController`  
**Public properties:** `imageSrc`, `title`, `subtitle`, `description`, `priceGap`, `buttonUrl`, `changedCabinId`  
**Dependencies:** None (properties are managed internally)

### Methods

#### Constructor
Initializes cabin display data with hard-coded defaults (image URL, title, description, price difference).

#### `saveAndContinue(Request $request, $itineraryId)` → RedirectResponse
Step 1 of checkout: Customer contact information.
- **Validation:** firstname, lastname, email, phone (required)
- **Create/Update:** `Customer::find()` or create new
- **Save:** Store customer data
- **Redirect:** To cabin confirmation page with itinerary ID

#### `updateSelectedCabin($id, $itineraryId)` → RedirectResponse
User changes cabin selection.
- **Param:** `$id` = cabin index
- **Redirect:** To cabin confirmation view with selected cabin index

#### `cabinConfirmation($itineraryId, $cabinIndex)` → View
Step 2: Display selected cabin with pricing.
- **Fetch:** Itinerary, associated offer, travel packages (cabin pricing)
- **Validation:** Ensure cabin index is within range
- **Load:** Selected cabin package details
- **Returns:** View with itinerary, travel packages, selected package, and offer

#### `servicesChoice($itineraryId, $travelPackageId)` → View
Step 3: Select onboard services and extras.
- **Load:** Itinerary, travel package, ship services
- **Tabs structure:** Beverage, Services, Servizi Avanzati
- **Returns:** View with tabs and available services

#### `configuredEstimate($itineraryId, $travelPackageId)` → View
Step 4: Review total price estimate.
- **Fetch:** Itinerary, selected travel package
- **Returns:** View with final estimate breakdown

#### `passengersForm($itineraryId)` → View
Step 5: Enter passenger details.
- **Load:** Itinerary, document types (IC, PSP), dinner shifts (first/second)
- **Returns:** View with passenger form and reference data

---

## 🔍 ItineraryOfferController

**Location:** `App\Http\Controllers\Website\ItineraryOfferController`  
**Dependencies:** `NewOfferService`

### Methods

#### `search($river, $destinationId, $month, $date, $portId, $cruiselineId)` → View
**Cruise search page** with dynamic filter options.

**Input Processing:**
- Build `SearchRequest` from URL parameters (type casting, null handling)
- Date format conversion: Replace underscores/dashes

**Data Fetching:**
1. **Itineraries:** Query via `NewOfferService::searchCruisesQuery()`, paginated (5 per page)
2. **Filter options:** Ports, cruiselines, destinations, months (all via service)
3. **Count:** Total cruises matching filters
4. **Website context:** From request middleware

**Page Title Generation:**
- Dynamic title based on filters: _"Crociere in partenza da {port} con destinazione {dest} - {cruiseline} - {month}"_

**Returns:** View `website.pages.search.index` with all filter data, results, and count.

---

## ✉️ LeadEmailVerificationController

**Location:** `App\Http\Controllers\Website\LeadEmailVerificationController`

### Methods

#### `verify($id, $hash)` → View
Email verification link handler.

**Flow:**
1. Load `Lead::findOrFail($id)`
2. **Hash validation:** Compare `sha1($lead->email)` with provided `$hash`
   - Invalid: `abort(403)` with message _"Link di verifica non valido."_
3. **Already verified:** Return `email-already-verified` view if `email_verified_at` is set
4. **Mark verified:** Update all leads with same email: `email_verified_at = now()`
5. **Return:** View `website.leads.email-verified`

**Security Note:** Uses SHA1 for email hashing (weak for security; better: use signed URLs).

---

## ❌ NewOfferController

**Location:** `App\Http\Controllers\Website\NewOfferController`

**Status:** Stub controller with only constructor.
- **Dependencies:** `OfferService` injected but not used
- **No methods:** No active routes defined
- **Purpose:** Placeholder for future offer functionality

---

## 🎁 OfferController

**Location:** `App\Http\Controllers\Website\OfferController`  
**Dependencies:** `OfferService`, `MscBookingClient`, `CabinService`, `ShipAmenityService`

### Methods

#### `index()` → View
Offers/deals listing page.
- **Filters:**
  - Market = current website market
  - `is_homepage = false` (excludes homepage featured deal)
  - Activation dates: Only active deals (start <= now, end >= now)
- **Sorting:** By score DESC (highest rated first)
- **Returns:** View `website.pages.offers.index` with deal list

#### `dealShow($id)` → View
Deal detail page.
- **Load:** Deal with rules
- **Decode JSON:** Extract cruise IDs from `rule.configuration` JSON
- **Fetch cruises:** Load associated `CruiseView` records
- **Returns:** View `website.pages.offers.show` with deal details and cruise list

#### `preventivoShow()` → View
"Preventivo" (estimate/quote) page.
- Simple view render with title and website context

---

## ⚓ PortController

**Location:** `App\Http\Controllers\Website\PortController`  
**Dependencies:** `PortService`

### Methods

#### `index(Request $request)` → View
Port listing page.
- **Load:** Destinations grouped with their ports via `PortService::getDestinationsWithPorts()`
- **Returns:** View `website.pages.ports.index` with grouped destinations

#### `show($id)` → View
Port detail page.
- **Load:** Port details via `Port::findOrFail($id)`
- **SEO metadata:** Title = _"{Port} Porto"_, description = port name
- **Returns:** View `website.pages.ports.show`

---

## 💰 QuoteController

**Location:** `App\Http\Controllers\Website\QuoteController`  
**Dependencies:** `LeadServices`, `QuoteService`, `ProductService`, `MscBookingService`, `CustomerService`

### Methods

#### `resumeQuote(Request $request, $token)` → View
**Resume quote from recovery link.**
- **Load:** Quote by `recovery_token`, extract lead
- **Reconstruct:** Rebuild quote session data from stored `response_call` JSON
- **Normalize:** Convert arrays to objects for view compatibility
- **Fetch:** Cruise, onboard items, website context
- **Load preferences:** Quote preferences, memberships, extras from DB
- **Returns:** View `website.pages.checkout.index` with all quote data

#### `createQuote(QuoteRequest $request)` → RedirectResponse
**Create new quote from checkout form.**
- **Validation:** Form request validation (`QuoteRequest`)
- **Service call:** `QuoteService::createQuoteFromRequest($request)`
- **Redirect:** To quote customization page with recovery token

#### `customizeQuote(Request $request, string $token)` → View
**Customize existing quote before payment.**
- **Load:** Quote by `recovery_token`
- **Protection:** Abort if quote already accepted or archived
- **Returns:** View `website.quote.customize` with quote data

#### `handleCabinQuote(Request $request)` → View
**@deprecated Checkout handler (old pattern).**

Large method handling complete checkout flow:
1. Decode JSON step1, cabinTypes from request
2. Load/create lead
3. Load/create quote
4. **MSC-specific:** Query pricing via `MscBookingService`
5. Extract cabin prices, onboard items (beverages, services)
6. Construct JSON response structure
7. Save to quote + database
8. Return checkout view

#### `getCabinPrices($cruise, $step1, $cabinTypeCode, $cabinName)` → array
**Query MSC pricing for cabin categories.**
- **Guard:** Return empty if cruiseline is not MSC
- **MSC API call:** `searchCruises()` to get cruise itinerary with prices
- **Loop:** Process each cruise category, fetch available cabins
- **Extract:** Included items, service charges, prices
- **Normalize:** Build unique code for price variant
- **Storage:** Save JSON backup to `temp/msc/`

#### `getOnboardItems($cruise, $step1)` → array
**Fetch onboard services from MSC API.**
- **Guard:** Return empty (currently disabled)
- **MSC API:** `shopRequest()` to fetch available services
- **Group:** By service type (beverages, services, etc.)

---

## 🏗️ Issues & Architecture Notes

### Shared Problems

1. **Hard-coded Strings:**
   - Italian error/status messages embedded in controllers
   - URL placeholders (`#`, Travelzoo images)
   - Cabin type codes (`i`, `o`, `b`, `s`, `yc`) hard-coded

2. **Extensive Commented Code:**
   - CruiselineController, DestinationController, QuoteController have large blocks of legacy logic
   - Suggests incomplete refactoring

3. **Static Cabin Data:**
   - DestinationController::showCruisesIndex() uses hard-coded cabin arrays
   - Not fetched from database

4. **Email Hash Security:**
   - LeadEmailVerificationController uses SHA1 (weak), should use signed URLs

5. **MSC-Specific Logic:**
   - QuoteController tightly coupled to MSC (`if ($cruiseline->code !== 'MSC')`)
   - getCabinPrices(), getOnboardItems() are MSC-only

6. **Session/Context Injection:**
   - Heavy reliance on `request()->website`, `request()->page` from middleware
   - Not explicit in method signatures

7. **No Input Validation on Route Params:**
   - `show($id)` methods receive IDs without explicit validation
   - Eloquent's `findOrFail()` handles 404, but no authorization checks

---

## 📝 Migration Notes for Base44

### Strategy

**Replace Blade rendering with React pages + backend functions for data.**

### Patterns

#### Page Rendering → React Component
```typescript
// Old: AuthController::showLoginForm() returns Blade view
// New: Route component (React page)
export default function LoginPage() {
  return <LoginForm />;  // No server data needed
}
```

#### Data + View → Backend Function + React
```typescript
// Old: CruiseController::show() queries cruise + cabin data, returns Blade view
// New: Backend function for data, React component for rendering

// Backend function: getCruiseData
async function getCruiseData(req) {
  const { cruiseId } = await req.json();
  const cruise = await base44.entities.Cruise.get(cruiseId);
  const cabins = await base44.entities.Cabin.filter({ cruise_id: cruiseId });
  return Response.json({ cruise, cabins });
}

// React component: CruisePage
export default function CruisePage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    base44.functions.invoke('getCruiseData', { cruiseId }).then(setData);
  }, []);
  return <CruiseView cruise={data?.cruise} cabins={data?.cabins} />;
}
```

#### Form Submission → Backend Function
```typescript
// Old: AuthController::saveRegistration() creates User/Customer
// New: Backend function + React form handler

async function registerUser(req) {
  const { email, password, firstName, lastName } = await req.json();
  const user = await base44.entities.User.create({ email, password, full_name: `${firstName} ${lastName}`, role: 'user' });
  // Auto-login handled by platform
  return Response.json({ success: true, userId: user.id });
}

// React: useForm hook handles submission
const handleSubmit = async (data) => {
  const res = await base44.functions.invoke('registerUser', data);
  navigate('/dashboard');
};
```

#### Multi-step Checkout → Automations + Backend Functions
```typescript
// Old: FinalConfigurationController with 5+ methods for each step
// New: Single Quote entity + state machine via automations

// Quote entity:
{
  step: 1 | 2 | 3 | 4 | 5,  // Current step
  cruise_id,
  customer_data,
  cabin_id,
  services,
  passengers,
  recovery_token
}

// Backend functions:
- createQuote(cruiseId, customerData) → creates Quote with step=1
- updateQuoteStep(quoteId, step, data) → updates step + data
- completeQuote(quoteId) → finalizes booking

// React: Multi-step form component manages UI, calls functions per step
```

#### Service-Specific Logic → Conditional Backend Functions
```typescript
// Old: getCabinPrices() tightly coupled to MSC
// New: Dispatch to provider-specific function

async function getCabinPrices(req) {
  const { cruiseId } = await req.json();
  const cruise = await base44.entities.Cruise.get(cruiseId);
  
  if (cruise.cruiseline.code === 'MSC') {
    return invokeMscPricing(cruise);
  } else if (cruise.cruiseline.code === 'COSTA') {
    return invokeCostaPricing(cruise);
  }
  return Response.json({ prices: [] });
}
```

### Entities Required

Ensure these entities exist with proper fields:

**Core:**
- Cruise, Cruiseline, Ship, Port, Destination, Itinerary
- Cabin, CabinType
- User (with role field)

**Booking:**
- Quote (step, cruise_id, customer_id, recovery_token, response_call, preferences, memberships, extras)
- Lead (email, email_verified_at)
- Customer (user_id, contact info)

**Content:**
- Page (slug, website_id, blocks)
- PageBlock (type, content, settings, sort_order)
- Deal (title, rules, score, is_homepage, market_id, activation_start, valid_to)
- Slider, Slide (for homepage)

**Configuration:**
- Website (hostname, market_id, website_id for pages)
- Market

### Key Improvements

1. **Separation of concerns:** Backend functions handle data, React handles UI
2. **Testability:** Backend functions independently testable
3. **Reusability:** Functions callable from multiple pages
4. **Type safety:** TypeScript + Zod schemas for API contracts
5. **No more Blade:** Pure React for all UI rendering
6. **Stateless:** Each page request independent (no session reliance)