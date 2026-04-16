# Website Action Classes (2 files)

**Directory:** `App/Actions/Website/`  
**Namespace:** `App\Actions\Website`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** LOW — thin wrappers; logic lives in DataTable/AlertService

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `DestroyWebsite` | `destroy(Website $website)` | Delete a Website record and redirect with alert |
| `IndexWebsite` | `getWebsite()` | Instantiate WebsitesDataTable and render index view |

---

## 🔧 Implementation

### `DestroyWebsite`

```php
class DestroyWebsite
{
    public function destroy(Website $website) {
        $website->delete();
        return (new AlertService())->alertOperazioneEseguita('websites.index');
        // ✅ Delegates flash/redirect to AlertService (consistent alert pattern)
        // ⚠️ AlertService instantiated with `new` — not injected (not testable)
        // ⚠️ 'alertOperazioneEseguita' is Italian — "operation performed alert"
        // ⚠️ No soft-delete check — uses hard delete ($website->delete())
        // ⚠️ No authorization check — relies entirely on caller (controller policy)
        // ⚠️ No cascade check — related Website records (pages, banners, etc.) may be orphaned
    }
}
```

**What `alertOperazioneEseguita('websites.index')` does:**  
Based on `AlertService` (already documented): sets a flash success message and returns a redirect to the named route `websites.index`.

---

### `IndexWebsite`

```php
class IndexWebsite
{
    public function getWebsite() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new WebsitesDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.websites.index');
        // ⚠️ All three dependencies instantiated with `new` — not injected (not testable, not container-resolved)
        // ⚠️ Method name 'getWebsite' — misleading; it renders the full index view, not a single Website
        // ⚠️ Returns a DataTable render response — tightly coupled to Yajra DataTables + Blade
        // ✅ Consistent with other Index action classes in the codebase
    }
}
```

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | ⚠️ HIGH | `DestroyWebsite` | **No authorization** — no `$this->authorize()` or policy check; any caller can delete any website |
| 2 | ⚠️ HIGH | `DestroyWebsite` | **Hard delete with no cascade check** — related records (pages, banners, market content) may be orphaned |
| 3 | ⚠️ MEDIUM | Both | **All dependencies instantiated with `new`** — bypasses Laravel container; breaks DI, mocking, and testing |
| 4 | ⚠️ MEDIUM | `DestroyWebsite` | **`AlertService` not injected** — `new AlertService()` in action body |
| 5 | ⚠️ MEDIUM | `IndexWebsite` | **`getWebsite()` is a misleading name** — should be `renderIndex()` or `index()` |
| 6 | ⚠️ MEDIUM | `IndexWebsite` | **Returns Blade/DataTable render** — tightly coupled to view layer; not reusable as API |
| 7 | ℹ️ LOW | `DestroyWebsite` | **`alertOperazioneEseguita` in Italian** — inconsistent with English codebase convention |
| 8 | ℹ️ LOW | Both | **No return type hints** — both methods untyped |

---

## 📝 Migration to Base44

These two action classes map to standard CRUD operations on the `Website` entity.

### `DestroyWebsite` → Entity delete + frontend toast

```tsx
// In WebsiteList React component:
const handleDelete = async (websiteId: string) => {
  await base44.entities.Website.delete(websiteId);
  toast({ title: 'Website eliminato con successo' });
  refetchWebsites();
};
```

No backend function needed — Base44 entity delete is a direct SDK call with built-in auth (RLS).  
If cascade cleanup is needed (orphaned pages, banners), add a backend function:

```typescript
// functions/deleteWebsite.js
const website = await base44.asServiceRole.entities.Website.get(websiteId);
// delete related: Pages, Banners, ContentByMarket...
await base44.asServiceRole.entities.Website.delete(websiteId);
return Response.json({ success: true });
```

### `IndexWebsite` → React page with entity list

```tsx
// pages/Websites.jsx
const { data: websites } = useQuery({
  queryKey: ['websites'],
  queryFn: () => base44.entities.Website.list('-created_date', 50),
});
// Render <WebsiteTable websites={websites} />
```

No `IndexWebsite` action class needed — replaced by standard `useQuery` + entity SDK call in the React page.

---

## Summary

**`Actions/Website/DestroyWebsite`** (9 lines): Single-method action that hard-deletes a `Website` record and returns an `AlertService` redirect. Critical gap: no authorization check and no cascade cleanup — deleting a website may orphan related pages, banners, and market content. `AlertService` instantiated directly (not injected).

**`Actions/Website/IndexWebsite`** (12 lines): Single-method action that wires up `WebsitesDataTable` with its two service dependencies and renders the Blade index view. All three dependencies instantiated with `new` (not container-resolved). Method name `getWebsite` is misleading — it renders a full index, not a single record.

**Migration priority: LOW** — both are thin wrappers. In Base44, `DestroyWebsite` becomes a direct entity SDK delete (with an optional backend function for cascade cleanup); `IndexWebsite` is replaced entirely by a React page using `useQuery`.