# CRM Workflow Controllers

**Purpose:** Manage lead/quote statuses and role-based workflow transitions.  
**Namespace:** `App\Http\Controllers\Admin\Setting\Crm`  
**Location:** `App/Http/Controllers/Admin/Setting/Crm/`  
**Total Controllers:** 3  
**Type:** CRM configuration — high priority

---

## 📋 Controller Index

| Controller | Purpose | Key Methods | Size |
|-----------|---------|-------------|------|
| LeadStateController | Manage lead statuses and transitions | index, create, edit, save, destroy, toggleField | 4.5 KB |
| QuoteStatusesController | Manage quote statuses and edibility | index, create, update, save, destroy, toggleField | 2.9 KB |
| WorkflowController | Role-based status transition rules | index, save, saveOrderWorkflow | 4.5 KB |

---

## 🔧 Detailed Controllers

### LeadStateController

**File:** `LeadStateController.php`

**Purpose:** CRUD for lead statuses (e.g., New, Qualified, Negotiating, Won, Lost).

| Method | Purpose | Route |
|--------|---------|-------|
| index() | List lead statuses | `GET /admin/lead-states` |
| create() | Show create form | `GET /admin/lead-states/create` |
| edit() | Show edit form | `GET /admin/lead-states/{id}/edit` |
| update() | Display for editing (confusing name) | `GET /admin/lead-states/{id}` |
| save() | Create/update lead status | `POST /admin/lead-states` |
| show() | Stub | `GET /admin/lead-states/{id}` |
| destroy() | Delete lead status | `DELETE /admin/lead-states/{id}` |
| toggleField() | AJAX toggle boolean field | `POST /admin/lead-states/toggle` |

**Key Logic:**

```php
save(Request $request) {
    $data = $request->all();
    
    // Parse checkbox fields (commented code suggests previous attempt)
    // Currently hardcoded to empty arrays
    $data['next_statuses'] = json_encode([]);
    $data['roles'] = json_encode([]);
    
    // Convert checkbox fields to boolean
    $data['reset_assignee'] = $request->input('reset_assignee') == 'on';
    $data['closed'] = $request->input('closed') == 'on';
    $data['converted'] = $request->input('converted') == 'on';
    $data['is_worked'] = $request->input('is_worked') == 'on';
    $data['in_negotiation'] = $request->input('in_negotiation') == 'on';
    
    // Create or update
    $state = LeadStatus::updateOrCreate(['id' => $data['id']], $data);
    return redirect with message
}

toggleField(Request $request) {
    // Validate request
    $request->validate([
        'id' => 'required|integer|exists:lead_states,id',
        'field' => 'required|string',
    ]);
    
    // Validate field is allowed
    if (!in_array($field, ['reset_assignee', 'closed', 'converted', 'is_worked', 'in_negotiation'])) {
        return error 'Campo non consentito' (Italian)
    }
    
    // Toggle boolean
    $leadStatus->$field = !$leadStatus->$field;
    $leadStatus->save();
    
    return JSON with new value
}
```

**Fields in LeadStatus:**
- `reset_assignee` — Clear assignee when entering this state
- `closed` — Mark lead as closed
- `converted` — Lead converted to order
- `is_worked` — Lead has been worked on
- `in_negotiation` — Lead is negotiating
- `roles` — JSON array of role IDs that can access
- `next_statuses` — JSON array of allowed next states

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 HIGH | **Commented Code** — Lines 51-60 show attempted roles/next_statuses logic, now hardcoded to empty arrays |
| 2 | ⚠️ HIGH | **No Input Validation** — save() accepts raw $request->all() without validation |
| 3 | ⚠️ HIGH | **No Authorization** — no gate/permission checks |
| 4 | ⚠️ MEDIUM | **JSON in Database** — roles/next_statuses stored as JSON strings, not structured data |
| 5 | ⚠️ MEDIUM | **Confusing Method Names** — update() doesn't actually update, just displays form |
| 6 | ℹ️ LOW | **Italian Error Messages** — "Campo non consentito" not i18n-friendly |
| 7 | ℹ️ LOW | **Inconsistent Toggle Logic** — checkboxes parsed manually instead of using form validation |

