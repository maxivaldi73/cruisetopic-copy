# Checkout Components

**Purpose:** Multi-step checkout wizard for cruise booking with cabin selection, passenger details, service add-ons, and payment processing.  
**Architecture:** Step-based components with shared Quote state, service integration, and payment handling.  
**Total Components:** 7 (6 step components + 1 overview component)

---

## 📋 Component Index

| Component | Purpose | Step |
|-----------|---------|------|
| BookingSummary | Quote summary display | Display |
| ChooseACabin | Cabin type selection & pricing | Step 1 |
| CustomizeServices | Add-on services (insurance, meals) | Step 2 |
| CustomizePassengers | Passenger details entry | Step 3 |
| CustomizePayment | Payment method & installments | Step 4 |
| BookingFinalOverview | Complete booking summary | Step 5 |
| FinalCheckoutComponent | Final confirmation & processing | Final |

---

## 📊 BookingSummary (Display Component)

**Location:** `App\Livewire\Checkout\BookingSummary`  
**Purpose:** Display quote summary with real-time updates

### State Variables

```php
public $quoteId;                   // Quote reference
public $quote;                     // Quote model
public $cruise;                    // Cruise details
public $serviceChargePerCabin;     // Service charge amount
```

### Event Listeners

```php
protected $listeners = [
    'cabin-saved' => 'loadData',      // Refresh on cabin change
    'services-updated' => 'loadData', // Refresh on service change
    'refresh' => '$refresh',          // Manual refresh
];
```

### Key Methods

#### `loadData()`
- Reloads quote and updates display
- Triggered by sibling components

### Issues

1. **Heavily Commented Code:** 50% of file is commented
2. **Unclear Purpose:** Summary or full form?
3. **Event-Driven:** Tightly coupled to sibling events
4. **No Validation:** Displays data without checks

---

## 🚪 ChooseACabin (Step 1)

**Location:** `App\Livewire\Checkout\ChooseACabin`  
**Purpose:** Select cabin type and pricing from available options

### State Variables

```php
public $quoteId;
public Quote $quote;              // Current quote
public Cruise $cruise;            // Selected cruise
public $cabinPrices = [];         // Available cabin prices
public $priceId;                  // Selected price ID
public $selectedCabinType;        // Selected cabin type code
public $choose_own_cabin = 0;     // Flag: custom cabin selection
public $lunchSession;             // Lunch session (on-board)
public $memberships = [];         // Membership types
public $cabinTypesByCode;         // Cabin types indexed by code
```

### Service Integration

```php
protected QuoteService $quoteService;  // Injected via boot()
```

### Key Methods

#### `mount()`
- Load quote, cruise, and pricing
- Set default selections

#### `selectCabinType($code, $priceId)`
- Update selected cabin
- Validate price availability
- Dispatch `cabin-saved` event

#### `chooseCabin()`
- Toggle custom cabin selection mode

#### `getCabinTypesByPriceId($priceId)`
- Fetch available cabin types for price

### Features
- Cabin type selection
- Price display per cabin
- Lunch session selection
- Membership tracking
- Real-time price updates

### Issues

1. **Service Dependency:** Requires QuoteService (not shown)
2. **Hard-coded Lunch Sessions:** No flexible meal times
3. **No Error Handling:** Assumes prices exist
4. **Direct Quote Modification:** May bypass validation
5. **Multiple Queries:** Fetches data repeatedly

---

## 🍽️ CustomizeServices (Step 2)

**Location:** `App\Livewire\Checkout\CustomizeServices`  
**Purpose:** Add optional services (insurance, dining packages, etc.)

### State Variables

```php
public $quoteId;
public Quote $quote;
public Cruise $cruise;
public $selectedAllInc;          // All-inclusive package selected
public $selectedComm;            // Dining package selected
public $selectedService;         // Service/activity selected
public $selectedInsurance;       // Insurance package selected
public $childPriceDetails = [    // Child pricing
    'price_name' => '',
    'price_amount' => 0,
];
```

### Service Integration

```php
protected QuoteService $quoteService;
```

### Event Listeners

```php
protected $listeners = [
    'cabin-saved' => 'load',    // Reload when cabin changes
    'refresh' => '$refresh',
];
```

### Key Methods

#### `mount()`
- Load quote and cruise
- Initialize service selections

#### `selectService($serviceId, $code)`
- Add/remove service from quote
- Update totals
- Validate pricing

#### `load()`
- Reload services on event trigger

#### `#[Computed] getServices()`
- Computed property (Livewire 3)
- Filter products by cruise

### Features
- Multiple service types (insurance, dining, activities)
- Child pricing handling
- Real-time price calculation
- Service composition

### Issues

1. **Massive File:** 32KB (largest component)
2. **Complex Pricing Logic:** Embedded throughout
3. **Child Pricing:** Inconsistent with adult pricing
4. **Multiple Service Types:** Confusing state structure
5. **No Validation:** Services added without verification

