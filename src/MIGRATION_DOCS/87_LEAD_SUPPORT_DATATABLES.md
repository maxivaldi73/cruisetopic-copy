# Lead Support DataTables (Activity, Rules, States)

**File:** `LeadActivityDataTable.php`, `LeadRulesDataTable.php`, `LeadStatesDataTable.php`  
**Namespace:** `App\DataTables\Lead`  
**Type:** CRM support configuration — **MEDIUM priority**

---

## 📋 Overview

| DataTable | Model | Complexity | Columns | Key Feature |
|-----------|-------|------------|---------|-------------|
| `LeadActivityDataTable` | `LeadLog` | LOW | 5 (id, description, current_status, activity, assignee, date) | Scoped by `leadId` parameter |
| `LeadRulesDataTable` | `LeadRule` | LOW | 4 (id, query, new_status, new_quality, action) | References LeadQuality + LeadStatus |
| `LeadStatesDataTable` | `LeadStatus` | MEDIUM | 7 (name, 5 boolean flags, action) | Inline checkbox toggles via AJAX |

---

## 1. LeadActivityDataTable

### Purpose
Audit log / activity timeline for a single Lead record. Shows all status changes, notes, and actions taken on a lead.

### Key Implementation

```php
// Scoped by lead ID (passed as public property)
public $leadId;

public function query(LeadLog $model): QueryBuilder {
    return $model->newQuery()->where('lead_id', $this->leadId);
}

// Column: description — decoded from JSON details field
->addColumn('description', function (LeadLog $leadLog) {
    $details = $leadLog->details;
    if ($details) {
        $decodedDetails = json_decode($details, true);
        return $decodedDetails['description'] ?? '-';
    }
    return '-';
})

// Column: current_status — N+1 query per row!
->addColumn('current_status', function (LeadLog $leadLog) {
    $statusId = json_decode($leadLog->details, true)['to_status'] ?? null;
    if ($statusId) {
        $leadStatus = LeadStatus::whereId($statusId)->first(); // ⚠️ N+1
        return $leadStatus?->name ?? '-';
    }
    return '-';
})

// Column: assignee — N+1 query per row!
->addColumn('assignee', function (LeadLog $leadLog) {
    $user = User::whereId($leadLog->user_id)->first(); // ⚠️ N+1
    return $user?->name ?? '-';
})
```

### Columns (6 total)

| Column | Source | Notes |
|--------|--------|-------|
| `id` | Direct | Row ID |
| `description` | JSON decode of `details` | JSON blob field |
| `current_status` | N+1 LeadStatus lookup | From `details['to_status']` |
| `activity` | Direct | Activity type |
| `assignee` | N+1 User lookup | From `user_id` |
| `created_at` | Formatted | `Y-m-d H:i:s` |

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — Any user can see any lead's activity |
| 2 | ⚠️ HIGH | **N+1 queries** — LeadStatus and User loaded per row |
| 3 | ⚠️ HIGH | **JSON blob** — `details` field stores structured data as JSON string |
| 4 | ⚠️ MEDIUM | **Commented-out action column** — Dead code |
| 5 | ⚠️ MEDIUM | **Double JSON decode** — Decoded multiple times per row |

---

## 2. LeadRulesDataTable

### Purpose
Manages automated lead routing/assignment rules. Each rule has a query condition, and defines what status + quality to apply when matched.

### Key Implementation

```php
public function query(LeadRule $model): QueryBuilder {
    return $model->newQuery(); // ⚠️ No auth, no scoping
}

// N+1 lookups for display
->addColumn('new_quality', function ($row) {
    $quality = LeadQuality::findOrFail($row->new_quality); // ⚠️ N+1
    return $quality ? $quality->name : '-';
})
->addColumn('new_status', function ($row) {
    $status = LeadStatus::findOrFail($row->new_status); // ⚠️ N+1
    return $status ? $status->name : '-';
})
```

### Columns (5 total)

| Column | Source | Notes |
|--------|--------|-------|
| `id` | Direct | Row ID |
| `query` | Direct | Rule query/condition string |
| `new_status` | N+1 LeadStatus lookup | |
| `new_quality` | N+1 LeadQuality lookup | |
| `action` | Blade view | `admin.lead-rules.action` |

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All rules visible to all users |
| 2 | ⚠️ HIGH | **N+1 queries** — LeadQuality and LeadStatus per row |
| 3 | ⚠️ HIGH | **`findOrFail` in loop** — Throws 404 on orphaned FK |
| 4 | ⚠️ MEDIUM | **Hardcoded view** — `admin.lead-rules.action` |
| 5 | ⚠️ MEDIUM | **Typo in table ID** — `lead-ruless-table` (double s) |
| 6 | ℹ️ LOW | **`query` column** — No indication of query language/format |

---

## 3. LeadStatesDataTable

### Purpose
Manages lead status workflow states (e.g., "New", "In Negotiation", "Converted", "Closed"). Each state has 5 boolean flags that control CRM behavior, toggled inline via AJAX checkboxes.

### Key Implementation

```php
public function query(LeadStatus $model): QueryBuilder {
    return $model->newQuery(); // ⚠️ No auth
}

// Inline AJAX checkbox toggle (5 boolean columns)
private function getBoolean(LeadStatus $leadState, string $column) {
    $checked = $leadState->$column ? 'checked' : '';
    return <<<HTML
    <label class="switch switch-success">
        <input type="checkbox"
               class="switch-input toggle-checkbox"
               name="{$column}"
               data-field="{$column}"
               value="{$leadState->$column}"
               {$checked}>
        ...
    </label>
    HTML;
}

// AJAX toggle endpoint (hardcoded)
$changeResetAssignee = $this->dataTableService->generateCheckboxToggleScript(
    $table,
    [2,3,4,5,6],                        // ⚠️ Magic column indices
    '/admin/lead-states/toggle-field',   // ⚠️ Hardcoded endpoint
    'Check modificato con successo!',    // ⚠️ Italian string
    'Rilevato problema nel cambio del check.' // ⚠️ Italian string
);
```

