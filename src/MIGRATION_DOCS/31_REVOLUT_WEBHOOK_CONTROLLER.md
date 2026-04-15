# Revolut Webhook Controller

**Purpose:** Handles incoming Revolut Business API payment webhook events, verifies their authenticity, updates order/installment state, and logs an audit trail.  
**Namespace:** `App\Http\Controllers\Webhooks`  
**Location:** `App/Http/Controllers/Webhooks/RevolutWebhookController.php`  
**Route:** (inferred) `POST /webhooks/revolut` — no CSRF protection (webhook endpoint)

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | Webhook receiver (HTTP Controller) |
| Auth | Signature-based (HMAC) + optional IP allowlist |
| Primary Action | Mark installment as paid, create Payment record |
| Audit Log | `revolut_transactions` table |
| Dependencies | `RevolutService`, `RevolutOrder`, `RevolutTransaction`, `Installment`, `Payment`, `Quote` |

---

## 🔗 Dependencies

### Models Used

| Model | Purpose |
|-------|---------|
| `RevolutOrder` | Links a Revolut payment order to an internal quote + installment |
| `RevolutTransaction` | Audit log table for every webhook received |
| `Installment` | Tracks payment installment status (paid_at) |
| `Payment` | Internal payment record created on successful payment |
| `Quote` | The parent booking/quote for the installment |

### Services Used

| Service | Methods Called |
|---------|---------------|
| `RevolutService` | `verifyWebhookSignature($payload, $signature)` |
| `RevolutService` | `mapProviderStatusToApp($state)` |

---

## 🔒 Security & Authentication

### 1. IP Allowlist (Optional)

```php
$allowed = config('revolut.allowed_webhook_ips', []);
if (!empty($allowed)) {
    $ip = $request->ip();
    if (!in_array($ip, $allowed)) {
        return response()->json(['message' => 'Disallowed IP'], 403);
    }
}
```

- Configured via `config/revolut.php` → `allowed_webhook_ips` (array of IPs)
- If array is **empty**, IP check is **skipped entirely**
- Returns **403 Forbidden** if IP not in allowlist

### 2. HMAC Signature Verification

```php
$signature = $request->header('X-Signature') ?? $request->header('Revolut-Signature');

if (!$this->service->verifyWebhookSignature($payload, $signature)) {
    return response()->json(['message' => 'Invalid signature'], 401);
}
```

- Supports two header names: `X-Signature` or `Revolut-Signature` (first non-null wins)
- Actual HMAC logic delegated to `RevolutService::verifyWebhookSignature()`
- Returns **401 Unauthorized** on failure

---

## 🔄 Request Processing Flow

```
POST /webhooks/revolut
  ↓
1. [Optional] IP Allowlist Check → 403 if blocked
  ↓
2. HMAC Signature Verification → 401 if invalid
  ↓
3. JSON Decode payload → 400 if malformed
  ↓
4. Extract event type + provider ID + status
  ↓
5. Map provider status → internal status via RevolutService
  ↓
6. Log info (event, providerId, state, mapped)
  ↓
7. Find RevolutOrder by provider ID
   ├─ If found + status is 'paid' → markInstallmentPaid()
   └─ If not found → Log warning
  ↓
8. Create RevolutTransaction audit record (always)
  ↓
9. Return 200 OK
```

---

## 📦 Payload Parsing

Revolut's Business API can send subtly different payload structures depending on the API version. The controller handles both:

### Event Type Extraction

```php
$event = $data['event'] ?? $data['type'] ?? null;
```

| Field | Fallback |
|-------|---------|
| `event` | `type` |

### Event Data Extraction

```php
$eventData = $data['data'] ?? $data['payload'] ?? $data;
```

Falls back to the root payload if no `data` or `payload` key.

### Provider Order ID Extraction

```php
$providerId = $eventData['id']
    ?? $eventData['order_id']
    ?? $data['order_id']
    ?? $eventData['payment_id']
    ?? null;
```

Tries 4 different key paths to find the Revolut order UUID. Returns **400** if none found.

### Status Extraction

```php
$state = $eventData['state'] ?? $eventData['status'] ?? 'pending';
$mapped = $this->service->mapProviderStatusToApp($state);
```

- Defaults to `'pending'` if neither key present
- `mapProviderStatusToApp()` translates Revolut states (e.g., `COMPLETED`, `FAILED`) to internal app states (e.g., `paid`, `failed`)

---

