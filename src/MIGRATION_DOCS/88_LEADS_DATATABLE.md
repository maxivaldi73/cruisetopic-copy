# LeadsDataTable (CRM Core Lead Management)

**File:** `LeadsDataTable.php`  
**Namespace:** `App\DataTables\Lead`  
**Type:** Core CRM — **HIGH priority**  
**Size:** 14.3 KB (largest Lead DataTable)

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **Model** | `Lead` |
| **Complexity** | HIGH — relationships, roles, currency formatting, avatar rendering |
| **Columns** | 8 (id, quality, name, status, value, assignee, date, action) |
| **Relationships** | statusLead, quality, assigneeUser, quote.customer, noteAttachments |
| **Filters** | Dropdown selects for quality, status, assignee + date range picker |
| **Role-based** | "Pull Lead" button visible only to active sellers |

---

## 🔧 Implementation

### Query

```php
public function query(Lead $model): QueryBuilder {
    return $model->newQuery()
        ->with(['statusLead', 'quality', 'assigneeUser', 'quote.customer'])
        ->with('noteAttachments');
    // ⚠️ No authorization — all leads visible to everyone
    // ⚠️ Large commented-out block with role-based filtering (dead code)
}
```

**Note:** There is a large commented-out block (lines 110-147) with old role-based query logic (superAdmin vs seller scoping), indicating this used to have auth but it was removed/disabled.

### Data Columns

#### `id` — Direct
```php
->editColumn('id', function (Lead $lead) {
    return $lead->id ? $lead->id : '-';
})
```

#### `name` — Avatar component (Blade partial)
```php
// Renders: avatar + name + lastname + email + phone + customer badge
return view('_partials.datatables.datatables-avatar', [
    'name'       => $lead->name,
    'lastname'   => $lead->lastname,
    'email'      => $lead->email,
    'phone'      => $lead->phone,
    'isCustomer' => $hasCustomer,
    'hasValue'   => $hasCustomer,
]);
```

#### `quality_id` — Custom HTML badge with tooltip
```php
$roleBadgeObj = [
    'BRONZE' => '<span class="badge rounded-pill" style="background-color:#cd7f32; ...">',
    'SILVER' => '<span class="badge rounded-pill bg-secondary ...">',
    'GOLD'   => '<span class="badge rounded-pill bg-warning ...">',
];
// Also shows origin + source in tooltip
```

#### `status` — Color-coded badge
```php
$statusColors = [
    8  => '#409EFF', // NEW
    9  => '#0dcaf0', // INFO
    10 => '#ffc107', // NOT ANSWER
    11 => '#dc3545', // LOSE
    12 => '#6c757d', // FALSO
    13 => '#6610f2', // DOPPIO
    14 => '#fd7e14', // RECALL
    15 => '#20c997', // TRATTATIVA
    16 => '#198754', // CONVERTED
];
// ⚠️ Hardcoded status IDs — breaks when records change
```

#### `value` — Currency formatted with locale
```php
$price = $lead->quote?->cabin_total_price;
$locale = session('locale', app()->getLocale());
$formatter = new NumberFormatter($locale, NumberFormatter::CURRENCY);
return $formatter->formatCurrency($price, 'EUR'); // ⚠️ Hardcoded EUR
```

#### `assignee_id` — Seller avatar (Blade partial)
```php
$stateNum = mt_rand(0, 5); // ⚠️ Random avatar color! Non-deterministic
$states = ['success', 'danger', 'warning', 'info', 'dark', 'primary', 'secondary'];
return view('admin.leads.partials.datatables.fields.datatables-seller', compact('lead', 'initials', 'state'));
```

#### `created_at` — Locale-aware ISO format
```php
Carbon::parse($lead->created_at)
    ->locale(session('locale', app()->getLocale()))
    ->isoFormat('DD MMM YYYY, HH:mm')
```

#### `action` — Role-aware Blade view
```php
$user = Auth::user();
return view('admin.leads.partials.datatables.actions.btn-actions', compact('lead', 'user'));
```

