# Fibos Testing Controller

**Purpose:** Manual testing endpoint for Fibos API integration, allowing developers to trigger sailings and itineraries data fetch from the admin panel.  
**Namespace:** `App\Http\Controllers\Testing`  
**Location:** `App/Http/Controllers/Testing/FibosTests.php`  
**Routes:** (inferred)
- `GET /tests` → `index()` — view testing dashboard
- `GET /tests/sailings` → `sailingsTest()` — fetch pricings
- `GET /tests/itineraries` → `itinerariesTest()` — fetch itineraries

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | Manual testing controller (development/admin use) |
| Auth | Likely admin-only (assumed via route group) |
| Primary Use | Test Fibos API connectivity per cruiseline |
| Dependencies | `FibosApi` service, `FibosSetting` model |
| Logging | Uses Laravel Log facade for test output |

---

## 🔧 Methods

### `index()`

```php
public function index()
{
    return view('tests.index');
}
```

- Returns a view at `tests.index` (Blade template)
- Likely provides a UI with links/buttons to trigger test methods
- No parameters or logic

---

### `sailingsTest()`

```php
public function sailingsTest()
{
    Log::info('test');
    $settings = FibosSetting::all();
    foreach ($settings as $setting) {
        try {
          $this->service->getPricings($setting->cruiseline_code);
        } catch (\Exception $exception) {
            Log::error($exception->getMessage());
        }
    }
}
```

**Purpose:** Fetch pricing data from Fibos API for all configured cruiselines.

| Step | Action |
|------|--------|
| 1 | Log generic `'test'` info message |
| 2 | Fetch all `FibosSetting` records (one per cruiseline) |
| 3 | For each setting, call `FibosApi::getPricings($cruiseline_code)` |
| 4 | Catch `\Exception`, log error message only |

**Issues:**
- No return value — method completes silently
- No UI feedback — caller has no way to know if test succeeded or failed
- Generic logging — `Log::info('test')` and error messages don't include cruiseline code or context
- No response body — should return JSON with results

---

### `itinerariesTest()`

```php
public function itinerariesTest()
{
    Log::info('test');
    $settings = FibosSetting::all();
    foreach ($settings as $setting) {
        try {
            $this->service->getItineraries($setting->cruiseline_code,'*');
        }catch (\Exception $exception){
            Log::error($exception->getMessage());
        }
    }
}
```

**Purpose:** Fetch itinerary data from Fibos API for all configured cruiselines.

| Step | Action |
|------|--------|
| 1 | Log generic `'test'` info message |
| 2 | Fetch all `FibosSetting` records |
| 3 | For each setting, call `FibosApi::getItineraries($cruiseline_code, '*')` |
| 4 | Catch `\Exception`, log error message only |

**Parameters:**
- `$cruiseline_code` — cruiseline identifier from setting
- `'*'` — hardcoded wildcard (likely means "all itineraries" in Fibos terminology)

**Issues:**
- Same as `sailingsTest()` — no return value, no response feedback
- Hardcoded `'*'` wildcard — not configurable
- No logging of which cruiseline succeeded/failed

---

## ⚠️ Issues / Concerns

### 1. No HTTP Response
Both test methods don't return any response — they execute silently in the background. Developers must check the logs to see if tests ran.

```php
// Current: silent
public function sailingsTest() { ... }

// Better: return JSON with results
public function sailingsTest() {
    $results = [];
    foreach ($settings as $setting) {
        try {
            $this->service->getPricings($setting->cruiseline_code);
            $results[$setting->cruiseline_code] = 'success';
        } catch (\Exception $e) {
            $results[$setting->cruiseline_code] = 'error: ' . $e->getMessage();
        }
    }
    return response()->json($results);
}
```

### 2. Generic Logging
- `Log::info('test')` — provides no context
- Error log omits cruiseline code, request details
- Should include cruiseline, operation, and full exception trace

```php
// Better logging
Log::info('Fibos pricings test starting');
Log::info('Testing pricings for cruiseline', ['code' => $setting->cruiseline_code]);
Log::error('Fibos pricings test failed', [
    'cruiseline' => $setting->cruiseline_code,
    'error' => $exception->getMessage(),
    'trace' => $exception->getTraceAsString(),
]);
```

### 3. No Authorization Check
- Controller likely has no `authorize()` or explicit role check
- Assumes routes are protected in route group (inferred `admin` middleware)
- **Risk:** If routes are public, anyone can trigger expensive API calls

