# Cruiseline & Card Components

**Purpose:** Display cruiseline data and featured offers. Includes card displays, detail pages, and lists with pagination.  
**Architecture:** Card components (single item), show components (detail page), list components (pagination).  
**Total Components:** 5

---

## 📋 Component Index

| Component | Type | Purpose |
|-----------|------|---------|
| CruiselineCardComponent | Card | Single cruiseline card with ships & itineraries |
| CruiselineShowComponent | Detail | Cruiseline detail page |
| CruiselinesList | List | Paginated cruiseline listing |
| FeaturedOfferCard | Card | Featured offer/cruise card |
| ImageTitleOnlyCard | Card | Generic image + title card |

---

## ⚓ Cruiseline Components

### CruiselineCardComponent

**Location:** `App\Livewire\Cruiselines\CruiselineCardComponent`  
**Purpose:** Display single cruiseline card with ship count and itinerary count  
**Skeleton:** Implicit (no skeleton property)

#### State Variables

```php
public $cruiseline             // Cruiseline model (passed to component)
public $shipsCount             // Count of ships for this cruiseline
public $ships                  // Collection of ships
public $firstShip              // First ship (for preview image)
public $itinerariesCount       // Count of itineraries
public $cruiselineLogoUrl      // Cruiseline logo URL with fallback
public $firstShipCoverUrl      // First ship cover image URL with fallback
```

#### Key Methods

##### `mount()`

**Logic:**
```php
// 1. Fetch all ships for cruiseline
$this->ships = Ship::whereCruiselineId($this->cruiseline->id)->get();

// 2. Get first ship for preview image
$this->firstShip = Ship::whereCruiselineId($this->cruiseline->id)->first();

// 3. Count ships
$this->shipsCount = $this->ships->count();

// 4. Count itineraries via custom method
$this->itinerariesCount = $this->cruiseline->itinerariesCount();

// 5. Get logo with hardcoded fallback
$this->cruiselineLogoUrl = ($this->cruiseline->getMedia('logo')->first() 
  ? $this->cruiseline->getMedia('logo')->first()->getUrl() 
  : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSN1ARfrdUqS1vUKuLeEQZHs8GkzoSt2FWBrA&s');

// 6. Get first ship cover image with fallback
$this->firstShipCoverUrl = ($this->firstShip && $this->firstShip->getMedia('cover')->first()
  ? $this->firstShip->getMedia('cover')->first()->getUrl()
  : 'fallback_url');
```

#### Features
- Ship count display
- Itinerary count display
- Logo image with hardcoded fallback
- Ship preview image
- Double media queries (inefficient)

#### Issues

1. **Double Media Calls:** getMedia() called twice per image (check + assignment)
2. **Hardcoded Fallback URLs:** External images instead of app assets
3. **Inefficient Queries:** Fetches all ships then counts (could use count())
4. **Commented Code:** Debug dd() statements left in
5. **No Error Handling:** Assumes ships and media exist
6. **Custom Method:** Relies on undocumented `itinerariesCount()` method

---

### CruiselineShowComponent

**Location:** `App\Livewire\Cruiselines\CruiselineShowComponent`  
**Purpose:** Detailed cruiseline page with ships and itineraries

#### State Variables

```php
public $cruiseline             // Cruiseline model (passed to component)
public $itinerariesCount       // Count of itineraries
public $ships                  // Ships with active itineraries
```

#### Key Methods

##### `mount()`

**Logic:**
```php
// Count itineraries
$this->itinerariesCount = $this->cruiseline->itinerariesCount();

// Get ships that have itineraries (custom scope)
$this->ships = $this->cruiseline->shipsWithItineraries()->get();
```

#### Features
- Itinerary count display
- Filtered ships (only those with itineraries)
- Uses custom scope `shipsWithItineraries()`

#### Issues

1. **Unused Custom Scope:** Relies on `shipsWithItineraries()` (not defined in context)
2. **No Pagination:** All ships fetched at once (could be large)
3. **Minimal Logic:** Display-only, all rendering in view
4. **Chained Query:** get() called on scope (no limit)

---

### CruiselinesList

**Location:** `App\Livewire\Cruiselines\CruiselinesList`  
**Purpose:** Paginated list of cruiselines with "Load More" button

#### State Variables

```php
public $perPage = 12           // Items per page
public $page = 1               // Current page
public $totalPages             // Calculated total pages
public $totalCruiselines       // Total count
public $showMoreButton = true  // Toggle "Load More" visibility
public $cruiselines = []       // Accumulated cruiselines array
```

#### Key Methods

##### `mount()`

**Logic:**
```php
// 1. Count total cruiselines
$this->totalCruiselines = Cruiseline::count();

// 2. Calculate total pages
$this->totalPages = ceil($this->totalCruiselines / $this->perPage);

// 3. Load first page
$this->loadMoreCruiselines();

// 4. Hide button if no more pages
if($this->page >= $this->totalPages){
    $this->showMoreButton = false;
}
```

##### `loadMoreCruiselines()`

**Logic:**
```php
if ($this->page <= $this->totalPages) {
    // Paginate cruiselines with itineraries
    $paginatedCruiselines = Cruiseline::query()
        ->whereHas('itineraries')              // Only with itineraries
        ->orderBy('code', 'asc')               // Sort by code
        ->paginate($this->perPage, ['*'], 'page', $this->page);
    
    // Accumulate results
    $this->cruiselines = array_merge(
        $this->cruiselines,
        $paginatedCruiselines->items()
    );
    
    // Increment page
    $this->page++;
    
    // Update button visibility
    if ($this->page > $this->totalPages) {
        $this->showMoreButton = false;
    }
}
```

