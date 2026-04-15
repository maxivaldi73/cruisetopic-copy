# API Controllers

**Purpose:** Handle REST API endpoints for authentication and itineraries queries.  
**Namespace:** `App\Http\Controllers\Api`  
**Location:** `App/Http/Controllers/Api/`  
**Total Controllers:** 2

---

## 📋 Controller Index

| Controller | Method | Purpose | Endpoint (inferred) |
|-----------|--------|---------|-------------------|
| ApiAuthController | login() | Authenticate via email/password and issue API token | `POST /api/auth/login` |
| ItinerariesController | getItineraries() | Query itineraries with optional filters | `GET /api/itineraries` |

---

## 🔧 Detailed Controllers

### ApiAuthController

**File:** `ApiAuthController.php`

```php
public function login(Request $request): \Illuminate\Http\JsonResponse
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    $user = \App\Models\User\User::where('email', $credentials['email'])->first();

    if (Auth::attempt($credentials)) {
        $token = $user->createToken('postman-token')->plainTextToken;
        return response()->json(['token' => $token]);
    }

    return response()->json([
        'error' => 'Le credenziali non sono corrette.'
    ]);
}
```

**Purpose:** Authenticate users and issue Sanctum API tokens.

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `POST /api/auth/login` |
| Request Body | `{email, password}` |
| Response | `{token}` or `{error}` |
| Auth | None (public) |
| Business Logic | Validate email/password, create Sanctum token |

**Flow:**
1. Validate email and password are provided and email is valid format
2. Fetch user by email
3. Attempt authentication using Laravel Auth::attempt()
4. On success: Create Sanctum token (`createToken('postman-token')`) and return plaintext token
5. On failure: Return JSON error message in Italian

**Parameters:**
- `email` — required, must be valid email format
- `password` — required, any value

**Response (Success - 200):**
```json
{
  "token": "1|abcdef1234567890..."
}
```

**Response (Failure - 401 implied, but returns 200 with error):**
```json
{
  "error": "Le credenziali non sono corrette."
}
```

**Token Usage:** Client includes token in Authorization header:
```
Authorization: Bearer {token}
```

---

### ItinerariesController

**File:** `ItinerariesController.php`

```php
public function getItineraries(Request $request) {
    $itineraries = Itinerary::query()->whereDepartureDateGreaterThanNow();
    
    // filter by date range
    if ($request->has('date_from') && $request->has('date_to') && $request->date_from != null && $request->date_to != null) {
        $itineraries->whereBetween('itinerary_departure_date', [$request->date_from, $request->date_to]);
    }
    
    // filter by destination id
    if ($request->has('destination_id') && $request->destination_id != null) {
        $itineraries->whereHas('destinations', function ($query) use ($request) {
            $query->where('destinations.id', $request->destination_id);
        });
    }
    
    // filter by port id
    if ($request->has('port_id') && $request->port_id != null) {
        $itineraries->whereHas('itineraryElements', function ($query) use ($request) {
            $query->where('port_id', $request->port_id)
                ->where('sequence', 0);
        });
    }
    
    // filter by cruiseline id
    if ($request->has('cruiseline_id') && $request->cruiseline_id != null) {
        $itineraries->where('cruiseline_id', $request->cruiseline_id);
    }
    
    $itineraries = $itineraries->groupBy('itineraryCode')->get();
    return [
        "itinerariesCount" => $itineraries->count(),
        "itineraries" => $itineraries->toArray(),
    ];
}
```

**Purpose:** Query cruise itineraries with optional filtering.

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /api/itineraries` |
| Query Parameters | `date_from`, `date_to`, `destination_id`, `port_id`, `cruiseline_id` (all optional) |
| Response | `{itinerariesCount, itineraries}` |
| Auth | Required (Sanctum token from ApiAuthController) |
| Business Logic | Query builder with conditional filtering, grouping by itinerary code |

**Query Parameters (all optional):**
- `date_from` — filter itineraries departing on or after this date (format: YYYY-MM-DD)
- `date_to` — filter itineraries departing on or before this date (format: YYYY-MM-DD)
- `destination_id` — filter by destination ID (integer)
- `port_id` — filter by port ID (integer) — must be port with sequence 0 in itinerary
- `cruiseline_id` — filter by cruise line ID (integer)

**Logic Flow:**
1. Start with all itineraries where departure date > now
2. If `date_from` and `date_to` provided: filter between dates
3. If `destination_id` provided: filter to itineraries that visit destination
4. If `port_id` provided: filter to itineraries where port is first stop (sequence 0)
5. If `cruiseline_id` provided: filter by cruiseline
6. Group results by `itineraryCode` (removes duplicate itineraries)
7. Return count and array of results

**Response (200):**
```json
{
  "itinerariesCount": 42,
  "itineraries": [
    {
      "id": 1,
      "itinerary_code": "MED-7D",
      "itinerary_departure_date": "2025-06-15",
      "cruiseline_id": 5,
      ...
    },
    ...
  ]
}
```

**OpenAPI Specification:** Includes full OpenAPI 3.0 documentation for Swagger/API docs.

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | REST API controllers |
| Auth | ApiAuthController is public; ItinerariesController requires token |
| Response Format | JSON |
| Error Handling | Minimal (no HTTP status codes on auth failure) |
| Filtering | Dynamic query builder with optional filters |
| Documentation | OpenAPI spec for ItinerariesController |

---

## ⚠️ Issues / Concerns

### ApiAuthController

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ High | **Incorrect HTTP Status** — Returns 200 on auth failure instead of 401. Client can't distinguish success from failure. |
| 2 | ⚠️ Medium | **Hardcoded Token Name** — Token created with hardcoded name 'postman-token'. Should be descriptive or dynamic. |
| 3 | ⚠️ Medium | **Italian Error Message** — Error message only in Italian. Not i18n-friendly. |
| 4 | ⚠️ Medium | **No Rate Limiting** — No protection against brute force attacks. |
| 5 | ℹ️ Low | **User Query Redundant** — Queries user by email before `Auth::attempt()`. Unnecessary; `Auth::attempt()` finds user internally. |

### ItinerariesController

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ High | **No Pagination** — Returns all matching itineraries without limit. Could be huge resultset. |
| 2 | ⚠️ High | **Inefficient GroupBy** — `groupBy('itineraryCode')` in PHP after fetching all rows. Should use SQL `DISTINCT`. |
| 3 | ⚠️ Medium | **No Input Validation** — Date parameters not validated as valid dates. |
| 4 | ⚠️ Medium | **Null Checks Redundant** — Checks `!= null` after `has()` check. Could simplify. |
| 5 | ℹ️ Low | **Missing Error Handling** — No try/catch or error responses. Returns blank array on error. |
| 6 | ⚠️ Medium | **No Response Status** — Returns array instead of JSON response with status code. |

---

## 📝 Migration Notes for Base44

### Strategy: Backend Functions for API Endpoints

Base44 has built-in API capabilities. Migrate to backend functions.

### Backend Function: Login

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Call Base44's built-in login
    const response = await fetch('https://api.base44.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { token } = await response.json();
    return Response.json({ token, success: true });
  } catch (error) {
    return Response.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
});
```

