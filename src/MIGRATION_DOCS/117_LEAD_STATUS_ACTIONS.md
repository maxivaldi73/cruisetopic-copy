# LeadStatus Action Classes (1 file)

**Directory:** `App/Actions/Lead/Status/`  
**Namespace:** `App\Actions\Lead\Status`  
**Type:** Single-responsibility action class (Laravel Actions pattern)  
**Priority:** MEDIUM — CRM lead workflow; guards against orphaned status deletion

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `DestroyLeadStatus` | `destroy(LeadStatus $leadState)` | Delete a LeadStatus with relational guard — blocks deletion if Leads are attached |

---

## 🔧 Implementation

```php
class DestroyLeadStatus
{
    public function destroy(LeadStatus $leadState) {
        try {
            // Guard: block deletion if LeadStatus is in use
            if ($leadState->leads()->count() > 0) {
                return (new AlertService())->alertRelazioniEsistenti('lead-states.index');
                // ✅ Correct relational guard — prevents orphaning Leads that reference this status
                // ⚠️ Uses ->count() > 0 instead of ->exists() — same inefficiency as DestroyQuoteStatus
                // ⚠️ AlertService instantiated with `new` — not injected
            }

            $leadState->delete();  // ⚠️ Hard delete — no soft delete / audit trail
            return (new AlertService())->alertOperazioneEseguita('lead-states.index');

        } catch (\Exception $e) {
            Log::error('leadState ', [$e]);
            // ✅ Exception IS logged (unlike DestroyPort which swallows it entirely)
            // ⚠️ Log message 'leadState ' too vague — no $leadState->id or name context
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante la cancellazione dello stato'
                // ⚠️ Italian error message
            );
        }
    }
}
```

**Dead import:** `use App\Models\User\User;` — imported but never referenced in the class body. No user-scoping or ownership check is performed.

---

## 🔄 Structural Comparison with `DestroyQuoteStatus`

This class is **nearly identical** to `DestroyQuoteStatus` (`109_QUOTE_STATUS_ACTIONS.md`):

| Aspect | `DestroyLeadStatus` | `DestroyQuoteStatus` |
|--------|---------------------|----------------------|
| Relation guard | `$leadState->leads()->count() > 0` | `$quoteStatus->quotes()->count() > 0` |
| Guard alert | `alertRelazioniEsistenti` | `alertRelazioniEsistenti` |
| Redirect | `'lead-states.index'` | `'quote-statuses.index'` |
| Exception logging | ✅ `Log::error('leadState ', [$e])` | ✅ `Log::error('quoteStatus ', [$e])` |
| Dead import | ✅ `User` (unused) | ❌ None |
| Hard delete | ✅ Yes | ✅ Yes |
| Auth check | ❌ Missing | ❌ Missing |

The only meaningful differences are the model name and redirect route. Both share the same `->count() > 0` inefficiency and vague log messages.

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **`->count() > 0` instead of `->exists()`** — unnecessary full COUNT aggregate; `->exists()` short-circuits at first row |
| 2 | ⚠️ MEDIUM | **Dead `User` import** — `use App\Models\User\User` imported but never used; suggests user ownership check was planned but never implemented |
| 3 | ⚠️ MEDIUM | **Hard delete** — no soft delete; deleted LeadStatus names removed from historical lead records |
| 4 | ⚠️ MEDIUM | **`AlertService` instantiated with `new`** — not container-resolved |
| 5 | ⚠️ MEDIUM | **No authorization check** — any authenticated user can delete any LeadStatus |
| 6 | ⚠️ MEDIUM | **Log message `'leadState '` too vague** — should include `$leadState->id` and name |
| 7 | ℹ️ LOW | **Italian error message** |
| 8 | ℹ️ LOW | **Parameter name mismatch** — method param is `$leadState` but model class is `LeadStatus` — minor naming confusion |

---

## 📝 Migration to Base44

### LeadStatus as entity

`LeadStatus` (also referred to as `LeadState` in route names) is a user-configurable CRM lookup table defining the stages in the lead workflow pipeline.

```json
{
  "name": "LeadStatus",
  "properties": {
    "name":     { "type": "string" },
    "color":    { "type": "string", "description": "Hex color for pipeline badge" },
    "order":    { "type": "integer", "description": "Display order in pipeline" },
    "is_final": { "type": "boolean", "default": false, "description": "Terminal state (won/lost)" }
  },
  "required": ["name"]
}
```

### `DestroyLeadStatus` → Backend function with relation guard

```typescript
// functions/deleteLeadStatus.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { leadStatusId } = await req.json();

  // Relation guard: check if any Lead references this status
  const leads = await base44.asServiceRole.entities.Lead.filter({ status_id: leadStatusId });
  if (leads.length > 0) {
    return Response.json({
      error: `Cannot delete: ${leads.length} lead(s) are assigned to this status`,
      count: leads.length
    }, { status: 409 });
  }

  await base44.asServiceRole.entities.LeadStatus.delete(leadStatusId);
  return Response.json({ success: true });
});
```

### Frontend

```tsx
const handleDelete = async (statusId: string) => {
  const res = await base44.functions.invoke('deleteLeadStatus', { leadStatusId: statusId });
  if (res.data.error) {
    toast({ title: 'Cannot delete', description: res.data.error, variant: 'destructive' });
  } else {
    toast({ title: 'Status deleted' });
    refetch();
  }
};
```

---

## Summary

**`Actions/Lead/Status/DestroyLeadStatus`** (20 lines): Deletes a `LeadStatus` with a relational guard — if any Lead still references the status, deletion is blocked via `alertRelazioniEsistenti`. Exception is logged (good), but log message is too vague. Dead import of `User` suggests ownership-scoped deletion was planned but never implemented. Structurally near-identical to `DestroyQuoteStatus` — same guard pattern, same `->count() > 0` inefficiency, same Italian messages, same missing auth check.

**Migration priority: MEDIUM** — straightforward admin-only backend function with Lead relation guard; same pattern as `deleteQuoteStatus`.