### 4. Hardcoded Wildcard
- `'*'` parameter hardcoded in `itinerariesTest()`
- Should be configurable or at least documented
- What does `'*'` mean in Fibos API context?

### 5. Bare Exception Catch
- `catch (\Exception $exception)` — catches all exceptions
- Should catch `FibosApiException` or `InvalidConfigurationException` specifically
- Could mask programming errors (e.g., null reference, type error)

### 6. No Timeout Handling
- Fibos API calls may hang or timeout
- No explicit timeout configuration
- Test could block for extended periods

### 7. No Response Status Indication
- Success/failure not differentiated in HTTP response
- Both return void → HTTP 200, but tests could all fail silently

---

## 📝 Migration Notes for Base44

### Current Architecture

```
Developer/Admin visits /tests
  ↓
View with button links
  ↓
POST /tests/sailings → sailingsTest() → FibosApi::getPricings()
  ↓
Log info/error
  (no feedback to browser)
```

### Base44 Equivalent: Backend Function

**Backend Function: testFibosAPI**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // Admin-only
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { testType } = await req.json(); // 'pricings' | 'itineraries'

  const settings = await base44.entities.FibosSetting.list();
  const results: Record<string, string> = {};

  for (const setting of settings) {
    try {
      if (testType === 'pricings') {
        const pricings = await fetchFibosPricings(setting.cruiseline_code);
        results[setting.cruiseline_code] = `success (${pricings.length} records)`;
      } else if (testType === 'itineraries') {
        const itineraries = await fetchFibosItineraries(setting.cruiseline_code);
        results[setting.cruiseline_code] = `success (${itineraries.length} records)`;
      }
    } catch (error) {
      results[setting.cruiseline_code] = `error: ${error.message}`;
      console.error(`Fibos ${testType} failed for ${setting.cruiseline_code}`, error);
    }
  }

  return Response.json({ testType, results, timestamp: new Date().toISOString() });
});

async function fetchFibosPricings(cruiselineCode: string) {
  const response = await fetch('https://fibos-api.example.com/pricings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('FIBOS_API_KEY')}` },
    body: JSON.stringify({ cruiseline_code: cruiselineCode }),
  });
  if (!response.ok) throw new Error(`Fibos API error: ${response.statusText}`);
  return response.json();
}

async function fetchFibosItineraries(cruiselineCode: string) {
  const response = await fetch('https://fibos-api.example.com/itineraries', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('FIBOS_API_KEY')}` },
    body: JSON.stringify({ cruiseline_code: cruiselineCode, filter: '*' }),
  });
  if (!response.ok) throw new Error(`Fibos API error: ${response.statusText}`);
  return response.json();
}
```

**Frontend: Admin Testing Panel (React)**

```typescript
export default function FibosTestPanel() {
  const [testType, setTestType] = useState<'pricings' | 'itineraries'>('pricings');
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('testFibosAPI', { testType });
    setResults(res.data.results);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2>Fibos API Testing</h2>
      <div>
        <label>
          <input
            type="radio"
            value="pricings"
            checked={testType === 'pricings'}
            onChange={e => setTestType(e.target.value as 'pricings')}
          />
          Pricings
        </label>
        <label>
          <input
            type="radio"
            value="itineraries"
            checked={testType === 'itineraries'}
            onChange={e => setTestType(e.target.value as 'itineraries')}
          />
          Itineraries
        </label>
      </div>
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Testing...' : 'Run Test'}
      </button>
      {results && (
        <div>
          <h3>Results:</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### Key Improvements

1. **Explicit Response:** Returns JSON with results per cruiseline
2. **Admin Protection:** Role check in backend function
3. **Configurable Test Type:** Parameter instead of separate methods
4. **Better Logging:** Detailed error messages with context
5. **UI Feedback:** Results displayed in real-time
6. **Testable:** Backend function independently testable with mock settings
7. **No Hanging:** HTTP request timeout handled automatically by Deno runtime

### Entities Required

| Entity | Key Fields |
|--------|-----------|
| `FibosSetting` | `cruiseline_code`, `subsystem_id`, `agency_id1`, `agency_id2`, `currency`, `enabled` |

### Secrets Required

| Secret | Description |
|--------|-------------|
| `FIBOS_API_KEY` | Fibos WSDL/REST API key for authentication |