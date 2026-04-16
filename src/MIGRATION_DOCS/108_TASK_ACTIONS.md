# Task Action Classes (2 files)

**Directory:** `App/Actions/Task/`  
**Namespace:** `App\Actions\Task`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — CRM task management (create/update/delete activities linked to Leads and Quotes)

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `DestroyTask` | `destroy(Task $task)` | Hard-delete a task, redirect to parent Lead |
| `SaveTask` | `save(Request $request)` | Create or update a Task (upsert), fire `TaskSaved` event, redirect to polymorphic subject |

---

## 🔧 Implementation

### 1. `DestroyTask`

```php
class DestroyTask
{
    public function destroy(Task $task) {
        try {
            $task->delete();  // ⚠️ Hard delete — no soft delete / audit trail
            return (new AlertService())->alertOperazioneEseguita('leads.show', $task->subject_id);
            // ⚠️ Hardcoded redirect to 'leads.show' — assumes subject is always a Lead
            //    If task belongs to a Quote, redirect is wrong (sends to leads.show with quote ID)
            // ⚠️ AlertService instantiated with `new` — not injected
        } catch (\Exception $e) {
            Log::error('task ', [$e]);  // ✅ Exception is logged (unlike DestroyUser)
            // ⚠️ Log message is just 'task ' — not descriptive; no task ID or subject info
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante la cancellazione del task'  // ⚠️ Italian
            );
        }
    }
}
```

**Key finding:** `DestroyTask` hardcodes `'leads.show'` for the redirect — but `SaveTask` (below) uses `$subject->redirectRoute()` for dynamic routing. This inconsistency means deleting a task that belongs to a Quote incorrectly redirects to `leads.show` with the Quote's ID.

**Dead import:** `use App\Models\LeadStatus;` — imported but never used.

---

### 2. `SaveTask`

Handles both **create** (new Task) and **update** (existing Task) via `$request->id` presence check.

```php
class SaveTask
{
    public function save(Request $request) {
        try {
            // 1. Normalize subject_type — frontend sends mangled namespace strings
            $subjectType = str_replace('AppModelsLead', 'App\Models\Lead', $request->subject_type);
            $subjectType = str_replace('AppModelsQuoteQuote', 'App\Models\Quote\Quote', $subjectType);
            // ⚠️ Fragile string replacement — relies on frontend sending exact mangled strings
            //    e.g. 'AppModelsLead' → 'App\Models\Lead'
            //         'AppModelsQuoteQuote' → 'App\Models\Quote\Quote'
            // ⚠️ If frontend sends a different format (e.g. URL-encoded, different separator),
            //    the replacement silently fails → wrong subject_type stored in DB

            // 2. Upsert: find existing or create new
            $task = $request->id ? Task::findOrFail($request->id) : new Task();
            $originalData = $task->getOriginal();  // ✅ captures pre-save state for event diff

            // 3. Normalize 'completed' checkbox (absent = 0, present = 1)
            $request->merge([
                'completed' => $request->has('completed') ? 1 : 0
            ]);
            // ⚠️ Mutating the Request object — side effect; better to handle in $validated directly

            // 4. Validate
            $validated = $request->validate([
                'subject_type'  => 'required|string',
                'subject_id'    => 'required|integer',
                'title'         => 'nullable|string|max:255',
                'description'   => 'nullable|string',
                'due_date'      => 'nullable|date',
                'activity_type' => 'required|in:call_back,email_send,follow_up,send_proposal,
                                        review_quote,request_documents,internal_note,
                                        check_payment,customer_feedback,other',
                'completed'     => 'nullable|boolean',
                'assignee_id'   => 'nullable|exists:users,id',
            ]);
            // ✅ Comprehensive validation including enum check for activity_type
            // ✅ assignee_id validated against users table
            // ⚠️ 'subject_type' validated only as 'string' — any string accepted,
            //    no check that it maps to a real polymorphic model

            // 5. Override subject_type with normalized value AFTER validation
            $validated['subject_type'] = $subjectType;
            $validated['completed']    = $request->boolean('completed');
            // ⚠️ 'completed' re-assigned after validation — double-processing

            $task->fill($validated);
            $task->save();  // ✅ Single save (not create+update separately)

            // 6. Determine create vs update for event
            $action = $task->wasRecentlyCreated ? 'created' : 'updated';
            event(new TaskSaved($task, $action, $originalData));
            // ✅ Fires TaskSaved event with action type and original data for diff/audit

            // 7. Dynamic redirect to polymorphic subject
            $subject = $task->subject;  // ⚠️ May throw if subject_type is invalid
            return (new AlertService())->alertOperazioneEseguita(
                $subject->redirectRoute(),    // ⚠️ Method must exist on both Lead and Quote models
                $subject->getRouteKey()       // ✅ Standard Laravel polymorphic key
            );
            // ✅ Contrast with DestroyTask which hardcodes 'leads.show' — this is correct

        } catch (\Exception $e) {
            Log::error('subject_type: ' . $request->subject_type, [$e]);
            // ✅ Logs subject_type for debugging context
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante il salvataggio dell\'attività del lead.'
                // ⚠️ Italian; says "lead activity" even when saving a Quote task
            );
        }
    }
}
```

