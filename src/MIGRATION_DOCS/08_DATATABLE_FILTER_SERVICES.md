# DataTable & Filter Services

**Purpose:** Frontend DataTable configuration and advanced query filtering for admin dashboards.  
**Package:** Yajra DataTables (server-side processing with advanced features)  

---

## 1️⃣ DataTableService

**Purpose:** Centralized configuration builder for Yajra DataTables HTML builder with multi-page selection, bulk actions, and export support.

### Architecture

```
DataTableService
├── configureHtml() - Main configuration entry point
├── Checkbox Management (multi-page selections)
├── Bulk Actions (delete, update, etc.)
├── Export Actions (Excel, CSV, PDF, Print, Copy)
├── Search & Filtering (column + global)
└── Event Handlers (draw, select, deselect)
```

### Main Method: configureHtml()

**Signature:**
```php
public function configureHtml(
    HtmlBuilder $builder,
    string $tableId,
    array $customParameters = [],
    array $customButtons = [],
    bool $enableCheckboxes = false,
    bool $enableSearchBuilder = false,
    array $checkboxOptions = []
): HtmlBuilder
```

**Flow:**
1. Get locale from session (default: 'it')
2. Load language file from CDN (IT, EN, FR, DE, AR)
3. Set common parameters (pagination, search, responsive, etc.)
4. Add checkbox support if enabled (multi-page selection)
5. Merge custom parameters
6. Configure buttons (default: column visibility + export)
7. Return configured HtmlBuilder

### Common Parameters

```php
[
    'processing' => true,           // Show loading indicator
    'serverSide' => true,           // Server-side processing
    'paging' => true,               // Enable pagination
    'searching' => true,            // Enable search
    'searchDelay' => 800,           // Delay before search request
    'pageLength' => 25,             // Rows per page
    'lengthChange' => true,         // Allow user to change page length
    'language' => [...]             // Localization URLs
    'drawCallback' => function()    // Post-draw handler
]
```

### Checkbox Support (Multi-Page Selection)

**Features:**
- Persistent selection across pages (Set-based storage)
- Select-all checkbox with indeterminate state
- Visual selection sync (checkboxes + DataTables Select API)
- Counter display (e.g., "5 rows selected")

**Implementation:**
- Uses `window.multiPageSelections[tableId]` Set for persistent storage
- Hybrid approach: DataTables Select API + custom storage
- Events: change (checkbox), draw (restore state), select/deselect (sync)

**Global Functions Generated:**
```javascript
window.getSelectedRowIds(tableId)          // Returns array of selected IDs
window.getSelectedRowsData(tableId)        // Returns row data objects
window.toggleRowSelection(tableId, rowId, isSelected)  // Add/remove selection
window.forceCleanSelections(tableId)       // Clear all selections
window.updateSelectAllState(tableId)       // Update select-all checkbox state
window.updateSelectionCounter(tableId)     // Show/hide row count
```

### Bulk Actions

**Methods:**
- `performBulkAction()` - With confirmation dialog
- `performBulkActionQuick()` - No confirmation
- `executeBulkRequest()` - AJAX execution
- `reloadTable()` - With/without preserving selections

**Features:**
- CSRF token support
- HTTP method spoofing (PUT, PATCH, DELETE via POST)
- SweetAlert2 for UX
- Configurable success/error messages
- Preserve selection after action (optional)

**Example Usage:**
```javascript
window.performBulkAction(
    'table-id',
    'delete',
    '/api/cruises/bulk-delete',
    'POST',
    csrfToken,
    'Delete selected cruises?',
    'Cruises deleted successfully',
    false
);
```

### Export Actions

**Supported Formats:**
- Excel (excelHtml5)
- CSV (csvHtml5)
- PDF (pdfHtml5)
- Print
- Copy to clipboard

**Features:**
- Multi-page export support (select all, then export)
- Export only selected rows
- Custom action handler: `performExportAction()`
- Preserves pagination state after export

### Column Visibility & Filtering

