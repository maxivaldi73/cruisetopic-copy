# Form Request Classes

**Purpose:** Laravel Form Request classes for input validation and authorization in HTTP controllers.  
**Framework:** Extends `Illuminate\Foundation\Http\FormRequest` with `authorize()` and `rules()` methods.  
**Total Classes:** 24

---

## 📋 Form Request Index

| Request Class | Purpose | Complexity |
|---------------|---------|------------|
| AIGenerationRequest | AI content generation params | Simple |
| AddNewPortFromMappingRequest | Create port from mapping | Simple |
| AmenityRequest | Ship/cabin amenity CRUD | Simple |
| BestDestinationStoreRequest | Featured destination config | Simple |
| CabinRequest | Cabin data with image | Medium |
| CancellationConditionRequest | Cancellation rules | Complex |
| ChangeLeadStatusRequest | Lead status transition | Simple |
| CruiselineRequest | Cruiseline with media | Medium |
| DestinationRequest | Destination with images | Medium |
| FibosSettingRequest | Fibos API credentials | Simple |
| FirstStepCheckoutRequest | Checkout contact info | Simple |
| InstallmentSettingRequest | Payment installments | Complex |
| ItineraryRequest | Itinerary lookup | Simple |
| LanguageRequest | Language settings | Simple |
| MarketRequest | Market/region config | Simple |
| PageRequest | CMS page with blocks | Complex |
| PermissionRequest | Permission creation | Simple |
| PortRequest | Port with geolocation | Medium |
| RegistrationRequest | User registration | Simple |
| SavePortMappingImportRequest | Port mapping import | Simple |
| ShipRequest | Ship with image | Medium |
| SupplierCancellationConditionRequest | Supplier cancellation | Complex |
| SupplierRequest | Supplier config | Medium |
| WebsiteRequest | Website/domain config | Medium |

---

## 🔧 Simple Request Classes

### AIGenerationRequest

**Location:** `App\Http\Requests\AIGenerationRequest`  
**Purpose:** Validate AI content generation parameters

```php
public function rules(): array
{
    return [
        'model' => 'required|string',
        'modelId' => 'required|integer',
        'lang' => 'required|string|min:4',
    ];
}
```

**Fields:**
- `model` - AI model/entity type (required string)
- `modelId` - Target entity ID (required integer)
- `lang` - Language code (required, min 4 chars)

---

### AddNewPortFromMappingRequest

**Location:** `App\Http\Requests\AddNewPortFromMappingRequest`  
**Purpose:** Create new port from provider mapping data

```php
public function rules(): array
{
    return [
        'id' => 'required|integer',
        'name' => 'required|string',
    ];
}
```

**Fields:**
- `id` - Provider port mapping ID
- `name` - Port name

---

### AmenityRequest

**Location:** `App\Http\Requests\AmenityRequest`  
**Purpose:** Ship/cabin amenity CRUD operations

```php
public function rules(): array
{
    return [
        'name' => 'required|string|max:255'
    ];
}
```

**Fields:**
- `name` - Amenity name (required, max 255 chars)

---

### BestDestinationStoreRequest

**Location:** `App\Http\Requests\BestDestinationStoreRequest`  
**Purpose:** Configure featured/promoted destinations per market

```php
public function rules(): array
{
    return [
        'market_id' => ['required', 'exists:markets,id'],
        'destination_id' => ['required', 'exists:destinations,id'],
        'valid_until_date' => ['required', 'date'],
    ];
}
```

**Fields:**
- `market_id` - Target market (FK validation)
- `destination_id` - Featured destination (FK validation)
- `valid_until_date` - Promotion expiry date

---

### ChangeLeadStatusRequest

**Location:** `App\Http\Requests\ChangeLeadStatusRequest`  
**Purpose:** Lead status workflow transitions

```php
public function rules(): array
{
    return [
        'id' => ['required','integer','exists:leads,id'],
        'status_id' => ['required','exists:lead_states,id'],
    ];
}
```

