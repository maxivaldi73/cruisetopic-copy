# HTTP Kernel

**Purpose:** Central HTTP middleware configuration for the Laravel application. Defines global middleware, route middleware groups (web/api), and middleware aliases.  
**Location:** `App\Http\Kernel`  
**Extends:** `Illuminate\Foundation\Http\Kernel`

---

## Overview

The Kernel is the entry point for all HTTP requests. It registers three tiers of middleware:

| Tier | Description |
|------|-------------|
| Global Middleware | Runs on every request |
| Middleware Groups | Applied to `web` or `api` route groups |
| Middleware Aliases | Named shortcuts for route-level middleware |

---

## 🌐 Global Middleware

Applied to **every** incoming HTTP request, regardless of route.

```php
protected $middleware = [
    // \App\Http\Middleware\TrustHosts::class,         // Commented out
    \App\Http\Middleware\TrustProxies::class,
    \Illuminate\Http\Middleware\HandleCors::class,
    \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
    \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
    \App\Http\Middleware\TrimStrings::class,
    \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
];
```

| Middleware | Purpose |
|-----------|---------|
| `TrustHosts` | Validates the `Host` header (commented out — disabled) |
| `TrustProxies` | Trusts reverse proxy headers (X-Forwarded-For, etc.) |
| `HandleCors` | Handles Cross-Origin Resource Sharing (CORS) headers |
| `PreventRequestsDuringMaintenance` | Returns 503 when app in maintenance mode |
| `ValidatePostSize` | Rejects requests exceeding `post_max_size` PHP ini |
| `TrimStrings` | Strips leading/trailing whitespace from string inputs |
| `ConvertEmptyStringsToNull` | Converts empty string inputs to `null` |

**Notes:**
- `TrustHosts` is commented out — host header validation is disabled. Should be enabled in production environments with known hostnames.

---

## 🗂️ Middleware Groups

### `web` Group

Applied to all routes in `routes/web.php`.

