# HTTP Middleware Classes

**Purpose:** Custom and extended Laravel middleware handling authentication redirects, cookie encryption, website context initialization, localization, and request validation.  
**Namespace:** `App\Http\Middleware`  
**Total Classes:** 11

---

## 📋 Middleware Index

| Class | Type | Purpose | Registered In |
|-------|------|---------|---------------|
| Authenticate | Extended | Redirect unauthenticated users to login | Kernel alias `auth` |
| EncryptCookies | Extended | Cookie encryption config (no exceptions) | `web` group |
| InitializeWebsite | Custom | Set website/currency/locale context per request | `web` group (inferred) |
| Localization | Custom | Set app locale from session | `web` group |
| PreventRequestsDuringMaintenance | Extended | Maintenance mode (no URI exceptions) | Global |
| RedirectIfAuthenticated | Custom | Redirect logged-in users away from guest pages | Kernel alias `guest` |
| TrimStrings | Extended | Strip whitespace (exclude passwords) | Global |
| TrustHosts | Extended | Trust subdomains of app URL | Global (commented out) |
| TrustProxies | Extended | Trust reverse proxy headers (AWS ELB) | Global |
| ValidateSignature | Extended | Signed URL validation (no ignored params) | Kernel alias `signed` |
| VerifyCsrfToken | Extended | CSRF protection (no URI exceptions) | `web` group |

---

## 🔒 Authenticate

**Location:** `App\Http\Middleware\Authenticate`  
**Extends:** `Illuminate\Auth\Middleware\Authenticate`  
**Registered As:** `auth` alias in Kernel

### Implementation

```php
protected function redirectTo($request)
{
    if (! $request->expectsJson()) {
        return route('login');
    }
}
```

### Behavior

| Request Type | Response |
|-------------|---------|
| JSON (`Accept: application/json`) | `null` → 401 Unauthorized (no redirect) |
| HTML/browser requests | Redirect to `route('login')` |

### Notes

- Standard Laravel pattern — redirects browser requests, returns 401 for API/JSON
- Relies on named route `'login'` existing in routes

### Migration to Base44

```typescript
// Replaces auth middleware in every backend function
const user = await base44.auth.me();
if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
// No redirect needed — frontend handles navigation
```

---

## 🍪 EncryptCookies

**Location:** `App\Http\Middleware\EncryptCookies`  
**Extends:** `Illuminate\Cookie\Middleware\EncryptCookies`  
**Registered In:** `web` middleware group

### Implementation

```php
protected $except = [
    //
];
```

### Behavior

- **No exceptions configured** — all cookies are encrypted
- Standard Laravel cookie encryption for all web requests

### Notes

- Empty `$except` array means full encryption (no plain-text cookies)
- Common exclusions would be: analytics cookies (e.g., `_ga`), cookie consent flags

### Migration to Base44

- **Not applicable.** Base44 uses stateless token-based auth — no server-side cookie management needed.

---

## 🌐 InitializeWebsite

**Location:** `App\Http\Middleware\InitializeWebsite`  
**Type:** Custom (implements `handle()` from scratch)  
**Registered In:** `web` group or global (inferred from role)

### Implementation

```php
public function handle(Request $request, Closure $next): Response
{
    $website = Website::where('hostname', $request->getHost())->first();

    if ($website) {
        $currency = Currency::wherePrimary(true)->first();
        $request->website = $website;
        $request->primaryCurrency = $currency;

        // Locale: session > website.default_lang > config('app.locale')
        $locale = session('locale', strtolower($website->default_lang ?? config('app.locale')));
        App::setLocale($locale);

        // Share to all views
        view()->share('website', $website);
        view()->share('locale', $locale);

        // Active page detection
        $page = Page::where('website_id', $website->id)
            ->where('link', '/' . $request->path())
            ->first();
        view()->share('currentPage', $page);

        // DB connection: set search_path for multi-tenant (if applicable)
        DB::statement("SET search_path TO {$website->schema}, public");
    }

    return $next($request);
}
```

### Behavior

| Step | Action |
|------|--------|
| 1 | Lookup `Website` by `hostname` |
| 2 | Set primary currency on request |
| 3 | Bind `$request->website` for downstream access |
| 4 | Resolve locale (session → website default → app default) |
| 5 | Set Laravel locale (`App::setLocale()`) |
| 6 | Share `website`, `locale` to all Blade views |
| 7 | Detect current CMS page by URL path |
| 8 | Set PostgreSQL `search_path` (multi-tenant schema switching) |

### Key Dependencies

| Dependency | Purpose |
|-----------|---------|
| `Website` model | Multi-tenant website lookup |
| `Currency` model | Primary currency resolution |
| `Page` model | CMS page detection |
| `App::setLocale()` | Laravel locale switching |
| `DB::statement()` | PostgreSQL schema switching |