**Methods:**
- `initComplete()` - Initialize search row with filters
- Column-specific search (text input or select dropdown)
- Global search (top-right input)
- Active filters display with reset buttons
- Min-length validation (2 characters for text search)

**Features:**
- Dynamic filter row creation (one-time)
- Select2 integration for dropdown filters
- Distinct filter options from server
- Filter pills showing active filters
- Reset individual or all filters

### Event Handlers

**JavaScript Events:**
- `draw.dt` - Restore selections, update counter
- `select.dt` - Sync checkboxes with DataTables Select API
- `deselect.dt` - Sync checkboxes with DataTables Select API
- `column-visibility.dt` - Sync filter row visibility

### Methods Summary

| Method | Purpose |
|--------|---------|
| `configureHtml()` | Main entry point for configuration |
| `getDrawCallback()` | Post-draw initialization (Select2, tooltips) |
| `getLayout()` | Configure toolbar layout (SearchBuilder, buttons) |
| `getButtons()` | Standard buttons (column visibility, export) |
| `addBulkActionButtons()` | Add custom bulk action buttons |
| `initComplete()` | Initialize search filters |
| `generateColumnClickScript()` | Handle table cell click events |
| `buttonClickScript()` | Handle button click events in cells |
| `generateColumnChangeScript()` | Handle select/dropdown changes |
| `generateCheckboxToggleScript()` | Handle checkbox toggle events |
| `selectedRowScript()` | Pre-select rows on initial load |

---

## 2️⃣ FilterService

**Purpose:** Advanced query builder for SearchBuilder integration - converts client-side filter criteria into Eloquent queries.

### Architecture

```
FilterService
├── applyFilters() - Entry point
├── processCriteria() - Recursive processor
├── processNestedGroup() - Handle AND/OR groups
├── processSingleCriterion() - Process individual filter
├── buildFilterCondition() - Build query condition
├── buildDateFilterCondition() - Special date handling
├── filterByDate() - Date filter logic
└── parseDateFilter() - Parse various date formats
```

### Main Method: applyFilters()

**Signature:**
```php
public function applyFilters($query, $searchBuilder): Builder
```

**Input Structure:**
```php
[
    'logic' => 'AND',  // or 'OR'
    'criteria' => [
        [
            'origData' => 'column_name',
            'condition' => '=',
            'value' => ['value1', 'value2'],
            'type' => 'string'  // or 'date', 'datetime'
        ],
        [
            'logic' => 'OR',
            'criteria' => [...]  // Nested group
        ]
    ]
]
```

**Output:**
Modified `$query` Builder with WHERE clauses applied.

### Supported Conditions

| Condition | Operation | Example |
|-----------|-----------|---------|
| `=` | Equals | `column = 'value'` |
| `!=` | Not equals | `column != 'value'` |
| `<` | Less than | `column < 100` |
| `<=` | Less or equal | `column <= 100` |
| `>` | Greater than | `column > 100` |
| `>=` | Greater or equal | `column >= 100` |
| `between` | Between two values | `column BETWEEN 1 AND 10` |
| `!between` | Not between | `NOT (column BETWEEN 1 AND 10)` |
| `starts` / `startsWith` | Starts with | `column LIKE 'prefix%'` |
| `!starts` / `!startsWith` | Not starts with | `column NOT LIKE 'prefix%'` |
| `contains` | Contains | `column LIKE '%value%'` |
| `!contains` | Not contains | `column NOT LIKE '%value%'` |
| `ends` / `endsWith` | Ends with | `column LIKE '%suffix'` |
| `!ends` / `!endsWith` | Not ends with | `column NOT LIKE '%suffix'` |
| `null` / `empty` | Is null or empty | `column IS NULL OR column = ''` |
| `!null` / `!empty` | Is not null/empty | `column IS NOT NULL AND column != ''` |
| `in` | In list | `column IN (id1, id2, id3)` |
| `!in` | Not in list | `column NOT IN (id1, id2, id3)` |
| `regex` | Regex match | `column REGEXP 'pattern'` |
| `!regex` | Not regex match | `column NOT REGEXP 'pattern'` |

### Date Filtering

