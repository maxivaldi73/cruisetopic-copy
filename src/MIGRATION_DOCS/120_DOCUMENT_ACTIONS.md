# Document Action Classes (2 files)

**Directory:** `App/Actions/Document/`  
**Namespace:** `App\Actions\Document`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** HIGH — handles polymorphic document file management across Leads, Quotes, and Tickets

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `DestroyDocument` | `destroy(Document $document)` | Hard-delete a Document record and redirect to parent entity |
| `SaveDocument` | `save(Request $request)` | Create/update Document with category-aware Dropzone media sync across polymorphic owners |

---

## 🔧 Implementation

### 1. `DestroyDocument`

```php
class DestroyDocument
{
    public function destroy(Document $document)
    {
        try {
            $documentable = $document->documentable;
            // ✅ Eager-resolves the polymorphic parent before deletion
            // ⚠️ $documentable fetched but only used if it's a Lead — wasted query for other types

            $document->delete();
            // ⚠️ Hard delete — no soft delete / audit trail
            // ⚠️ No cascade cleanup of attached Spatie media files — physical files orphaned on disk

            if ($documentable instanceof \App\Models\Lead) {
                return (new AlertService())->alertOperazioneEseguita(
                    'leads.show',
                    ['lead' => $documentable->id]
                );
                // ⚠️ Only handles Lead — no redirect logic for Quote or Ticket parents
                // ⚠️ If parent is Quote or Ticket → method returns null (implicit null return)
                //    → caller gets no redirect, no alert — silent failure for non-Lead documents
            }

        } catch (\Exception $e) {
            \Log::error('Errore durante la cancellazione del documento: ', [$e]);
            // ✅ Exception IS logged — better than DestroyPort (which swallowed $e entirely)
            // ⚠️ Italian log message
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante la cancellazione del documento'
                // ⚠️ Italian user-facing error message
            );
        }
    }
}
```

#### Critical Bug: Missing Redirect for Non-Lead Parents

The `if ($documentable instanceof Lead)` check **only redirects for Lead documents**. If the Document belongs to a `Quote` or `Ticket`, the method returns `null` — the HTTP response is undefined. The controller will either throw an error or return a blank response. This is a significant incomplete implementation.

---

### 2. `SaveDocument`

```php
class SaveDocument
{
    use DropzoneMediaSyncTrait;

    public function save(Request $request)
    {
        $data = $request->validate([
            'documentable_type' => 'required|string',
            'documentable_id'   => 'required|integer',
            'description'       => 'nullable|string',
            'contract'          => ['nullable', 'array'],
            'contract.*'        => ['string'],
            'payment-receipt'   => ['nullable', 'array'],
            'payment-receipt.*' => ['string'],
            'identity-document' => ['nullable', 'array'],
            'identity-document.*'=> ['string'],
            'certification'     => ['nullable', 'array'],
            'certification.*'   => ['string'],
            'other-documents'   => ['nullable', 'array'],
            'other-documents.*' => ['string'],
            'id'                => 'nullable|integer',
            // ✅ Validates all 5 document category arrays + description
            // ⚠️ 'id' validated but never used — `updateOrCreate` uses `[]` as match key (see below)
            // ⚠️ Hyphenated keys like 'payment-receipt' are non-standard and error-prone in PHP
        ]);

        // Namespace normalization — converts mangled class names from POST data back to PHP FQCNs
        $documentableClass = str_replace('AppModelsLead', 'App\Models\Lead', $data['documentable_type']);
        $documentableClass = str_replace('AppModelsQuoteQuote', 'App\Models\Quote\Quote', $documentableClass);
        $documentableClass = str_replace('AppModelsTicket', 'App\Models\Ticket', $documentableClass);
        // ⚠️ Manual string replacement — fragile; adding a new polymorphic type requires editing here
        // ⚠️ No allowlist validation — any class name could be submitted and resolved as a model
        //    e.g. POST documentable_type=AppModelsUser → resolves to App\Models\User::findOrFail()
        //    → SECURITY RISK: Arbitrary model instantiation from user input (IDOR-adjacent)
        $documentable = $documentableClass::findOrFail($data['documentable_id']);

        // Per-type category allowlists
        $categories = match ($documentableClass) {
            \App\Models\Lead::class        => ['identity-document', 'certification', 'other-documents'],
            \App\Models\Quote\Quote::class => ['contract', 'payment-receipt', 'other-documents'],
            default                        => ['contract', 'payment-receipt', 'identity-document', 'certification', 'other-documents'],
            // ✅ Restricts which document categories can be attached per parent type
            // ⚠️ Ticket falls through to 'default' — all categories enabled (may be intentional)
        };

        return \DB::transaction(function () use ($request, $data, $documentable, $categories) {

            $document = $documentable->documents()->updateOrCreate(
                [],             // ⚠️ Empty match criteria — always creates a new record or matches the FIRST
                                //    document for this parent; cannot update a specific document by ID
                                //    despite 'id' being validated in the rules above — it's never used here
                [
                    'description' => $data['description'] ?? null,
                    'user_id'     => auth()->id(),
                    // ⚠️ No authorization — any user can attach documents to any Lead/Quote/Ticket
                ]
            );

            foreach ($categories as $category) {
                $this->syncDropzoneMedia($document, $category, $request->input($category, []));
                // ✅ Syncs Dropzone-uploaded media per category — creates/deletes media attachments
                // ⚠️ Spatie/Dropzone coupling — replaced by Base44 UploadFile in migration
            }

            $subject = $documentable;

            return (new \App\Services\Alerts\AlertService())->alertOperazioneEseguita(
                $subject->redirectRoute(),
                $subject->getRouteKey()
                // ✅ Polymorphic redirect — delegates route resolution to the parent model
                // ✅ Works for any documentable type that implements redirectRoute() + getRouteKey()
                // ⚠️ Will throw if documentable model doesn't implement redirectRoute()
            );
        });
    }
}
```

