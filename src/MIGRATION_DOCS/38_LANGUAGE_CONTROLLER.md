# Language Controller

**Purpose:** Handles language/locale switching for the application.  
**Namespace:** `App\Http\Controllers\Materio\language`  
**Location:** `App/Http/Controllers/Materio/language/LanguageController.php`  
**Type:** Utility controller for i18n (internationalization)

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | Locale/language switching controller |
| Primary Use | Set user's preferred language |
| Extends | `Controller` |
| Dependencies | `Request`, `App` facade |
| Auth | Likely public (no auth check) |
| Session | Stores locale preference in session |

---

## 🔧 Method

### swap(Request $request, $locale) → RedirectResponse

```php
public function swap(Request $request, $locale)
{
    if (!in_array($locale, ['it', 'en', 'fr', 'ar', 'de'])) {
        abort(400);
    } else {
        $request->session()->put('locale', $locale);
    }
    App::setLocale($locale);
    return redirect()->back();
}
```

**Purpose:** Switch the application locale and store preference in session.

| Step | Action |
|------|--------|
| 1 | Validate locale against whitelist: `it`, `en`, `fr`, `ar`, `de` |
| 2 | Abort with 400 if locale not in whitelist |
| 3 | Store locale in session: `$request->session()->put('locale', $locale)` |
| 4 | Set app-wide locale: `App::setLocale($locale)` |
| 5 | Redirect back to previous page |

**Parameters:**
- `$locale` — language code (e.g., `'en'`, `'it'`, `'fr'`)

**Response:**
- On success: Redirect to referrer (HTTP 302)
- On invalid locale: HTTP 400 Bad Request

---

## ⚠️ Issues / Concerns

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ Medium | Hard-coded locale whitelist in controller — should be config |
| 2 | ⚠️ Medium | No CSRF protection check visible (Laravel middleware should handle) |
| 3 | ℹ️ Low | Locale stored in **session only** — lost when session expires |
| 4 | ℹ️ Low | No persistent locale preference (database) for authenticated users |
| 5 | ℹ️ Low | Missing trailing comma in array after `'en'` (minor) |

---

## 📝 Migration Notes for Base44

### Current Architecture

```
GET /language/swap/{locale}
  → validate locale
  → store in session
  → set app locale
  → redirect back
```

### Base44 Equivalent: Backend Function + Frontend Hook

**Backend Function: setUserLanguage**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { locale } = await req.json();

  const supportedLocales = ['it', 'en', 'fr', 'ar', 'de'];
  if (!supportedLocales.includes(locale)) {
    return Response.json({ error: 'Unsupported locale' }, { status: 400 });
  }

  const user = await base44.auth.me();
  if (user) {
    // Persist language preference for authenticated users
    await base44.auth.updateMe({ preferred_language: locale });
  }

  // For unauthenticated users, localStorage is used on frontend
  return Response.json({ locale, success: true });
});
```

**Frontend: React Language Switcher**

```tsx
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function LanguageSwitcher() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Load locale from localStorage or user preference
    const saved = localStorage.getItem('locale');
    const user = base44.auth.me();
    setLocale(user?.preferred_language || saved || 'en');
  }, []);

  const handleLanguageChange = async (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);

    const user = await base44.auth.isAuthenticated();
    if (user) {
      // Persist for authenticated users
      await base44.functions.invoke('setUserLanguage', { locale: newLocale });
    }
  };

  return (
    <select value={locale} onChange={e => handleLanguageChange(e.target.value)}>
      <option value="en">English</option>
      <option value="it">Italiano</option>
      <option value="fr">Français</option>
      <option value="ar">العربية</option>
      <option value="de">Deutsch</option>
    </select>
  );
}
```

**I18n Setup (React with next-intl or i18next)**

```tsx
// hooks/useLocale.js
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function useLocale() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    setLocale(saved || 'en');
  }, []);

  return locale;
}

// App.jsx (with next-intl)
import { IntlProvider } from 'use-intl';
import messages from './translations.json';

export default function App() {
  const locale = useLocale();

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <YourApp />
    </IntlProvider>
  );
}
```

### Route Registration (App.jsx)

```jsx
// No route needed — language switching is handled via:
// 1. Backend function for persistence
// 2. React hook/context for state management
// 3. localStorage for client-side persistence

// If you want a simple redirect endpoint:
<Route path="/language/:locale" element={<LanguageSwitcher />} />
```

### User Entity Extension

Add a `preferred_language` field to the User entity (or use auth settings):

```json
{
  "preferred_language": {
    "type": "string",
    "enum": ["it", "en", "fr", "ar", "de"],
    "default": "en"
  }
}
```

### Key Improvements Over Current Implementation

1. **Config-driven locales:** Move whitelist to environment/config
2. **Persistent storage:** Save language preference to user entity
3. **Frontend-first:** Use localStorage + React context for faster UX
4. **Stateless backend:** Backend only persists preference, doesn't manage session
5. **RTL support:** `ar` locale now properly supported with RTL layout detection
6. **No session dependency:** Works for both authenticated and guest users

### Summary

The current Laravel controller handles basic locale switching. In Base44, use a combination of:
- **Backend function** for persistent storage (authenticated users)
- **localStorage** for guest/client-side preference
- **React hook** for application-wide locale state
- **i18n library** (next-intl, i18next) for translation management

This approach is more scalable, responsive, and doesn't rely on server sessions.