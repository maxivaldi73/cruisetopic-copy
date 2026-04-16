# Comment Action Classes (2 files)

**Directory:** `App/Actions/Comment/`  
**Namespace:** `App\Actions\Comment`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — polymorphic comment system used across Leads, Tickets, and Quotes; `SaveComment` includes customer email notification on Ticket comments

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `DestroyComment` | `destroy(Comment $comment)` | Delete a polymorphic Comment and redirect to its parent entity |
| `SaveComment` | `save(Request $request)` | Create/update a polymorphic Comment with media sync and conditional customer notification |

---

## 🔧 Implementation

### 1. `DestroyComment`

```php
class DestroyComment
{
    public function destroy(Comment $comment)
    {
        try {
            $commentable = $comment->commentable;
            // ✅ Resolves polymorphic parent before deletion — used for redirect
            // ⚠️ No null guard — if commentable is missing (orphaned comment), $commentable is null
            //    and all three instanceof checks fail silently → falls through to alertBackWithError

            $comment->delete();
            // ✅ Hard delete
            // ⚠️ No cascade cleanup — if Comment has media attachments (via Spatie),
            //    physical files may be orphaned on disk

            if ($commentable instanceof \App\Models\Lead) {
                return (new AlertService())->alertOperazioneEseguita('leads.show', ['lead' => $commentable->id]);
            }

            if ($commentable instanceof \App\Models\Ticket) {
                return (new AlertService())->alertOperazioneEseguita('tickets.show', ['ticket' => $commentable->id]);
            }

            if ($commentable instanceof \App\Models\Quote\Quote) {
                return (new AlertService())->alertOperazioneEseguita('quotes.edit', ['quote' => $commentable->id]);
            }
            // ✅ Handles all three known commentable types (Lead, Ticket, Quote)
            // ✅ Better than DestroyDocument — which only handled Lead and returned null for others

            return (new AlertService())->alertBackWithError(
                'Comment deleted, but no redirect target was available.'
            );
            // ✅ Fallback for unknown/null commentable — English message (rare in this codebase!)
            // ⚠️ Mixed language: this fallback is English while the catch block is Italian

        } catch (\Exception $e) {
            \Log::error('Errore durante la cancellazione del commento: ', [$e]);
            // ✅ Exception IS logged (unlike DestroyPort/DestroyDestination which swallowed $e)
            // ⚠️ Italian log message
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante la cancellazione del commento'
                // ⚠️ Italian user-facing error message
            );
        }
    }
}
```

**Comparison to `DestroyDocument`:** `DestroyComment` is significantly better — it handles **all three** polymorphic parent types (Lead, Ticket, Quote) and provides a fallback for unknown types, whereas `DestroyDocument` only handled Lead and silently returned `null` for Quote and Ticket (producing an undefined HTTP response). Exception is also properly logged here.

---

### 2. `SaveComment`