---

## Pattern Analysis

### Polymorphic Document Ownership

The `Document` model supports three parent types via Laravel polymorphism:

| `documentable_type` | Categories Available |
|---------------------|---------------------|
| `App\Models\Lead` | identity-document, certification, other-documents |
| `App\Models\Quote\Quote` | contract, payment-receipt, other-documents |
| `App\Models\Ticket` | contract, payment-receipt, identity-document, certification, other-documents (all) |

### `updateOrCreate` Bug

`$documentable->documents()->updateOrCreate([], [...])` uses an **empty match array `[]`** — which means:
- On first call: creates a new Document record for this parent ✅
- On second call: matches the **first Document** and updates it — cannot distinguish which document to update
- The `'id'` field validated in the rules is **never passed to `updateOrCreate`** — it's dead validation

The correct pattern would be:
```php
// Fix: use id as the match key
$document = Document::updateOrCreate(
    ['id' => $data['id']],  // match by ID for update, null for create
    [
        'documentable_type' => $documentableClass,
        'documentable_id'   => $data['documentable_id'],
        'description'       => $data['description'] ?? null,
        'user_id'           => auth()->id(),
    ]
);
```

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | `DestroyDocument` | **Missing redirect for Quote/Ticket** — method returns `null` for non-Lead parents; silent failure |
| 2 | 🔴 CRITICAL | `SaveDocument` | **Arbitrary model instantiation from user input** — `documentable_type` is resolved to a PHP class without allowlist validation; IDOR-adjacent security risk |
| 3 | 🔴 CRITICAL | `SaveDocument` | **`updateOrCreate` with empty match `[]`** — cannot update a specific document; always matches first or creates new; `id` field validated but unused |
| 4 | ⚠️ HIGH | `DestroyDocument` | **No cascade cleanup** — Spatie media files orphaned on disk after document deletion |
| 5 | ⚠️ HIGH | `SaveDocument` | **No authorization check** — any authenticated user can attach/modify documents on any entity |
| 6 | ⚠️ MEDIUM | `DestroyDocument` | **Hard delete** — no soft delete / audit trail for document history |
| 7 | ⚠️ MEDIUM | `SaveDocument` | **Fragile namespace normalization** — manual `str_replace` on class names; new types require code changes |
| 8 | ⚠️ MEDIUM | `SaveDocument` | **Hyphenated validation keys** — `payment-receipt`, `identity-document`, `other-documents`; non-standard PHP array keys |
| 9 | ⚠️ MEDIUM | Both | **AlertService instantiated with `new`** — not DI-resolved, not testable |
| 10 | ⚠️ MEDIUM | Both | **Italian log/error messages** |
| 11 | ℹ️ LOW | `SaveDocument` | **Ticket uses all categories** — falls through to `default` in `match`; likely intentional but undocumented |