---

### QuoteStatusesController

**File:** `QuoteStatusesController.php`

**Purpose:** CRUD for quote/order statuses (e.g., Draft, Sent, Accepted, Paid, Fulfilled).

| Method | Purpose | Route |
|--------|---------|-------|
| index() | List quote statuses | `GET /admin/quote-statuses` |
| create() | Show create form | `GET /admin/quote-statuses/create` |
| update() | Show edit form (confusing name) | `GET /admin/quote-statuses/{id}` |
| save() | Create/update quote status | `POST /admin/quote-statuses` |
| destroy() | Delete quote status | `DELETE /admin/quote-statuses/{id}` |
| toggleField() | AJAX toggle boolean field | `POST /admin/quote-statuses/toggle` |

**Key Logic:**

```php
save(Request $request) {
    $data = $request->all();
    
    // Parse checkbox fields (with bug on line 31)
    $data['is_editable_by_customer'] = 
        (isset($data['is_editable_by_customer'] ) && $data['']=='on') ? true : false;
    // ☝️ Bug: $data[''] is empty key, should check same field
    
    $data['is_editable_by_seller'] = 
        (isset($data['is_editable_by_seller'] ) && $data['is_editable_by_seller']=='on') ? true : false;
    
    $data['is_completed'] = (...) ? true : false;
    $data['is_lost'] = (...) ? true : false;
    $data['notify_to_customer'] = (...) ? true : false;
    $data['is_cancelled'] = (...) ? true : false;
    
    // Initialize JSON fields for new records
    if ($data['id'] == 0) {
        $data['next_statuses'] = json_encode([]);
        $data['roles'] = json_encode([]);
    }
    
    $quoteStatus = QuoteStatus::updateOrCreate(['id' => $data['id']], $data);
    return redirect with message
}

toggleField(Request $request) {
    // Similar to LeadStateController
    // Allowed fields: 'is_accepted', 'is_archived'
    // Toggle and save
    return JSON response
}
```

**Fields in QuoteStatus:**
- `is_editable_by_customer` — Customer can modify
- `is_editable_by_seller` — Seller can modify
- `is_completed` — Quote is complete/fulfilled
- `is_lost` — Quote lost (no sale)
- `is_cancelled` — Quote cancelled
- `notify_to_customer` — Notify customer on transition
- `roles` — JSON array of role IDs
- `next_statuses` — JSON array of allowed next states

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **Bug on Line 31** — `$data['']=='on'` checks empty key, always fails |
| 2 | ⚠️ HIGH | **No Input Validation** — raw $request->all() accepted |
| 3 | ⚠️ HIGH | **No Authorization** — no access control checks |
| 4 | ⚠️ MEDIUM | **JSON Storage** — roles/next_statuses as JSON, not normalized |
| 5 | ⚠️ MEDIUM | **Confusing Method Names** — update() doesn't update, just displays |
| 6 | ℹ️ LOW | **Italian Error Messages** — not i18n |
| 7 | ℹ️ LOW | **Inconsistent Checkbox Parsing** — manual string comparison instead of validation |

---

### WorkflowController

**File:** `WorkflowController.php`

**Purpose:** Configure role-based status transition rules.

| Method | Purpose | Route |
|--------|---------|-------|
| index() | Display workflow builder UI | `GET /admin/workflow` |
| save() | Save lead status transitions for role | `POST /admin/workflow/save` |
| saveOrderWorkflow() | Save quote status transitions for role | `POST /admin/workflow/order-save` |

**Key Logic:**