**Supported Date Formats:**
- `2025` - Year only
- `2025-03` or `03-2025` - Year and month
- `2025-03-25` - Full date (YYYY-MM-DD)
- `25-03-2025` - Date (DD-MM-YYYY)
- `25/03/2025` - Date with slashes
- `03/25/2025` - American format (MM/DD/YYYY)
- `2025/03/25` - Slash format (YYYY/MM/DD)
- `25.03.2025` - Dot format (DD.MM.YYYY)
- `2025-01-01 to 2025-12-31` - Range (TO separator)

**Date Filter Processing:**
```php
case 'year':
    $query->whereYear($column, $year);

case 'year-month':
    $query->whereBetween($column, ['2025-03-01', '2025-03-31']);

case 'date':
    $query->whereDate($column, '2025-03-25');

case 'date-range':
    $query->whereBetween($column, [$startDate, $endDate]);
```

### Recursive Processing

**Supports nested AND/OR groups:**

```
IF criteria has 'criteria' key (nested group)
    ├─ processNestedGroup()
    │  └─ Wrap in where() / orWhere() based on parent logic
    │     └─ Recursively call processCriteria() on children
ELSE
    └─ processSingleCriterion()
       └─ Call buildFilterCondition()
          └─ Return array or Closure for query
```

**Query Method Selection:**
- First condition: always `where()`
- Subsequent conditions:
  - If logic is `AND`: use `where()`
  - If logic is `OR`: use `orWhere()`

### Validation & Null Handling

**Criteria Validation:**
```php
- Must have: origData, condition, value
- value[0] must not be empty
- Invalid criteria are skipped (logged)
```

**Null & Empty Handling:**
- `null` / `empty`: `WHERE column IS NULL OR column = ''`
- `!null` / `!empty`: `WHERE column IS NOT NULL AND column != ''`
- Array values: checked with `count($value) > 0`

### Error Handling

**Logging:**
- Unrecognized conditions logged as warnings
- No exceptions thrown - graceful degradation
- Invalid criteria skipped silently

**Utility Method:**
```php
public function debugSearchBuilder($searchBuilder): void
```
Logs SearchBuilder structure for debugging.

### Example Usage

**PHP (Controller):**
```php
$filterService = new FilterService();
$query = User::query();
$query = $filterService->applyFilters($query, $searchBuilder);
$results = $query->paginate(25);
```

**Frontend SearchBuilder (DataTables):**
Client sends criteria from SearchBuilder UI → Server receives as `request()->input('searchBuilder')`

---

## 🔗 Integration Flow

```
DataTable HTML (Frontend)
    ├─ SearchBuilder UI
    └─ User defines filters (AND/OR, conditions, values)
        ↓
Ajax Request
    ├─ URL: /api/data-endpoint
    └─ POST data: searchBuilder = {...}
        ↓
Controller (Server)
    ├─ Receive searchBuilder
    ├─ Create base query
    ├─ Call FilterService::applyFilters()
    └─ Return filtered results (JSON)
        ↓
DataTable AJAX Response
    ├─ JSON with filtered rows
    ├─ Render table
    └─ Update filter pills in UI
```

---

## 📝 Migration Notes for Base44

### Frontend Components
- DataTableService: Complex JavaScript generation from PHP
- **Base44 Approach:** Use React DataTable with TanStack Table + Recharts
- Separate concerns: UI (React) vs. Query Building (Backend)

### Query Building
- FilterService: Solid recursive filter builder
- **Base44 Approach:** Implement similar logic in backend functions
- Use Drizzle ORM or similar type-safe query builders

### Configuration
- Yajra DataTables: Laravel-specific, tightly coupled
- **Base44 Approach:** 
  - Create JSON schema for table configuration
  - Client-side rendering with React
  - Server-side filtering via backend function

### JavaScript Generation
- Current: PHP generates JavaScript strings
- **Base44 Approach:**
  - Separate JS files
  - TypeScript for type safety
  - Hooks for state management

### Date Parsing
- Robust multi-format date parsing
- **Keep as-is:** Useful utility independent of framework