## 💳 markInstallmentPaid() (Private Method)

Called when `$mapped === 'paid'` and a matching `RevolutOrder` exists.

```php
private function markInstallmentPaid(RevolutOrder $revolutOrder): void
{
    $installment = Installment::find($revolutOrder->installment_id);
    if (!$installment || $installment->paid_at) {
        return; // Idempotency guard: already paid
    }

    $installment->paid_at = now();
    $installment->save();

    $quote = Quote::find($revolutOrder->quote_id);
    if ($quote) {
        Payment::create([
            'payment_method_id' => $quote->payment_method_id,
            'quote_id'          => $quote->id,
            'installment_id'    => $installment->id,
            'amount'            => $installment->installment_amount,
            'currency'          => strtoupper($quote->currency),
            'state'             => 'paid',
        ]);
    }
}
```

### Logic Summary

| Step | Action |
|------|--------|
| 1 | Find `Installment` via `revolutOrder->installment_id` |
| 2 | **Idempotency check:** If already paid (`paid_at` not null), exit silently |
| 3 | Set `installment->paid_at = now()`, save |
| 4 | Find parent `Quote` via `revolutOrder->quote_id` |
| 5 | Create `Payment` record linked to quote, installment, and payment method |
| 6 | Log success |

### Payment Record Created

| Field | Source |
|-------|--------|
| `payment_method_id` | `$quote->payment_method_id` |
| `quote_id` | `$quote->id` |
| `installment_id` | `$installment->id` |
| `amount` | `$installment->installment_amount` |
| `currency` | `strtoupper($quote->currency)` |
| `state` | `'paid'` (hardcoded) |

---

## 📝 Audit Log: RevolutTransaction

A `RevolutTransaction` record is **always created**, regardless of whether the order was found or the installment was updated. This provides a full audit trail of every webhook received.

```php
RevolutTransaction::create([
    'provider_payment_id'  => $providerId,
    'amount'               => ($eventData['order_amount']['value'] ?? $eventData['amount'] ?? 0) / 100,
    'currency'             => strtoupper($eventData['order_amount']['currency'] ?? $eventData['currency'] ?? 'EUR'),
    'status'               => $mapped,
    'metadata'             => $eventData['metadata'] ?? null,
    'provider_response'    => $eventData,
    'webhook_payload'      => $data,
    'webhook_received_at'  => now(),
    'paid_at'              => $mapped === 'paid' ? now() : null,
]);
```

### Amount Normalization

- Revolut sends amounts in **minor units** (cents): value is divided by 100
- Currency defaulted to `'EUR'` if not present

---

## 📊 HTTP Response Codes

| Code | Condition |
|------|-----------|
| `200 OK` | Webhook processed successfully |
| `400 Bad Request` | Invalid JSON payload OR missing provider ID |
| `401 Unauthorized` | Invalid HMAC signature |
| `403 Forbidden` | IP not in allowlist |

---

## ⚠️ Issues / Concerns

### 1. No Database Transaction
- `markInstallmentPaid()` performs multiple DB writes (Installment save + Payment create) without wrapping in `DB::transaction()`
- If `Payment::create()` fails, `installment->paid_at` is already set — inconsistent state
- **Fix:** Wrap in `DB::transaction(fn() => ...)`

### 2. No Event Dispatched
- No Laravel event fired on successful payment (e.g., `PaymentReceived`)
- Listeners can't react to successful payments (email notifications, downstream sync)
- **Fix:** `event(new PaymentReceived($installment, $quote))`

### 3. RevolutTransaction Always Created
- Even if the RevolutOrder isn't found or JSON is malformed, the transaction record may be created
- Currently only skipped on 400/401/403 early returns — this is mostly acceptable for audit purposes

### 4. Silent Quote Not Found
- If `Quote::find($revolutOrder->quote_id)` returns null, `Payment` is simply not created — no warning logged
- **Fix:** Add `Log::warning('Revolut webhook: Quote not found', ['quote_id' => $revolutOrder->quote_id])`

### 5. Italian Inline Comments
- Comments like `// Il provider_order_id corrisponde all'id dell'ordine Revolut` are in Italian
- Inconsistent with English codebase convention

### 6. Hardcoded `'paid'` Status String
- `'state' => 'paid'` in `Payment::create()` — should use a constant or enum

