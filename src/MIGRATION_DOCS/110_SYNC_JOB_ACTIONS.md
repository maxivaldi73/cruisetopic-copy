# SyncJob Action Classes (1 file)

**Directory:** `App/Actions/Provider/SyncJob/`  
**Namespace:** `App\Actions\Provider\SyncJob`  
**Type:** Single-responsibility action class (Laravel Actions pattern)  
**Priority:** MEDIUM — provider sync monitoring dashboard; reads raw Laravel `jobs` table

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `IndexSyncJob` | `getIndex($cruiselineId)` | Render sync job dashboard for a given Cruiseline — maps provider code, queries `jobs` + `sync_jobs`, renders DataTable |

---

## 🔧 Implementation

```php
class IndexSyncJob
{
    // Cruiseline code → provider name mapping
    private const PROVIDERS = [
        'COSTA' => 'costa',
        'EXP'   => 'explora',
        'MSC'   => 'msc',
        'ARY'   => 'aroya'
    ];
    // ⚠️ Hardcoded map — adding a new provider requires editing this class
    // ⚠️ Default fallback is 'fibos' (via ?? 'fibos') — implicit, not declared in the map

    public function getIndex($cruiselineId) {
        // 1. Resolve Cruiseline
        $cruiseline = Cruiseline::find($cruiselineId);
        // ⚠️ No null guard — if $cruiselineId is invalid, $cruiseline is null
        //    Next line: $cruiseline->code → fatal null dereference

        // 2. Map cruiseline code → provider name
        $provider = self::PROVIDERS[$cruiseline->code] ?? 'fibos';
        // ✅ Safe array access with fallback to 'fibos'
        // ⚠️ $provider is passed to the view but the variable is NOT used in the DataTable
        //    — only used for view-level display (e.g. provider badge/label)

        // 3. Wire DataTable dependencies (all with `new`)
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new SyncJobDataTable($dataTableService, $filterService, $cruiselineId);
        // ⚠️ All three instantiated with `new` — not container-resolved, not testable

        // 4. Query raw Laravel jobs table joined with sync_jobs
        $jobs = DB::table('jobs')
            ->join('sync_jobs', 'jobs.id', '=', 'sync_jobs.job_id')
            ->where('sync_jobs.cruiseline_id', $cruiselineId)
            ->orderBy('created_at', 'DESC')
            ->select('jobs.*')
            ->get();
        // ⚠️ Queries the raw Laravel `jobs` table (queue worker table) — couples business logic
        //    to Laravel's internal queue infrastructure
        // ⚠️ `created_at` in orderBy is ambiguous — both `jobs` and `sync_jobs` have `created_at`;
        //    should be qualified as 'jobs.created_at' or 'sync_jobs.created_at'
        // ⚠️ `select('jobs.*')` — fetches all columns including `payload` (serialized PHP object,
        //    potentially large binary blob); no column pruning
        // ⚠️ No pagination — fetches ALL matching jobs into memory
        // ✅ JOIN is correct — sync_jobs.job_id links to jobs.id

        return $dataTable->render(
            'admin.provider.sync.index',
            compact('jobs', 'cruiselineId', 'provider')
        );
        // ⚠️ Both $dataTable AND $jobs are passed — DataTable handles its own AJAX data fetching;
        //    $jobs collection is redundant if DataTable covers the same data
        // ⚠️ Tightly coupled to Blade view path
    }
}
```

### Provider Code → Name Map

| Cruiseline Code | Provider Name | Fallback |
|-----------------|--------------|---------|
| `COSTA` | `costa` | — |
| `EXP` | `explora` | — |
| `MSC` | `msc` | — |
| `ARY` | `aroya` | — |
| *(anything else)* | `fibos` | ✅ default |