### Dropdown Filters (distinctFilters)

```php
->with([
    'distinctFilters' => [
        '1' => $this->getDistinctValues('quality_id'),  // LeadQuality options
        '3' => $this->getDistinctValues('status'),       // LeadStatus options
        '5' => $this->getDistinctValues('assignee_id'), // Seller options
    ],
])
```

Filter data sources:
- `quality_id` → `LeadQuality::select('id','name')->orderBy('name')`
- `status` → `LeadStatus::select('id','name')->orderBy('name')`
- `assignee_id` → `Seller::select('id','first_name','last_name')`

### Role-Based Button

```php
if (Auth::user()->isActiveSeller()) {
    $buttonPullLead = Button::raw()
        ->text('...<span>Pull Lead</span>...')
        ->attr(['onclick' => 'window.location.href="' . route('leads.pullNextLead') . '";']);
}
```

### Column Definition (8 columns)

| Index | Name | Searchable | Orderable | Filter Type |
|-------|------|-----------|-----------|-------------|
| 0 | `#ID` | ✅ | ✅ | — (non-filterable) |
| 1 | `Quality` | — | ✅ | Select dropdown |
| 2 | `Name` | ✅ | — | Text search |
| 3 | `Status` | ✅ | ✅ | Select dropdown |
| 4 | `Value` | — | — | — (non-filterable) |
| 5 | `Seller` | — | ✅ | Select dropdown |
| 6 | `Date` | ✅ | ✅ | Date range picker |
| 7 | `Action` | — | — | — |

### Date Range Filter

```php
->filterColumn('leads.created_at', function ($query, $keyword) {
    $this->applyDateRangeFilter($query, $keyword, 'leads.created_at');
})
// Uses DatePickerQueryFilter trait
// Frontend: window.dtSilenceDateFilters('#leads-table .date-range-filter input')
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Detail |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization** | All leads visible to all users; commented-out role filter disabled |
| 2 | 🔴 CRITICAL | **Hardcoded status IDs** | `$statusColors[8..16]` — breaks if IDs change in DB |
| 3 | ⚠️ HIGH | **Hardcoded EUR currency** | `formatCurrency($price, 'EUR')` — ignores market/website currency |
| 4 | ⚠️ HIGH | **Random avatar color** | `mt_rand(0, 5)` — non-deterministic, changes on every render |
| 5 | ⚠️ HIGH | **Magic column indices** | `[0,4,7]`, `[1,3,5]` — break on column reorder |
| 6 | ⚠️ HIGH | **Hardcoded view paths** | 4 different Blade partials hardcoded |
| 7 | ⚠️ HIGH | **Large dead code block** | Commented-out role-based query (lines 110-147) |
| 8 | ⚠️ HIGH | **Wrong export filename** | Returns `'Destinations_...'` — copy-paste bug |
| 9 | ⚠️ MEDIUM | **Hardcoded route** | `route('leads.pullNextLead')` |
| 10 | ⚠️ MEDIUM | **Italian column label** | `->title('Stato')` for status column |
| 11 | ⚠️ MEDIUM | **Inline HTML generation** | Quality badges and status badges are PHP HTML strings |
| 12 | ℹ️ LOW | **`mt_rand` indices** | Used for badge `states` array but array has 7 items, `mt_rand(0,5)` only gives 6 |

---

## 📝 Migration to Base44

### Entity: Lead

```json
{
  "name": "Lead",
  "type": "object",
  "properties": {
    "name": { "type": "string", "required": true },
    "lastname": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "status_id": { "type": "string", "description": "Ref to LeadStatus entity" },
    "quality": {
      "type": "string",
      "enum": ["BRONZE", "SILVER", "GOLD"],
      "description": "Lead quality tier"
    },
    "assignee_id": { "type": "string", "description": "Ref to User/Seller entity" },
    "origin": { "type": "string" },
    "source": { "type": "string" },
    "quote_id": { "type": "string", "description": "Ref to Quote entity" },
    "cabin_total_price": { "type": "number" },
    "currency_code": { "type": "string", "default": "EUR" },
    "notes": { "type": "string" },
    "is_customer": { "type": "boolean", "default": false }
  },
  "required": ["name"]
}
```

### Backend Functions

```typescript
// functions/getLeads.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    page = 0,
    search = '',
    status_id = '',
    quality = '',
    assignee_id = '',
    date_from = '',
    date_to = '',
    sort_by = 'created_date',
    sort_order = 'desc'
  } = await req.json();

  const filters = {};
  if (search) filters.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ];
  if (status_id) filters.status_id = status_id;
  if (quality) filters.quality = quality;
  if (assignee_id) {
    // Non-admin sellers see only their own leads
    if (user.role !== 'admin') {
      filters.assignee_id = user.id;
    } else {
      filters.assignee_id = assignee_id;
    }
  } else if (user.role !== 'admin') {
    filters.assignee_id = user.id;
  }

  const sortStr = `${sort_order === 'asc' ? '+' : '-'}${sort_by}`;
  const leads = await base44.entities.Lead.filter(filters, sortStr, 25, page * 25);

  return Response.json({ data: leads });
});

