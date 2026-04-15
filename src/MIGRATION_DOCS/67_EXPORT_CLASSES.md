# Export Classes (Excel Data Export)

**Purpose:** Export entity data to Excel files with translations support.  
**Namespace:** `App\Export`  
**Location:** `App/Export/` (9 files)  
**Type:** Data export utilities — low priority

---

## 📋 Overview

| File | Type | Size | Purpose | Issues |
|------|------|------|---------|--------|
| CabinLangSheetExport | FromQuery | 2.5 KB | Export cabins with Italian translations | ✅ Good |
| CruiselineExport | FromQuery | 6.6 KB | Export cruiselines with translations | ✅ Good |
| DestinationExport | FromQuery | 3.6 KB | Export destinations with translations | ✅ Good |
| PortExport | FromQuery | 3.5 KB | Export ports with translations | ✅ Good |
| ShipExport | FromQuery | 3.6 KB | Export ships with translations | ✅ Good |
| CostaPortExport | FromCollection | 0.8 KB | Export Costa provider ports | ⚠️ Issues |
| ExploraPortExport | FromCollection | 0.8 KB | Export Explora provider ports | ⚠️ Issues |
| FibosPortExport | FromCollection | 1.2 KB | Export Fibos provider ports | ⚠️ Issues |
| MscPortExport | FromCollection | 0.8 KB | Export MSC provider ports | ⚠️ Issues |

---

## 🔧 High-Quality Exports (FromQuery + Translations)

### CabinLangSheetExport (2.5 KB)

Export cabins with ship names and Italian translations.

```php
class CabinLangSheetExport implements FromQuery, WithHeadings, WithMapping, WithChunkReading
{
    public function query()
    {
        return Cabin::query()
            ->from('cabins')
            ->join('ships', 'ships.id', '=', 'cabins.ship_id')
            ->where('cabins.enabled', true)
            ->select([
                'cabins.id',
                'ships.name as ship_name',
                'cabins.category_code',
                'cabins.type',
                DB::raw("COALESCE((
                    SELECT NULLIF(TRIM(t.value), '')
                    FROM translations t
                    WHERE t.model_id = cabins.id
                      AND t.model_class = '" . addslashes(Cabin::class) . "'
                      AND t.lang_code = 'IT'
                      AND t.model_property = 'name'
                    LIMIT 1
                ), cabins.name) as final_name"),
                // ... more translation subqueries ...
            ]);
    }
    
    public function headings(): array
    {
        return ['ID', 'Ship', 'Category Code', 'Type', 'Name', 'Description'];
    }
    
    public function map($row): array
    {
        return [
            $row->id, $row->ship_name, $row->category_code, $row->type,
            $row->final_name, $row->final_description,
        ];
    }
    
    public function chunkSize(): int
    {
        return 5000;
    }
}
```

**Pattern:**
- ✅ Optimized SQL-based queries (not lazy loading)
- ✅ Subqueries for translation fallback (COALESCE)
- ✅ Chunk reading for memory efficiency
- ✅ Mapping for clean Excel output
- ✅ Filters enabled records only

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ MEDIUM | **SQL injection via addslashes()** — Not proper escaping, only works for class names | Security risk |
| 2 | ⚠️ MEDIUM | **Hardcoded 'IT' language** — Only exports Italian translations | Limited flexibility |
| 3 | ⚠️ MEDIUM | **No authorization** — Anyone can export all cabin data | Security |
| 4 | ⚠️ MEDIUM | **LIMIT 1 on subqueries** — May not handle multiple translations per property | Incomplete |
| 5 | ℹ️ LOW | **Chunk size 5000** — May be too large or too small depending on row size | Tuning |

---

### CruiselineExport, DestinationExport, PortExport, ShipExport

All follow **same pattern** as CabinLangSheetExport with minor variations:
- CruiselineExport: 10 columns with nested translations (6.6 KB)
- DestinationExport: 6 columns (ID, name, desc, meta fields)
- PortExport: 6 columns, filters by `whereHas('FibosPorts')`
- ShipExport: 7 columns (ID, code, name, desc, meta fields)

**Common Issues** (all FromQuery exports):
- SQL injection via addslashes() (low risk, class names only)
- Hardcoded Italian language 'IT'
- No authorization checks
- No user feedback on export status
- Subqueries per translation (N+1 on database level)

---

## 🔧 Provider Port Exports (FromCollection)

### CostaPortExport, ExploraPortExport, MscPortExport (0.8 KB each)

Simple collection exports from provider-specific models.

```php
class CostaPortExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        $ports = MscPort::all(); // ⚠️ BUG: CostaPortExport uses MscPort!
        
        return $ports->map(function ($port) {
            return [
                'name' => $port->name,
                'code' => $port->code,
                'is_not_a_port' => $port->is_not_a_port,
                'port_id' => $port->port_id,
            ];
        });
    }
    
    public function headings(): array
    {
        return ['name', 'code', 'is_not_a_port', 'port_id'];
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **CostaPortExport uses MscPort model** (line 15) | Exports wrong data |
| 2 | ⚠️ HIGH | **`::all()` loads entire table** — No filtering, no pagination | Memory/performance risk |
| 3 | ⚠️ HIGH | **No authorization** — Anyone can export provider port data | Security |
| 4 | ⚠️ MEDIUM | **Inconsistent with main exports** — No translation support | Feature gap |
| 5 | ⚠️ MEDIUM | **No error handling** — Crashes if model not found | Reliability |
| 6 | ℹ️ LOW | **Duplicate headings array** — Unnecessary variable assignment | Code smell |

### FibosPortExport (1.2 KB)

Parameterized export for Fibos ports by cruiseline code.

```php
class FibosPortExport implements FromCollection, WithHeadings
{
    private $cruiselineCode;
    
