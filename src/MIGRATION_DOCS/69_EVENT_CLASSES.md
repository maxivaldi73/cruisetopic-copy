# Event Classes (Domain Events)

**Purpose:** Domain events for CRM operations (leads, quotes, tasks, tickets, reviews, users).  
**Namespace:** `App\Events`  
**Location:** `App/Events/` (10 files)  
**Type:** Event-driven architecture — medium priority

---

## 📋 Overview

| Event | Domain | Type | Size | Status |
|-------|--------|------|------|--------|
| LeadAssigned | CRM | Stub | 0.5 KB | ⚠️ No data |
| LeadStageChanged | CRM | Stub | 0.5 KB | ⚠️ No data |
| LeadCreated | CRM | Complete | 0.6 KB | ✅ Good |
| QuoteCreated | CRM | Stub | 0.5 KB | ⚠️ No data |
| QuoteStatusChanged | CRM | Stub | 0.5 KB | ⚠️ No data |
| QuoteUpdated | CRM | Complete | 0.5 KB | ✅ Good |
| ReviewSaved | Review | Complete | 0.6 KB | ⚠️ Untyped |
| TicketAssigned | Support | Complete | 0.3 KB | ✅ Good |
| TaskSaved | Task | Complete | 0.8 KB | ⚠️ Action enum |
| UserRoleChangedEvent | Admin | Complete | 0.3 KB | ✅ Good |

---

## 🔧 Event Classes Detailed

### Stub Events (No Data Passed)

**LeadAssigned, LeadStageChanged, QuoteCreated, QuoteStatusChanged**

```php
class LeadAssigned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct()
    {
        // NO DATA PASSED!
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 HIGH | **Empty constructor** — No event data passed | Listeners can't identify entity |
| 2 | ⚠️ HIGH | **Hardcoded 'channel-name'** — Not dynamic, all events on same channel | Inefficient broadcasts |
| 3 | ⚠️ HIGH | **Broadcasting unused** — Fires events but no listeners defined | Event sinks |
| 4 | ⚠️ MEDIUM | **ShouldBroadcast not implemented** — Implements but doesn't extend interface | Inconsistent |
| 5 | ℹ️ LOW | **Unused imports** — PresenceChannel, InteractsWithSockets not needed | Code smell |

---

### Complete Events (With Data)

#### LeadCreated (0.6 KB)

```php
class LeadCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $lead;

    public function __construct(Lead $lead)
    {
        $this->lead = $lead;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
```

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **Hardcoded 'channel-name'** |
| 2 | ⚠️ MEDIUM | **Untyped property** — `public $lead` instead of typed `public Lead $lead` |
| 3 | ⚠️ MEDIUM | **No broadcast data** — No `broadcastWith()` method |

---

#### QuoteUpdated (0.5 KB)

```php
class QuoteUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Quote $quote; // ✅ Typed property

    public function __construct(Quote $quote)
    {
        $this->quote = $quote;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
```

**Good:**
- ✅ Typed property (modern PHP)
- ✅ Constructor with data

**Issues:**
- ⚠️ Hardcoded 'channel-name'
- ⚠️ No broadcastWith()

---

#### ReviewSaved (0.6 KB)

```php
class ReviewSaved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $review;    // ⚠️ Untyped
    public $isNew;     // ⚠️ Untyped

    public function __construct($review, $isNew)
    {
        $this->review = $review;
        $this->isNew = $isNew;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
```

**Issues:**
- ⚠️ Both properties untyped
- ⚠️ Hardcoded channel
- ⚠️ No broadcastWith()

---

#### TicketAssigned (0.3 KB) ✅

```php
class TicketAssigned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public bool $isReassignment = false
    ) {
    }
}
```

**Good:**
- ✅ Constructor property promotion (modern PHP 8)
- ✅ Typed properties
- ✅ Default value
- ✅ Clean & concise
- ✅ No unnecessary broadcasting

---

#### TaskSaved (0.8 KB)

```php
class TaskSaved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Task $task;
    public string $action; // 'created' o 'updated' — ⚠️ Should be enum
    public array $originalData;

    public function __construct(Task $task, string $action, array $originalData = [])
    {
        $this->task = $task;
        $this->action = $action;
        $this->originalData = $originalData;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
```

**Good:**
- ✅ Typed properties
- ✅ Tracks original data for diffs
- ✅ Action metadata

**Issues:**
- ⚠️ Action as string (should be enum)
- ⚠️ Hardcoded channel
- ⚠️ No broadcastWith()
- ⚠️ Italian comment ('o' instead of 'or')

---

#### UserRoleChangedEvent (0.3 KB) ✅

```php
class UserRoleChangedEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public array $roles
    ) {
    }
}
```

**Good:**
- ✅ Constructor property promotion
- ✅ Typed properties
- ✅ Clean & simple
- ✅ No unnecessary broadcasting

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 HIGH | 7 | 4 empty constructors (no data), 6 hardcoded channels, broadcasting unused |
| ⚠️ MEDIUM | 12 | Untyped properties (3×), no broadcastWith(), hardcoded language, action string not enum |
| ℹ️ LOW | 5 | Unused imports, inconsistent naming, code smell |

---

## 📝 Migration Notes for Base44

### Strategy: Event Sourcing + Audit Trail

**Step 1: Create Event Log Entity**

```json
// entities/EventLog.json
{
  "event_type": {"type": "string"},
  "entity_type": {"type": "string"},
  "entity_id": {"type": "string"},
  "user_id": {"type": "string"},
  "data": {"type": "object"},
  "action": {"type": "string"},
  "timestamp": {"type": "string", "format": "date-time"}
}
```

**Step 2: Backend Functions**

**Function: emitEvent**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  const { event_type, entity_type, entity_id, data, action } = await req.json();

  if (!event_type || !entity_type || !entity_id) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Create event log for audit trail
    const eventLog = await base44.entities.EventLog.create({
      event_type,
      entity_type,
      entity_id,
      user_id: user?.id || null,
      data,
      action,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to listeners (real-time subscriptions)
    // In Base44, use websocket subscriptions or webhooks
    
    return Response.json({ 
      success: true, 
      event_id: eventLog.id,
      timestamp: eventLog.timestamp 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

**Function: getEventHistory**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entity_type, entity_id } = await req.json();

  const events = await base44.entities.EventLog.filter({
    entity_type,
    entity_id,
  }, '-timestamp', 100);

  return Response.json({ events });
});
```

