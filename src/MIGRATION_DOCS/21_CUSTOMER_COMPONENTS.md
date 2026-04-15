# Customer/Personal Area Components

**Purpose:** Tab-based dashboard system for authenticated customers. Manages account profile, preferences, confirmations, estimates, and coupons.  
**Architecture:** Parent container (PersonalArea) with 6 child tab components (all display-only).  
**Total Components:** 7

---

## 📋 Component Index

| Component | Type | Purpose |
|-----------|------|---------|
| PersonalArea | Container | Tab navigation & customer context |
| Overview | Tab | Dashboard summary view |
| Profile | Tab | Customer profile management |
| Preferences | Tab | Settings/preferences |
| Confirmations | Tab | Confirmation status (email/SMS) |
| Estimations | Tab | Price quotes/estimates |
| Coupons | Tab | Promotional codes |

---

## 👤 PersonalArea (Container)

**Location:** `App\Livewire\Customer\PersonalArea`  
**Purpose:** Tab-based container for customer dashboard  
**Parent Container:** Yes (manages tab state and routing)

### State Variables

```php
public $tab = 'overview'        // Active tab (query string parameter)
public $user                    // Current authenticated user
public $customer                // Customer model (fetched in mount)
```

### Protected Properties

```php
protected $queryString = ['tab'];  // Tab persisted in URL (?tab=overview)
```

### Key Methods

#### `mount()`
- **Query:** `Customer::where('user_id', $this->user->id)->first()`
- **Assumption:** User always has a related Customer record
- **Issue:** No error handling if customer missing

#### `switchTab($tab)`
- Simple tab switching
- Updates `$this->tab` property
- URL automatically synced via $queryString

### Features
- Tab-based navigation
- URL-based tab persistence (bookmarkable)
- Customer context loading
- Minimal state management

### Issues

1. **Missing Customer Handling:** No guard if customer not found
2. **Hardcoded Default Tab:** 'overview' hard-coded (should be flexible)
3. **Unused User Property:** `$user` property set but likely available via auth()
4. **No Validation:** Tab switching doesn't validate tab names

---

## 📑 Tab Components (Display-Only)

### Overview

**Location:** `App\Livewire\Customer\Overview`  
**Purpose:** Customer dashboard overview tab

- Display-only wrapper
- No state, no data loading
- All logic in view

### Profile

**Location:** `App\Livewire\Customer\Profile`  
**Purpose:** Customer profile management

- Display-only wrapper
- No validation or update methods
- All logic in view

### Preferences

**Location:** `App\Livewire\Customer\Preferences`  
**Purpose:** Customer preference settings

- Display-only wrapper
- No event handling
- All logic in view

### Confirmations

**Location:** `App\Livewire\Customer\Confirmations`  
**Purpose:** Email/SMS confirmation status

- Display-only wrapper
- No resend or verification methods
- All logic in view

### Estimations

**Location:** `App\Livewire\Customer\Estimations`  
**Purpose:** Price estimates/quotes

- Display-only wrapper
- No data loading
- All logic in view

### Coupons

**Location:** `App\Livewire\Customer\Coupons`  
**Purpose:** Customer coupons and promotional codes

- Display-only wrapper
- No coupon logic (apply, validate, redeem)
- All logic in view

---

## 🏗️ Architecture

### Component Hierarchy

```
PersonalArea (Container)
├─ Overview
├─ Profile
├─ Preferences
├─ Confirmations
├─ Estimations
└─ Coupons
```

### Tab Components Pattern

All tab components follow the same minimal pattern:

```php
public function render()
{
    return view('livewire.customer.{tab-name}');
}
```

**Characteristics:**
- Display-only (no data loading)
- No state management
- No event listeners
- Rely entirely on parent context (PersonalArea)
- All logic deferred to Blade views

---

## 📊 Components Comparison

| Component | Type | Has State | Data Loading | Interactivity |
|-----------|------|-----------|--------------|---------------|
| PersonalArea | Container | Yes (tab) | Customer lookup | Tab switching |
| Overview | Tab | No | None | Display only |
| Profile | Tab | No | None | Display only |
| Preferences | Tab | No | None | Display only |
| Confirmations | Tab | No | None | Display only |
| Estimations | Tab | No | None | Display only |
| Coupons | Tab | No | None | Display only |

---

## ⚠️ Common Issues

### Shared Problems

1. **Empty Components:** All tab components are display-only wrappers
2. **No Data Loading:** Logic delegated entirely to views (no separation of concerns)
3. **No State Management:** Components don't manage their own state
4. **No Validation:** No data validation in components
5. **No Event Handling:** No listeners or event processing
6. **Logic in Views:** Business logic lives in Blade templates instead of components

### Architectural Issues

1. **Tight View Coupling:** Components tightly coupled to view structure
2. **No Reusability:** Tab components can't be reused independently
3. **Parent Dependency:** Tab components depend entirely on PersonalArea context
4. **Query String Limitation:** Only single tab parameter in URL (not extensible)

