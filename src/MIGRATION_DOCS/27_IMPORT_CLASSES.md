# Import Classes

**Purpose:** Excel/CSV import classes for bulk-loading translated content into core entities. All classes delegate to `TranslationImportService` for standardized row processing with column mapping and language scoping.  
**Framework:** Maatwebsite/Excel with chunked reading and heading-row support.  
**Total Importers:** 5

---

## 📋 Import Class Index

| Class | Model | Fields Imported | Language |
|-------|-------|----------------|----------|
| CabinLangSheetImport | Cabin | name, description | (default) |
| CruiselineImport | Cruiseline | name, description, description_html, short_description, meta_title, meta_description, meta_description_search | (default) |
| DestinationImport | Destination | name, description, meta_title, meta_description | IT |
| PortImport | Port | name, description | IT |
| ShipImport | Ship | name, description, meta_title, meta_description | IT |

---

## 🏗️ Shared Architecture

All import classes follow the same pattern:

```php
class XxxImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    protected TranslationImportService $service;

    public function __construct()
    {
        $this->service = new TranslationImportService(
            XxxModel::class,
            ['field' => 'Column Header', ...],
            'IT' // optional language scope
        );
    }

    public function collection(Collection $rows)
    {
        $this->service->importRows($rows);
    }

    public function getStats(): array { return $this->service->getStats(); }
    public function getErrors(): array { return $this->service->getErrors(); }
    public function chunkSize(): int { return 100; } // (varies per class)
}
```

### Interfaces Implemented

| Interface | Purpose |
|-----------|---------|
| `ToCollection` | Receives rows as Laravel Collection |
| `WithHeadingRow` | Uses first row as column names |
| `WithChunkReading` | Processes rows in chunks (memory efficiency) |

---

## 📦 CabinLangSheetImport

**Location:** `App\Imports\CabinLangSheetImport`  
**Model:** `App\Models\Cabin`  
**Language:** Default (not scoped)

### Column Mapping

| Excel Column | Model Field |
|-------------|-------------|
| name | name |
| description | description |

### Constructor

```php
$this->service = new TranslationImportService(
    \App\Models\Cabin::class,
    [
        'name'        => 'name',
        'description' => 'description',
    ]
);
```

### Notes
- No language scope → uses TranslationImportService default
- Minimal field mapping (name + description only)
- Class name includes "LangSheet" suggesting it's specifically for translation imports

---

## ⚓ CruiselineImport

**Location:** `App\Imports\CruiselineImport`  
**Model:** `App\Models\Cruiseline`  
**Language:** Default (not scoped)

### Column Mapping

| Excel Column | Model Field |
|-------------|-------------|
| Name | name |
| Description | Description |
| Description Html | description_html |
| Short Description | short_description |
| Meta Title | meta_title |
| Meta Description | meta_description |
| Meta Description Sear... | meta_description_search |

### Notes
- Most extensive field set of all importers (7 fields)
- Column headers use Title Case with spaces (not snake_case)
- Includes HTML description variant (`description_html`)
- Includes SEO fields (`meta_title`, `meta_description`, `meta_description_search`)

---

## 🌍 DestinationImport

**Location:** `App\Imports\DestinationImport`  
**Model:** `App\Models\Destination`  
**Language:** `IT` (Italian)

### Column Mapping

| Excel Column | Model Field |
|-------------|-------------|
| name | name |
| description | description |
| meta_title | meta_title |
| meta_description | meta_description |

### Constructor

```php
$this->service = new TranslationImportService(
    Destination::class,
    [
        'name'             => 'name',
        'description'      => 'description',
        'meta_title'       => 'meta_title',
        'meta_description' => 'meta_description',
    ],
    'IT'
);
```

### Notes
- Explicitly scoped to Italian (`'IT'`)
- Column names use snake_case (consistent with model field names)
- Includes SEO metadata fields

---

## 🚢 PortImport

**Location:** `App\Imports\PortImport`  
**Model:** `App\Models\Port`  
**Language:** `IT` (Italian)

### Column Mapping

| Excel Column | Model Field |
|-------------|-------------|
| name | name |
| description | description |

### Notes
- Minimal mapping (name + description only)
- Scoped to Italian (`'IT'`)
- Simplest of the IT-scoped importers

---

## 🛳️ ShipImport

**Location:** `App\Imports\ShipImport`  
**Model:** `App\Models\Ship`  
**Language:** `IT` (Italian)

### Column Mapping

| Excel Column | Model Field |
|-------------|-------------|
| name | name |
| description | description |
| meta_title | meta_title |
| meta_description | meta_description |

### Notes
- Matches DestinationImport field set (both have 4 fields + IT scope)
- Includes SEO fields alongside name/description

---

## 📊 Comparison Table

| Class | Fields | Language | Has HTML | Has SEO |
|-------|--------|----------|----------|---------|
| CabinLangSheetImport | 2 | default | ❌ | ❌ |
| CruiselineImport | 7 | default | ✅ | ✅ |
| DestinationImport | 4 | IT | ❌ | ✅ |
| PortImport | 2 | IT | ❌ | ❌ |
| ShipImport | 4 | IT | ❌ | ✅ |

