# Quote Status Action Classes (1 file)

**Directory:** `App/Actions/Quote/Status/`  
**Namespace:** `App\Actions\Quote\Status`  
**Type:** Single-responsibility action class (Laravel Actions pattern)  
**Priority:** MEDIUM — CRM quote workflow; guards against orphaned status deletion

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `DestroyQuoteStatus` | `destroy(QuoteStatus $quoteStatus)` | Delete a QuoteStatus with relational guard — blocks deletion if Quotes are attached |

---

## 🔧 Implementation

```php
class DestroyQuoteStatus
{
    public function destroy(QuoteStatus $quoteStatus) {
        try {
            // Guard: block deletion if QuoteStatus is in use
            if ($quoteStatus->quotes()->count() > 0) {
                return (new AlertService())->alertRelazioniEsistenti('quote-statuses.index');
                // ✅ Correct guard — prevents orphaning Quotes that reference this status
                // ✅ Uses dedicated 'alertRelazioniEsistenti' alert (Italian: "existing relations")
                // ⚠️ Uses COUNT query — could use ->exists() for a cheaper single-row check
                // ⚠️ AlertService instantiated with `new` — not injected
            }

            $quoteStatus->delete();  // ⚠️ Hard delete — no soft delete / audit trail
            return (new AlertService())->alertOperazioneEseguita('quote-statuses.index');

        } catch (\Exception $e) {
            Log::error('quoteStatus ', [$e]);
            // ✅ Exception is logged
            // ⚠️ Log message 'quoteStatus ' too vague — no ID or name context
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante la cancellazione dello stato'
                // ⚠️ Italian error message
            );
        }
    }
}
```

### `alertRelazioniEsistenti` context
Based on `AlertService` pattern (documented): sets a flash warning message indicating the record cannot be deleted because related records exist, then redirects to the given route. Consistent with the same guard pattern used in other Action classes (e.g. port/destination deletion guards).

---

## ⚠️ Issues

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **`->count() > 0` instead of `->exists()`** — COUNT(*) fetches a full aggregate; `->exists()` short-circuits at first row — minor but unnecessary overhead |
| 2 | ⚠️ MEDIUM | **Hard delete** — deleting a QuoteStatus removes it from history; soft delete would preserve audit trail |
| 3 | ⚠️ MEDIUM | **`AlertService` instantiated with `new`** — not container-resolved; not testable |
| 4 | ⚠️ MEDIUM | **No authorization check** — any caller can delete any QuoteStatus; relies entirely on caller (controller) to enforce access |
| 5 | ⚠️ MEDIUM | **Log message `'quoteStatus '` too vague** — should include `$quoteStatus->id` and `$quoteStatus->name` |
| 6 | ℹ️ LOW | **All messages in Italian** — `alertRelazioniEsistenti`, error string |
| 7 | ℹ️ LOW | **No return type hint** on `destroy()` |

---

## 📝 Migration to Base44

### QuoteStatus as entity or enum

In Base44, `QuoteStatus` is likely a small lookup table. Two migration options:

**Option A — Enum field on Quote entity** (if statuses are fixed):
```json
"status": {
  "type": "string",
  "enum": ["draft","pending","approved","rejected","expired","converted"]
}
```
→ No `DestroyQuoteStatus` action needed at all.

**Option B — Separate `QuoteStatus` entity** (if statuses are user-configurable):
```json
{
  "name": "QuoteStatus",
  "properties": {
    "name":     { "type": "string" },
    "color":    { "type": "string" },
    "is_final": { "type": "boolean", "default": false }
  }
}
```

### `DestroyQuoteStatus` → Backend function with relation guard

```typescript
// functions/deleteQuoteStatus.js
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

const { quoteStatusId } = await req.json();

// Relation guard: check if any Quote references this status
const quotes = await base44.asServiceRole.entities.Quote.filter({ status_id: quoteStatusId });
if (quotes.length > 0) {
  return Response.json({
    error: 'Cannot delete: this status is assigned to existing quotes',
    count: quotes.length
  }, { status: 409 });
}

await base44.asServiceRole.entities.QuoteStatus.delete(quoteStatusId);
return Response.json({ success: true });
```

### Frontend

```tsx
const handleDelete = async (statusId: string) => {
  const res = await base44.functions.invoke('deleteQuoteStatus', { quoteStatusId: statusId });
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

**`Actions/Quote/Status/DestroyQuoteStatus`** (24 lines): Deletes a `QuoteStatus` with a relational guard — if any Quote still references the status, deletion is blocked via `alertRelazioniEsistenti`. Exception is logged (good), but log message is too vague. Uses `->count() > 0` where `->exists()` would be cheaper. No authorization check; hard delete with no soft-delete trail.

**Migration priority: MEDIUM** — if QuoteStatus becomes a fixed enum in Base44, this action disappears entirely; if statuses remain user-configurable, replace with an admin-only backend function that checks for referencing Quotes before deleting.