### PersonalArea-Specific Issues

1. **Missing Customer Guard:** No check if customer lookup fails
2. **Unused User Property:** `$user` redundant (use auth()->user())
3. **Hard-coded Default:** Tab default 'overview' is not configurable
4. **No Tab Validation:** `switchTab()` doesn't validate tab names

---

## 📝 Migration Notes for Base44

### Current Architecture Problem

```
PersonalArea (Livewire)
  └─ 6 Empty Tab Components
      └─ All Logic in Blade Views (No separation of concerns)
```

**Issues:**
- Logic lives in templates, not components
- No reusability of tab logic
- Difficult to test
- Hard to maintain

### Base44 Refactor: Composition Over Containers

**Recommended Pattern:**

```typescript
// Parent: PersonalAreaPage
export default function PersonalAreaPage() {
  const [tab, setTab] = useState('overview');
  const { data: customer, isLoading } = useQuery(
    ['customer'],
    () => base44.functions.invoke('getCustomerData', {})
  );

  const tabs = [
    { id: 'overview', label: 'Overview', component: OverviewTab },
    { id: 'profile', label: 'Profile', component: ProfileTab },
    { id: 'preferences', label: 'Preferences', component: PreferencesTab },
    { id: 'confirmations', label: 'Confirmations', component: ConfirmationsTab },
    { id: 'estimations', label: 'Estimations', component: EstimationsTab },
    { id: 'coupons', label: 'Coupons', component: CouponsTab },
  ];

  return (
    <div>
      <TabNavigation tabs={tabs} active={tab} onChange={setTab} />
      {tabs.find(t => t.id === tab)?.component && (
        <tabs.find(t => t.id === tab).component customer={customer} />
      )}
    </div>
  );
}

// Child Tab: ProfileTab
function ProfileTab({ customer }) {
  const mutation = useMutation(data => 
    base44.functions.invoke('updateCustomerProfile', data)
  );
  
  return (
    <form onSubmit={e => {
      e.preventDefault();
      mutation.mutate({...});
    }}>
      {/* Profile edit form */}
    </form>
  );
}
```

### Key Improvements

1. **Data Fetching:** Backend function loads customer once (not per tab)
2. **Tab Components with Logic:** Each tab has its own state + handlers
3. **No Empty Wrappers:** Each component does actual work
4. **Reusability:** Tab components can work independently
5. **Type Safety:** TypeScript prevents invalid tab names
6. **Better Testing:** Logic in components, not views

### Backend Function Pattern

**Function: getCustomerData**

```typescript
async function getCustomerData(req) {
  const user = await base44.auth.me();
  if (!user) return { error: 'Unauthorized' };

  const customer = await base44.entities.Customer.filter({
    user_id: user.id
  });

  return {
    user: { id: user.id, email: user.email, name: user.full_name },
    customer: customer[0] || null,
    preferences: customer[0]?.preferences || {},
    confirmations: await getConfirmationStatus(user.id),
    estimations: await getCustomerEstimates(user.id),
    coupons: await getCustomerCoupons(user.id)
  };
}
```

### Data Loading Strategy

**Option 1: Single Fetch (Recommended)**
- Load all customer data once in parent
- Pass to tab components via props
- Faster, better UX

**Option 2: Lazy Load per Tab**
- Each tab fetches its own data
- Better for large datasets
- More separate requests

**Option 3: Hybrid**
- Core data (customer profile) loaded in parent
- Tab-specific data (coupons, estimations) lazy-loaded

### Component Structure

```
pages/PersonalAreaPage.tsx
├─ hooks/useCustomerData.ts (query)
├─ components/PersonalAreaTabs.tsx (tab navigation)
└─ components/tabs/
    ├─ OverviewTab.tsx (with data + logic)
    ├─ ProfileTab.tsx (with edit form)
    ├─ PreferencesTab.tsx
    ├─ ConfirmationsTab.tsx
    ├─ EstimationsTab.tsx
    └─ CouponsTab.tsx
```

### Validation & Error Handling

**Add to tab components:**

```typescript
// ProfileTab example
const [errors, setErrors] = useState({});

const handleSave = async (data) => {
  try {
    await mutation.mutateAsync({
      name: data.name,
      email: data.email,
      phone: data.phone
    });
    toast.success('Profile updated');
  } catch (err) {
    setErrors(err.validation || {});
    toast.error('Update failed');
  }
};
```

### Benefits Over Current Livewire Pattern

1. **Separation of Concerns:** Logic in components, markup in templates
2. **Testability:** Can test component logic independently
3. **Reusability:** Tab components work standalone
4. **Type Safety:** Props and state are typed (TypeScript)
5. **Performance:** Single data fetch, lazy load if needed
6. **Maintainability:** Clear data flow parent → child