**Fields:**
- `id` - Lead ID (FK validation)
- `status_id` - Target status (FK validation)

**Note:** `description` field commented out (optional transition note)

---

### FibosSettingRequest

**Location:** `App\Http\Requests\FibosSettingRequest`  
**Purpose:** Fibos API configuration per cruiseline

```php
public function rules(): array
{
    return [
        "cruiseline_code" => 'required',
        "subsystem_id" => 'required',
        "agency_id1" => 'required',
        "agency_id2" => 'required',
        "currency" => 'required',
    ];
}
```

**Fields:**
- `cruiseline_code` - Cruiseline identifier
- `subsystem_id` - Fibos subsystem
- `agency_id1`, `agency_id2` - Agency credentials
- `currency` - Default currency code

**Issue:** No type or format validation on fields

---

### FirstStepCheckoutRequest

**Location:** `App\Http\Requests\FirstStepCheckoutRequest`  
**Purpose:** Checkout wizard step 1 - contact information

```php
public function rules(): array
{
    return [
        'name' => 'required | string',
        'lastname' => 'required | string',
        'email' => 'required | email',
        'phone' => 'required | numeric',
    ];
}
```

**Fields:**
- `name`, `lastname` - Customer name
- `email` - Contact email
- `phone` - Phone number (numeric only)

**Issue:** Spaces in rule strings (cosmetic)

---

### ItineraryRequest

**Location:** `App\Http\Requests\ItineraryRequest`  
**Purpose:** Itinerary lookup parameters

```php
public function rules(): array
{
    return [
        'itineraryCode' => 'string|max:30',
        'cruiseId' => 'string|max:30',
    ];
}
```

**Fields:**
- `itineraryCode` - Itinerary identifier (optional)
- `cruiseId` - Cruise identifier (optional)

**Note:** Both fields optional - used for search/lookup

---

### LanguageRequest

**Location:** `App\Http\Requests\LanguageRequest`  
**Purpose:** Language configuration

```php
public function rules(): array
{
    return [
        'name' => 'required|string|max:255',
        'primary' => 'nullable|boolean',
    ];
}
```

**Fields:**
- `name` - Language name
- `primary` - Primary language flag

---

### MarketRequest

**Location:** `App\Http\Requests\MarketRequest`  
**Purpose:** Market/region configuration

```php
public function rules(): array
{
    return [
        'code' => 'required|string|max:255',
        'name' => 'required|string|max:255'
    ];
}
```

**Fields:**
- `code` - Market code (e.g., "ita", "eng")
- `name` - Market display name

---

### PermissionRequest

**Location:** `App\Http\Requests\PermissionRequest`  
**Purpose:** Permission creation

```php
public function rules(): array
{
    return [
        'key' => 'required|string|unique:permissions,key',
        'name' => 'required|string|max:255',
    ];
}
```

**Fields:**
- `key` - Permission key (unique)
- `name` - Display name

---

### SavePortMappingImportRequest

**Location:** `App\Http\Requests\SavePortMappingImportRequest`  
**Purpose:** Port mapping import trigger

```php
public function rules(): array
{
    return [
        'cruiseline_code' => 'required',
    ];
}
```

**Fields:**
- `cruiseline_code` - Target cruiseline for import

---

## 📷 Medium Complexity (with Media)

### CabinRequest

**Location:** `App\Http\Requests\CabinRequest`  
**Purpose:** Cabin data with image upload

```php
public function rules(): array
{
    return [
        'ship_id' => 'required|exists:ships,id',
        'category_code' => 'required|string|max:255',
        'name' => 'required|string|max:255',
        'type' => 'nullable|string|max:3',
        'description' => 'nullable|string',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
    ];
}
```

**Fields:**
- `ship_id` - Parent ship (FK validation)
- `category_code` - Cabin category
- `name` - Cabin name
- `type` - Cabin type code (max 3 chars)
- `description` - Cabin description
- `image` - Upload (2MB max, common formats)

---

### CruiselineRequest

