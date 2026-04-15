# Factories & Interfaces

## 🏭 CruiseRealTimeFactory

**Purpose:** Factory pattern for creating cruise line-specific real-time service instances.

### Implementation

```php
namespace App\Services\Factories;

use App\Services\Interfaces\ICruiseRealTime;

class CruiseRealTimeFactory
{
    public static function getInstance($cruiselineCode): ICruiseRealTime {
        $cruiselineCode = ucfirst(strtolower($cruiselineCode));
        $className = $cruiselineCode."RealTime";
        $class = "App\\Services\\{$cruiselineCode}\\{$className}";
        return new $class();
    }
}
```

### How It Works

1. **Input:** `$cruiselineCode` (e.g., "msc", "royal", "NCL")
2. **Normalization:** Converts to PascalCase (e.g., "Msc", "Royal", "Ncl")
3. **Class Naming:** Appends "RealTime" → "MscRealTime", "RoyalRealTime", etc.
4. **Dynamic Loading:** Constructs full namespace path: `App\Services\{Cruiseline}\{ClassName}`
5. **Instantiation:** Creates new instance implementing `ICruiseRealTime`

### Expected Directory Structure

```
App/Services/
├── Msc/
│   └── MscRealTime.php (implements ICruiseRealTime)
├── Royal/
│   └── RoyalRealTime.php (implements ICruiseRealTime)
├── Ncl/
│   └── NclRealTime.php (implements ICruiseRealTime)
├── Factories/
│   └── CruiseRealTimeFactory.php
└── Interfaces/
    └── ICruiseRealTime.php
```

### Usage Example

```php
$factory = new CruiseRealTimeFactory();
$realTimeService = $factory->getInstance('msc');
// Returns: instance of App\Services\Msc\MscRealTime
```

---

## 📋 ICruiseRealTime Interface

**Purpose:** Contract for cruise line-specific real-time services.

### Inferred Properties/Methods

Based on factory usage, the interface should define:

```php
interface ICruiseRealTime
{
    // Likely methods:
    public function getAvailability($shipCode, $departureDate): array;
    public function getPricing($packageId): array;
    public function getItinerary($cruiseId): array;
    // ... other real-time data methods
}
```

### Implementation Classes

- `MscRealTime` - MSC Cruises real-time service
- `RoyalRealTime` - Royal Caribbean real-time service
- `NclRealTime` - Norwegian Cruise Line real-time service
- Others for additional cruise lines

---

## 🔗 Integration Points

### Where Factory Is Used

Likely called from:
- **Controllers** - Fetching real-time data for specific cruise lines
- **Services** - Orchestrating multi-cruiseline operations
- **API Endpoints** - Dynamic service selection based on URL parameter

### Relationship to Fibos Services

| Component | Purpose | Relationship |
|-----------|---------|--------------|
| FibosApi | Generic Fibos SOAP client | Base implementation |
| Fibos*Services | Fibos-specific business logic | Might implement ICruiseRealTime |
| CruiseRealTimeFactory | Dynamic service instantiation | Higher-level abstraction |
| Cruiseline-specific RealTime | Custom logic per line | Implements interface |

---

## ⚠️ Technical Considerations

### Dynamic Class Loading
- **Risk:** No validation if class exists → Fatal error on invalid cruiseline code
- **Improvement:** Add class_exists() check and throw custom exception

### Naming Convention
- **Current:** Hard-coded to `{Cruiseline}RealTime` in namespace `App\Services\{Cruiseline}`
- **Impact:** Adding new cruise lines requires creating matching directory + class

### Type Safety
- **Return Type:** Correctly typed as `ICruiseRealTime`
- **Input Type:** `$cruiselineCode` should be string (type-hinted in modern PHP)

---

## 📝 Migration Notes for Base44

### Backend Functions Equivalent
In Base44, could map to:
- Backend function per cruise line (e.g., `mscGetRealTime`, `royalGetRealTime`)
- Single function with cruiseline parameter + conditional logic
- Service registry pattern instead of dynamic namespaces

### Recommendation
```js
// Base44 approach (simplified)
const getRealTimeService = (cruiselineCode) => {
  const services = {
    'msc': new MscRealTimeService(),
    'royal': new RoyalRealTimeService(),
    'ncl': new NclRealTimeService(),
  };
  return services[cruiselineCode.toLowerCase()];
};
```

### Benefits
- Type-safe at compile time
- No dynamic class loading
- Explicit service registration
- Better error handling