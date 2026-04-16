# LanguagesDataTable (Language Management)

**File:** `LanguagesDataTable.php`  
**Namespace:** `App\DataTables\Language`  
**Type:** Master data / localization config — **LOW priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Language` |
| **Complexity** | VERY LOW |
| **Columns** | 3 (code, name, action) |
| **Special Feature** | Appends `(Primary)` to primary language name |

---

## 🔧 Implementation

### Query
```php
public function query(Language $model) {
    return $model->newQuery(); // ⚠️ No auth, shows all languages
}
```

### Data Transformation
```php
// Marks primary language in name column
->editColumn('name', function($language) {
    return $language->primary ? $language->name . ' (Primary)' : $language->name;
})

// Actions via Blade view
->addColumn('action', function($language) {
    return view('admin.languages.action', compact('language')); // ⚠️ Hardcoded view
})
```

### Columns (3 total)

| Column | Notes |
|--------|-------|
| `code` | Language code (e.g., `en`, `it`, `fr`) |
| `name` | Language name, appended with `(Primary)` if primary |
| `action` | Blade partial `admin.languages.action` |

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All languages visible to all users |
| 2 | ⚠️ HIGH | **Hardcoded view path** — `admin.languages.action` |
| 3 | ⚠️ HIGH | **Hardcoded route** — `route('languages.create')` |
| 4 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used |
| 5 | ⚠️ MEDIUM | **`primary` flag not a column** — Shown inline in name but not sortable/filterable |
| 6 | ⚠️ MEDIUM | **No `is_active` field** — Can't disable unused languages |
| 7 | ℹ️ LOW | **No BCP 47 validation** — `code` field is free text |

---

## 📝 Migration to Base44

### Entity

```json
{
  "name": "Language",
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "pattern": "^[a-z]{2}(-[A-Z]{2})?$",
      "description": "BCP 47 language code (e.g., 'en', 'it', 'fr', 'en-US')"
    },
    "name": {
      "type": "string",
      "description": "Language display name (e.g., 'English', 'Italian')"
    },
    "native_name": {
      "type": "string",
      "description": "Name in own language (e.g., 'Italiano', 'Français')"
    },
    "is_primary": {
      "type": "boolean",
      "default": false,
      "description": "Whether this is the default/primary language"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether this language is enabled"
    },
    "flag_emoji": {
      "type": "string",
      "description": "Optional flag emoji (e.g., '🇮🇹', '🇬🇧')"
    }
  },
  "required": ["code", "name"]
}
```

### Backend Function

```typescript
// functions/getLanguages.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { search = '', is_active = '' } = await req.json();

  const filters = {};
  if (search) filters.$or = [
    { code: { $regex: search, $options: 'i' } },
    { name: { $regex: search, $options: 'i' } },
  ];
  if (is_active !== '') filters.is_active = is_active === 'true';

  const languages = await base44.entities.Language.filter(filters, '+code');
  return Response.json({ data: languages });
});

// functions/setPrimaryLanguage.js — enforce single primary
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { languageId } = await req.json();

  // Unset all others
  const all = await base44.asServiceRole.entities.Language.filter({ is_primary: true });
  for (const lang of all) {
    await base44.asServiceRole.entities.Language.update(lang.id, { is_primary: false });
  }

  // Set new primary
  await base44.asServiceRole.entities.Language.update(languageId, { is_primary: true });
  return Response.json({ success: true });
});
```

### Key Improvements

1. **Admin-only authorization**
2. **`is_primary` as dedicated boolean column** — sortable, filterable, togglable
3. **`is_active` field** — enables disabling languages without deletion
4. **`native_name` field** — shows language name in own script
5. **`flag_emoji` field** — for richer UI display
6. **BCP 47 validation** on `code` field via regex pattern
7. **`setPrimaryLanguage` function** — enforces single primary (unsets others)
8. **No hardcoded routes or views**

---

## Summary

**LanguagesDataTable** (4.5 KB): Minimal language management table. Very simple — code, name, actions. One notable feature: appends `(Primary)` to the primary language name inline. CRITICAL: no authorization. HIGH: hardcoded Blade view (`admin.languages.action`) and route (`languages.create`). MEDIUM: unused FilterService, `primary` flag not a column (just text in name), no `is_active`.

In Base44: Language entity with code (BCP 47 validated), name, native_name, is_primary (boolean column), is_active, flag_emoji. Admin-only getLanguages function. Separate setPrimaryLanguage function that atomically unsets all others before setting new primary.

**Migration priority: LOW** — Reference data, minimal complexity, rarely changes. Auth gap is critical but risk is low since languages are non-sensitive public data.