**Location:** `App\Http\Requests\CruiselineRequest`  
**Purpose:** Cruiseline with logo and cover images

```php
public function rules()
{
    return [
        'code' => 'required|string|max:255',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'description_html' => 'nullable|string',
        'short_description' => 'nullable|string|max:255',
        'meta_title' => 'nullable|string|max:255',
        'meta_description' => 'nullable|string',
        'meta_description_search' => 'nullable|string',
        'meta_keywords' => 'nullable|string',
        'address' => 'nullable|string',
        'phone' => 'nullable|string',
        'website' => 'nullable',
        'logo' => 'nullable|image|mimes:jpeg,png,svg|max:2048',
        'cover' => 'nullable|image|mimes:jpeg,png|max:2048',
    ];
}
```

**Fields:**
- Core: `code`, `name`
- Content: `description`, `description_html`, `short_description`
- SEO: `meta_title`, `meta_description`, `meta_description_search`, `meta_keywords`
- Contact: `address`, `phone`, `website`
- Media: `logo`, `cover` (image uploads)

---

### DestinationRequest

**Location:** `App\Http\Requests\DestinationRequest`  
**Purpose:** Destination with multiple images

```php
public function rules()
{
    return [
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'meta_title' => 'nullable|string|max:255',
        'meta_description' => 'nullable|string|max:255',
        'meta_keywords' => 'nullable|string|max:255',
        'parent_id' => 'nullable|exists:destinations,id',
        'cover' => ['nullable', 'string'],
        'images' => ['nullable', 'array'],
        'images.*' => ['string'],
    ];
}
```

**Fields:**
- Core: `name`, `description`
- SEO: `meta_title`, `meta_description`, `meta_keywords`
- Hierarchy: `parent_id` (self-referential FK)
- Media: `cover` (string URL), `images` (array of URLs)

**Note:** Cover/images expect URLs (pre-uploaded), not file uploads

---

### PortRequest

**Location:** `App\Http\Requests\PortRequest`  
**Purpose:** Port with geolocation and climate data

```php
public function rules()
{
    return [
        'name' => 'required|string|max:255',
        'destination_id' => 'nullable|exists:destinations,id',
        'lat' => 'required|numeric',
        'lng' => 'required|numeric',
        'continent_id' => ['required', 'exists:continents,id'],
        'country_id' => [
            'nullable',
            Rule::exists('countries', 'id')->where(function ($query) {
                if ($this->filled('continent_id')) {
                    $query->where('continent_id', $this->input('continent_id'));
                }
            }),
        ],
        'description' => 'nullable|string',
        'meta_title' => 'nullable|string|max:255',
        'meta_description' => 'nullable|string',
        'meta_keywords' => 'nullable|string',
        'sunny_days' => 'nullable|integer|min:0|max:365',
        'temperature_avg' => 'nullable|numeric',
        'cover' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        'images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
    ];
}
```

**Fields:**
- Core: `name`, `description`
- Location: `lat`, `lng` (required), `continent_id`, `country_id`, `destination_id`
- SEO: `meta_title`, `meta_description`, `meta_keywords`
- Climate: `sunny_days`, `temperature_avg`
- Media: `cover`, `images.*` (file uploads)

**Features:**
- Conditional FK validation (country must belong to continent)
- Climate data bounds (sunny_days 0-365)

---

### ShipRequest

**Location:** `App\Http\Requests\ShipRequest`  
**Purpose:** Ship with image upload

```php
public function rules()
{
    return [
        'code' => 'required|string|max:255',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'meta_title' => 'nullable|string|max:255',
        'meta_description' => 'nullable|string',
        'meta_keywords' => 'nullable|string',
        'cruiseline_id' => 'required|exists:cruiselines,id',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
    ];
}
```

**Fields:**
- Core: `code`, `name`, `cruiseline_id` (FK)
- Content: `description`
- SEO: `meta_title`, `meta_description`, `meta_keywords`
- Media: `image` (file upload)

---

### SupplierRequest