```php
'web' => [
    \App\Http\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \App\Http\Middleware\VerifyCsrfToken::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

| Middleware | Purpose |
|-----------|---------|
| `EncryptCookies` | Encrypts and decrypts cookie values |
| `AddQueuedCookiesToResponse` | Flushes queued cookies to response |
| `StartSession` | Initializes and manages session state |
| `ShareErrorsFromSession` | Makes session validation errors available in views |
| `VerifyCsrfToken` | Protects against Cross-Site Request Forgery |
| `SubstituteBindings` | Resolves route model bindings (e.g., `{user}` → User model) |

### `api` Group

Applied to all routes in `routes/api.php`.

```php
'api' => [
    // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

| Middleware | Purpose |
|-----------|---------|
| `EnsureFrontendRequestsAreStateful` | Sanctum SPA auth (commented out — disabled) |
| `ThrottleRequests:api` | Rate limiting via `api` throttle config |
| `SubstituteBindings` | Resolves route model bindings |

**Notes:**
- Sanctum's `EnsureFrontendRequestsAreStateful` is commented out. The app may be using token-based auth instead of SPA cookie-based auth, or this was intentionally removed.

---

## 🏷️ Middleware Aliases

Named aliases for applying middleware to individual routes or groups.

```php
protected $middlewareAliases = [
    'auth'             => \App\Http\Middleware\Authenticate::class,
    'auth.basic'       => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
    'auth.session'     => \Illuminate\Session\Middleware\AuthenticateSession::class,
    'cache.headers'    => \Illuminate\Http\Middleware\SetCacheHeaders::class,
    'can'              => \Illuminate\Auth\Middleware\Authorize::class,
    'guest'            => \App\Http\Middleware\RedirectIfAuthenticated::class,
    'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
    'precognitive'     => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
    'signed'           => \App\Http\Middleware\ValidateSignature::class,
    'throttle'         => \Illuminate\Routing\Middleware\ThrottleRequests::class,
    'verified'         => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
];
```

| Alias | Middleware | Purpose |
|-------|-----------|---------|
| `auth` | `Authenticate` | Redirects unauthenticated users to login |
| `auth.basic` | `AuthenticateWithBasicAuth` | HTTP Basic Auth check |
| `auth.session` | `AuthenticateSession` | Validates session-based authentication |
| `cache.headers` | `SetCacheHeaders` | Applies HTTP cache control headers |
| `can` | `Authorize` | Gate/policy-based authorization |
| `guest` | `RedirectIfAuthenticated` | Redirects logged-in users away from guest pages |
| `password.confirm` | `RequirePassword` | Requires password confirmation before sensitive actions |
| `precognitive` | `HandlePrecognitiveRequests` | Livewire/Precognition validation support |
| `signed` | `ValidateSignature` | Validates signed/temporary URL signatures |
| `throttle` | `ThrottleRequests` | General rate limiting for routes |
| `verified` | `EnsureEmailIsVerified` | Blocks unverified email users |

### Custom Middleware (App-Specific)

These are custom implementations in `App\Http\Middleware\`:

| Custom Class | Alias / Group | Notes |
|-------------|---------------|-------|
| `TrustProxies` | Global | Custom proxy trust config |
| `PreventRequestsDuringMaintenance` | Global | Custom maintenance mode handler |
| `TrimStrings` | Global | Custom string trimming |
| `EncryptCookies` | web | Custom cookie encryption |
| `VerifyCsrfToken` | web | Custom CSRF (may have exceptions list) |
| `Authenticate` | `auth` | Custom redirect logic on auth failure |
| `RedirectIfAuthenticated` | `guest` | Custom post-login redirect |
| `ValidateSignature` | `signed` | Custom signed URL validation |

---

## 🔒 Security Observations

### Issues / Risks

1. **TrustHosts Disabled:** The `TrustHosts` middleware is commented out.
   - Risk: Host header injection attacks
   - Fix: Enable and configure with known host patterns

2. **Sanctum SPA Auth Disabled:** `EnsureFrontendRequestsAreStateful` is commented out.
   - Impact: Frontend SPAs must use token-based auth, not cookie sessions
   - Confirm: Intentional or legacy leftover?

3. **CSRF Applied Only to `web`:** API routes have no CSRF protection.
   - Expected: API routes use stateless token auth (Sanctum tokens or JWT)
   - Verify: All API routes that mutate data are protected via auth token

4. **No Spatie Role Middleware Listed:** Spatie `role` and `permission` aliases not registered here.
   - May be registered elsewhere (e.g., AppServiceProvider or gate definitions)
   - Check: Middleware alias registration for role-based access

---

## 🏗️ Middleware Execution Order

For a typical `web` request, execution order is:

```
1. TrustProxies
2. HandleCors
3. PreventRequestsDuringMaintenance
4. ValidatePostSize
5. TrimStrings
6. ConvertEmptyStringsToNull
--- web group ---
7. EncryptCookies
8. AddQueuedCookiesToResponse
9. StartSession
10. ShareErrorsFromSession
11. VerifyCsrfToken
12. SubstituteBindings
--- route-specific ---
13. auth / can / throttle / etc.
```

---

## 📝 Migration Notes for Base44

### Middleware Equivalents in Base44

Base44 handles many of these concerns at the platform level. Here's the mapping:

| Laravel Middleware | Base44 Equivalent |
|-------------------|------------------|
| `HandleCors` | Configured at platform/CDN level |
| `ThrottleRequests` | Platform rate limiting |
| `Authenticate` | `base44.auth.me()` in backend functions |
| `VerifyCsrfToken` | Not needed (stateless API / token auth) |
| `StartSession` | Not needed (stateless backend functions) |
| `EncryptCookies` | Not applicable (no server-side cookies) |
| `EnsureEmailIsVerified` | Custom check in backend function |
| `can` (Authorize) | Role check in backend function (user.role) |
| `throttle` | Base44 platform handles rate limiting |
| `ValidateSignature` | Custom HMAC validation in backend function |
| `SubstituteBindings` | Not applicable (no route model binding) |

### Custom Middleware Migration

```typescript
// auth → check user in backend function
const user = await base44.auth.me();
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

// can → check role
if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

// verified → check email verification
if (!user.email_verified_at) return Response.json({ error: 'Email not verified' }, { status: 403 });

// throttle → handled by Base44 platform automatically
```

### Not Needed in Base44

- CSRF tokens (stateless API with token auth)
- Cookie encryption (no server-side session cookies)
- Session management (stateless architecture)
- Maintenance mode middleware (platform-level toggle)
- Post size validation (platform handles upload limits)
- String trimming (handle in frontend validation or function input parsing)