// functions/pullNextLead.js — for active sellers only
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Find unassigned leads sorted by creation date
  const leads = await base44.entities.Lead.filter(
    { assignee_id: null },
    '+created_date',
    1
  );

  if (leads.length === 0) {
    return Response.json({ message: 'No leads available' });
  }

  const lead = leads[0];
  await base44.entities.Lead.update(lead.id, { assignee_id: user.id });

  return Response.json({ data: lead });
});
```

### React Component (key parts)

```tsx
// Status badge — deterministic by status name, not hardcoded ID
const STATUS_COLORS = {
  'NEW':         '#409EFF',
  'INFO':        '#0dcaf0',
  'NOT ANSWER':  '#ffc107',
  'LOSE':        '#dc3545',
  'RECALL':      '#fd7e14',
  'TRATTATIVA':  '#20c997',
  'CONVERTED':   '#198754',
};

// Quality badge
const QUALITY_BADGES = {
  BRONZE: { color: '#cd7f32', icon: '🥉' },
  SILVER: { color: '#6c757d', icon: '🥈' },
  GOLD:   { color: '#ffc107', icon: '🥇' },
};

// Seller avatar — deterministic color from name hash
const getAvatarColor = (name) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
  const hash = name?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

// Currency — use lead's own currency_code, not hardcoded EUR
const formatValue = (price, currency = 'EUR') => {
  if (!price || price === 0) return '-';
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(price);
};
```

### Key Improvements

1. **Role-based scoping** — Sellers see only their leads; admins see all
2. **Pull Lead** function with proper assignment logic
3. **Status colors by name** — not hardcoded DB IDs
4. **Deterministic avatar colors** — hash-based, not random
5. **Lead currency field** — each lead stores its own currency
6. **Quality as enum** — BRONZE/SILVER/GOLD in entity schema
7. **No dead code** — remove commented-out role filter
8. **Correct export filename** — fix `Destinations_` copy-paste
9. **Proper column labels** — English, no Italian strings
10. **Date range filter** — server-side date range on `created_date`

---

## Summary

**LeadsDataTable** (14.3 KB): Core CRM table — the most feature-rich Lead DataTable. Manages leads with quality badges (BRONZE/SILVER/GOLD), color-coded status badges, locale-aware dates, currency-formatted deal value, seller avatar, and role-based action buttons. CRITICAL: no authorization (role-based query was commented out), hardcoded status DB IDs (8-16) that break if records change. HIGH: hardcoded EUR currency (ignores market), random seller avatar colors (non-deterministic), magic column indices, 4 hardcoded Blade view paths, large dead code block, wrong export filename (`Destinations_`). MEDIUM: hardcoded route, Italian column label (`Stato`), inline HTML generation.

**Migration priority: HIGH** — Core CRM module, critical auth gap, brittle DB ID coupling, dead role-based code needs reactivation with proper seller scoping and Pull Lead feature.