---

## ⚠️ Common Issues

### Shared Problems

1. **Service Instantiation in Constructor:** `new TranslationImportService(...)` called in constructor
   - Not injectable / not testable without real service
   - Better: Accept service as constructor parameter (DI)

2. **Inconsistent Column Header Casing:**
   - `CruiselineImport` uses Title Case: `'Name'`, `'Description Html'`
   - Others use snake_case: `'name'`, `'description'`
   - Risk: Excel file column names must match exactly (brittle)

3. **No Validation Interface:** Most classes do not implement `WithValidation`
   - CabinLangSheetImport comment mentions `WithValidation` in imports but doesn't implement it
   - Invalid rows silently skipped or cause errors

4. **Hard-coded Language Scope:** IT language is hard-coded per class
   - No way to run the same importer for a different language without code change
   - Better: Accept language as constructor parameter

5. **No Transaction Wrapping:** Each chunk processed independently
   - Partial failure leaves database in inconsistent state
   - Better: Wrap each chunk in DB::transaction()

---

## 📝 Migration Notes for Base44

### Current Pattern

```php
// Laravel: Upload Excel → Import class → TranslationImportService → DB
Excel::import(new CruiselineImport(), $file);
$stats = $importer->getStats();
$errors = $importer->getErrors();
```

### Base44 Refactor: Backend Function + Core Integration

**Strategy:** Use `ExtractDataFromUploadedFile` integration to parse the uploaded file, then bulk-create/update entities.

#### Backend Function: importTranslations

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { fileUrl, entityType, language } = await req.json();

  // Define field mapping per entity type
  const fieldMaps = {
    cabin: { name: 'name', description: 'description' },
    cruiseline: {
      name: 'Name',
      description: 'Description',
      description_html: 'Description Html',
      short_description: 'Short Description',
      meta_title: 'Meta Title',
      meta_description: 'Meta Description',
    },
    destination: { name: 'name', description: 'description', meta_title: 'meta_title', meta_description: 'meta_description' },
    port: { name: 'name', description: 'description' },
    ship: { name: 'name', description: 'description', meta_title: 'meta_title', meta_description: 'meta_description' },
  };

  const fieldMap = fieldMaps[entityType];
  if (!fieldMap) {
    return Response.json({ error: 'Unknown entity type' }, { status: 400 });
  }

  // Extract rows from uploaded file
  const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
    file_url: fileUrl,
    json_schema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.keys(fieldMap).map(k => [k, { type: 'string' }])
      )
    }
  });

  if (result.status !== 'success') {
    return Response.json({ error: result.details }, { status: 422 });
  }

  const rows = Array.isArray(result.output) ? result.output : [result.output];

  let updated = 0;
  let errors = [];

  for (const row of rows) {
    try {
      const entityId = row.id;
      if (!entityId) { errors.push({ row, reason: 'Missing id' }); continue; }

      const patch = {};
      for (const [modelField, excelCol] of Object.entries(fieldMap)) {
        if (row[excelCol] !== undefined) patch[modelField] = row[excelCol];
      }

      const Entity = base44.entities[entityType.charAt(0).toUpperCase() + entityType.slice(1)];
      await Entity.update(entityId, patch);
      updated++;
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  return Response.json({ updated, errors, total: rows.length });
});
```

#### Frontend: Admin Import UI

```typescript
export default function ImportTranslations() {
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState('cruiseline');
  const [language, setLanguage] = useState('IT');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    // 1. Upload file
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    // 2. Call backend function
    const res = await base44.functions.invoke('importTranslations', {
      fileUrl: file_url,
      entityType,
      language,
    });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div>
      <select value={entityType} onChange={e => setEntityType(e.target.value)}>
        {['cabin', 'cruiseline', 'destination', 'port', 'ship'].map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input type="file" accept=".xlsx,.csv" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleImport} disabled={loading}>Import</button>
      {result && (
        <div>
          <p>Updated: {result.updated} / {result.total}</p>
          {result.errors.length > 0 && (
            <pre>{JSON.stringify(result.errors, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
```

### Key Improvements

1. **Single Backend Function:** One `importTranslations` function handles all entity types (no 5 separate importers)
2. **Language as Parameter:** Language passed at runtime, not hard-coded
3. **Column Map Registry:** Centralized field maps, easy to update
4. **Error Visibility:** Errors returned to UI (not silent)
5. **Admin Protection:** Role check in backend function
6. **Reusable UI:** Single upload component for all entity types
7. **No Excel Package:** Uses Base44's built-in `ExtractDataFromUploadedFile` integration

### Entities Required

For each entity (Cabin, Cruiseline, Destination, Port, Ship) ensure these fields exist in the entity schema:
- `name` (string)
- `description` (string)
- `meta_title` (string, optional)
- `meta_description` (string, optional)
- `description_html` (string, optional — Cruiseline only)
- `short_description` (string, optional — Cruiseline only)