### 7. No Retry Handling
- If the controller throws an uncaught exception, Revolut will retry the webhook
- No deduplication on `provider_payment_id` in `revolut_transactions` — could result in duplicate records on retry
- **Fix:** Use `firstOrCreate` or unique constraint on `provider_payment_id`

---

## 📝 Migration Notes for Base44

### Current Architecture

```
Revolut → POST /webhooks/revolut → RevolutWebhookController
  → RevolutService (verify signature + map status)
  → RevolutOrder → Installment → Payment (mark paid)
  → RevolutTransaction (audit log)
```

### Base44 Equivalent: Backend Function

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const payload = await req.text();
    const signature = req.headers.get('revolut-signature') ?? req.headers.get('x-signature');

    // 1. Verify HMAC signature
    const secret = Deno.env.get('REVOLUT_WEBHOOK_SECRET');
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (signature !== expected) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const data = JSON.parse(payload);

    const eventData = data.data ?? data.payload ?? data;
    const providerId = eventData.id ?? eventData.order_id ?? data.order_id ?? eventData.payment_id;
    if (!providerId) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const rawState = eventData.state ?? eventData.status ?? 'pending';
    const mapped = mapStatus(rawState); // 'paid' | 'failed' | 'pending'

    // 2. Find RevolutOrder + mark installment paid
    const [revolutOrders] = await base44.asServiceRole.entities.RevolutOrder.filter({ id: providerId });
    if (revolutOrders?.length > 0 && mapped === 'paid') {
      await markInstallmentPaid(base44, revolutOrders[0]);
    }

    // 3. Audit log
    await base44.asServiceRole.entities.RevolutTransaction.create({
      provider_payment_id: providerId,
      amount: (eventData.order_amount?.value ?? eventData.amount ?? 0) / 100,
      currency: (eventData.order_amount?.currency ?? eventData.currency ?? 'EUR').toUpperCase(),
      status: mapped,
      webhook_payload: data,
      webhook_received_at: new Date().toISOString(),
      paid_at: mapped === 'paid' ? new Date().toISOString() : null,
    });

    return Response.json({ message: 'ok' });
  } catch (error) {
    console.error('Revolut webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapStatus(state: string): string {
  const map: Record<string, string> = {
    COMPLETED: 'paid',
    FAILED: 'failed',
    CANCELLED: 'failed',
    PENDING: 'pending',
  };
  return map[state?.toUpperCase()] ?? 'pending';
}

async function markInstallmentPaid(base44, revolutOrder) {
  const installments = await base44.asServiceRole.entities.Installment.filter({ id: revolutOrder.installment_id });
  const installment = installments[0];
  if (!installment || installment.paid_at) return; // idempotency guard

  await base44.asServiceRole.entities.Installment.update(installment.id, { paid_at: new Date().toISOString() });

  const quotes = await base44.asServiceRole.entities.Quote.filter({ id: revolutOrder.quote_id });
  const quote = quotes[0];
  if (quote) {
    await base44.asServiceRole.entities.Payment.create({
      payment_method_id: quote.payment_method_id,
      quote_id: quote.id,
      installment_id: installment.id,
      amount: installment.installment_amount,
      currency: quote.currency?.toUpperCase(),
      state: 'paid',
    });
  }
}
```

### Required Secret

| Key | Description |
|-----|-------------|
| `REVOLUT_WEBHOOK_SECRET` | HMAC signing secret from Revolut dashboard |

### Entities Required

| Entity | Key Fields |
|--------|-----------|
| `RevolutOrder` | `id` (Revolut UUID), `installment_id`, `quote_id` |
| `RevolutTransaction` | `provider_payment_id`, `amount`, `currency`, `status`, `webhook_payload`, `webhook_received_at`, `paid_at` |
| `Installment` | `id`, `paid_at`, `installment_amount` |
| `Payment` | `payment_method_id`, `quote_id`, `installment_id`, `amount`, `currency`, `state` |
| `Quote` | `id`, `payment_method_id`, `currency` |

### Key Improvements Over Current Implementation

1. **No DB Transaction Bug** — `markInstallmentPaid` should use atomic updates
2. **Deduplication** — add unique constraint on `provider_payment_id` in `RevolutTransaction`
3. **Event Dispatch** — fire a `payment_completed` event for downstream automations
4. **Log Missing Quote** — warn when quote not found instead of silently skipping
5. **Typed Status Mapping** — centralized `mapStatus()` replaces service method
6. **Secret via Env Var** — `REVOLUT_WEBHOOK_SECRET` set via Base44 secrets manager