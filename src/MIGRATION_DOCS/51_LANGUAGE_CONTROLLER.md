# Language Controller

**Purpose:** Handle language/locale switching for multi-language support.  
**Namespace:** `App\Http\Controllers\Language`  
**Location:** `App/Http/Controllers/Language/LanguageController.php`  
**Type:** Utility controller for i18n (internationalization)

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | Locale/language switching controller |
| Primary Use | Set user's preferred language |
| Extends | `Controller` |
| Dependencies | `Request`, `App` facade |
| Auth | Public (no authentication required) |
| Session | Stores locale preference in session |

---

## 🔧 Method

### swap(Request $request, $locale) → RedirectResponse

```php
public function swap(Request $request, $locale)
{
    $allowed = ['en', 'it', 'hu', 'hr', 'ro', 'al', 'pl', 'sb', 'ar', 'na'];

    if (!in_array(strtolower($locale), $allowed)) {
        abort(400);
    }

    $locale = strtolower($locale);
    $request->session()->put('locale', $locale);
    App::setLocale($locale);

    return redirect()->back();
}
```

**Purpose:** Switch the application locale and store preference in session.

| Step | Action |
|------|--------|
| 1 | Define whitelist of allowed locales: en, it, hu, hr, ro, al, pl, sb, ar, na |
| 2 | Validate locale against whitelist (case-insensitive) |
| 3 | Abort with 400 if locale not in whitelist |
| 4 | Normalize locale to lowercase |
| 5 | Store locale in session: `$request->session()->put('locale', $locale)` |
| 6 | Set app-wide locale: `App::setLocale($locale)` |
| 7 | Redirect back to referrer (HTTP 302) |

**Parameters:**
- `$locale` — language code (e.g., `'en'`, `'it'`, `'ar'`)

**Response:**
- On success: Redirect to referrer (HTTP 302)
- On invalid locale: HTTP 400 Bad Request

**Supported Locales:**
- `en` — English
- `it` — Italian
- `hu` — Hungarian
- `hr` — Croatian
- `ro` — Romanian
- `al` — Albanian
- `pl` — Polish
- `sb` — Serbian (Cyrillic)
- `ar` — Arabic
- `na` — Navajo (?)

---

## ⚠️ Issues / Concerns

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ Medium | Hard-coded locale whitelist in controller — should be config |
| 2 | ⚠️ Medium | No CSRF protection check visible (Laravel middleware should handle) |
| 3 | ℹ️ Low | Locale stored in **session only** — lost when session expires |
| 4 | ℹ️ Low | No persistent locale preference (database) for authenticated users |
| 5 | ⚠️ Medium | Locale list seems incomplete/odd (Navajo 'na'?) — verify list accuracy |
| 6 | ⚠️ Medium | No validation that locale files actually exist |
| 7 | ℹ️ Low | RTL languages (ar) not handled specially (layout direction) |

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

Base44 doesn't have a native language switcher like Laravel, but you can implement one:

**Backend Function: setUserLanguage**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { locale } = await req.json();

  const supportedLocales = ['en', 'it', 'hu', 'hr', 'ro', 'al', 'pl', 'sb', 'ar', 'na'];
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

**Frontend: React Language Switcher Hook**

```tsx
// hooks/useLanguage.js
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useLanguage() {
  const [locale, setLocale] = useState('en');
  const [loading, setLoading] = useState(false);

  // Load initial locale on mount
  useEffect(() => {
    const loadLocale = async () => {
      try {
        // Try to get from localStorage first
        const saved = localStorage.getItem('locale');
        if (saved) {
          setLocale(saved);
          return;
        }

        // Then try from user preference if authenticated
        const isAuthed = await base44.auth.isAuthenticated();
        if (isAuthed) {
          const user = await base44.auth.me();
          if (user?.preferred_language) {
            setLocale(user.preferred_language);
          }
        }
      } catch (err) {
        console.error('Failed to load language preference:', err);
      }
    };

    loadLocale();
  }, []);

  // Change language function
  const changeLanguage = async (newLocale) => {
    setLoading(true);
    try {
      // Save to localStorage for offline use
      localStorage.setItem('locale', newLocale);
      setLocale(newLocale);

      // Persist to database if authenticated
      const isAuthed = await base44.auth.isAuthenticated();
      if (isAuthed) {
        await base44.functions.invoke('setUserLanguage', { locale: newLocale });
      }

      // Optionally reload page or emit event to update i18n
      // This depends on your i18n library (next-intl, i18next, etc.)
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setLoading(false);
    }
  };

  return { locale, changeLanguage, loading };
}
```

**Component: Language Switcher**

```tsx
// components/LanguageSwitcher.jsx
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

const LANGUAGES = {
  en: 'English',
  it: 'Italiano',
  hu: 'Magyar',
  hr: 'Hrvatski',
  ro: 'Română',
  al: 'Shqip',
  pl: 'Polski',
  sb: 'Srpski',
  ar: 'العربية',
  na: 'Navajo',
};

export default function LanguageSwitcher() {
  const { locale, changeLanguage, loading } = useLanguage();

  return (
    <Select value={locale} onValueChange={changeLanguage} disabled={loading}>
      <SelectTrigger className="w-32">
        <Globe className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### User Entity Extension

Add a `preferred_language` field to the User entity (or extend it):

```json
{
  "preferred_language": {
    "type": "string",
    "enum": ["en", "it", "hu", "hr", "ro", "al", "pl", "sb", "ar", "na"],
    "default": "en"
  }
}
```

### i18n Setup (Example with next-intl)

```tsx
// App.jsx
import { useLanguage } from '@/hooks/useLanguage';
import { IntlProvider } from 'use-intl';
import messages from './locales.json'; // {en: {...}, it: {...}, ...}

export default function App() {
  const { locale } = useLanguage();

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <YourAppContent />
    </IntlProvider>
  );
}
```

### Route Registration (Optional)

```jsx
// If you want a simple redirect endpoint for backward compatibility
<Route path="/language/:locale" element={<LanguageRedirect />} />
```

**LanguageRedirect Component:**

```tsx
// components/LanguageRedirect.jsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

export default function LanguageRedirect() {
  const { locale: paramLocale } = useParams();
  const { changeLanguage } = useLanguage();

  useEffect(() => {
    if (paramLocale) {
      changeLanguage(paramLocale);
      window.location.href = '/'; // Redirect to home
    }
  }, [paramLocale, changeLanguage]);

  return null;
}
```

### Key Improvements Over Current Implementation

1. **Config-driven locales:** Move whitelist to environment/config or constants
2. **Persistent storage:** Save language preference to user entity
3. **Frontend-first:** Use localStorage + React context for faster UX
4. **Better RTL handling:** Detect RTL languages and adjust layout direction
5. **Offline support:** Works without database connection via localStorage
6. **No session dependency:** Works for both authenticated and guest users
7. **Validation:** Verify locale files actually exist before switching
8. **i18n integration:** Works with standard i18n libraries (next-intl, i18next)

### Summary

The Language Controller is a **utility for locale switching** in a multi-language app. In Base44, use:

- **Backend function** for persistent storage (authenticated users)
- **localStorage** for guest/client-side preference
- **React hook** for application-wide locale state
- **i18n library** (next-intl, i18next) for translation management

This approach is more scalable, responsive, and doesn't rely on server sessions.