### Backend Function: Query Itineraries

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const destinationId = url.searchParams.get('destination_id');
    const portId = url.searchParams.get('port_id');
    const cruiselineId = url.searchParams.get('cruiseline_id');

    // Build filter
    const filter: Record<string, any> = {};

    if (dateFrom && dateTo) {
      // Validate date format (YYYY-MM-DD)
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return Response.json(
          { error: 'Invalid date format (use YYYY-MM-DD)' },
          { status: 400 }
        );
      }
      filter.departure_date = { $gte: dateFrom, $lte: dateTo };
    }

    if (destinationId) {
      filter.destination_id = parseInt(destinationId);
    }

    if (portId) {
      filter.port_id = parseInt(portId);
    }

    if (cruiselineId) {
      filter.cruiseline_id = parseInt(cruiselineId);
    }

    // Query itineraries with pagination
    const itineraries = await base44.entities.Itinerary.filter(filter, '-departure_date', 50);

    return Response.json({
      count: itineraries.length,
      itineraries: itineraries,
      success: true,
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
});
```

### Frontend: Login Hook

```tsx
// hooks/useApiAuth.js
import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export function useApiAuth() {
  const [token, setToken] = useState(localStorage.getItem('api_token'));
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('login', { email, password });
      if (res.data.token) {
        localStorage.setItem('api_token', res.data.token);
        setToken(res.data.token);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('api_token');
    setToken(null);
  };

  return { token, login, logout, loading };
}
```

### Frontend: Itineraries Query Hook

```tsx
// hooks/useItineraries.js
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useItineraries(filters = {}) {
  return useQuery({
    queryKey: ['itineraries', filters],
    queryFn: async () => {
      const res = await base44.functions.invoke('getItineraries', filters);
      return res.data;
    },
    enabled: !!localStorage.getItem('api_token'), // Only fetch if authenticated
  });
}
```

### React Component: Itinerary Search

```tsx
// pages/ItinerarySearch.jsx
import { useState } from 'react';
import { useItineraries } from '@/hooks/useItineraries';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ItinerarySearch() {
  const [filters, setFilters] = useState({});
  const { data, isLoading, error } = useItineraries(filters);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setFilters(Object.fromEntries(formData));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <Input name="date_from" type="date" placeholder="From" />
        <Input name="date_to" type="date" placeholder="To" />
        <Input name="destination_id" type="number" placeholder="Destination ID" />
        <Input name="port_id" type="number" placeholder="Port ID" />
        <Input name="cruiseline_id" type="number" placeholder="Cruise Line ID" />
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {data && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Found {data.count} itineraries
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.itineraries?.map((itinerary) => (
              <Card key={itinerary.id} className="p-4">
                <h3 className="font-bold">{itinerary.itinerary_code}</h3>
                <p className="text-sm text-muted-foreground">
                  Departs: {new Date(itinerary.departure_date).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Key Improvements

1. **Correct HTTP Status Codes** — 401 on auth failure, 400 on validation error, 500 on server error
2. **Input Validation** — Validate date format, integer fields
3. **Pagination** — Limit results to 50 (configurable)
4. **Efficient Queries** — Use filter/query at database level, not PHP-level groupBy
5. **Error Handling** — Try/catch with meaningful error messages
6. **i18n** — English error messages (or configurable)
7. **Rate Limiting** — Can add via backend function middleware
8. **Type Safety** — TypeScript for better IDE support

### Entities Required

```json
// entities/Itinerary.json
{
  "itinerary_code": {"type": "string"},
  "departure_date": {"type": "string", "format": "date-time"},
  "destination_id": {"type": "integer"},
  "cruiseline_id": {"type": "integer"},
  "ports": {"type": "array"}
}
```

### Summary

Two API controllers for authentication and itinerary queries. In Base44:

- **Migrate to backend functions** — More secure and platform-agnostic
- **Use correct HTTP status codes** — 401 for auth failures, 400 for validation, 500 for errors
- **Add pagination** — Prevent huge result sets
- **Validate input** — Check dates are valid format, IDs are integers
- **Use entities** — Define Itinerary and related entities
- **Frontend hooks** — Use React Query for efficient client-side fetching

This approach is more maintainable, scalable, and follows REST API best practices.