Fibos is the implicit default — all non-mapped cruiseline codes (including all Fibos-sourced cruiselines) fall through to `'fibos'`.

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **`$cruiseline` not null-guarded** — `Cruiseline::find()` returns `null` for invalid ID; `$cruiseline->code` on line 23 throws a fatal error |
| 2 | ⚠️ HIGH | **Ambiguous `orderBy('created_at')`** — column exists on both `jobs` and `sync_jobs`; MySQL may resolve arbitrarily; should be `'jobs.created_at'` |
| 3 | ⚠️ HIGH | **`select('jobs.*')` fetches `payload` column** — contains large serialized PHP blobs; wastes memory on every page load |
| 4 | ⚠️ HIGH | **No pagination** — all matching jobs fetched into memory; could be thousands of rows for active providers |
| 5 | ⚠️ HIGH | **Queries raw `jobs` table** — tightly couples to Laravel queue internals; `jobs` table is meant for the queue worker, not for display |
| 6 | ⚠️ MEDIUM | **`$jobs` and `$dataTable` both cover sync job data** — likely redundant; unclear which one actually drives the UI |
| 7 | ⚠️ MEDIUM | **Hardcoded `PROVIDERS` map** — adding a provider requires editing this class |
| 8 | ⚠️ MEDIUM | **`'fibos'` fallback implicit** — not in the PROVIDERS map; only visible via `??` operator |
| 9 | ⚠️ MEDIUM | **All dependencies instantiated with `new`** — not container-resolved, not testable |
| 10 | ⚠️ MEDIUM | **No authorization check** — any caller can view sync jobs for any cruiseline |
| 11 | ℹ️ LOW | **`$cruiselineId` untyped** — no type hint on `getIndex()` parameter |
| 12 | ℹ️ LOW | **Method name `getIndex`** — inconsistent with `renderIndex()` convention; also misleading (renders view, not returns data) |

---

## 📝 Migration to Base44

### Key architectural shift

In Base44, there is no raw `jobs` table — the queue infrastructure is managed by the platform. Sync job status must be tracked in a dedicated **`SyncJob` entity** that backend functions write to.

### `SyncJob` Entity Schema

```json
{
  "name": "SyncJob",
  "properties": {
    "cruiseline_id":  { "type": "string" },
    "provider":       { "type": "string", "enum": ["fibos","costa","explora","msc","aroya"] },
    "status":         { "type": "string", "enum": ["pending","running","completed","failed"] },
    "started_at":     { "type": "string", "format": "date-time" },
    "completed_at":   { "type": "string", "format": "date-time" },
    "error_message":  { "type": "string" },
    "records_synced": { "type": "integer" }
  }
}
```

### Provider mapping → utility constant

```typescript
// lib/providers.ts
export const PROVIDER_MAP: Record<string, string> = {
  COSTA: 'costa',
  EXP:   'explora',
  MSC:   'msc',
  ARY:   'aroya',
};
export const getProvider = (code: string) => PROVIDER_MAP[code] ?? 'fibos';
```

### `IndexSyncJob` → React page

```tsx
// pages/SyncJobs.jsx
const { data: syncJobs } = useQuery({
  queryKey: ['syncJobs', cruiselineId],
  queryFn: () => base44.entities.SyncJob.filter(
    { cruiseline_id: cruiselineId },
    '-started_at',
    50  // paginated
  ),
});
// Render status badges, timestamps, error messages
// Provider label derived from cruiseline.code via getProvider()
```

No backend function needed for read-only display — direct entity SDK query suffices.

---

## Summary

**`Actions/Provider/SyncJob/IndexSyncJob`** (36 lines): Renders the sync job monitoring dashboard for a given Cruiseline. Maps cruiseline codes to provider names via a hardcoded `PROVIDERS` constant (with implicit `'fibos'` fallback), queries the raw Laravel `jobs` table joined to `sync_jobs`, and passes both a DataTable and a raw jobs collection to the Blade view. **Critical bug:** no null guard on `Cruiseline::find()` — invalid `$cruiselineId` causes fatal null dereference. **High issues:** ambiguous `orderBy('created_at')` (column exists on both tables), `select('jobs.*')` fetches large serialized `payload` blobs, no pagination, coupling to Laravel queue internals. The dual DataTable + raw `$jobs` collection suggests the view may be rendering the same data twice.

**Migration priority: MEDIUM** — replace raw `jobs` table queries with a dedicated `SyncJob` entity that backend sync functions write to; render via a React page with direct entity SDK queries.