#### Features
- Pagination with "Load More" button
- Filters to cruiselines with itineraries
- Accumulates results (not replace)
- Sorted by cruiseline code
- Dynamic button visibility

#### Issues

1. **Double Count:** Counts total in mount(), then paginate() re-counts
2. **Inefficient Pagination:** paginate() method re-counts on each call
3. **Array Accumulation:** Uses array_merge() instead of lazy loading
4. **Filtering Logic:** whereHas('itineraries') filters at query level (good)
5. **No Search/Filter:** Hardcoded filtering, no user controls

---

## 🎨 Card Components

### FeaturedOfferCard

**Location:** `App\Livewire\Components\FeaturedOfferCard`  
**Purpose:** Display featured offer/cruise card

#### State Variables

```php
public $cruise                 // Cruise model (passed to component)
public $k                      // Unknown purpose (possibly index)
public $website                // Website context (possibly for branding)
```

#### Key Methods

- `render()` only - display-only component

#### Features
- Featured offer display
- Minimal state

#### Issues

1. **Unused Properties:** `$k` and `$website` purpose unclear
2. **No Documentation:** Properties lack explanation
3. **Display-Only:** All logic in view

---

### ImageTitleOnlyCard

**Location:** `App\Livewire\Components\ImageTitleOnlyCard`  
**Purpose:** Generic reusable card with image and title

#### State Variables

```php
public $entity                 // Generic entity (could be any model)
```

#### Key Methods

- `render()` only - display-only component

#### Features
- Generic, reusable card component
- Minimal properties
- Flexible entity type

#### Issues

1. **Too Generic:** No constraints on entity type
2. **No Type Safety:** Accepts any entity
3. **Display-Only:** All logic in view
4. **Unclear Output:** View must handle various entity types

---

## 📊 Components Comparison

| Component | Type | Has State | Data Loading | Pagination | Filtering |
|-----------|------|-----------|--------------|-----------|-----------|
| CruiselineCardComponent | Card | Yes | Ships, media | No | No |
| CruiselineShowComponent | Detail | Yes | Ships (filtered) | No | No |
| CruiselinesList | List | Yes | Paginated | Yes | Itineraries only |
| FeaturedOfferCard | Card | Yes | None | No | No |
| ImageTitleOnlyCard | Card | Yes | None | No | No |

---

## ⚠️ Common Issues

### Shared Problems

1. **Double Media Calls:** getMedia() called twice (check + assign)
2. **Hardcoded Fallback URLs:** External images instead of config
3. **No Error Handling:** Missing validation for media/ships
4. **Double Counting:** Count total, then paginate re-counts
5. **Commented Code:** Debug statements left in
6. **Minimal Card Components:** FeaturedOfferCard and ImageTitleOnlyCard are empty

### Performance Issues

1. CruiselineCardComponent: Fetches all ships instead of count()
2. CruiselineShowComponent: No pagination for large ship lists
3. CruiselinesList: array_merge() on each "Load More" (inefficient)

### Architecture Issues

1. No reusable card component pattern
2. FeaturedOfferCard and ImageTitleOnlyCard serve same purpose (generic cards)
3. Undefined custom methods (itinerariesCount, shipsWithItineraries)

---

## 📝 Migration Notes for Base44

### Media Handling Pattern

**Current:**
```php
$url = $this->cruiseline->getMedia('logo')->first() 
  ? $this->cruiseline->getMedia('logo')->first()->getUrl() 
  : 'hardcoded_fallback_url';
```

**Better (Null coalescing + config):**
```php
$url = $this->cruiseline->getMedia('logo')->first()?->getUrl() 
  ?? config('app.fallback_images.cruiseline_logo');
```

### Card Component Consolidation

**Current:** Multiple card types (FeaturedOfferCard, ImageTitleOnlyCard, CruiselineCardComponent)

**Better:** Single reusable Card component with slots:
```typescript
<Card
  title={cruiseline.name}
  image={cruiseline.logo_url}
  subtitle={`${ships.length} ships`}
  onClick={() => navigate(`/cruiselines/${cruiseline.id}`)}
/>
```

### Pagination Pattern for Base44

**Backend Function: getCruiselines**
```typescript
async function getCruiselines(req) {
  const { page = 1, perPage = 12 } = req.body;
  
  const cruiselines = await base44.entities.Cruiseline.filter({
    enabled: true,
    has_itineraries: true
  });
  
  const start = (page - 1) * perPage;
  const paginated = cruiselines.slice(start, start + perPage);
  
  return {
    items: paginated,
    total: cruiselines.length,
    hasMore: (page * perPage) < cruiselines.length,
    page,
    perPage
  };
}
```

**React Component:**
```typescript
export default function CruiselinesList() {
  const [page, setPage] = useState(1);
  const [cruiselines, setCruiselines] = useState([]);
  
  const { data, hasMore } = useQuery(
    ['cruiselines', page],
    () => base44.functions.invoke('getCruiselines', { page, perPage: 12 })
  );
  
  const loadMore = () => {
    setCruiselines(prev => [...prev, ...data.items]);
    setPage(prev => prev + 1);
  };
  
  return (
    <div>
      {cruiselines.map(c => (
        <CruiselineCard key={c.id} cruiseline={c} />
      ))}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### Key Improvements

1. **No Double Queries:** Fetch once per page load
2. **Cleaner Fallbacks:** Config-driven image fallbacks
3. **Reusable Cards:** Single Card component with props
4. **Type Safety:** TypeScript prevents prop errors
5. **Better Pagination:** No array accumulation, cleaner state
6. **Separated Concerns:** Logic in functions, UI in components