---

## 👥 CustomizePassengers (Step 3)

**Location:** `App\Livewire\Checkout\CustomizePassengers`  
**Purpose:** Enter passenger details (name, nationality, age, etc.)

### State Variables

```php
public $quoteId;
public Quote $quote;
public $lead;                    // Lead/booking contact
public $passengers = [];         // Array of passenger data
public $countries = [];          // Available countries
public $nationalitySearch = [];  // Search terms per passenger
public $nationalityResults = []; // Search results
```

### Service Integration

```php
protected QuoteService $quoteService;
```

### Key Methods

#### `mount()`
- Load quote and lead
- Initialize passengers from quote
- Load country list

#### `updatePassengers($passengers)`
- Update passenger data
- Validate required fields
- Save to quote

#### `searchNationality($index, $query)`
- Search countries by name
- Return filtered results
- Update results for autocomplete

### Features
- Passenger form with validation
- Nationality autocomplete
- Multiple passengers support
- Age/birthdate tracking

### Issues

1. **Commented Code:** Listeners and properties commented out
2. **No Validation:** Accept any input
3. **Country Lookup:** No caching of countries
4. **Field Mapping:** Unclear which fields required

---

## 💳 CustomizePayment (Step 4)

**Location:** `App\Livewire\Checkout\CustomizePayment`  
**Purpose:** Select payment method and configure installments

### State Variables

```php
public $quoteId;
public $quote;
public $paymentConditions;              // Payment terms
public $paymentMethodId;                // Selected method
public bool $termsAccepted = false;     // T&C acceptance
public $showRateOption = false;         // Show exchange rate option
public $showAccontoSaldoOption = false; // Show deposit/balance option
public bool $canPay = true;             // Payment availability

// Installment fields
public $totalAmount = 0;
public $countMonths = 1;
public $monthlyInstallmentAmount = 0;
public $depositAmount = 0;
public $balanceAmount = 0;
public $monthlyInstallments = 0;
public $remainingDueDate;
public $paymentError = null;
```

### Service Integration

```php
protected InstallmentSettingService $installmentService;
protected QuoteService $quoteService;
protected RevolutService $revService;
```

### Event Listeners

```php
protected $listeners = [
    'paymentMethodSelected' => 'onPaymentMethodSelected',
];

// Attributes (Livewire 3 syntax)
#[On('paymentMethodSelected')]
public function onPaymentMethodSelected($methodId)
```

### Key Methods

#### `mount()`
- Load quote and payment conditions
- Initialize installment settings

#### `selectPaymentMethod($methodId)`
- Set selected payment method
- Show/hide rate and installment options
- Trigger event

#### `calculateInstallments($months)`
- Split total into monthly payments
- Calculate deposit amount
- Set due dates

#### `processPayment()`
- Validate payment data
- Create installment records
- Call external payment service (Revolut)
- Handle errors

#### `onPaymentMethodSelected($methodId)`
- Event handler for payment method selection

### Features
- Payment method selection (multiple providers)
- Installment plan calculation
- Revolut integration (payment processor)
- Exchange rate display (for forex)
- T&C acceptance
- Error handling and display

### Issues

1. **Revolut Integration:** Hard-coded provider (not flexible)
2. **Complex Installment Logic:** Embedded in component
3. **Error Handling:** Manual error management
4. **User Creation:** Auto-creates users during payment (side effect)
5. **Password Generation:** Creates random passwords (security concern)
6. **Huge File:** 17KB (complex logic)

---

## 📋 BookingFinalOverview (Step 5)

**Location:** `App\Livewire\Checkout\BookingFinalOverview`  
**Purpose:** Final review of all booking details before confirmation

### State Variables

```php
// Cruise/Itinerary
public $itinerary;
public $cruiseline;
public $formattedRoute;
public $shipCoverUrl;
public $destinationName;

// Quote data
public $quoteId;
public $quote;

// Cabin details
public $cabinDetails;
public $serviceCharges;
public $servicesList;

// Pricing
public $totalAmount = 0;
public $depositAmount = 0;
public $balanceAmount = 0;
public $portChargesAmt = 0;

// Installments
public $depositInstallment;
public $monthlyInstallments = 0;
public $monthlyInstallmentAmount = 0;
public $remainingDueDate;

// Passengers
public $passengerCount;

// Configuration
public $currencySymbol;
public $memberships = [];
public $lunchIndex;
```

### Service Integration

```php
protected InstallmentSettingService $installmentService;
protected QuoteService $quoteService;
```

### Key Methods

#### `mount()`
- Load all quote details
- Calculate totals
- Format route and pricing
- Gather cabin and service details

#### `render()`
- Return view with assembled data