**Step 3: Entity Automation (on Lead/Quote creation)**

```typescript
// Set up automation to trigger emitEvent on create/update
create_automation({
  automation_type: 'entity',
  name: 'Log Lead Creation',
  function_name: 'emitEvent',
  entity_name: 'Lead',
  event_types: ['create'],
  function_args: {
    event_type: 'LeadCreated',
    entity_type: 'Lead',
  },
})
```

**Step 4: React Event Listener/Timeline**

```tsx
// components/EventTimeline.jsx
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';

export function EventTimeline({ entityType, entityId }) {
  const { data } = useQuery({
    queryKey: ['events', entityType, entityId],
    queryFn: () =>
      base44.functions.invoke('getEventHistory', {
        entity_type: entityType,
        entity_id: entityId,
      }),
  });

  const events = data?.data?.events || [];

  return (
    <div className="space-y-2">
      <h3 className="font-bold">Event History</h3>
      {events.map((event) => (
        <Card key={event.id} className="p-3">
          <p className="text-sm font-semibold">{event.event_type}</p>
          <p className="text-xs text-gray-500">{event.action}</p>
          <p className="text-xs text-gray-400">
            {new Date(event.timestamp).toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
```

### Key Improvements

1. **Fix Empty Constructors** — All events carry entity data
2. **Dynamic Channels** — Use entity_id, not hardcoded names
3. **Type Safety** — All properties typed (or use enums)
4. **Audit Trail** — EventLog entity captures all changes
5. **Real-time** — Websocket subscriptions instead of Laravel broadcasting
6. **Event Sourcing** — Full history of all domain events
7. **Action Enums** — TaskSaved.action as ActionType enum
8. **broadcastWith()** — Explicit data sent to listeners
9. **Clean Events** — Only include necessary traits (TicketAssigned pattern)
10. **Consistency** — All events follow same pattern

### Event Class Pattern (Recommended)

```typescript
// Example: Create as entity automations, not Laravel events

// Instead of LeadAssigned class, use automation:
{
  automation_type: 'entity',
  entity_name: 'Lead',
  event_types: ['update'],
  trigger_conditions: {
    conditions: [
      { field: 'changed_fields', operator: 'contains', value: 'assigned_to' }
    ]
  },
  function_name: 'emitLeadAssignedEvent'
}

// Backend function:
async function emitLeadAssignedEvent(event) {
  const { entity_id, data } = event;
  await base44.functions.invoke('emitEvent', {
    event_type: 'LeadAssigned',
    entity_type: 'Lead',
    entity_id,
    data: {
      assigned_to: data.assigned_to,
      previous_assignee: event.old_data?.assigned_to,
    },
    action: 'assigned',
  });
}
```

---

## Summary

10 event classes for CRM domain: 4 are stubs with empty constructors (LeadAssigned, LeadStageChanged, QuoteCreated, QuoteStatusChanged), 6 carry entity data (LeadCreated, QuoteUpdated, ReviewSaved, TicketAssigned, TaskSaved, UserRoleChangedEvent). Issues: empty constructors (can't identify entities), hardcoded 'channel-name' (all events broadcast to same channel), unused broadcasting/listeners, untyped properties (3 classes), action as string not enum, unnecessary imports, inconsistent patterns (TicketAssigned/UserRoleChangedEvent clean, others verbose).

In Base44: Create EventLog audit entity, backend functions (emitEvent, getEventHistory), replace Laravel events with entity automations + functions, React event timeline/history UI, remove hardcoded channels (use entity-based subscriptions), add type safety, implement event sourcing pattern for full audit trail, use constructor property promotion consistently.

**Migration Priority: MEDIUM** — event-driven architecture for CRM (leads, quotes), but not critical; mostly stubs needing data; easy refactoring to automations + backend functions.