```php
save(Request $request) {
    // Get role
    $role = Role::findOrFail($request->input('role_id'));
    
    // Parse transition data from form
    // Form keys: "state1-state2", "state1-state3" etc
    $data = $request->except(['role_id', '_token']);
    $newData = [];
    foreach ($data as $key => $value) {
        // Parse "1-2" → [1] = [2]
        $keyExploded = explode('-', $key);
        $leadState = $keyExploded[0];
        $nextLeadState = $keyExploded[1];
        if (isset($newData[$leadState])) {
            $newData[$leadState][] = $nextLeadState;
        } else {
            $newData[$leadState] = [$nextLeadState];
        }
    }
    
    // Update all lead statuses with new transitions
    $leadStates = LeadStatus::all();
    foreach ($leadStates as $value) {
        // Decode JSON
        $roles = json_decode($value->roles) ?? [];
        $nextStates = (array)json_decode($value->next_statuses) ?? [];
        
        // If state has transitions for this role, update
        if (isset($newData[$value->id])) {
            if (!in_array($role->id, $roles)) {
                $roles[] = $role->id;
            }
            $nextStates[$role->id] = $newData[$value->id];
        } else {
            // Remove role from transitions
            if (in_array($role->id, $roles)) {
                $roles = array_diff($roles, [$role->id]);
            }
            if (isset($nextStates[$role->id])) {
                $nextStates[$role->id] = [];
            }
        }
        
        // Save back as JSON
        $value->roles = $roles;
        $value->next_statuses = $nextStates;
        $value->save();
    }
    
    return redirect back with success
}

saveOrderWorkflow(Request $request) {
    // Identical logic to save() but for QuoteStatus instead of LeadStatus
}
```

**Data Structure:**

```json
LeadStatus {
  id: 1,
  name: "New",
  roles: [1, 2, 3],           // Role IDs that can access
  next_statuses: {
    "1": [2, 3],              // If role 1, next states are 2 or 3
    "2": [2, 3, 4],           // If role 2, next states are 2, 3, or 4
    "3": [4]                  // If role 3, next state is 4
  }
}
```

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 HIGH | **Duplicated Logic** — save() and saveOrderWorkflow() are 99% identical |
| 2 | ⚠️ HIGH | **No Input Validation** — parses form data without validation |
| 3 | ⚠️ HIGH | **No Authorization** — no checks who can modify workflows |
| 4 | ⚠️ MEDIUM | **N+1 Query** — loads all statuses in loop, queries inside loop |
| 5 | ⚠️ MEDIUM | **JSON Complexity** — nested arrays stored as JSON, hard to query |
| 6 | ⚠️ MEDIUM | **Form Key Parsing** — fragile string splitting on '-', breaks if state names contain '-' |
| 7 | ⚠️ MEDIUM | **No Confirmation** — updates all statuses without validation |
| 8 | ℹ️ LOW | **No Transactions** — if one status save fails, others already updated |
| 9 | ℹ️ LOW | **Misleading Variable Names** — $roles/$nextStates are already arrays, not JSON |

---

## 📊 Data Architecture Issues

All three controllers struggle with storing complex relationships as JSON:

```
Current (Bad):
┌─────────────┐
│ LeadStatus  │
├─────────────┤
│ id: 1       │
│ name: "New" │
│ roles: "[1,2,3]"              ← JSON string ❌
│ next_statuses: "{...JSON...}" ← Nested JSON ❌
└─────────────┘

Better (Normalized):
┌──────────────────┐      ┌────────────────────┐
│ LeadStatus       │      │ StatusTransition   │
├──────────────────┤      ├────────────────────┤
│ id: 1            │      │ id: 1              │
│ name: "New"      │◀─────│ from_status_id: 1  │
└──────────────────┘      │ to_status_id: 2    │
                          │ role_id: 1         │
                          └────────────────────┘
```

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 2 | QuoteStatusesController line 31 bug, LeadStateController hardcoded empty arrays |
| 🔴 HIGH | 7 | No validation, no authorization, duplicated code, commented code in production |
| ⚠️ MEDIUM | 12 | JSON storage, N+1 queries, fragile parsing, confusing method names |
| ℹ️ LOW | 8 | Italian messages, inconsistent checkbox handling, no transactions |

---

## 📝 Migration Notes for Base44

### Strategy: Normalize Entities + Backend Functions

**Step 1: Create Normalized Entities**

