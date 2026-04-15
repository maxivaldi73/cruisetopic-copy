# RevolutController

**Purpose:** Handles Revolut payment order creation, post-checkout return handling, and cancellation for cruise bookings.  
**Location:** `App\Http\Controllers\Payments\RevolutController`  
**Extends:** `App\Http\Controllers\Controller`  
**Namespace:** `App\Http\Controllers\Payments`

---

## Dependencies

| Dependency | Type | Purpose |
|-----------|------|---------|
| `RevolutService` | Service | Calls Revolut API (create order, get payment status, map status) |
| `Quote` | Model | Retrieves the quote/order by ID to determine the payment amount |
| `RevolutTransaction` | Model | Persists the Revolut payment transaction record locally |
| `Str` | Laravel Helper | UUID/random string generation |
| `Log` | Laravel Facade | Error/warning logging |

---

## Routes

| Method | URI | Controller Method | Notes |
|--------|-----|------------------|-------|
| GET | `/revolut/test` | `testPay()` | Development/debug only — dead code after `dd()` |
| POST | `/revolut/create` | `create()` | Initiate a real payment |
| GET | `/revolut/return` | `return()` | Called by Revolut after user completes or cancels checkout |
| GET | `/revolut/cancel` | `cancel()` | Optional cancel landing page |

---

## Methods

---

### `testPay()` → RedirectResponse | View ⚠️ DEV ONLY

**Purpose:** Development endpoint for manually testing the Revolut checkout flow.

**Flow:**
1. Generates a `TEST-{uuid}` order ID
2. Builds a hard-coded payload (€10.00, EUR)
3. Calls `RevolutService::createOrder($payload)`
4. **Hits `dd($response)`** — execution stops here in current code
5. Dead code below creates a `RevolutTransaction` and redirects to `checkout_url`

**Issues:**
- `dd()` left in — this method is permanently broken in production
- Dead code after `dd()` (lines 61–90) is unreachable
- Hard-coded Italian description (`'Pagamento ordine test'`)
- Hard-coded redirect URL (`cruisetopic.dev.bluehat.al`)
- Should be removed or gated behind `APP_ENV=local` before any production deploy

---

### `create(Request $request)` → RedirectResponse

**Purpose:** Create a Revolut payment order for a specific Quote and redirect the user to Revolut's hosted checkout.

**Validation:**
```php
'currency' => ['required', 'string', 'size:3'],   // e.g. "EUR"
'order_id' => ['required', 'integer'],              // Quote ID
```