#### `activity_type` Enum Values

```
call_back | email_send | follow_up | send_proposal | review_quote |
request_documents | internal_note | check_payment | customer_feedback | other
```
These map to `ActivityType` enum (documented in `70_ENUM_CLASSES.md`).

#### `TaskSaved` Event (already documented in `69_EVENT_CLASSES.md`)
Payload: `Task $task, string $action ('created'|'updated'), array $originalData`  
Used for audit log, notifications, lead activity timeline.

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | `DestroyTask` | **Hardcoded `'leads.show'` redirect** — if task belongs to a Quote, redirect goes to wrong route with wrong ID |
| 2 | ⚠️ HIGH | `SaveTask` | **Fragile `str_replace` namespace normalization** — silently fails if frontend sends unexpected format; wrong `subject_type` stored in DB |
| 3 | ⚠️ HIGH | `SaveTask` | **`'subject_type'` not validated against allowed models** — any string passes; could store arbitrary class names in polymorphic column |
| 4 | ⚠️ HIGH | `SaveTask` | **`$task->subject` may throw** if `subject_type` normalization failed — no null guard before calling `->redirectRoute()` |
| 5 | ⚠️ MEDIUM | `DestroyTask` | **`LeadStatus` imported but never used** — dead import |
| 6 | ⚠️ MEDIUM | `DestroyTask` | **Hard delete** — no soft delete; task history lost |
| 7 | ⚠️ MEDIUM | `SaveTask` | **Mutates `$request` with `merge()`** — side effect; prefer assigning directly in `$validated` |
| 8 | ⚠️ MEDIUM | `SaveTask` | **`completed` processed twice** — merged into request then re-assigned after validation |
| 9 | ⚠️ MEDIUM | Both | **`AlertService` instantiated with `new`** — not injected |
| 10 | ⚠️ MEDIUM | Both | **All messages in Italian** |
| 11 | ℹ️ LOW | `DestroyTask` | **Log message `'task '` too vague** — should include `$task->id` and `$task->subject_id` |
| 12 | ℹ️ LOW | `SaveTask` | **Error message says "attività del lead"** even for Quote tasks |

---

## 📝 Migration to Base44

### Task Entity Schema

```json
{
  "name": "Task",
  "properties": {
    "subject_type":  { "type": "string", "enum": ["lead", "quote"] },
    "subject_id":    { "type": "string", "description": "ID of related Lead or Quote" },
    "title":         { "type": "string" },
    "description":   { "type": "string" },
    "due_date":      { "type": "string", "format": "date" },
    "activity_type": {
      "type": "string",
      "enum": ["call_back","email_send","follow_up","send_proposal","review_quote",
               "request_documents","internal_note","check_payment","customer_feedback","other"]
    },
    "completed":     { "type": "boolean", "default": false },
    "assignee_id":   { "type": "string", "description": "User ID" }
  }
}
```
> No polymorphic namespace mangling needed — `subject_type` becomes a simple enum `"lead" | "quote"`.

### `SaveTask` → Backend function (to fire event/notification)

```typescript
// functions/saveTask.js
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

const { taskId, ...data } = await req.json();

// Validate subject_type
if (!['lead', 'quote'].includes(data.subject_type)) {
  return Response.json({ error: 'Invalid subject_type' }, { status: 400 });
}

const task = taskId
  ? await base44.asServiceRole.entities.Task.update(taskId, data)
  : await base44.asServiceRole.entities.Task.create(data);

// Fire notification / audit log inline (no separate event system needed)
// e.g. update Lead.last_activity_at, send assignee notification via SendEmail

return Response.json({ success: true, task });
```

### `DestroyTask` → Direct SDK delete + navigate to subject

```tsx
// Frontend: delete task, then navigate based on subject_type
const handleDelete = async (task) => {
  await base44.entities.Task.delete(task.id);
  navigate(task.subject_type === 'lead' ? `/leads/${task.subject_id}` : `/quotes/${task.subject_id}`);
};
```
No backend function needed for simple delete — routing is handled client-side cleanly.

---

## Summary

**`Actions/Task/DestroyTask`** (21 lines): Hard-deletes a Task and redirects to the parent subject. **Critical bug:** redirect hardcoded to `'leads.show'` — if the task belongs to a Quote, the user is redirected to the wrong route. Dead import of `LeadStatus`. Exception logged but log message too vague.

**`Actions/Task/SaveTask`** (58 lines): Upsert action for Tasks linked polymorphically to Lead or Quote. Normalizes mangled frontend namespace strings via fragile `str_replace`, validates input including activity_type enum, fires `TaskSaved` event with pre/post diff, and redirects dynamically via `$subject->redirectRoute()`. **Key issues:** namespace normalization silently fails on unexpected input format storing invalid `subject_type` in DB; `subject_type` not validated against allowed models; `completed` processed twice; `$request->merge()` mutates the request object.

**Migration priority: HIGH** — Task is core CRM functionality. In Base44: replace polymorphic namespace mangling with a simple `subject_type` enum (`"lead"|"quote"`); use a backend function for save (to trigger notifications/audit); use direct SDK delete with client-side subject-aware navigation.