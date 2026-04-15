# Eloquent Observers

**Purpose:** Automatic model event handling (created, updated, deleted, restored, etc.) - decouples business logic from controllers.

---

## Overview

Observers are registered in AppServiceProvider, either via model binding or explicit registration in EventServiceProvider.

| Observer | Model | Purpose |
|----------|-------|---------|
| CruisePriceObserver | CruisePrice | Sync FareFamily on save |
| PortObserver | Port | Invalidate ports list cache |
| QuoteDetailObserver | QuoteDetail | Recalculate quote totals & sync discounts |

---

## 1️⃣ CruisePriceObserver

**Location:** `App\Observers\CruisePriceObserver`  
**Model:** `App\Models\CruisePrice`  
**Registration:** AppServiceProvider (line: `CruisePrice::observe(CruisePriceObserver::class)`)

### Purpose

Keeps FareFamily table in sync with CruisePrice data - ensures fare families are created/updated when prices are saved.

### Methods

#### `saved(CruisePrice $cruisePrice): void`
- **Trigger:** Both create and update events
- **Action:** Call `syncFareFamily()`
- **Logic:** Unifies create/update logic under one method

#### `deleted(CruisePrice $cruisePrice): void`
- **Trigger:** When price is deleted
- **Action:** Currently empty (commented implementation)
- **Note:** Deletion doesn't cascade to FareFamily because other prices might share it
- **Future:** If explicit deletion needed, check if other CruisePrice records exist for same fareFamily

### Protected Methods

#### `syncFareFamily(CruisePrice $cruisePrice): void`
- **Prerequisites:**
  - CruisePrice must have associated Cruise
  - CruisePrice must have fareFamily value
- **Action:** `FareFamily::updateOrCreate()`
- **Data:**
  - Key: `cruiseline_id` (from cruise), `code` (fareFamily)
  - Update: `description` (from fareDesc or fallback to fareFamily)
- **Effect:** Creates or updates FareFamily record per cruiseline

### Data Dependencies

| Field | Source | Purpose |
|-------|--------|---------|
| cruiseline_id | $cruisePrice->cruise->cruiseline_id | Fare family per cruiseline |
| code | $cruisePrice->fareFamily | Unique fare family code |
| description | $cruisePrice->fareDesc ?: $cruisePrice->fareFamily | Human-readable label |

### Example Flow

```
CruisePrice created/updated
    ├─ saved() triggered
    ├─ syncFareFamily() called
    └─ FareFamily::updateOrCreate({
         cruiseline_id: 1,
         code: 'SUITE',
       }, {
         description: 'Suite Fares'
       })
```

---

## 2️⃣ PortObserver

**Location:** `App\Observers\PortObserver`  
**Model:** `App\Models\Port`  
**Registration:** EventServiceProvider (explicit mapping)

### Purpose

Cache invalidation strategy - clears cached port list whenever port data changes, ensuring fresh data on next access.

### Methods

| Event | Method | Action |
|-------|--------|--------|
| create | `created()` | Call `forgetCache()` |
| update | `updated()` | Call `forgetCache()` |
| delete | `deleted()` | Call `forgetCache()` |
| restore | `restored()` | Call `forgetCache()` |
| force delete | `forceDeleted()` | Call `forgetCache()` |

**All methods follow same pattern:** Single responsibility - forget cache.

### Private Methods

#### `forgetCache(): void`
- **Cache Key:** `'ports_list'`
- **Action:** `Cache::forget(key)`
- **Effect:** Next query will re-fetch and re-cache

### Caching Strategy

```
Query: Get all ports
  ├─ Check cache: Cache::get('ports_list')
  ├─ If cached: return cached
  └─ If empty: query DB → Cache::put('ports_list', data, TTL)

Port changes (create/update/delete/restore/forceDelete)
  └─ Invalidate cache: Cache::forget('ports_list')
  └─ Next query: Re-fetch and re-cache
```

### Design Pattern

**Reactive Cache Invalidation:**
- Pro: Simple, guarantees freshness on changes
- Con: Cache miss on every modification
- Alternative: Time-based TTL + reactive invalidation (hybrid)

### Example Usage

```php
// Model method (likely)
public static function allPorts()
{
    return Cache::remember('ports_list', 3600, function() {
        return static::all();
    });
}

// Port changes trigger observer
Port::create([...]);  // forgetCache() called
Port::first()->update([...]); // forgetCache() called

// Next fetch re-populates cache
Port::allPorts(); // Re-queries DB, re-caches
```

---

## 3️⃣ QuoteDetailObserver

**Location:** `App\Observers\QuoteDetailObserver`  
**Model:** `App\Models\Quote\QuoteDetail`  
**Registration:** AppServiceProvider (line: `QuoteDetail::observe(QuoteDetailObserver::class)`)

### Purpose

Maintains quote integrity:
1. Recalculate quote totals on any detail change
2. Auto-sync discounts when related line items change
3. Handle percentage/fixed discounts with conditional application

### Methods

#### `created(QuoteDetail $quoteDetail): void`
- **Trigger:** New line item added
- **Action:** `recalculateQuote()`
- **Effect:** Quote totals updated with new item