**Flow:**
1. Load `Quote::findOrFail($data['order_id'])` — aborts 404 if not found
2. Convert `total_amount` to minor units (×100)
3. Build Revolut order payload
4. Call `RevolutService::createOrder($payload)` → get Revolut order response
5. Persist `RevolutTransaction` record with provider payment ID, amount, currency, mapped status, metadata
6. Redirect user to `$response['checkout_url']` (Revolut's hosted page)
7. On failure: redirect to `website.home` with Italian error flash message

**Payload Structure:**
```php
[
    'amount'                      => int,       // minor units (cents)
    'currency'                    => 'EUR',
    'description'                 => 'Pagamento ordine test',  // hard-coded Italian
    'redirect_url'                => 'https://cruisetopic.dev.bluehat.al',  // hard-coded dev URL
    'metadata'                    => ['order_id' => $order_id],
    'merchant_order_data'         => ['url' => '...', 'reference' => $order_id],
    'statement_descriptor_suffix' => 'ORD-{order_id}',
]
```

**Issues:**
1. **Hard-coded `redirect_url`:** Points to dev domain — must be dynamic (use `route('revolut.return')`)
2. **Hard-coded description:** Italian string `'Pagamento ordine test'` — should be translated or configurable
3. **No authorization:** Any authenticated user can create a payment for any order ID — no ownership check on `Quote`
4. **`amount_minor` calculation bug:** `round($response['amount'] * 100)` — Revolut API already returns amount in minor units, so multiplying by 100 again is incorrect
5. **Commented-out `industry_data`:** Likely needed for travel/airline categorization

---

### `return(Request $request)` → View

**Purpose:** Landing page after the user completes (or abandons) checkout on Revolut's hosted page. Polls Revolut for the latest payment status and updates the local transaction record.

**Query Parameters Accepted:**
| Param | Fallback | Purpose |
|-------|---------|---------|
| `payment_id` | `id` | Revolut provider payment ID |
| `reference` | `order_ref` | Metadata order reference |

**Flow:**
1. Try to find `RevolutTransaction` by `provider_payment_id`
2. Fallback: find by JSON metadata `order_id` field
3. If still not found → render `payments.revolut.return` with status `'unknown'`
4. Poll Revolut API: `RevolutService::getPayment($provider_payment_id)`
5. Map returned status to app status:
   - `'paid'` → `$tx->markAsPaid($status)`
   - `'failed'`, `'cancelled'`, `'expired'` → `$tx->markAsFailed($status)`
6. Render `payments.revolut.return` with final `$tx->status`

**Issues:**
1. **Status field inconsistency:** In `create()`, status is mapped from `$response['state']`; here it's mapped from `$status['status']` — different field names from the same API
2. **Silent polling failure:** Catch block logs a warning but continues — user sees stale status if polling fails
3. **No Quote update:** Payment status is updated on `RevolutTransaction` but the parent `Quote` model is not updated (e.g., to `paid`)
4. **Polling instead of webhook:** Status is only updated when the user visits this page — missed if the user closes the tab

---

### `cancel(Request $request)` → View

**Purpose:** Simple cancel page shown when user abandons payment.

**Flow:** Returns `payments.revolut.cancel` view. No logic.

**Issues:**
- No transaction update (should mark transaction as `cancelled`)
- No Quote update

---

## `RevolutTransaction` Model — Inferred Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | int\|null | Authenticated user ID (nullable for guest checkout) |
| `order_id` | int | Local Quote ID |
| `provider_payment_id` | string | Revolut's `id` field |
| `amount` | int | Amount in minor units (cents) |
| `amount_minor` | int | Redundant? Same as `amount` based on payload |
| `currency` | string | ISO 4217 currency code (e.g., `EUR`) |
| `status` | string | Mapped app status (`pending`, `paid`, `failed`, etc.) |
| `metadata` | json | `{ order_id: ... }` |
| `provider_response` | json | Full raw API response |

**Model Methods:**
- `markAsPaid($providerStatus)` — updates status to `paid`, stores provider data
- `markAsFailed($providerStatus)` — updates status to `failed`, stores provider data

---

## `RevolutService` — Inferred Interface

| Method | Purpose |
|--------|---------|
| `createOrder(array $payload): array` | POST to Revolut Orders API, returns order object |
| `getPayment(string $id): array` | GET payment by provider ID |
| `mapProviderStatusToApp(string $status): string` | Map Revolut status → app status (`pending`, `paid`, `failed`, etc.) |

---

## Issues & Concerns Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🚨 Critical | `testPay()` has `dd()` — endpoint is permanently broken |
| 2 | 🚨 Critical | `create()` `redirect_url` hard-coded to dev domain |
| 3 | ⚠️ High | No authorization on `create()` — any user can pay for any order |
| 4 | ⚠️ High | `amount_minor` calculation multiplies by 100 unnecessarily |
| 5 | ⚠️ High | `return()` never updates the parent `Quote` to `paid` |
| 6 | ⚠️ Medium | Status field name inconsistency (`state` vs `status`) between methods |
| 7 | ⚠️ Medium | `cancel()` doesn't mark transaction or quote as cancelled |
| 8 | ℹ️ Low | Hard-coded Italian descriptions |
| 9 | ℹ️ Low | Polling on return — webhook preferred for real-time status |

---

## Migration Notes for Base44

### Strategy

Replace all controller methods with **backend functions**. The frontend (React) handles redirects and page rendering.

---

### Backend Function: `createRevolutPayment`

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { quoteId, currency } = await req.json();

    // Load quote and verify ownership
    const quote = await base44.entities.Quote.get(quoteId);
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });
    if (quote.created_by !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const amountMinor = Math.round(quote.total_amount * 100); // cents

    // Call Revolut API
    const revolutApiKey = Deno.env.get('REVOLUT_API_KEY');
    const revolutBaseUrl = Deno.env.get('REVOLUT_API_URL'); // sandbox vs production

    const payload = {
      amount: amountMinor,
      currency: currency.toUpperCase(),
      description: `Order ${quoteId}`,
      redirect_url: `${Deno.env.get('APP_URL')}/payment/return`,
      metadata: { order_id: quoteId },
      merchant_order_data: {
        url: Deno.env.get('APP_URL'),
        reference: String(quoteId),
      },
      statement_descriptor_suffix: `ORD-${quoteId}`,
    };

    const response = await fetch(`${revolutBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${revolutApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const order = await response.json();
    if (!response.ok) {
      return Response.json({ error: 'Revolut API error', details: order }, { status: 502 });
    }

    // Persist transaction
    await base44.entities.RevolutTransaction.create({
      user_id: user.id,
      quote_id: quoteId,
      provider_payment_id: order.id,
      amount: amountMinor,
      currency: payload.currency,
      status: mapRevolutStatus(order.state),
      metadata: payload.metadata,
      provider_response: order,
    });

    return Response.json({ checkoutUrl: order.checkout_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapRevolutStatus(state) {
  const map = { pending: 'pending', processing: 'processing', completed: 'paid', failed: 'failed', cancelled: 'cancelled' };
  return map[state] ?? 'pending';
}
```

---

### Backend Function: `handleRevolutReturn`

```typescript
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { providerId, reference } = await req.json();

    let tx = null;
    if (providerId) {
      const results = await base44.entities.RevolutTransaction.filter({ provider_payment_id: providerId });
      tx = results[0] ?? null;
    }
    if (!tx && reference) {
      const results = await base44.entities.RevolutTransaction.filter({ quote_id: reference });
      tx = results[0] ?? null;
    }

    if (!tx) return Response.json({ status: 'unknown' });

    // Poll Revolut for current status
    const revolutApiKey = Deno.env.get('REVOLUT_API_KEY');
    const revolutBaseUrl = Deno.env.get('REVOLUT_API_URL');

    const statusRes = await fetch(`${revolutBaseUrl}/orders/${tx.provider_payment_id}`, {
      headers: { 'Authorization': `Bearer ${revolutApiKey}` },
    });
    const statusData = await statusRes.json();
    const mappedStatus = mapRevolutStatus(statusData.state);

    // Update transaction
    await base44.entities.RevolutTransaction.update(tx.id, {
      status: mappedStatus,
      provider_response: statusData,
    });

    // Update Quote if paid
    if (mappedStatus === 'paid') {
      await base44.entities.Quote.update(tx.quote_id, { status: 'paid' });
    } else if (['failed', 'cancelled'].includes(mappedStatus)) {
      await base44.entities.Quote.update(tx.quote_id, { status: 'cancelled' });
    }

    return Response.json({ status: mappedStatus });
  } catch (error) {
    return Response.json({ status: 'unknown', error: error.message }, { status: 500 });
  }
});
```

---

### Frontend Usage (React)

```typescript
// Initiate payment
const handlePay = async () => {
  const res = await base44.functions.invoke('createRevolutPayment', {
    quoteId: quote.id,
    currency: 'EUR',
  });
  if (res.data.checkoutUrl) {
    window.location.href = res.data.checkoutUrl; // Redirect to Revolut
  }
};

// Payment return page (reads query params)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  base44.functions.invoke('handleRevolutReturn', {
    providerId: params.get('payment_id') ?? params.get('id'),
    reference: params.get('reference') ?? params.get('order_ref'),
  }).then(res => setPaymentStatus(res.data.status));
}, []);
```

---

### Entities Required

**RevolutTransaction:**
```json
{
  "user_id": { "type": "string" },
  "quote_id": { "type": "string" },
  "provider_payment_id": { "type": "string" },
  "amount": { "type": "number" },
  "currency": { "type": "string" },
  "status": { "type": "string", "enum": ["pending", "processing", "paid", "failed", "cancelled"] },
  "metadata": { "type": "object" },
  "provider_response": { "type": "object" }
}
```

**Quote** (add field):
```json
{
  "payment_status": { "type": "string", "enum": ["unpaid", "paid", "cancelled"], "default": "unpaid" }
}
```

### Environment Variables Required

| Variable | Description |
|----------|-------------|
| `REVOLUT_API_KEY` | Revolut merchant API key (sandbox or production) |
| `REVOLUT_API_URL` | Revolut base URL (`https://sandbox-merchant.revolut.com/api/1.0` or prod) |
| `APP_URL` | Canonical app URL for redirect callbacks |

### Key Improvements

1. **Remove `testPay()`** — or strictly gate it behind `APP_ENV !== production`
2. **Dynamic redirect URL** — use `APP_URL` env var, not hard-coded dev domain
3. **Ownership check** — verify requesting user owns the quote before initiating payment
4. **Fix `amount_minor`** — Revolut returns minor units already; no ×100 needed
5. **Update Quote on payment** — mark `Quote.payment_status = 'paid'` on successful return
6. **Webhook over polling** — implement Revolut webhook handler for real-time status updates (see `32_REVOLUT_WEBHOOK_CONTROLLER.md`)
7. **Status field consistency** — use `state` field consistently (Revolut orders API uses `state`, not `status`)