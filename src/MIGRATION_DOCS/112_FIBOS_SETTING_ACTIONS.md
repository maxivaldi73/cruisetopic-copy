# FibosSetting Action Classes (6 files)

**Directory:** `App/Actions/Provider/Setting/`  
**Namespace:** `App\Actions\Provider\Setting`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** MEDIUM — Fibos API configuration management (credentials, endpoints, sync parameters)

---

## 📋 Overview

| Class | Method | Purpose | Status |
|-------|--------|---------|--------|
| `IndexFibosSetting` | `getSettings()` | Render DataTable of all FibosSettings | ✅ Implemented |
| `CreateFibosSetting` | `create()` | Return create form view with empty model | ✅ Implemented |
| `EditFibosSetting` | `edit(FibosSetting $fibosSetting)` | Return edit form view with existing model | ✅ Implemented |
| `DestroyFibosSetting` | `destroy(FibosSetting $fibosSetting)` | Hard-delete a FibosSetting with error handling | ✅ Implemented |
| `StoreFibosSetting` | *(none)* | Create new FibosSetting — **NOT IMPLEMENTED** | 🔴 Empty stub |
| `UpdateFibosSetting` | *(none)* | Update existing FibosSetting — **NOT IMPLEMENTED** | 🔴 Empty stub |

> **Critical gap:** `StoreFibosSetting` and `UpdateFibosSetting` are empty class stubs — the write path for Fibos settings is completely missing. Users can view the create/edit form but cannot save anything.

---

## 🔧 Implementation

### 1. `IndexFibosSetting`

```php
class IndexFibosSetting
{
    public function getSettings() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new FibosSettingDataTable($dataTableService, $filterService);
        return $dataTable->render('admin.provider.fibos.setting');
        // ✅ Simpler than IndexSyncJob/IndexShip — no extra model fetch needed
        // ⚠️ All dependencies instantiated with `new` — not container-resolved, not testable
        // ⚠️ No authorization check
        // ⚠️ Method name 'getSettings' — misleading (renders view, not returns data)
    }
}
```

---

### 2. `CreateFibosSetting`

```php
class CreateFibosSetting
{
    public function create() {
        $fibosSetting = new FibosSetting();
        return view('admin.fibos.create-setting', compact('fibosSetting'));
        // ✅ Standard Laravel pattern — passes empty model for form field binding
        // ⚠️ No authorization check — any user can access the create form
        // ⚠️ Different view path than IndexFibosSetting:
        //    Index → 'admin.provider.fibos.setting'
        //    Create/Edit → 'admin.fibos.create-setting'  ← inconsistent namespace
        // ⚠️ New FibosSetting() not saved — purely for form scaffolding
    }
}
```

---

### 3. `EditFibosSetting`

```php
class EditFibosSetting
{
    public function edit(FibosSetting $fibosSetting) {
        return view('admin.fibos.create-setting', compact('fibosSetting'));
        // ✅ Reuses the same view as CreateFibosSetting (shared create/edit form — common pattern)
        // ✅ Route model binding — Laravel resolves $fibosSetting from URL parameter automatically
        // ⚠️ No authorization check — any user can edit any FibosSetting
        // ⚠️ Shares view path inconsistency with CreateFibosSetting (see above)
    }
}
```

**Note:** `CreateFibosSetting` and `EditFibosSetting` share the same Blade view (`admin.fibos.create-setting`), which uses `$fibosSetting->exists` or `$fibosSetting->id` to toggle between "create" and "update" form behavior. This is the standard Laravel shared form pattern — not a bug, but worth noting for migration.

---

### 4. `DestroyFibosSetting`

```php
class DestroyFibosSetting
{
    public function destroy(FibosSetting $fibosSetting) {
        try {
            $fibosSetting->delete();
            return (new AlertService())->alertOperazioneEseguita('fibos.mapping');
            // ✅ Redirects to 'fibos.mapping' — contextually correct (back to the mapping page)
            // ⚠️ Hard delete — no soft delete / audit trail
            // ⚠️ No cascade check — if FibosSetting has related sync jobs or mappings,
            //    they may be orphaned
            // ⚠️ AlertService instantiated with `new` — not injected
        } catch (\Exception $e) {
            return (new AlertService())->alertBackWithError();
            // ⚠️ Exception swallowed — $e never logged (unlike DestroyTask which at least logs it)
            // ⚠️ No error context passed to alertBackWithError() — generic message shown
        }
    }
}
```

---

### 5. `StoreFibosSetting` — 🔴 EMPTY STUB

```php
class StoreFibosSetting
{
    // No methods defined
}
```

**Impact:** The create form (`CreateFibosSetting`) renders a UI but there is no action class to handle form submission. The controller calling this action either calls the method directly on the model (bypassing the action pattern) or the feature is broken/incomplete.