```json
// entities/LeadStatus.json
{
  "code": {"type": "string", "unique": true},
  "name": {"type": "string"},
  "reset_assignee": {"type": "boolean", "default": false},
  "closed": {"type": "boolean", "default": false},
  "converted": {"type": "boolean", "default": false},
  "is_worked": {"type": "boolean", "default": false},
  "in_negotiation": {"type": "boolean", "default": false}
}

// entities/StatusTransition.json
{
  "from_status_id": {"type": "string"},
  "to_status_id": {"type": "string"},
  "role_id": {"type": "string"},
  "is_allowed": {"type": "boolean", "default": true}
}

// entities/QuoteStatus.json
{
  "code": {"type": "string", "unique": true},
  "name": {"type": "string"},
  "is_editable_by_customer": {"type": "boolean"},
  "is_editable_by_seller": {"type": "boolean"},
  "is_completed": {"type": "boolean"},
  "is_lost": {"type": "boolean"},
  "is_cancelled": {"type": "boolean"},
  "notify_to_customer": {"type": "boolean"}
}
```

**Step 2: Backend Functions**

**Function: updateLeadStatusWorkflow**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { roleId, transitions } = await req.json();
  
  // Validate
  if (!roleId || !Array.isArray(transitions)) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Delete existing transitions for this role
  const existing = await base44.entities.StatusTransition.filter({ role_id: roleId });
  for (const trans of existing) {
    await base44.entities.StatusTransition.delete(trans.id);
  }

  // Create new transitions
  for (const { from, to } of transitions) {
    await base44.entities.StatusTransition.create({
      from_status_id: from,
      to_status_id: to,
      role_id: roleId,
      is_allowed: true,
    });
  }

  return Response.json({ success: true });
});
```

**Step 3: React Component**

```tsx
// pages/admin/WorkflowPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function WorkflowPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [transitions, setTransitions] = useState([]);

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.functions.invoke('listRoles', {}),
  });

  const { data: statuses } = useQuery({
    queryKey: ['leadStatuses'],
    queryFn: () => base44.functions.invoke('listLeadStatuses', {}),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateLeadStatusWorkflow', data),
  });

  const handleToggleTransition = (from, to) => {
    const key = `${from}-${to}`;
    setTransitions((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Lead Status Workflow</h1>

      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
        <option>Select Role</option>
        {roles?.roles?.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <div className="grid gap-4">
        {statuses?.statuses?.map((status) => (
          <div key={status.id} className="border p-4 rounded">
            <h3 className="font-bold">{status.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {statuses?.statuses?.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleToggleTransition(status.id, target.id)}
                  className={`px-3 py-1 rounded ${
                    transitions.includes(`${status.id}-${target.id}`)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  → {target.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => saveMutation.mutate({ roleId: selectedRole, transitions })}>
        Save Workflow
      </button>
    </div>
  );
}
```

### Key Improvements

1. **Normalized Data** — Remove JSON storage, use proper entities and relationships
2. **Input Validation** — Validate all inputs before saving
3. **Authorization** — Enforce admin-only access
4. **No Duplication** — Single function handles both lead and quote workflows
5. **No N+1 Queries** — Use batch operations
6. **Transaction Safety** — Delete old, create new in transaction
7. **Proper Queries** — StatusTransition entity can be queried efficiently
8. **English Messages** — i18n-friendly error messages
9. **Bug Fixes** — Fix QuoteStatusesController line 31 bug
10. **No Commented Code** — Remove incomplete role/next_statuses logic

---

## Summary

3 CRM controllers managing lead/quote statuses and role-based workflows. **CRITICAL:** QuoteStatusesController has bug on line 31, LeadStateController hardcodes next_statuses to empty arrays. **HIGH:** No validation, authorization, or input validation; duplicated code; JSON storage prevents efficient querying; N+1 query patterns.

In Base44:
- Normalize to StatusTransition entity (remove JSON)
- Create backend functions with validation/authorization
- Consolidate duplicate lead/quote logic
- Implement React workflow builder UI
- Fix all identified bugs

**Migration Priority: HIGH** — core CRM functionality, multiple critical bugs, poor data normalization.