### Multi-Tenant Architecture

The `SET search_path TO {schema}` call is critical:
- Each website may have its own PostgreSQL schema
- This ensures all DB queries scope to the correct tenant's data
- **Risk:** If `$website->schema` is user-controlled, SQL injection possible
- **Fix:** Validate schema name against allowlist

### Issues

1. **SQL Injection Risk:** `{$website->schema}` injected directly into `SET search_path` without sanitization
2. **Silent Failure:** If no website found, request continues with no website context
3. **No Fallback Currency:** If no primary currency found, `$currency` is null
4. **Locale Lowercase:** `strtolower()` applied — verify locale system accepts lowercase codes (some expect `it_IT`)
5. **Performance:** 2 DB queries on every web request (Website + Currency)
6. **Page Detection:** Additional query per request to detect current page
7. **Italian Comments:** Inline comments in Italian

### Migration to Base44

```typescript
// No equivalent needed — Base44 handles multi-tenancy at platform level
// Website context set via:
// 1. Platform domain configuration
// 2. Frontend env variables (VITE_SITE_ID etc.)
// 3. Backend function receives request context

// For locale handling:
// Store user locale preference in User entity
// Frontend reads and applies locale via i18n library

// For page detection:
// React Router handles route matching client-side
// CMS page lookup done in page components, not middleware
```

---

## 🌍 Localization

**Location:** `App\Http\Middleware\Localization`  
**Type:** Custom (standalone `handle()`)  
**Registered In:** `web` group (likely after `InitializeWebsite`)

### Implementation

```php
public function handle(Request $request, Closure $next)
{
    if (session()->has('locale')) {
        App::setLocale(session()->get('locale'));
    }
    return $next($request);
}
```

### Behavior

- Reads `locale` from session
- If set, overrides app locale via `App::setLocale()`
- If not set, does nothing (app default locale remains)

### Relationship with InitializeWebsite

Both `InitializeWebsite` and `Localization` set the locale:

| Middleware | Source | Priority |
|-----------|--------|---------|
| `InitializeWebsite` | session → website.default_lang → config | Runs first |
| `Localization` | session only | Runs after, can override |

**Redundancy:** Both check session for `locale`. `Localization` is a simpler version that doesn't do the full website context setup.

### Issues

1. **Overlap with InitializeWebsite:** If both are registered, locale is set twice from session
2. **No Validation:** Any locale string accepted without validation
3. **Silent Fail:** If session has invalid locale, Laravel may not find translations

### Migration to Base44

```typescript
// Not needed — locale managed client-side in React
// Store in User entity or localStorage:
const locale = user.preferred_locale || 'it';
i18n.changeLanguage(locale);
```

---

## 🚧 PreventRequestsDuringMaintenance

**Location:** `App\Http\Middleware\PreventRequestsDuringMaintenance`  
**Extends:** `Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance`  
**Registered In:** Global middleware

### Implementation

```php
protected $except = [
    //
];
```

### Behavior

- No URIs whitelisted for maintenance mode bypass
- All requests blocked when `php artisan down` is active
- Returns 503 Service Unavailable

### Notes

- Common exceptions: `/admin` (so admins can still access), `/health` (for load balancers)
- Empty array means **total lockout** during maintenance

### Migration to Base44

- **Not applicable.** Base44 platform handles maintenance at infrastructure level.
- Can toggle app offline via dashboard settings.

---

## 🔁 RedirectIfAuthenticated

**Location:** `App\Http\Middleware\RedirectIfAuthenticated`  
**Type:** Custom (standalone)  
**Registered As:** `guest` alias in Kernel

### Implementation

```php
public function handle(Request $request, Closure $next, ...$guards)
{
    $guards = empty($guards) ? [null] : $guards;

    foreach ($guards as $guard) {
        if (Auth::guard($guard)->check()) {
            return redirect(RouteServiceProvider::HOME);
        }
    }

    return $next($request);
}
```

### Behavior

| State | Response |
|-------|---------|
| User authenticated | Redirect to `RouteServiceProvider::HOME` |
| User not authenticated | Continue request |

### Notes

- Used on guest-only routes (login, register, password reset)
- `RouteServiceProvider::HOME` constant defines the post-auth home (typically `/`)
- Supports multiple guards (web, api, etc.)

### Migration to Base44

```typescript
// Frontend handles this via route guards
// Check authentication before rendering guest-only pages:
const isAuthenticated = await base44.auth.isAuthenticated();
if (isAuthenticated) {
    navigate('/dashboard');
}
```

---

## ✂️ TrimStrings

**Location:** `App\Http\Middleware\TrimStrings`  
**Extends:** `Illuminate\Foundation\Http\Middleware\TrimStrings`  
**Registered In:** Global middleware