---

### 6. `UpdateFibosSetting` — 🔴 EMPTY STUB

```php
class UpdateFibosSetting
{
    // No methods defined
}
```

**Impact:** Same as `StoreFibosSetting` — the edit form renders but the update path is unimplemented in the action layer.

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | `StoreFibosSetting` | **Empty stub — create path not implemented** in action layer |
| 2 | 🔴 CRITICAL | `UpdateFibosSetting` | **Empty stub — update path not implemented** in action layer |
| 3 | ⚠️ HIGH | `DestroyFibosSetting` | **Exception swallowed with no logging** — `$e` never passed to `Log::error()` |
| 4 | ⚠️ HIGH | `DestroyFibosSetting` | **No cascade check** — related sync jobs / mappings may be orphaned on delete |
| 5 | ⚠️ MEDIUM | All | **No authorization checks** — any authenticated user can CRUD Fibos settings |
| 6 | ⚠️ MEDIUM | All | **All dependencies instantiated with `new`** — not container-resolved, not testable |
| 7 | ⚠️ MEDIUM | `DestroyFibosSetting` | **Hard delete** — no soft delete / audit trail |
| 8 | ⚠️ MEDIUM | `CreateFibosSetting` / `EditFibosSetting` | **Inconsistent view path** — index uses `'admin.provider.fibos.setting'`, create/edit use `'admin.fibos.create-setting'` (different namespace depth) |
| 9 | ℹ️ LOW | `IndexFibosSetting` | **Method name `getSettings`** — misleading; renders a full view, not returns data |
| 10 | ℹ️ LOW | `DestroyFibosSetting` | **`alertBackWithError()` called without message** — shows a generic error with no context |

---

## 📝 Migration to Base44

### `FibosSetting` Entity Schema

Based on `FibosSettingDataTable` (documented in `80_FIBOS_SETTING_DATATABLE.md`) and `FibosSettingRequest` (documented in `28_FORM_REQUESTS.md`):

```json
{
  "name": "FibosSetting",
  "properties": {
    "cruiseline_id":  { "type": "string", "description": "Related Cruiseline ID" },
    "api_url":        { "type": "string" },
    "api_user":       { "type": "string" },
    "api_password":   { "type": "string", "description": "Store encrypted or via secrets" },
    "market":         { "type": "string" },
    "currency":       { "type": "string" },
    "language":       { "type": "string" },
    "is_active":      { "type": "boolean", "default": true }
  }
}
```

> ⚠️ **Security note:** `api_password` should not be stored as a plain entity field — use Base44 secrets or encrypted storage for credentials.

### CRUD Migration

All 6 action classes collapse into standard entity SDK calls (no backend function needed for basic CRUD):

```tsx
// INDEX
const { data: settings } = useQuery({
  queryKey: ['fibosSettings'],
  queryFn: () => base44.entities.FibosSetting.list('-created_date', 50),
});

// CREATE
await base44.entities.FibosSetting.create({ api_url, api_user, api_password, market, currency, language });

// UPDATE
await base44.entities.FibosSetting.update(settingId, updatedData);

// DELETE — with relation check first
const relatedJobs = await base44.entities.SyncJob.filter({ fibos_setting_id: settingId });
if (relatedJobs.length > 0) {
  toast({ title: 'Cannot delete: active sync jobs reference this setting', variant: 'destructive' });
  return;
}
await base44.entities.FibosSetting.delete(settingId);
```

### Resolving the empty stubs

`StoreFibosSetting` and `UpdateFibosSetting` being empty means the legacy app likely handles persistence directly in the controller (bypassing the action pattern) or the feature is genuinely broken. In Base44 this is irrelevant — the entity SDK handles both create and update natively.

---

## Summary

**`Actions/Provider/Setting/`** — 6-class CRUD action set for `FibosSetting` (Fibos API credentials/config per cruiseline). **Critical finding: `StoreFibosSetting` and `UpdateFibosSetting` are completely empty stubs** — the write path for Fibos settings is unimplemented at the action layer; persistence is either handled directly in the controller or the feature is broken. `IndexFibosSetting` follows the same thin DataTable wrapper pattern as `IndexShip`/`IndexSyncJob`. `CreateFibosSetting` and `EditFibosSetting` both render the same shared Blade form (`admin.fibos.create-setting`) with different model states — standard pattern but inconsistent view path vs. the index. `DestroyFibosSetting` swallows exceptions without logging and has no cascade guard for related sync jobs. All classes lack authorization checks.

**Migration priority: MEDIUM** — straightforward entity SDK CRUD in Base44; empty stubs are a non-issue since Base44 handles create/update natively. Credential fields (`api_password`) must be handled securely (secrets manager or encryption) rather than stored as plain entity fields.