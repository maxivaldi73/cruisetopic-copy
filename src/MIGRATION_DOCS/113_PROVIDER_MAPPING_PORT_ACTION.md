# ProviderMappingPort Action Class (1 file)

**Directory:** `App/Actions/Provider/Port/`  
**Namespace:** `App\Actions\Provider\Port`  
**Type:** Single-responsibility action class (Laravel Actions pattern)  
**Priority:** MEDIUM — port mapping is core to provider sync accuracy (maps provider port codes to internal Port records)

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `ProviderMappingPort` | `getMappingPort($cruiselineId)` | Render port mapping DataTable scoped to a given Cruiseline |

---

## 🔧 Implementation

```php
class ProviderMappingPort
{
    public function getMappingPort($cruiselineId) {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new ProviderMappingPortDataTable($dataTableService, $filterService, $cruiselineId);
        // ⚠️ All three instantiated with `new` — not container-resolved, not testable

        $cruiseline = Cruiseline::find($cruiselineId);
        // ⚠️ No null guard — invalid $cruiselineId returns null
        //    → Blade view receives null $cruiseline → potential fatal rendering error
        // ⚠️ Cruiseline fetched AFTER DataTable construction — same logical inversion as IndexShip

        return $dataTable->render('admin.provider.mapping-ports', compact('cruiseline'));
        // ✅ Passes $cruiseline to view (for breadcrumb/title display)
        // ⚠️ No authorization check — any caller can view port mappings for any cruiseline
    }
}
```

### Pattern Match

This class is **structurally identical** to `IndexShip` (`111_SHIP_ACTIONS.md`):

| Aspect | `IndexShip` | `ProviderMappingPort` |
|--------|-------------|----------------------|
| DataTable | `ShipDataTable` | `ProviderMappingPortDataTable` |
| View | `admin.provider.ship.index` | `admin.provider.mapping-ports` |
| Extra model | `Cruiseline::find()` | `Cruiseline::find()` |
| Null guard | ❌ Missing | ❌ Missing |
| Auth check | ❌ Missing | ❌ Missing |
| DI pattern | `new` everywhere | `new` everywhere |

The only meaningful difference is the DataTable class and view path — all issues are identical.

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **`Cruiseline::find()` not null-guarded** — invalid ID → `null` passed to template → likely fatal rendering error |
| 2 | ⚠️ HIGH | **Cruiseline fetched after DataTable construction** — invalid ID not caught before wiring the DataTable |
| 3 | ⚠️ MEDIUM | **All dependencies instantiated with `new`** — not container-resolved, not testable |
| 4 | ⚠️ MEDIUM | **No authorization check** — any caller can view port mappings for any cruiseline |
| 5 | ⚠️ MEDIUM | **`$cruiselineId` untyped** — no type hint |
| 6 | ℹ️ LOW | **Class name `ProviderMappingPort`** — inconsistent with `Index*` naming convention used by all other action classes in this directory |
| 7 | ℹ️ LOW | **Method name `getMappingPort`** — misleading; renders a full DataTable view, not returns data |

---

## 📝 Migration to Base44

Identical migration pattern to `IndexShip` — two parallel entity SDK queries on a React page:

```tsx
// pages/ProviderMappingPorts.jsx
const urlParams = new URLSearchParams(window.location.search);
const cruiselineId = urlParams.get('cruiselineId');

const { data: cruiseline } = useQuery({
  queryKey: ['cruiseline', cruiselineId],
  queryFn: () => base44.entities.Cruiseline.get(cruiselineId),
  enabled: !!cruiselineId,
});

const { data: portMappings } = useQuery({
  queryKey: ['portMappings', cruiselineId],
  queryFn: () => base44.entities.ProviderMappingPort.filter(
    { cruiseline_id: cruiselineId },
    'provider_port_code',
    100
  ),
  enabled: !!cruiselineId,
});

// Render: breadcrumb with cruiseline.name, mapping table with provider code → internal Port
```

No backend function needed — direct entity SDK with admin route guard.

---

## Summary

**`Actions/Provider/Port/ProviderMappingPort`** (12 lines): Thin DataTable render wrapper that scopes `ProviderMappingPortDataTable` to a given `$cruiselineId` and passes the resolved `Cruiseline` to the Blade view. Structurally **identical to `IndexShip`** — same null guard omission on `Cruiseline::find()`, same logical inversion (DataTable built before validating cruiseline exists), same `new` instantiation pattern, same missing auth check. Additionally inconsistent in naming: the class is called `ProviderMappingPort` (not `IndexProviderMappingPort`) and the method `getMappingPort` (not `getIndex`).

**Migration priority: MEDIUM** — replaced by a React page with two parallel entity SDK queries (cruiseline + port mappings filtered by cruiseline_id). Port mapping UI may also need inline editing support for mapping provider codes to internal Port records.