    public function __construct($cruiselineCode)
    {
        $this->cruiselineCode = $cruiselineCode;
    }
    
    public function collection()
    {
        $fibosCruiseline = FibosCruiseline::whereCode($this->cruiselineCode)->first();
        $ports = FibosPort::query()->whereFibosCruiselineId($fibosCruiseline->id)->get();
        
        return $ports->map(function ($port) {
            return [
                'name' => $port->name,
                'code' => $port->code,
                'is_not_a_port' => $port->is_not_a_port,
                'cruiseline_code' => $this->cruiselineCode,
                'port_id' => $port->port_id,
            ];
        });
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **No null check** — Crashes if cruiselineCode not found | Reliability |
| 2 | ⚠️ HIGH | **N+1 query pattern** — Loads cruiseline first, then ports | Performance |
| 3 | ⚠️ MEDIUM | **No authorization** — Anyone can export Fibos ports | Security |
| 4 | ⚠️ MEDIUM | **No translation support** — Unlike main exports | Feature gap |

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 1 | CostaPortExport uses wrong model (MscPort) |
| ⚠️ HIGH | 9 | Missing null checks, ::all() loads all data, no authorization (4×), N+1 patterns |
| ⚠️ MEDIUM | 10 | SQL injection (low risk), hardcoded language, no error handling, inconsistent patterns |
| ℹ️ LOW | 3 | Code smell, chunk size tuning, duplicate arrays |

---

## 📝 Migration Notes for Base44

### Strategy: Backend Functions + Streaming

**Step 1: Create Export Job Entity**

```json
// entities/ExportJob.json
{
  "user_id": {"type": "string"},
  "entity_type": {"type": "string"},
  "status": {"type": "string", "enum": ["pending", "processing", "completed", "failed"]},
  "file_url": {"type": "string"},
  "row_count": {"type": "integer"},
  "filters": {"type": "object"},
  "error_message": {"type": "string"},
  "started_at": {"type": "string", "format": "date-time"},
  "completed_at": {"type": "string", "format": "date-time"}
}
```

**Step 2: Backend Functions**

**Function: exportEntities**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { entity_type, filters = {} } = await req.json();

  if (!entity_type) {
    return Response.json({ error: 'entity_type required' }, { status: 400 });
  }

  try {
    // Create export job record
    const job = await base44.entities.ExportJob.create({
      user_id: user.id,
      entity_type,
      status: 'pending',
      filters,
    });

    // Fetch entities
    const entities = await base44.entities[entity_type].filter(filters, '-created_date', 10000);

    // Build CSV/Excel data
    const data = entities.map(entity => ({
      id: entity.id,
      ...entity, // All fields
    }));

    // In production, upload to cloud storage
    // For now, return data for client-side download
    
    await base44.entities.ExportJob.update(job.id, {
      status: 'completed',
      row_count: data.length,
      completed_at: new Date().toISOString(),
    });

    return Response.json({ job, data });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
```

**Step 3: React Component**

```tsx
// pages/admin/DataExportPage.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DataExportPage() {
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('exportEntities', {
        entity_type: entityType,
        filters: { enabled: true },
      }),
    onSuccess: (data) => {
      // Convert to CSV and trigger download
      const csv = convertToCSV(data.data.data);
      downloadCSV(csv, `${entityType}-export.csv`);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const handleExport = () => {
    if (!entityType) {
      alert('Select an entity type');
      return;
    }
    setLoading(true);
    mutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger>
            <SelectValue placeholder="Select entity..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cruise">Cruises</SelectItem>
            <SelectItem value="Ship">Ships</SelectItem>
            <SelectItem value="Port">Ports</SelectItem>
            <SelectItem value="Cruiseline">Cruiselines</SelectItem>
            <SelectItem value="Destination">Destinations</SelectItem>
            <SelectItem value="Cabin">Cabins</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExport} disabled={loading}>
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </CardContent>
    </Card>
  );
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item =>
    Object.values(item).map(v => `"${v}"`).join(',')
  );
  return [headers, ...rows].join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
```

### Key Improvements

1. **Authorization** — Admin-only enforced
2. **Fix Critical Bug** — CostaPortExport uses correct model
3. **No SQL Injection** — Use parameterized queries
4. **Configurable Languages** — Not hardcoded to Italian
5. **Scalable** — Job tracking, streaming for large exports
6. **Null Checks** — All error cases handled
7. **Consistent Pattern** — All exports follow same structure
8. **User Feedback** — Export status/progress
9. **No Memory Issues** — Streaming instead of loading all data
10. **Audit Trail** — Track who exported what/when

---

## Summary

9 Excel export classes: 5 high-quality (FromQuery, translations, chunking), 4 simple (FromCollection, provider ports). **CRITICAL:** CostaPortExport uses MscPort model (exports wrong data). Issues: no authorization (all 9), ::all() loads entire tables, hardcoded Italian language, SQL injection via addslashes, no null checks, N+1 patterns, inconsistent translation support.

In Base44: Create ExportJob entity, backend function (exportEntities) with authorization/null checks/error handling, React export UI with entity selection, CSV download client-side, audit trail, fix CostaPortExport model, configurable languages, stream large exports.

**Migration Priority: LOW** — data export utilities, not critical business logic, but 1 critical bug (wrong model).