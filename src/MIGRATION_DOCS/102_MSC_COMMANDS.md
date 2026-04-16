# MSC Console Commands (1 file)

**Directory:** `Console/Commands/msc/`  
**Namespace:** `App\Console\Commands\msc`  
**Priority:** MEDIUM — MSC-specific itinerary map import

---

## 📋 Overview

| Command | Signature | Purpose | In Kernel? |
|---------|-----------|---------|------------|
| `ImportItineraryMapsCommand` | `itineraries:import-maps` | Parse MSC XML → update `map_big_size` on Itinerary | ❌ not scheduled |

---

## 🔧 Command Detail

### `ImportItineraryMapsCommand` — `itineraries:import-maps`

```
itineraries:import-maps
  {path=resources/xml/msc/maps.xml : Percorso del file XML}
  {--sync : Esegui subito (senza coda)}
  {--dry  : Esegui dry-run (non scrive su DB)}
```

**Description (Italian):** `Importa MapBigSize per ogni ItineraryCode dal file XML e aggiorna la tabella itineraries`  
→ Reads `MapBigSize` URLs keyed by `ItineraryCode` from an MSC XML file and patches the `itineraries` table.

#### Implementation

```php
public function handle(): int
{
    // 1. Resolve path: absolute if file exists, else base_path() relative
    $path = is_file($pathArg) ? realpath($pathArg) : base_path($pathArg);

    if (!is_file($path)) {
        $this->error("File non trovato: {$path}");  // ⚠️ Italian error
        return self::FAILURE;                        // ✅ Correct exit code
    }

    $dry = (bool) $this->option('dry');

    if ($this->option('sync')) {
        // ⚠️ --sync: instantiates job directly and calls ->handle() synchronously
        $this->warn('Esecuzione in modalità --sync (senza coda).');  // ⚠️ Italian
        (new ImportItineraryMapsJob($path, $dry))->handle();
    } else {
        // ✅ Default: dispatches to queue (queue name unspecified — uses 'default')
        ImportItineraryMapsJob::dispatch($path, $dry);
        $this->info("Job messo in coda (imports): {$path}" . ($dry ? ' [DRY-RUN]' : ''));
    }

    return self::SUCCESS;
}
```

#### Key Observations

| Aspect | Detail |
|--------|--------|
| **Input** | XML file at `resources/xml/msc/maps.xml` (default) or custom path |
| **Job** | `App\Jobs\Msc\ImportItineraryMapsJob($path, $dry)` — not yet documented |
| **Dry-run** | `--dry` flag passed through to job — job must implement the dry-run logic |
| **Sync mode** | `--sync` instantiates job directly with `(new Job)->handle()` |
| **Queue** | Default queue (no `->onQueue()` specified) |
| **Not in Kernel** | Manual trigger only — typically run after MSC XML delivery |

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **Hardcoded MSC XML path** — `resources/xml/msc/maps.xml`; file must be manually placed on server before running |
| 2 | ⚠️ HIGH | **`--sync` uses `(new Job)->handle()`** — bypasses all Laravel job infrastructure (no timeout handling, no error reporting to queue, no retry logic) |
| 3 | ⚠️ MEDIUM | **No queue name specified** — dispatches to `default` queue; may mix with unrelated jobs |
| 4 | ⚠️ MEDIUM | **Description and output strings in Italian** — `"File non trovato"`, `"Esecuzione in modalità --sync"`, `"Job messo in coda"` |
| 5 | ⚠️ MEDIUM | **`ImportItineraryMapsJob` not yet documented** — dry-run behavior, XML parsing logic, and field mapping are opaque |
| 6 | ⚠️ MEDIUM | **Not in Kernel** — no automated trigger; relies on manual execution or external delivery pipeline |
| 7 | ℹ️ LOW | **Path resolution logic** — `is_file($pathArg)` check before `base_path()` is correct but could confuse if a relative path happens to exist as an absolute path |

---

## 📝 Migration to Base44

### Approach

In Base44, the XML file cannot be placed on a filesystem path. Instead:

1. **Upload the XML file** via `base44.integrations.Core.UploadFile` from the frontend
2. **Call a backend function** `importItineraryMaps` with the file URL and a `dryRun` flag
3. The function fetches the XML, parses it with a Deno XML parser, and updates `Itinerary` entities

```typescript
// functions/importItineraryMaps.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { fileUrl, dryRun = true } = await req.json();
  if (!fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

  // Fetch and parse XML
  const xmlText = await fetch(fileUrl).then(r => r.text());
  // Parse <ItineraryCode> → <MapBigSize> mappings
  // For each itinerary: update map_big_size field (unless dryRun)

  return Response.json({ updated: n, skipped: m, dryRun });
});
```

### Frontend Upload Flow

```tsx
// Admin page: upload MSC maps XML file, trigger import, show results
// 1. <input type="file"> → base44.integrations.Core.UploadFile({ file })
// 2. Call importItineraryMaps({ fileUrl, dryRun: true }) for preview
// 3. Confirm → call with dryRun: false to apply
```

### Itinerary Entity field needed

```json
"map_big_size": {
  "type": "string",
  "description": "URL to MSC itinerary map image (MapBigSize from XML)"
}
```

---

## Summary

**`Console/Commands/msc/ImportItineraryMapsCommand`** (40 lines): MSC-specific command that reads an XML file from disk and dispatches `ImportItineraryMapsJob` to import `MapBigSize` map URLs into the `itineraries` table. Supports `--sync` (direct job execution, bypasses queue) and `--dry` (dry-run, no DB writes) flags. Not scheduled — manual trigger only, intended to run after MSC delivers a fresh XML export. Main issues: hardcoded file path requires manual server-side file placement, `--sync` bypasses all queue infrastructure, no queue name specified (uses `default`), all output strings in Italian. `ImportItineraryMapsJob` not yet documented — XML parsing and field mapping logic unknown.

**Migration priority: MEDIUM** — replace file-system path with file upload flow; backend function handles XML parsing and Itinerary entity updates with dry-run support.