### Features
- Complete booking summary
- Passenger listing
- Price breakdown
- Installment schedule
- Itinerary details

### Issues

1. **Data Assembly:** 40+ properties (information overload)
2. **Calculation in Mount:** All logic in mount() (inefficient)
3. **No Computed Properties:** Could use Livewire 3 #[Computed]
4. **Huge File:** 9KB of initialization
5. **Hard-coded Calculations:** Format rules embedded
6. **No Validation:** Assumes all data present

---

## ✅ FinalCheckoutComponent (Final Step)

**Location:** `App\Livewire\Checkout\FinalCheckoutComponent`  
**Purpose:** Final confirmation and order submission

### State Variables

```php
public $cruise;
public $cruiseline;
public $destination;
public $quote;
public $pricePerCabins;
public $onboardItemsByType;
public $lead;

// Multi-step data
public $step1, $step2, $step3, $step4, $step5;

// Display config
public $cabinTypes;
public $currencySymbol;
public $includedItems;
public $preferences;
public $memberships;
public $extras;
public $test;  // Debug flag
```

### Key Methods

#### `mount($cruiseline, $pricePerCabins)`
- Load cruise destination data
- Order itinerary destinations
- Initialize display data

### Features
- Final confirmation display
- Complete booking summary
- Submit action

### Issues

1. **Incomplete Implementation:** mount() only, no render()
2. **Commented Code:** Unclear final structure
3. **Debug Properties:** `$test` flag left in
4. **Query Complexity:** Complex join for destinations
5. **No Validation:** No pre-submission checks

---

## 🏗️ Checkout Architecture

### Component Hierarchy

```
CheckoutFlow (Parent/Router)
├─ BookingSummary (Side panel - always visible)
├─ Step 1: ChooseACabin
├─ Step 2: CustomizeServices
├─ Step 3: CustomizePassengers
├─ Step 4: CustomizePayment
├─ Step 5: BookingFinalOverview
└─ Final: FinalCheckoutComponent
```

### Event Flow

```
ChooseACabin
  └─ cabin-saved → BookingSummary.loadData()
  
CustomizeServices
  └─ services-updated → BookingSummary.loadData()
  
CustomizePayment
  └─ paymentMethodSelected → onPaymentMethodSelected()
  
All Steps
  └─ refresh → $refresh (manual refresh)
```

### Data Dependencies

```
Quote (root entity)
├─ Cruise (FK)
│  └─ Itinerary
│     └─ ItineraryElements
│
├─ QuoteDetails (line items)
│  └─ Services/Products
│
├─ Passengers
└─ Installments
```

---

## ⚠️ Common Issues

### Shared Problems

1. **Heavy State:** 20-50 properties per component
2. **Event-Driven Coupling:** Tightly coupled via listeners
3. **Commented Code:** Legacy code left commented throughout
4. **No Validation:** Minimal input validation
5. **Service Dependency:** Injected services obscure logic
6. **Calculation Complexity:** Pricing/installment logic scattered
7. **Error Handling:** Manual error management (strings)

### Architecture Issues

1. **Giant Components:** Files 2-32KB (violates single responsibility)
2. **Business Logic in UI:** Payment, pricing, calculations mixed
3. **No Composition:** Monolithic step components
4. **Event Soup:** Multiple overlapping event listeners
5. **Tight Coupling:** Components depend on sibling events

### Specific Issues

| Component | Issues |
|-----------|--------|
| BookingSummary | 50% commented, unclear purpose |
| ChooseACabin | Hard-coded lunch sessions, multiple queries |
| CustomizeServices | 32KB file, complex pricing, child pricing inconsistency |
| CustomizePassengers | Commented listeners, no validation |
| CustomizePayment | Revolut hard-coded, user creation side-effect, 17KB |
| BookingFinalOverview | 40+ properties, logic in mount(), no composition |
| FinalCheckoutComponent | Incomplete, debug code, no render() |

### Data Flow Issues

1. **State Synchronization:** Quote updates scattered across components
2. **Side Effects:** Payment creates users, installments
3. **No Rollback:** Failed payment leaves orphaned records
4. **Event Race Conditions:** Multiple listeners might conflict

---

## 📝 Migration Notes for Base44

### Current Architecture Problem

```
Monolithic Checkout Components (Livewire)
  ├─ 7 massive components (2-32KB each)
  ├─ Complex state (20-50 properties per component)
  ├─ Event-driven coupling (tight)
  ├─ Calculation logic mixed with UI
  └─ Manual error handling & validation
```

### Base44 Refactor: Backend-Driven Checkout

**Strategy:** Move business logic to backend functions, use React for UI composition.

#### Backend Functions