### Columns (7 total)

| Column | Type | Notes |
|--------|------|-------|
| `name` | Direct | Status name |
| `reset_assignee` | Boolean toggle | Checkbox via inline HTML |
| `closed` | Boolean toggle | Checkbox via inline HTML |
| `converted` | Boolean toggle | Checkbox via inline HTML |
| `is_worked` | Boolean toggle | Checkbox via inline HTML |
| `in_negotiation` | Boolean toggle | Checkbox via inline HTML |
| `action` | Blade view | `components.custom.datatables.actions.leads.states.btn-actions` |

### Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **No authorization** — All users can toggle critical CRM workflow flags |
| 2 | ⚠️ HIGH | **Magic column indices** — `[2,3,4,5,6]` break on column reorder |
| 3 | ⚠️ HIGH | **Hardcoded AJAX endpoint** — `/admin/lead-states/toggle-field` |
| 4 | ⚠️ HIGH | **GET request for mutation** — Toggling via GET is a CSRF risk |
| 5 | ⚠️ MEDIUM | **Italian UI strings** — Not localizable |
| 6 | ⚠️ MEDIUM | **Wrong export filename** — Returns `'Destinations_...'` (copy-paste bug) |
| 7 | ⚠️ MEDIUM | **Hardcoded view** — `components.custom.datatables.actions.leads.states.btn-actions` |
| 8 | ℹ️ LOW | **`LeadState` model imported but `LeadStatus` used** — Dead import |

---

## Migration to Base44

### Entities Needed

```json
// LeadLog entity (activity trail)
{
  "name": "LeadLog",
  "properties": {
    "lead_id": { "type": "string" },
    "user_id": { "type": "string" },
    "activity": { "type": "string" },
    "description": { "type": "string" },
    "to_status_id": { "type": "string" },
    "details": { "type": "object" }  // structured, not JSON blob
  }
}

// LeadRule entity
{
  "name": "LeadRule",
  "properties": {
    "query": { "type": "string" },
    "description": { "type": "string" },
    "new_status_id": { "type": "string" },
    "new_quality": { "type": "string", "enum": ["BRONZE", "SILVER", "GOLD"] },
    "is_active": { "type": "boolean", "default": true },
    "priority": { "type": "integer" }
  }
}

// LeadStatus entity
{
  "name": "LeadStatus",
  "properties": {
    "name": { "type": "string" },
    "color": { "type": "string" },
    "reset_assignee": { "type": "boolean", "default": false },
    "closed": { "type": "boolean", "default": false },
    "converted": { "type": "boolean", "default": false },
    "is_worked": { "type": "boolean", "default": false },
    "in_negotiation": { "type": "boolean", "default": false },
    "sort_order": { "type": "integer" }
  }
}
```

### Backend Functions

```typescript
// functions/getLeadActivity.js — admin or assigned seller only
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId } = await req.json();
  if (!leadId) return Response.json({ error: 'Missing leadId' }, { status: 400 });

  const logs = await base44.entities.LeadLog.filter(
    { lead_id: leadId },
    '-created_date',
    100
  );

  return Response.json({ data: logs });
});

// functions/toggleLeadStatusFlag.js — admin only
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { statusId, field } = await req.json();
  const allowedFields = ['reset_assignee', 'closed', 'converted', 'is_worked', 'in_negotiation'];
  if (!allowedFields.includes(field)) return Response.json({ error: 'Invalid field' }, { status: 400 });

  const status = await base44.entities.LeadStatus.get(statusId);
  await base44.entities.LeadStatus.update(statusId, { [field]: !status[field] });

  return Response.json({ success: true });
});
```

### Key Improvements

1. **Admin authorization** on all write operations
2. **`details` as structured object** — no more JSON blob decode
3. **Eager loading** — eliminate N+1 (load status/user with logs)
4. **Named field toggles** — no magic column indices
5. **POST/PATCH for mutations** — CSRF-safe
6. **Correct export filenames** — fix `Destinations_` copy-paste bugs
7. **Localized UI strings** — no hardcoded Italian
8. **LeadRule priority field** — enables ordered rule evaluation
9. **LeadStatus color field** — used for badge display in LeadsDataTable

---

## Summary

Three CRM support DataTables for managing lead workflow configuration:

- **LeadActivityDataTable**: Scoped audit log per lead. CRITICAL: no auth. HIGH: N+1 (User + LeadStatus per row), JSON blob abuse.
- **LeadRulesDataTable**: Automated routing rules. CRITICAL: no auth. HIGH: N+1 + `findOrFail` in loop. MEDIUM: typo in table ID `lead-ruless-table`.
- **LeadStatesDataTable**: Workflow state flags with inline AJAX checkboxes. CRITICAL: no auth on CRM workflow toggles. HIGH: magic indices, hardcoded endpoint, GET for mutation. MEDIUM: Italian strings, wrong export filename.

**Migration priority: MEDIUM** — Auth gap is critical but these are admin-only config tables used infrequently. LeadStatesDataTable has highest risk due to inline mutation without CSRF protection.