### Implementation

```php
protected $except = [
    'current_password',
    'password',
    'password_confirmation',
];
```

### Behavior

- Trims whitespace from all string inputs
- **Excludes:** Password fields (trimming passwords can cause auth issues)

### Notes

- Standard Laravel pattern — always exclude password fields
- Prevents accidental whitespace in form submissions

### Migration to Base44

```typescript
// Handle in backend function input processing:
const trimmed = Object.fromEntries(
    Object.entries(body).map(([k, v]) => [
        k,
        (typeof v === 'string' && !['password', 'current_password'].includes(k))
            ? v.trim()
            : v
    ])
);
```

---

## 🏠 TrustHosts

**Location:** `App\Http\Middleware\TrustHosts`  
**Extends:** `Illuminate\Http\Middleware\TrustHosts`  
**Registered In:** Global middleware — **COMMENTED OUT** in Kernel

### Implementation

```php
public function hosts()
{
    return [
        $this->allSubdomainsOfApplicationUrl(),
    ];
}
```

### Behavior

- Trusts all subdomains of the `APP_URL` environment variable
- Example: if `APP_URL=https://cruisetopic.com`, trusts `*.cruisetopic.com`

### Status: Disabled

Currently commented out in `App\Http\Kernel`:
```php
// \App\Http\Middleware\TrustHosts::class,
```

**Security Risk:** Without this middleware, `Host` header injection is possible. Attackers can forge the Host header to trigger unintended behavior (password reset links, cache poisoning).

**Recommendation:** Enable in production with explicit host list.

### Migration to Base44

- **Not applicable.** CDN/platform handles host validation at infrastructure level.

---

## 🔀 TrustProxies

**Location:** `App\Http\Middleware\TrustProxies`  
**Extends:** `Illuminate\Http\Middleware\TrustProxies`  
**Registered In:** Global middleware

### Implementation

```php
protected $proxies;  // null = no specific proxies trusted

protected $headers =
    Request::HEADER_X_FORWARDED_FOR |
    Request::HEADER_X_FORWARDED_HOST |
    Request::HEADER_X_FORWARDED_PORT |
    Request::HEADER_X_FORWARDED_PROTO |
    Request::HEADER_X_FORWARDED_AWS_ELB;
```

### Trusted Headers

| Header | Purpose |
|--------|---------|
| `X-Forwarded-For` | Real client IP behind proxy |
| `X-Forwarded-Host` | Original Host header |
| `X-Forwarded-Port` | Original port |
| `X-Forwarded-Proto` | Original protocol (http/https) |
| `X-Forwarded-AWS-ELB` | AWS Elastic Load Balancer specific |

### Notes

- `$proxies = null` means no specific trusted proxies — accepts from **any** proxy
- `HEADER_X_FORWARDED_AWS_ELB` indicates deployment on AWS behind ELB/ALB
- Without this, `$request->ip()` would return the load balancer IP, not client IP

### Issues

1. **`$proxies = null`:** Trusts any upstream proxy — could allow IP spoofing
   - **Fix:** Set to specific proxy IPs or `'*'` intentionally with documentation

### Migration to Base44

- **Not applicable.** Base44 platform handles proxy headers at infrastructure level.

---

## ✍️ ValidateSignature

**Location:** `App\Http\Middleware\ValidateSignature`  
**Extends:** `Illuminate\Routing\Middleware\ValidateSignature`  
**Registered As:** `signed` alias in Kernel

### Implementation

```php
protected $except = [
    // 'fbclid',
    // 'utm_campaign',
    // 'utm_content',
    // 'utm_medium',
    // 'utm_source',
    // 'utm_term',
];
```

### Behavior

- Validates HMAC signature on signed URLs (e.g., email verification links)
- All query string parameters included in signature verification
- Common marketing params (`fbclid`, `utm_*`) are **commented out** — they would invalidate the signature if appended

### Issues

1. **Marketing Params Not Excluded:** UTM params commented out
   - If a signed URL is shared with UTM tracking appended, verification will fail
   - **Fix:** Uncomment and add common tracking params to `$except`

### Migration to Base44

```typescript
// Signed URL validation in backend function:
import { createHmac } from 'node:crypto';

function verifySignedUrl(url: string, secret: string): boolean {
    const urlObj = new URL(url);
    const signature = urlObj.searchParams.get('signature');
    urlObj.searchParams.delete('signature');
    
    const expected = createHmac('sha256', secret)
        .update(urlObj.toString())
        .digest('hex');
    
    return signature === expected;
}
```

---

## 🛡️ VerifyCsrfToken

**Location:** `App\Http\Middleware\VerifyCsrfToken`  
**Extends:** `Illuminate\Foundation\Http\Middleware\VerifyCsrfToken`  
**Registered In:** `web` middleware group