**Location:** `App\Http\Requests\SupplierRequest`  
**Purpose:** Supplier/vendor configuration

```php
protected function prepareForValidation()
{
    $data = [];
    $data['is_active'] = $this->input('is_active') == '1' ? true : false;
    $this->merge($data);
}

public function rules(): array
{
    $supplierId = $this->route('supplier');

    return [
        'name' => 'required|string|max:255',
        'code' => 'required|string|max:255|unique:suppliers,code,' . $supplierId,
        'is_active' => 'boolean',
        'cruiselines' => 'nullable|array',
        'cruiselines.*' => 'exists:cruiselines,id',
    ];
}
```

**Features:**
- `prepareForValidation()` - Checkbox normalization
- Unique code with self-exclusion on update
- Cruiseline associations (array of IDs)

---

### WebsiteRequest

**Location:** `App\Http\Requests\WebsiteRequest`  
**Purpose:** Website/domain configuration

```php
public function rules(): array
{
    $id = $this->input('id');

    return [
        'hostname' => [
            'required',
            'string',
            'max:255',
            Rule::unique('websites', 'hostname')->ignore($id),
        ],
        'default_lang' => 'required|string|max:255',
        'market_id' => 'required|exists:markets,id',
        'timezone' => 'nullable|string|max:100',
        'currency_id' => 'nullable|exists:currencies,id',
    ];
}
```

**Fields:**
- `hostname` - Domain (unique with self-exclusion)
- `default_lang` - Default language
- `market_id` - Associated market (FK)
- `timezone` - Timezone identifier
- `currency_id` - Default currency (FK)

---

## 🔄 Complex Request Classes (with prepareForValidation)

### CancellationConditionRequest

**Location:** `App\Http\Requests\CancellationConditionRequest`  
**Purpose:** Complex cancellation policy rules

```php
protected function prepareForValidation()
{
    $data = [];

    // Checkbox normalization
    $data['is_active'] = $this->input('is_active') == '1' ? true : false;

    // Empty numeric fields → 0
    if ($this->input('cruise_duration_min_days') === null || 
        $this->input('cruise_duration_min_days') === '') {
        $data['cruise_duration_min_days'] = 0;
    }

    // Fare families: remove empty values
    if ($this->has('fare_families') && is_array($this->input('fare_families'))) {
        $data['fare_families'] = array_values(array_filter(
            $this->input('fare_families'), 
            fn($v) => !is_null($v) && $v !== ''
        ));
    }

    // Penalty rules: clean and reindex
    if ($this->has('penalty_rules')) {
        $rules = $this->input('penalty_rules');
        $cleanedRules = [];
        foreach ($rules as $rule) {
            if (isset($rule['days_from']) && is_numeric($rule['days_from'])) {
                $cleanedRules[] = $rule;
            }
        }
        $data['penalty_rules'] = array_values($cleanedRules);
    }

    $this->merge($data);
}

public function rules(): array
{
    return [
        'name' => 'required|string|max:255',
        'cruiseline_id' => 'required|exists:cruiselines,id',
        'is_active' => 'boolean',
        'cruise_duration_min_days' => 'nullable|integer|min:0',
        'fare_families' => 'nullable|array',
        'fare_families.*' => 'exists:fare_families,id',
        'penalty_rules' => 'nullable|array',
        'penalty_rules.*.days_from' => 'required_with:penalty_rules|integer|min:0',
        'penalty_rules.*.days_to' => 'nullable|integer|min:0',
        'penalty_rules.*.penalty_percent' => 'required_with:penalty_rules|numeric|min:0|max:100',
    ];
}
```

**Features:**
- Nested array validation (penalty_rules.*)
- Checkbox normalization
- Empty value cleaning
- Array reindexing

---

### InstallmentSettingRequest

**Location:** `App\Http\Requests\InstallmentSettingRequest`  
**Purpose:** Payment installment configuration