---

## 📝 Migration to Base44

### Document Entity Schema

```json
{
  "name": "Document",
  "type": "object",
  "properties": {
    "parent_type": {
      "type": "string",
      "enum": ["lead", "quote", "ticket"],
      "description": "The type of entity this document belongs to"
    },
    "parent_id": {
      "type": "string",
      "description": "The ID of the parent entity (Lead, Quote, or Ticket)"
    },
    "description": {
      "type": "string",
      "description": "Optional description or notes"
    },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url":      { "type": "string" },
          "category": {
            "type": "string",
            "enum": ["contract", "payment-receipt", "identity-document", "certification", "other-documents"]
          },
          "name":     { "type": "string" },
          "uploaded_by": { "type": "string" }
        }
      },
      "description": "Uploaded file URLs with category tags"
    }
  },
  "required": ["parent_type", "parent_id"]
}
```

> **Design note:** Instead of Spatie's multi-collection media approach, store files as a `files` array with an embedded `category` field on each entry. This eliminates the need for separate media sync logic.

### `SaveDocument` → Frontend + Entity SDK

```tsx
// Frontend: upload files by category, then save Document
const CATEGORIES_BY_TYPE = {
  lead:   ['identity-document', 'certification', 'other-documents'],
  quote:  ['contract', 'payment-receipt', 'other-documents'],
  ticket: ['contract', 'payment-receipt', 'identity-document', 'certification', 'other-documents'],
};

const handleSave = async ({ parentType, parentId, description, filesByCategory }) => {
  // 1. Upload all files in parallel
  const allFiles = [];
  for (const [category, files] of Object.entries(filesByCategory)) {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { url: file_url, category, name: file.name, uploaded_by: user.email };
      })
    );
    allFiles.push(...uploaded);
  }

  // 2. Create or update Document record
  if (documentId) {
    await base44.entities.Document.update(documentId, { description, files: allFiles });
  } else {
    await base44.entities.Document.create({
      parent_type: parentType,
      parent_id:   parentId,
      description,
      files:       allFiles,
    });
  }
};
```

### `DestroyDocument` → Entity SDK (direct call)

```tsx
// Frontend: simple delete — no cascade needed since files are URLs (no disk cleanup)
const handleDelete = async (documentId) => {
  await base44.entities.Document.delete(documentId);
  // ✅ No orphaned files — file URLs still accessible in storage (can add cleanup if needed)
  // ✅ No polymorphic redirect logic — React Router handles navigation
};
```

### Key Improvements in Migration

1. **Fix IDOR** — `parent_type` is a validated enum `["lead", "quote", "ticket"]`, not a raw PHP class name
2. **Fix updateOrCreate** — explicit `documentId` check: `if (documentId) update() else create()`
3. **Fix missing redirect** — React Router `navigate()` handles all parent types uniformly; no type-specific conditions
4. **Cascade cleanup** — files are URLs in cloud storage; deletion of the Document record is sufficient (optionally purge URLs via a backend function)
5. **Authorization** — page-level route guard restricts document management to admin or the owning user

---

## Summary

**`Actions/Document/DestroyDocument`** (22 lines): Deletes a polymorphic `Document` record and redirects to its parent entity. CRITICAL: redirect logic only handles `Lead` parents — `Quote` and `Ticket` documents return `null`, producing undefined HTTP behavior. Exception is logged (better than `DestroyPort`). No cascade cleanup of Spatie media files. Hard delete only.

**`Actions/Document/SaveDocument`** (63 lines): Creates or updates a `Document` with category-specific Dropzone media sync for three polymorphic parent types (Lead, Quote, Ticket). CRITICAL BUG: `documentable_type` is resolved to a PHP class via manual `str_replace` without an allowlist — any user can craft a payload resolving to any model (IDOR-adjacent risk). CRITICAL BUG: `updateOrCreate([], [...])` with empty match criteria cannot reliably update a specific document — the validated `id` field is ignored. Category allowlists per parent type are a good pattern worth preserving in migration.

**Migration priority: HIGH** — two critical bugs (IDOR risk in class resolution, broken updateOrCreate) require a clean rewrite; the category-per-type model is sound and maps directly to a `files[]` array with embedded category tags on the Document entity.

**Total documented: 519 files**