```php
class SaveComment
{
    use DropzoneMediaSyncTrait;

    public function save(Request $request)
    {
        $data = $request->validate([
            'commentable_type' => 'required|string',
            'commentable_id'   => 'required|integer',
            'body'             => 'nullable|string',
            'is_internal'      => ['nullable', 'boolean'],
            'uploaded_media'   => ['nullable', 'array'],
            'uploaded_media.*' => ['string'],
            'id'               => 'nullable|integer',
            'redirect_route'   => 'nullable|string',
            'redirect_param'   => 'nullable|string',
            // ✅ Validates all fields — including media array
            // ✅ redirect_route/redirect_param allow caller to override redirect target
            // ⚠️ 'body' is nullable — a Comment with no body and no media is technically allowed
            // ⚠️ 'commentable_type' validated as string but NOT as an allowlist — IDOR risk (see below)
        ]);

        // Namespace normalization — same fragile pattern as SaveDocument and SaveTask
        $commentableClass = str_replace('AppModelsLead',       'App\Models\Lead',        $data['commentable_type']);
        $commentableClass = str_replace('AppModelsQuoteQuote', 'App\Models\Quote\Quote', $commentableClass);
        $commentableClass = str_replace('AppModelsTicket',     'App\Models\Ticket',      $commentableClass);
        $commentable = $commentableClass::findOrFail($data['commentable_id']);
        // 🔴 CRITICAL IDOR: same vulnerability as SaveDocument — arbitrary class name from user input
        //    resolved to a PHP model without allowlist validation
        //    e.g. POST commentable_type=AppModelsUser → resolves to App\Models\User::findOrFail()
        //    Any model in the application can be instantiated and its ID exposed

        // Edit guard — prevents editing externally-sent Ticket comments
        $existingComment = null;
        if (!empty($data['id'])) {
            $existingComment = Comment::query()->find($data['id']);

            if ($existingComment && $commentable instanceof Ticket && !$existingComment->is_internal) {
                return (new AlertService())->alertBackWithError(
                    'External comments already sent to the customer cannot be edited.'
                );
                // ✅ Business rule: once a Ticket comment is sent to the customer (is_internal=false),
                //    it cannot be edited — preserves the integrity of customer communication history
                // ✅ English message — consistent with the edit context
                // ⚠️ Only enforced for Ticket — Lead/Quote comments can always be edited
            }
        }

        return DB::transaction(function () use ($data, $commentable) {

            // is_internal only meaningful for Tickets — forced false for Lead/Quote
            $isInternal = $commentable instanceof Ticket
                ? (bool) ($data['is_internal'] ?? false)
                : false;
            // ✅ Good guard — prevents is_internal flag leaking to non-Ticket contexts

            $isNewComment = empty($data['id']);

            $comment = $commentable->comments()->updateOrCreate(
                ['id' => $data['id'] ?? null],
                [
                    'body'        => $data['body'] ?? null,
                    'is_internal' => $isInternal,
                    'user_id'     => auth()->id(),
                ]
            );
            // ✅ Correct updateOrCreate — uses ['id' => $data['id'] ?? null] as match key
            //    This is the FIXED version of the SaveDocument bug (which used empty [] as match)
            // ⚠️ When $data['id'] is null, match key is ['id' => null] — Eloquent treats this
            //    as "find a record where id IS NULL" — always creates new, which is correct here
            // ⚠️ No authorization — any user can comment on any Lead/Ticket/Quote

            $this->syncDropzoneMedia($comment, 'uploaded_media', $data['uploaded_media'] ?? []);
            // ✅ Syncs Dropzone-uploaded media per comment — Spatie/Dropzone coupling
            // → Replaced by UploadFile integration in Base44 migration

            // Customer notification — only for NEW, non-internal Ticket comments
            if ($isNewComment && !$comment->is_internal) {
                DB::afterCommit(fn () => $this->sendCustomerNotification($commentable, $comment->fresh('media')));
                // ✅ Uses DB::afterCommit — fires only if the transaction commits successfully
                //    Prevents sending email if the DB write rolls back
                // ✅ $comment->fresh('media') — reloads comment with media after commit (media may
                //    have been attached after the comment was created in the same transaction)
                // ⚠️ Only Ticket comments notify the customer — Lead/Quote comments are internal only
            }

            // Dynamic redirect — caller can override via redirect_route/redirect_param
            $routeName  = $data['redirect_route']  ?? $commentable->redirectRoute();
            $routeParam = $data['redirect_param']   ?? $commentable->getRouteKey();
            // ✅ Flexible redirect — caller can specify destination, fallback to model's default
            // ⚠️ redirect_route is a raw string from user input — unvalidated route name;
            //    could cause an exception if the named route doesn't exist

            return (new AlertService())->alertOperazioneEseguita($routeName, $routeParam);
        });
    }

    private function sendCustomerNotification(object $commentable, Comment $comment): void
    {
        if (!$commentable instanceof Ticket) {
            return;
            // ✅ Guard — only processes Ticket commentables
        }

        $customerEmail = trim((string) $commentable->customer?->email);

        if ($customerEmail === '') {
            return;
            // ✅ Null-safe: skips notification if customer has no email
            // ⚠️ No validation that email is a valid address — trim + empty check only
        }

        Mail::mailer('support')->to($customerEmail)->send(new TicketCommentMail($commentable, $comment));
        // ✅ Uses named 'support' mailer — dedicated SMTP/transport for support emails
        // ⚠️ No try/catch — if Mail fails, the exception propagates through DB::afterCommit
        //    (afterCommit exceptions are typically logged but don't roll back the transaction)
        // ⚠️ No rate limiting — spammy comment creation could flood the customer's inbox
    }
}
```

