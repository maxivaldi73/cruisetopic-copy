# Materio Page Controllers

**Purpose:** Simple view-rendering controllers for miscellaneous pages in the Materio admin UI theme.  
**Namespace:** `App\Http\Controllers\Materio\pages`  
**Location:** `App/Http/Controllers/Materio/pages/`  
**Total Controllers:** 16

---

## 📋 Controller Index

| Category | Controller | View Rendered | Purpose |
|----------|-----------|--------------|---------|
| **Account Settings** | AccountSettingsAccount | `content.pages.pages-account-settings-account` | User account profile settings |
| | AccountSettingsBilling | `content.pages.pages-account-settings-billing` | Billing/payment settings |
| | AccountSettingsNotifications | `content.pages.pages-account-settings-notifications` | Notification preferences |
| | AccountSettingsConnections | `content.pages.pages-account-settings-connections` | OAuth/third-party connections |
| | AccountSettingsSecurity | `content.pages.pages-account-settings-security` | Password, 2FA, security settings |
| **Error & Status Pages** | MiscError | `content.pages.pages-misc-error` | Generic error page (500) |
| | MiscNotAuthorized | `content.pages.pages-misc-not-authorized` | Authorization error (403) |
| | MiscServerError | `content.pages.pages-misc-server-error` | Server error page (500) |
| | MiscComingSoon | `content.pages.pages-misc-comingsoon` | Coming soon placeholder |
| | MiscUnderMaintenance | `content.pages.pages-misc-under-maintenance` | Maintenance mode page |
| **Public Pages** | Faq | `content.pages.pages-faq` | FAQ listing page |
| | Pricing | `content.pages.pages-pricing` | Pricing page |
| **User Profile** | UserProfile | `content.pages.pages-profile-user` | User profile view |
| | UserProjects | `content.pages.pages-profile-projects` | User projects listing |
| | UserTeams | `content.pages.pages-profile-teams` | User teams listing |
| | UserConnections | `content.pages.pages-profile-connections` | User social connections |

---

## 🔧 Controllers

### Account Settings Controllers

#### AccountSettingsAccount
```php
public function index()
{
    return view('content.pages.pages-account-settings-account');
}
```
- Account profile settings (name, email, avatar, etc.)
- No data passed to view — form fields populated client-side or via middleware context

#### AccountSettingsBilling
```php
public function index()
{
    return view('content.pages.pages-account-settings-billing');
}
```
- Billing/payment method management
- Invoice history (likely fetched client-side)

#### AccountSettingsNotifications
```php
public function index()
{
    return view('content.pages.pages-account-settings-notifications');
}
```
- Email notification preferences (toggles, frequency)
- No server-side logic — form state managed client-side

#### AccountSettingsConnections
```php
public function index()
{
    return view('content.pages.pages-account-settings-connections');
}
```
- Third-party service integrations (Google, GitHub, etc.)
- OAuth flow endpoints likely handled separately

#### AccountSettingsSecurity
```php
public function index()
{
    return view('content.pages.pages-account-settings-security');
}
```
- Password management, 2FA setup
- Active sessions list
- Login history

---

### Error & Status Page Controllers

#### MiscError
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'blank'];
    return view('content.pages.pages-misc-error', ['pageConfigs' => $pageConfigs]);
}
```
- Generic 500 error page
- Uses blank layout (no sidebar, minimal chrome)
- No error details injected — static error message display

#### MiscNotAuthorized
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'blank'];
    return view('content.pages.pages-misc-not-authorized', ['pageConfigs' => $pageConfigs]);
}
```
- 403 Forbidden error page
- Blank layout configuration

#### MiscServerError
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'blank'];
    return view('content.pages.pages-misc-server-error', ['pageConfigs' => $pageConfigs]);
}
```
- Server error (500+) page
- Blank layout — minimal UI

#### MiscComingSoon
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'blank'];
    return view('content.pages.pages-misc-comingsoon', ['pageConfigs' => $pageConfigs]);
}
```
- Coming soon placeholder page
- Blank layout
- Often used for features under development