```php
protected function prepareForValidation()
{
    $data = [];

    // Checkbox normalization
    $data['is_active'] = $this->input('is_active') == '1' ? true : false;

    // Empty numeric fields → 0
    if ($this->input('max_days_before_departure') === null || 
        $this->input('max_days_before_departure') === '') {
        $data['max_days_before_departure'] = 0;
    }
    if ($this->input('min_cruise_amount') === null || 
        $this->input('min_cruise_amount') === '') {
        $data['min_cruise_amount'] = 0;
    }
    if ($this->input('first_installment_percent') === null || 
        $this->input('first_installment_percent') === '') {
        $data['first_installment_percent'] = 0;
    }

    // Fare families cleaning
    if ($this->has('fare_families') && is_array($this->input('fare_families'))) {
        $data['fare_families'] = array_values(array_filter(
            $this->input('fare_families'), 
            fn($v) => !is_null($v) && $v !== ''
        ));
    }

    // Installment rules cleaning
    if ($this->has('installment_rules')) {
        $rules = $this->input('installment_rules');
        $cleanedRules = [];
        foreach ($rules as $rule) {
            if (isset($rule['installment_number']) && is_numeric($rule['installment_number'])) {
                $cleanedRules[] = $rule;
            }
        }
        $data['installment_rules'] = array_values($cleanedRules);
    }

    $this->merge($data);
}

public function rules(): array
{
    return [
        'name' => 'required|string|max:255',
        'cruiseline_id' => 'required|exists:cruiselines,id',
        'is_active' => 'boolean',
        'max_days_before_departure' => 'nullable|integer|min:0',
        'min_cruise_amount' => 'nullable|numeric|min:0',
        'first_installment_percent' => 'nullable|numeric|min:0|max:100',
        'fare_families' => 'nullable|array',
        'fare_families.*' => 'exists:fare_families,id',
        'installment_rules' => 'nullable|array',
        'installment_rules.*.installment_number' => 'required_with:installment_rules|integer|min:1',
        'installment_rules.*.days_before_departure' => 'nullable|integer|min:0',
        'installment_rules.*.percent' => 'required_with:installment_rules|numeric|min:0|max:100',
    ];
}
```

**Features:**
- Multiple nested array validations
- Percentage bounds (0-100)
- Complex installment rule structure

---

### SupplierCancellationConditionRequest

**Location:** `App\Http\Requests\SupplierCancellationConditionRequest`  
**Purpose:** Supplier-specific cancellation rules

```php
// Same structure as CancellationConditionRequest
// with supplier_id instead of cruiseline_id
```

**Fields:**
- Similar to `CancellationConditionRequest`
- Uses `supplier_id` FK instead of `cruiseline_id`

---

### PageRequest

**Location:** `App\Http\Requests\PageRequest`  
**Purpose:** CMS page with content blocks

```php
protected function prepareForValidation(): void
{
    $websiteId = $this->route("websiteId");
    if ($websiteId) {
        $this->merge(["website_id" => $websiteId]);
    }
}

public function rules(): array
{
    $rules = [
        "slug" => "nullable|string|max:255",
        "link" => "nullable|string|max:500",
        "in_menu" => "nullable|boolean",
        "menu_order" => "nullable|integer",
        "website_id" => "required|integer|exists:websites,id",
        "active_lang" => "nullable|string|max:10",
        "name" => "nullable|string|max:255",
        "title" => "nullable|string|max:255",
        "description" => "nullable|string",
        "blocks" => "nullable|array",
        "blocks.*.type" => "required_with:blocks|in:" . implode(',', PageBlock::$validTypes),
        "blocks.*.content" => "nullable",
        "blocks.*.settings" => "nullable|array",
    ];

    return $rules;
}
```

**Features:**
- Route parameter injection (`websiteId`)
- Block type validation against `PageBlock::$validTypes`
- Nested block structure validation

---

### RegistrationRequest

**Location:** `App\Http\Requests\RegistrationRequest`  
**Purpose:** User registration