---

## Pattern Analysis

### Redirect Override Pattern

`SaveComment` introduces a pattern not seen in other Save actions: **caller-specified redirect via `redirect_route` / `redirect_param`**. This allows the same action to be invoked from different contexts (Lead detail, Ticket detail, Quote edit) and redirect back to the originating page without baking the logic into the action class itself. This is a better design than the `SaveTask` approach (which used polymorphic `$subject->redirectRoute()`).

### `updateOrCreate` — Correct vs `SaveDocument`

| Action | Match key | Result |
|--------|-----------|--------|
| `SaveDocument` | `[]` (empty) | **BUG** — always matches first or creates new; ignores `id` |
| `SaveComment` | `['id' => $data['id'] ?? null]` | ✅ **Correct** — updates by ID when provided, creates new when `id` is null |

`SaveComment` correctly fixes the `updateOrCreate` pattern that was broken in `SaveDocument`.

### `DB::afterCommit` Usage

The customer notification is dispatched via `DB::afterCommit` — ensuring the email fires only if the transaction commits. This is a production-correct pattern that prevents sending emails for rolled-back writes.

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | `SaveComment` | **IDOR via arbitrary class resolution** — `commentable_type` resolved to PHP class without allowlist; any model can be instantiated from user input |
| 2 | ⚠️ HIGH | `DestroyComment` | **No cascade media cleanup** — Spatie media attachments orphaned on disk after comment deletion |
| 3 | ⚠️ HIGH | Both | **No authorization check** — any authenticated user can delete or create/edit comments on any entity |
| 4 | ⚠️ MEDIUM | `SaveComment` | **`redirect_route` unvalidated** — raw string from user input; invalid named route causes exception |
| 5 | ⚠️ MEDIUM | `SaveComment` | **No rate limiting on notifications** — rapid comment creation could flood customer inbox |
| 6 | ⚠️ MEDIUM | `SaveComment` | **Mail failure not caught** — `Mail::send` in `afterCommit` can throw; exception logged but not surfaced to user |
| 7 | ⚠️ MEDIUM | Both | **AlertService instantiated with `new`** — not DI-resolved |
| 8 | ⚠️ MEDIUM | `SaveComment` | **Fragile namespace normalization** — manual `str_replace` on class names; same pattern as SaveDocument/SaveTask |
| 9 | ⚠️ MEDIUM | `DestroyComment` | **Mixed language in error messages** — fallback is English, catch block is Italian |
| 10 | ℹ️ LOW | `DestroyComment` | **Hard delete** — no soft delete / audit trail for comment history |
| 11 | ℹ️ LOW | `SaveComment` | **`body` nullable** — allows empty comments with no body (valid only if media is attached, but not enforced) |

---

## 📝 Migration to Base44

### `Comment` Entity Schema

```json
{
  "name": "Comment",
  "type": "object",
  "properties": {
    "parent_type": {
      "type": "string",
      "enum": ["lead", "ticket", "quote"],
      "description": "Commentable entity type — replaces polymorphic commentable_type"
    },
    "parent_id": {
      "type": "string",
      "description": "ID of the parent Lead, Ticket, or Quote"
    },
    "body": {
      "type": "string",
      "description": "Comment text body"
    },
    "is_internal": {
      "type": "boolean",
      "default": false,
      "description": "If true, comment is internal (not sent to customer). Only relevant for Tickets."
    },
    "media_urls": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Uploaded file URLs — replaces Spatie media collection"
    },
    "notification_sent": {
      "type": "boolean",
      "default": false,
      "description": "Whether customer notification email was sent for this comment"
    }
  },
  "required": ["parent_type", "parent_id"]
}
```

### `SaveComment` → Entity SDK + Backend function for notification