#### MiscUnderMaintenance
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'blank'];
    return view('content.pages.pages-misc-under-maintenance', ['pageConfigs' => $pageConfigs]);
}
```
- Maintenance mode page
- Blank layout
- Displayed when app is down for updates

---

### Public Page Controllers

#### Faq
```php
public function index()
{
    return view('content.pages.pages-faq');
}
```
- FAQ listing page
- No data injection — FAQs likely hardcoded in Blade view or static

#### Pricing
```php
public function index()
{
    return view('content.pages.pages-pricing');
}
```
- Pricing/plans page
- No dynamic pricing data — likely static content

---

### User Profile Controllers

#### UserProfile
```php
public function index()
{
    return view('content.pages.pages-profile-user');
}
```
- User profile view (my profile or public profile)
- No user data passed — context from middleware or route parameter

#### UserProjects
```php
public function index()
{
    return view('content.pages.pages-profile-projects');
}
```
- User projects listing
- No project data injected

#### UserTeams
```php
public function index()
{
    return view('content.pages.pages-profile-teams');
}
```
- User teams/organizations listing
- No team data injected

#### UserConnections
```php
public function index()
{
    return view('content.pages.pages-profile-connections');
}
```
- User social connections (followers, following)
- No connection data injected

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Assumed authenticated via route group middleware |
| Data | **Most pass no data** — client-side fetching or middleware context |
| Layout | Most use default layout; error pages use `blank` layout |
| Pattern | One method (`index()`) per controller |
| Theme | Materio admin UI kit |

**Key Pattern Difference from UI Controllers:**
- Error/status pages pass `['pageConfigs' => ['myLayout' => 'blank']]` to use minimal layout
- Settings/profile pages pass no data (assume middleware context or AJAX fetching)

---

## ⚠️ Issues / Concerns

1. **Layout Configuration:** `$pageConfigs` pattern (hardcoded 'blank' layout) is a view-level concern, not business logic.
2. **No Data Injection:** Settings and profile pages don't pass user data — likely handled via:
   - Middleware injecting `request()->user()` context
   - Client-side AJAX calls after page load
   - Blade view accessing `auth()->user()` directly
3. **Static Content:** FAQ and Pricing likely have hardcoded content in Blade views
4. **Error Handling:** Error pages are display-only; actual error/exception handling done elsewhere
5. **One Controller Per Page:** Could consolidate into fewer controllers

---

## 📝 Migration Notes for Base44

### Assessment

These controllers fall into two categories:

**1. Settings/Profile Pages (Data-Driven)**
- AccountSettings* controllers: Should be replaced with React components + backend functions to fetch/update user settings
- UserProfile* controllers: Should use React + API calls

**2. Status/Error Pages (Static)**
- Error pages (Misc*): Move to static/error handling component or middleware-level redirect
- FAQ, Pricing: Can be static React pages or fetched from CMS

### Base44 Refactor Pattern

**For Settings Pages:**
```typescript
// Backend function: getUserSettings
async function getUserSettings(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const settings = await base44.entities.UserSettings.filter({ user_id: user.id });
  return Response.json({ user, settings: settings[0] || {} });
}

// React: AccountSettingsPage
const [settings, setSettings] = useState(null);
useEffect(() => {
  base44.functions.invoke('getUserSettings', {}).then(res => setSettings(res.data));
}, []);
```

**For Error Pages:**
```typescript
// Move to lib/PageNotFound or create ErrorPage component
// Base44 already has PageNotFound - use that instead of creating duplicates
```

**For Static Pages:**
```typescript
// FAQ and Pricing are static — move to simple React pages
export default function FaqPage() {
  return (
    <div>
      <h1>FAQ</h1>
      {/* Hardcoded FAQ items or fetch from CMS entity */}
    </div>
  );
}
```

### Entities Required

**For Settings Pages:**
- `UserSettings` or extend User entity with settings fields
- `UserNotificationPreference`
- `UserPaymentMethod`
- `UserConnection` (for OAuth/social connections)

**For Profile Pages:**
- Existing: `User`
- `UserProject`
- `UserTeam`
- `UserConnection`

**For Static Pages:**
- None (or optionally: `FaqItem`, `PricingPlan` if content should be dynamic)

### Routes (Inferred)

| Route | Controller | Data |
|-------|-----------|------|
| `GET /account/settings/account` | AccountSettingsAccount | User profile |
| `GET /account/settings/billing` | AccountSettingsBilling | Billing method |
| `GET /account/settings/notifications` | AccountSettingsNotifications | Notification prefs |
| `GET /account/settings/connections` | AccountSettingsConnections | OAuth connections |
| `GET /account/settings/security` | AccountSettingsSecurity | Security settings |
| `GET /error` | MiscError | Static |
| `GET /403` | MiscNotAuthorized | Static |
| `GET /500` | MiscServerError | Static |
| `GET /coming-soon` | MiscComingSoon | Static |
| `GET /maintenance` | MiscUnderMaintenance | Static |
| `GET /faq` | Faq | Static/CMS |
| `GET /pricing` | Pricing | Static/CMS |
| `GET /profile` | UserProfile | User data |
| `GET /profile/projects` | UserProjects | User projects |
| `GET /profile/teams` | UserTeams | User teams |
| `GET /profile/connections` | UserConnections | User connections |

### Recommendation

1. **Keep error pages:** Don't migrate; use Base44's built-in error handling (PageNotFound, 404 handler) or simple static components
2. **Refactor settings:** Migrate to React + backend functions (one per settings section)
3. **Refactor profile:** Migrate to React + backend function to fetch user data + relations
4. **Static pages:** Convert FAQ/Pricing to simple React pages (no backend required unless dynamic)

---

## Comparison: Materio Controller Types

| Type | Count | Logic | Data | Layout | Priority |
|------|-------|-------|------|--------|----------|
| UI Components | 19 | None | None | Default | Low |
| Tables | 4 | None | None | Default | Low |
| Pages (Settings/Profile) | 10 | None | Partial | Default | Medium |
| Pages (Error/Status) | 5 | None | None | Blank | Low |
| Pages (Static) | 2 | None | None | Default | Low |
| **Total Materio** | **40** | **0** | **Minimal** | **2 layouts** | **Skip for now** |

**Conclusion:** All 40 Materio controllers are pure view renderers — no business logic to migrate. Replace with React pages as needed.