```typescript
// Quote management
async function getQuote(req) { /* Load quote + related data */ }
async function updateQuoteCabin(req) { /* Validate & update */ }
async function addQuoteService(req) { /* Add service to quote */ }
async function updatePassengers(req) { /* Validate & save */ }

// Pricing
async function calculateInstallments(req) {
  const { total, months } = req.body;
  // Business logic: deposit calc, due dates, etc.
  return { monthlyAmount, deposit, schedule };
}

// Payment
async function processPayment(req) {
  // Revolut integration, installment creation
  // Atomic: create payment + installments in transaction
}

// Summary
async function getCheckoutSummary(req) {
  // Assemble all checkout data for review
  return { quote, pricing, passengers, schedule };
}
```

#### React Component Structure

```typescript
export default function CheckoutFlow({ quoteId }) {
  const [step, setStep] = useState(1);
  const { data: quote } = useQuery(['quote', quoteId], 
    () => base44.functions.invoke('getQuote', { quoteId })
  );

  return (
    <div className="flex gap-4">
      {/* Left: Summary (always visible) */}
      <CheckoutSummary quote={quote} />
      
      {/* Right: Current step */}
      <div>
        {step === 1 && <CabinStep quote={quote} onNext={() => setStep(2)} />}
        {step === 2 && <ServicesStep quote={quote} onNext={() => setStep(3)} />}
        {step === 3 && <PassengersStep quote={quote} onNext={() => setStep(4)} />}
        {step === 4 && <PaymentStep quote={quote} onNext={() => setStep(5)} />}
        {step === 5 && <ReviewStep quote={quote} onSubmit={submitOrder} />}
      </div>
    </div>
  );
}

// Step components - focused, reusable
function CabinStep({ quote, onNext }) {
  const mutation = useMutation(cabin =>
    base44.functions.invoke('updateQuoteCabin', { quoteId: quote.id, cabin })
  );
  
  return (
    <form onSubmit={e => {
      e.preventDefault();
      mutation.mutate(selectedCabin, { onSuccess: onNext });
    }}>
      {/* Cabin selection UI */}
    </form>
  );
}
```

#### Key Improvements

1. **Separation of Concerns:** Logic in functions, UI in components
2. **Atomic Operations:** Payment creates installments in one transaction
3. **Validation Server-Side:** Prevent invalid state
4. **Error Handling:** Proper error objects, not strings
5. **Composable Steps:** Each step is independent component
6. **Reusable:** Backend functions callable from multiple frontends
7. **Testable:** Functions testable independently
8. **Type Safety:** TypeScript prevents prop/state errors

#### Payment Flow

```typescript
// Before: Error-prone, side effects
CustomizePayment.processPayment() {
  // Revolut API call
  // Create user if missing
  // Create installments
  // Update quote
  // Handle errors manually
}

// After: Clean, atomic, tested
async function processPayment(req) {
  const base44 = createClientFromRequest(req);
  
  try {
    // 1. Validate payment data
    validatePaymentData(req.body);
    
    // 2. Get or create customer
    let customer = await base44.entities.Customer.filter({
      email: req.body.email
    });
    if (!customer[0]) {
      customer = await base44.entities.Customer.create({
        email: req.body.email,
        name: req.body.name
      });
    }
    
    // 3. Process payment via Revolut
    const paymentResult = await revolutService.charge({
      amount: req.body.amount,
      method: req.body.methodId
    });
    
    // 4. Create installments (if applicable)
    const installments = await base44.entities.Installment.bulkCreate(
      generateInstallmentSchedule(paymentResult)
    );
    
    // 5. Update quote with payment info
    await base44.entities.Quote.update(req.body.quoteId, {
      payment_status: 'confirmed',
      installment_ids: installments.map(i => i.id)
    });
    
    return { success: true, paymentId: paymentResult.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### Error Handling

```typescript
// Before: String errors
public ?string $paymentError = null;

// After: Structured errors
const [error, setError] = useState(null);

const handlePayment = async () => {
  try {
    const res = await base44.functions.invoke('processPayment', {});
    if (!res.data.success) {
      setError(res.data.error); // Proper error object
      return;
    }
    onSuccess(res.data.paymentId);
  } catch (err) {
    setError(err.message); // Exception handling
  }
};
```

### Component File Size Reduction

| Component | Current | Target | Reason |
|-----------|---------|--------|--------|
| CustomizeServices | 32KB | 3KB | Move pricing to backend |
| CustomizePayment | 17KB | 4KB | Move payment logic to function |
| BookingFinalOverview | 9KB | 2KB | Assemble in backend function |
| ChooseACabin | 9KB | 2KB | Validate in backend |

### Benefits

1. **Maintainability:** Smaller components, focused responsibilities
2. **Testability:** Functions independently testable
3. **Reusability:** Backend functions used by mobile app too
4. **Performance:** Single API call per step instead of multiple queries
5. **Security:** Sensitive operations server-side
6. **Type Safety:** TypeScript throughout
7. **Scalability:** Easy to add new steps or payment methods