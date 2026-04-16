# Language Action Classes (1 file)

**Directory:** `App/Actions/Language/`  
**Namespace:** `App\Actions\Language`  
**Type:** Single-responsibility action class (Laravel Actions pattern)  
**Priority:** LOW — thin DataTable wrapper; no business logic

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `IndexLanguage` | `getLanguage()` | Render DataTable of all Languages |

---

## 🔧 Implementation

```php
class IndexLanguage
{
    public function getLanguage() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new LanguagesDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.languages.index');
        // ⚠️ All three instantiated with `new` — not container-resolved, not testable
        // ⚠️ No authorization check
        // ⚠️ Method name 'getLanguage' — misleading; renders a full index view, not returns data
    }
}
```

### Pattern Classification

This is the **canonical minimal Index action** — structurally identical to `IndexFibosCruiseline`, `IndexFibosSetting`, `IndexProduct`, and `IndexPort`:

| Class | DataTable | View path | Extra logic |
|-------|-----------|-----------|-------------|
| `IndexLanguage` | `LanguagesDataTable` | `admin.languages.index` | ❌ None |
| `IndexFibosCruiseline` | `FibosCruiselineDataTable` | `admin.provider.fibos.cruiseline` | ❌ None |
| `IndexProduct` | `ProductsDataTable` | `admin.products.index` | ❌ None (dead import) |
| `IndexPort` | `PortDataTable` | `admin.ports.index` | ❌ None (dead import) |
| `IndexFibosSetting` | `FibosSettingDataTable` | `admin.provider.fibos.setting` | ❌ None |

`IndexLanguage` is the cleanest variant — no dead imports, no extra model fetches.

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ MEDIUM | **All dependencies instantiated with `new`** — not container-resolved, not testable |
| 2 | ⚠️ MEDIUM | **No authorization check** — any authenticated user can view the language list |
| 3 | ℹ️ LOW | **Method name `getLanguage`** — misleading; renders a full DataTable view |

---

## 📝 Migration to Base44

Single entity SDK query — no backend function needed:

```tsx
// pages/Languages.jsx
const { data: languages = [] } = useQuery({
  queryKey: ['languages'],
  queryFn: () => base44.entities.Language.list('name', 100),
});

// Render: table of languages with code, name, locale, active status
// (columns per LanguagesDataTable — doc 89_LANGUAGES_DATATABLE.md)
```

---

## Summary

**`Actions/Language/IndexLanguage`** (10 lines): The cleanest minimal Index action in the codebase — wires `LanguagesDataTable` with its two service dependencies and renders the Blade view. No dead imports, no extra model fetches, no scoping parameters. Shares only the universal issues of the pattern: `new` instantiation and no auth check.

**Migration priority: LOW** — trivial replacement by a React page with a single `useQuery` entity SDK call.