```tsx
// Frontend: upload media, save comment, trigger notification
const handleSaveComment = async ({ parentType, parentId, body, isInternal, files, commentId }) => {
  // 1. Upload media files
  const mediaUrls = await Promise.all(
    files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url))
  );

  // 2. Save comment
  const isNew = !commentId;
  if (commentId) {
    await base44.entities.Comment.update(commentId, { body, media_urls: mediaUrls });
  } else {
    const comment = await base44.entities.Comment.create({
      parent_type: parentType,
      parent_id:   parentId,
      body,
      is_internal: parentType === 'ticket' ? isInternal : false,
      media_urls:  mediaUrls,
    });

    // 3. Trigger customer notification for new non-internal Ticket comments
    if (parentType === 'ticket' && !isInternal) {
      await base44.functions.invoke('sendTicketCommentNotification', {
        commentId: comment.id,
        ticketId:  parentId,
      });
    }
  }
};
```

### `sendTicketCommentNotification` Backend function

```typescript
// functions/sendTicketCommentNotification.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { commentId, ticketId } = await req.json();

  const ticket  = await base44.asServiceRole.entities.Ticket.get(ticketId);
  const comment = await base44.asServiceRole.entities.Comment.get(commentId);

  const customerEmail = ticket?.customer_email?.trim();
  if (!customerEmail) return Response.json({ skipped: true, reason: 'no customer email' });

  await base44.integrations.Core.SendEmail({
    to:      customerEmail,
    subject: `New reply on your ticket #${ticket.reference_number ?? ticketId}`,
    body:    comment.body ?? '(no message body)',
  });

  await base44.asServiceRole.entities.Comment.update(commentId, { notification_sent: true });

  return Response.json({ success: true });
});
```

### `DestroyComment` → Frontend + Entity SDK

```tsx
// Frontend: simple delete with navigation
const handleDeleteComment = async (comment) => {
  await base44.entities.Comment.delete(comment.id);
  // No cascade needed — file URLs are in cloud storage (optionally purge via backend function)
  // React Router handles navigation back to parent entity
};
```

### Key Improvements over Legacy

1. **Fix IDOR** — `parent_type` is a validated enum `["lead", "ticket", "quote"]`, not a raw PHP class name
2. **Fix redirect** — React Router `navigate()` handles all parent types; no `redirect_route` string injection
3. **`updateOrCreate` preserved correctly** — `commentId` check mirrors the correct `['id' => $data['id']]` pattern
4. **Notification after commit** — backend function called after entity save (same semantic as `DB::afterCommit`)
5. **`notification_sent` flag** — tracks whether email was sent; enables idempotent retry
6. **Edit guard preserved** — UI disables editing of non-internal Ticket comments that have been sent
7. **Media cleanup** — file URLs in cloud storage; deletion of Comment record is sufficient

---

## Summary

**`Actions/Comment/DestroyComment`** (29 lines): Deletes a polymorphic `Comment` and redirects to its parent entity — **the best-implemented destroy action in the codebase so far**: handles all three commentable types (Lead, Ticket, Quote) with a proper fallback for unknown types, and correctly logs exceptions. Contrast with `DestroyDocument` which silently returned `null` for non-Lead parents. Issues: no cascade media cleanup, no authorization, hard delete, mixed English/Italian error messages.

**`Actions/Comment/SaveComment`** (65 lines): Creates or updates a polymorphic `Comment` with Dropzone media sync and conditional customer email notification. Notable positives: correct `updateOrCreate` with `['id' => ...]` match key (fixes `SaveDocument`'s broken empty-match bug), `DB::afterCommit` for safe post-commit email dispatch, immutable-external-comment guard for Ticket comments, caller-specified redirect override pattern. CRITICAL: same IDOR vulnerability as `SaveDocument` — `commentable_type` resolved to PHP class from user input without an allowlist. Also: `redirect_route` is an unvalidated raw string from user input; Mail failure not caught in afterCommit.

**Migration priority: HIGH** — IDOR vulnerability in `SaveComment` is a critical security fix; customer notification flow (email on new public Ticket comment) is a core business feature that must be preserved. `updateOrCreate` pattern and `DB::afterCommit` semantics should be replicated correctly in the Base44 backend function.

**Total documented: 527 files**