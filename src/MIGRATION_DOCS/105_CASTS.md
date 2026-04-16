# Eloquent Casts (2 files)

**Directory:** `App/Casts/`  
**Namespace:** `App\Casts`  
**Type:** Custom Eloquent attribute casts — timezone-aware date/datetime handling  
**Priority:** MEDIUM — affects all date fields across models; understanding needed before entity migration

---

## 📋 Overview

| Class | Applied To | DB Format | PHP Output |
|-------|-----------|-----------|-----------|
| `LocalDateTime` | Datetime fields | UTC `Y-m-d H:i:s` | Carbon in `app.timezone` |
| `LocalDate` | Date-only fields | `Y-m-d` | Carbon in `app.timezone` |

Both implement `Illuminate\Contracts\Database\Eloquent\CastsAttributes` with `get()` (read) and `set()` (write) methods.

---

## 🔧 Implementation

### `LocalDateTime`

```php
class LocalDateTime implements CastsAttributes
{
    // READ: parse DB value → convert to app timezone
    public function get($model, string $key, $value, array $attributes)
    {
        return $value ? Carbon::parse($value)->setTimezone(config('app.timezone')) : null;
        // ✅ Null-safe — returns null if value is empty
        // ✅ Converts DB UTC timestamp to configured app timezone for display
        // ⚠️ config('app.timezone') loaded per-call — no caching
    }

    // WRITE: parse input → normalize to UTC before storing
    public function set($model, string $key, $value, array $attributes)
    {
        return $value ? Carbon::parse($value)->utc()->format('Y-m-d H:i:s') : null;
        // ✅ Normalizes any input to UTC before saving to DB
        // ✅ Consistent storage format: 'Y-m-d H:i:s'
        // ⚠️ Carbon::parse() on invalid string will throw — no error guard
    }
}
```

**Behavior summary:**
- DB stores UTC; PHP reads in local timezone
- Accepts any Carbon-parseable string as input, stores as UTC
- Clean and correct timezone handling pattern

---

### `LocalDate`

```php
class LocalDate implements CastsAttributes
{
    // READ: same as LocalDateTime — parse and convert to app timezone
    public function get($model, string $key, $value, array $attributes)
    {
        return $value ? Carbon::parse($value)->setTimezone(config('app.timezone')) : null;
        // ⚠️ Returns a Carbon DATETIME object for a date-only field
        //    (time component will be 00:00:00 or parsed time — could confuse consumers)
        // ⚠️ Applying timezone offset to a date-only value may shift the date by ±1 day
        //    (e.g. 2024-01-01 in UTC+14 becomes 2024-01-01T14:00, but in UTC-12 still 2024-01-01T00:00)
    }

    // WRITE: fast-path for already-formatted date strings; parse anything else
    public function set($model, string $key, $value, array $attributes)
    {
        if (!$value) return null;

        // Fast-path: already a YYYY-MM-DD string → store as-is (no UTC conversion)
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
            // ✅ Avoids unnecessary Carbon parse for clean date strings
        }

        return Carbon::parse($value)->format('Y-m-d');
        // ✅ Strips time component for non-date inputs
        // ⚠️ No timezone conversion on set (contrast with LocalDateTime which converts to UTC)
        //    — correct for date-only fields since dates are timezone-agnostic in most cases
        // ⚠️ Carbon::parse() on invalid string throws — no error guard
    }
}
```

**Behavior summary:**
- `get()`: returns Carbon object (with time 00:00:00) in app timezone — time portion is meaningless for date fields
- `set()`: stores as `Y-m-d` string, no UTC conversion (correct for pure dates)
- Fast-path avoids re-parsing already-valid date strings

---

## ⚠️ Issues

| # | Severity | Cast | Issue |
|---|----------|------|-------|
| 1 | ⚠️ HIGH | `LocalDate` | **`get()` returns Carbon with timezone offset applied to date-only value** — could shift date by ±1 day in extreme timezones (UTC+14 / UTC-12); should return `Carbon::parse($value)->toDateString()` or a `CarbonImmutable` date |
| 2 | ⚠️ HIGH | Both | **`Carbon::parse()` throws on invalid string input** — no try/catch guard; a malformed DB value will crash the model accessor |
| 3 | ⚠️ MEDIUM | `LocalDate` | **`get()` returns a `Carbon` (datetime) object for a date-only field** — consumers expecting a date string may get unexpected time components |
| 4 | ⚠️ MEDIUM | Both | **`config('app.timezone')` evaluated on every read** — minor performance concern on bulk queries; could be cached in a static property |
| 5 | ℹ️ LOW | `LocalDateTime` | **`set()` has no fast-path** — always calls `Carbon::parse()` + `->utc()->format()` even for already-UTC strings; minor inefficiency |
| 6 | ℹ️ LOW | Both | **No unit tests visible** — timezone edge cases (DST, UTC±12–14) are high-risk without test coverage |

---

## 📝 Migration to Base44

### Key Context

Base44 entities store dates as **ISO 8601 strings** (UTC). There is no equivalent of Eloquent casts — date/timezone conversion is handled in the **frontend** (display) and **backend functions** (input normalization).

### Pattern to Replicate

| Laravel Cast | Base44 Equivalent |
|-------------|-------------------|
| `LocalDateTime::get()` | Frontend: `new Date(isoString).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })` |
| `LocalDateTime::set()` | Backend function: `new Date(input).toISOString()` before entity save |
| `LocalDate::get()` | Frontend: display `field.split('T')[0]` or use `date-fns/format` |
| `LocalDate::set()` | Backend function: validate `YYYY-MM-DD` regex, store as-is |

### Entity Field Types

When migrating model fields that use these casts:

```json
// Fields using LocalDateTime cast → use "string" with format "date-time"
"departure_date": {
  "type": "string",
  "format": "date-time",
  "description": "Stored in UTC, display in local timezone"
}

// Fields using LocalDate cast → use "string" with format "date"
"embarkation_date": {
  "type": "string",
  "format": "date",
  "description": "Date only, no timezone conversion needed"
}
```

### Frontend Utility (suggested)

```ts
// utils/dates.ts
const APP_TIMEZONE = 'Europe/Rome';  // replaces config('app.timezone')

export const formatLocalDateTime = (isoString: string) =>
  new Intl.DateTimeFormat('it-IT', {
    timeZone: APP_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(isoString));

export const formatLocalDate = (dateString: string) =>
  dateString?.split('T')[0] ?? null;  // safe for both 'YYYY-MM-DD' and ISO strings

export const toUtcIso = (localDatetimeInput: string) =>
  new Date(localDatetimeInput).toISOString();
```

---

## Summary

**`Casts/LocalDateTime`** (15 lines): Eloquent cast that reads UTC datetime from DB and returns a Carbon object in `app.timezone`, and normalizes any input to UTC on write. Clean and correct — the standard pattern for timezone-aware datetime storage. Minor issues: no guard against invalid input strings, `config()` evaluated per-read.

**`Casts/LocalDate`** (20 lines): Eloquent cast for date-only fields. Write path is correct (stores `Y-m-d`, no timezone conversion). Read path has a subtle bug: applies `setTimezone(app.timezone)` to a date value, returning a Carbon datetime object — for extreme timezones this could shift the displayed date by ±1 day. Returns Carbon (datetime) where a date string would be more appropriate.

**Migration note:** No direct equivalent in Base44 — replicate with frontend `Intl.DateTimeFormat` for display and `new Date().toISOString()` in backend functions for storage normalization. Mark all migrated fields with `"format": "date-time"` or `"format": "date"` in entity schemas accordingly.