### Implementation

```php
protected $except = [
    //
];
```

### Behavior

- Validates CSRF token on all mutating requests (POST, PUT, PATCH, DELETE)
- **No exceptions** — all web routes protected
- Token sourced from session or `X-CSRF-TOKEN` header

### Notes

- Empty `$except` array = **full CSRF protection** on all web routes
- Common exclusions: webhook endpoints (can't send CSRF token), third-party callbacks

### Migration to Base44

- **Not applicable.** Base44 backend functions use token-based auth (no session/CSRF).
- API routes inherently stateless — no CSRF risk.

---

## 📊 Middleware Summary

### What Each Middleware Does at Request Time

```
Request arrives
  ↓
[Global] TrustProxies       → Normalize client IP from X-Forwarded-* headers
[Global] TrimStrings        → Strip whitespace from inputs (except passwords)
[Global] PreventMaintenance → Block if maintenance mode active
--- web group ---
[Web] EncryptCookies        → Decrypt incoming / encrypt outgoing cookies
[Web] VerifyCsrfToken       → Validate CSRF token
[Web] Localization          → Set locale from session
--- custom (inferred) ---
[Custom] InitializeWebsite  → Set website context, currency, locale, page
--- route-specific ---
[alias: auth] Authenticate           → Redirect to login if unauthenticated
[alias: guest] RedirectIfAuthenticated → Redirect home if already authenticated
[alias: signed] ValidateSignature    → Validate HMAC signed URL
```

---

## 🔐 Security Analysis

| Middleware | Status | Risk |
|-----------|--------|------|
| TrustHosts | ⚠️ Disabled | Host header injection possible |
| TrustProxies `$proxies=null` | ⚠️ | Any proxy trusted — IP spoof risk |
| ValidateSignature UTM params | ⚠️ | Marketing params break signed URLs |
| VerifyCsrfToken `$except=[]` | ✅ | Full protection |
| EncryptCookies `$except=[]` | ✅ | All cookies encrypted |
| InitializeWebsite schema injection | 🚨 | SQL injection via `search_path` |
| TrimStrings passwords excluded | ✅ | Correct |
| Authenticate JSON/HTML split | ✅ | Correct pattern |

---

## 📝 Migration Notes for Base44

### Full Middleware Mapping

| Laravel Middleware | Base44 Equivalent | Status |
|-------------------|-------------------|--------|
| `Authenticate` | `base44.auth.me()` in each function | ✅ Simple replace |
| `EncryptCookies` | Not needed (no server cookies) | ❌ Eliminate |
| `InitializeWebsite` | Frontend context + backend function arg | 🔄 Refactor |
| `Localization` | Client-side i18n library | 🔄 Refactor |
| `PreventMaintenance` | Platform toggle | ❌ Eliminate |
| `RedirectIfAuthenticated` | Frontend route guard | 🔄 Refactor |
| `TrimStrings` | Input preprocessing in function | 🔄 Simple inline |
| `TrustHosts` | Platform/CDN config | ❌ Eliminate |
| `TrustProxies` | Platform handles | ❌ Eliminate |
| `ValidateSignature` | Custom HMAC in function | 🔄 Refactor |
| `VerifyCsrfToken` | Not needed (stateless API) | ❌ Eliminate |

### InitializeWebsite Refactor Strategy

The most complex migration is `InitializeWebsite` because it injects context used everywhere.

**Current Usage Pattern:**
```php
// In controllers/views:
$website = $request->website;
$currency = $request->primaryCurrency;
$locale = App::getLocale();
```

**Base44 Strategy:**

1. **Website config stored in entity:**
```typescript
// WebsiteConfig entity with hostname, default_lang, market_id, currency_id, schema
const config = await base44.entities.WebsiteConfig.filter({ hostname: 'cruisetopic.it' });
```

2. **Frontend reads from env/config:**
```typescript
// VITE_SITE_ID set per deployment
const siteId = import.meta.env.VITE_SITE_ID;
```

3. **Locale managed client-side:**
```typescript
// React + i18next
i18n.use(initReactI18next).init({ lng: user.locale || 'it' });
```

4. **Backend function receives context as parameter:**
```typescript
// Each function call includes website context
const { websiteId, locale } = req.body;
const website = await base44.entities.Website.get(websiteId);
```

### Key Takeaways

1. **Eliminate 7 middlewares** — Platform handles proxy, cookies, CSRF, maintenance
2. **Refactor 4 middlewares** — Auth, locale, website context, signed URLs
3. **Critical Security Fix** — `InitializeWebsite` schema injection must be addressed
4. **Localization** — Move entirely to frontend i18n library
5. **Multi-tenancy** — Requires explicit website context parameter instead of request-level injection