```php
public function rules(): array
{
    return [
        'firstname' => 'nullable|string|max:255',
        'lastname' => 'nullable|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:3',
        'phone' => 'nullable|string|max:255',
    ];
}
```

**Fields:**
- `email` - Required, unique
- `password` - Required, min 3 chars
- `firstname`, `lastname`, `phone` - Optional

**Issue:** Weak password requirement (min:3)

---

## 📊 Validation Patterns Summary

### Common Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| FK Validation | Foreign key exists | `exists:ships,id` |
| Unique with Exclusion | Update operations | `unique:suppliers,code,` . $id |
| Conditional FK | Related records | `Rule::exists()->where()` |
| Image Upload | Media handling | `image|mimes:...|max:2048` |
| Checkbox Normalization | `prepareForValidation()` | `== '1' ? true : false` |
| Nested Array | Complex forms | `rules.*.field` |
| Empty → Default | Numeric fields | `=== null \|\| === '' → 0` |

### Authorization Pattern

All requests return `true` for authorization:
```php
public function authorize(): bool
{
    return true;
}
```

**Issue:** No per-request authorization - relies on middleware/policies.

---

## ⚠️ Common Issues

### Shared Problems

1. **No Authorization Logic:** All `authorize()` return `true`
2. **Weak Password Rules:** `min:3` in RegistrationRequest
3. **Missing Type Validation:** FibosSettingRequest fields untyped
4. **Inconsistent Formatting:** Spaces in rule strings
5. **Hardcoded Values:** Block types from model constant

### Security Concerns

1. **No CSRF Validation:** Handled by middleware
2. **No Rate Limiting:** Handled elsewhere
3. **Weak Passwords:** Minimum 3 characters
4. **No Sanitization:** Input used as-is after validation

### Architectural Issues

1. **Duplicated Logic:** CancellationCondition vs SupplierCancellation
2. **Complex prepareForValidation:** Should be simpler
3. **Model Dependencies:** PageBlock::$validTypes in request

---

## 📝 Migration Notes for Base44

### Laravel Pattern

```php
// Controller
public function store(CruiselineRequest $request)
{
    $validated = $request->validated();
    Cruiseline::create($validated);
}
```

### Base44 Pattern

```typescript
// Backend function with Zod validation
import { z } from 'npm:zod@3.22.0';

const cruiselineSchema = z.object({
  code: z.string().max(255),
  name: z.string().max(255),
  description: z.string().optional(),
  // ... other fields
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  
  // Validate
  const result = cruiselineSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ 
      error: 'Validation failed', 
      details: result.error.issues 
    }, { status: 400 });
  }
  
  // Create
  const cruiseline = await base44.entities.Cruiseline.create(result.data);
  return Response.json({ success: true, data: cruiseline });
});
```

### Key Differences

| Laravel | Base44 |
|---------|--------|
| FormRequest class | Zod schema |
| `authorize()` method | Auth in function |
| `rules()` array | Schema definition |
| `prepareForValidation()` | Pre-processing in function |
| `$request->validated()` | `schema.parse()` |
| Auto-validation | Manual validation call |

### Benefits of Zod Approach

1. **Type Safety:** TypeScript inference from schema
2. **Reusability:** Schemas can be shared
3. **Composability:** Combine schemas with `.extend()`, `.merge()`
4. **Custom Validators:** Chain `.refine()` for complex logic
5. **Error Messages:** Configurable per field

### Example Refactor: CabinRequest

```typescript
const cabinSchema = z.object({
  ship_id: z.number().int().positive(),
  category_code: z.string().max(255),
  name: z.string().max(255),
  type: z.string().max(3).optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
});

// Usage in backend function
const data = cabinSchema.parse(body);
await base44.entities.Cabin.create(data);
```

### Media Handling

```typescript
// Before: Laravel file upload validation
'image' => 'nullable|image|mimes:jpeg,png|max:2048'

// After: Base44 upload + URL storage
const { file_url } = await base44.integrations.Core.UploadFile({ file });
await base44.entities.Cabin.create({ ...data, image_url: file_url });
``