#### `updated(QuoteDetail $quoteDetail): void`
- **Trigger:** Existing line item modified
- **Actions:** 
  1. `handlePriceChanges()` - Check if amount/quantity changed, update applicable discounts
  2. `recalculateQuote()` - Recalculate totals
- **Flow:** Price changes → discount sync → total recalc

#### `deleted(QuoteDetail $quoteDetail): void`
- **Trigger:** Line item removed
- **Action:** `recalculateQuote()`
- **Effect:** Quote totals recalculated without deleted item

### Protected Methods

#### `handlePriceChanges(QuoteDetail $quoteDetail): void`
- **Guard:** Only proceed if `total_amount` or `quantity` changed
- **Logic:**
  1. Get parent Quote
  2. Find all discount-type details in quote
  3. For each discount: check if it applies to modified line's unit type
  4. If applies: call `updateDiscountAmount()`
- **Discount Applicability:** Matched via `product->applies_to_type` vs `quoteDetail->unit`

#### `updateDiscountAmount(QuoteDetail $discountDetail, $quote): void`
- **Input:** Discount QuoteDetail, parent Quote
- **Logic:**
  1. Get discount value & type from detail or product
  2. Guard: skip if not percentage type or not discount type
  3. Calculate base amount:
     - If `applies_to_type === 'total'`: sum all non-discount items
     - Else: sum items matching unit type
  4. Calculate: `newDiscountAmount = (baseAmount * discountValue) / 100`
  5. Ensure negative: `if > 0 → negate`
  6. Update quietly: `updateQuietly()` (avoids retriggering observer)

**Supported Discount Types:** `percentage`, `percent`, `percentuale` (i18n variants)

#### `recalculateQuote(QuoteDetail $quoteDetail): void`
- **Action:** Call `$quote->recalculateTotals()`
- **Guard:** Check quote exists
- **Effect:** Subtotal, tax, grand total recalculated

### Data Model

**QuoteDetail Fields:**
```
- id (PK)
- quote_id (FK)
- type (string: 'item', 'discount', etc.)
- unit (string: 'pax', 'cruise', 'cabin', etc.)
- unit_price (decimal)
- quantity (int)
- total_amount (decimal)
- product_id (FK, nullable for discounts)
- discount_value (decimal, nullable)
- discount_type (string, nullable: 'percentage', 'fixed')
- line_subtotal (decimal)
```

### Example Flows

**Scenario 1: Add Cruise Item**
```
create() called with unit='cruise', total_amount=1000
  └─ recalculateQuote()
     └─ Quote.recalculateTotals()
        ├─ Subtotal = 1000
        ├─ Tax = calculated
        └─ Grand Total = updated
```

**Scenario 2: Update Cruise Price (1000 → 1200)**
```
update() called with new total_amount=1200
  ├─ handlePriceChanges()
  │  ├─ isDirty('total_amount') = true
  │  ├─ Find discounts applying to 'cruise' type
  │  ├─ For each: updateDiscountAmount()
  │  │  ├─ baseAmount = 1200 (sum cruises, excl. discounts)
  │  │  ├─ newDiscountAmount = (1200 * 5) / 100 = -60
  │  │  └─ updateQuietly() discount detail
  │  └─ return
  └─ recalculateQuote()
     └─ Quote totals: Subtotal=1200 - 60 discount = 1140
```

**Scenario 3: Delete Cruise Item**
```
delete() called
  └─ recalculateQuote()
     └─ Subtotal without deleted item
```

### Implementation Details

**updateQuietly() Usage:**
- Avoids retriggering observer on discount amount update
- Prevents infinite loops: price change → discount sync → would trigger update again
- Manual save without events

**Discount Matching Logic:**
```php
if ($product->applies_to_type === $quoteDetail->unit || 
    $product->applies_to_type === 'total') {
    // Apply discount recalc
}
```
- `applies_to_type === 'total'`: applies to entire quote
- `applies_to_type === $unit`: applies only to specific line type (pax, cruise, cabin, etc.)

---

## 📝 Migration Notes for Base44

### Observer Pattern Limitations
- **Current:** Observers tied to Eloquent models
- **Issue:** Hard to test, silent failures, implicit dependencies
- **Base44 Approach:** Explicit automation + backend functions

### Cache Invalidation
- **Current:** PortObserver clears 'ports_list'
- **Better:** Event-driven cache invalidation or TTL-based
- **Base44:** Use Redis subscribers or scheduled cache refresh

### Quote Recalculation
- **Current:** Observer-driven totals
- **Complex:** Nested discount logic, percentage calculations
- **Better:** Separate query service vs. persistence
- **Base44 Pattern:**
  ```typescript
  // Backend function for quote totals
  const quote = await base44.entities.Quote.get(id);
  const details = await base44.entities.QuoteDetail.filter({quote_id: id});
  const totals = calculateQuoteTotals(details);
  ```

### Design Improvements for Base44
1. **Separate concerns:** Quote calculation ≠ persistence
2. **Explicit triggers:** Don't rely on implicit observer events
3. **Idempotent operations:** Price changes should be deterministic
4. **Audit trail:** Track discount calculations for transparency

### Type Safety
- Observer methods lack type hints on some params
- **Base44:** Use TypeScript for compile-time safety