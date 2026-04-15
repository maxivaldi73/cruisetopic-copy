# Checkout Payment Controller

**Purpose:** Handle payment processing for cruise booking checkout via Revolut.  
**Namespace:** `App\Http\Controllers\Checkout`  
**Location:** `App/Http/Controllers/Checkout/CheckoutPaymentController.php`  
**Type:** Payment flow controller (Revolut-specific)

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | Payment processing controller |
| Primary Use | Handle multi-step checkout payment flow |
| Dependencies | RevolutService, QuoteService, Quote, Installment, Payment models |
| Auth | Requires authenticated user (implicit via quoteToken) |
| Payment Provider | Revolut (credit card only) |
| Scope | Cruise booking checkout |

---

## 🔧 Methods

### Constructor

```php
public function __construct(RevolutService $revolutService, QuoteService $quoteService)
{
    $this->revolutService = $revolutService;
    $this->quoteService = $quoteService;
}
```

Injects dependencies for Revolut payment service and quote business logic.

---

### show(Request $request, string $quoteToken) → View | ErrorResponse

**Purpose:** Display payment page for a quote.

| Step | Action |
|------|--------|
| 1 | Fetch quote with installments and customer by recovery token |
| 2 | Validate quote cancellation conditions |
| 3 | Get quote's payment method |
| 4 | Switch on payment method name |
| 5 | For 'credit_card': create/get Revolut customer |
| 6 | Create Revolut order from quote |
| 7 | Load current installment to pay |
| 8 | Render payment view with order details |

**Parameters:**
- `$quoteToken` — unique recovery token from quote

**Returns:**
- **View:** `checkout.payment` with quote, revolutOrder, installment (on success)
- **ErrorResponse:** 400 with error message if:
  - Quote not found (404 from `firstOrFail()`)
  - Cancellation condition is null
  - Payment method not supported (default case)

**Example Flow:**
1. User visits `/checkout/payment/{quoteToken}`
2. Quote is fetched and validated
3. For credit card payments:
   - Revolut customer created (if new)
   - Revolut order created
   - Payment form rendered with iframe/embed
4. User submits card details via Revolut UI
5. Revolut redirects to `return()` method

---

### return(Request $request, string $quoteToken) → RedirectResponse

**Purpose:** Handle Revolut return (post-3DS authentication or payment redirect).

| Step | Action |
|------|--------|
| 1 | Fetch quote by recovery token |
| 2 | Fetch latest Revolut order for quote |
| 3 | Call Revolut API to poll payment status |
| 4 | Map Revolut status to app status ('paid', 'failed', 'cancelled', etc.) |
| 5 | If 'paid': mark installment as paid, create Payment record, redirect to success |
| 6 | If failed/cancelled/expired: redirect back to payment with error |
| 7 | If pending/authorised: optimistic redirect to success with 'processing' status |
| 8 | On exception: log warning, redirect to success optimistically |

**Parameters:**
- `$quoteToken` — unique recovery token

**Returns:**
- **Redirect to success:** If payment succeeded
- **Redirect to payment form:** If payment failed with error message
- **Redirect to success (optimistic):** If status still pending or polling fails

**Status Mappings:**
- `'paid'` → Mark installment paid, create Payment record
- `'failed'`, `'cancelled'`, `'expired'` → Show error, allow retry
- `'pending'`, `'authorised'` → Optimistic success (will settle later)

**Key Point:** Uses optimistic approach for pending payments—assumes they'll settle and updates asynchronously.

---

### success(Request $request, string $quoteToken) → View

**Purpose:** Display payment success confirmation page.

| Step | Action |
|------|--------|
| 1 | Fetch quote with installments, customer, and cruise |
| 2 | Count paid installments |
| 3 | Count pending installments |
| 4 | Render success view |

**Parameters:**
- `$quoteToken` — unique recovery token

**Returns:**
- **View:** `checkout.payment-success` with quote, paidInstallments, pendingInstallments count

**Display Options:**
- Shows paid installments list
- Shows count of remaining installments
- Allows further installment setup or booking completion

---

### cancel(Request $request, string $quoteToken) → View

**Purpose:** Display payment cancellation page.

| Step | Action |
|------|--------|
| 1 | Fetch quote by recovery token |
| 2 | Render cancellation view |

**Parameters:**
- `$quoteToken` — unique recovery token

**Returns:**
- **View:** `checkout.payment-cancel` with quote

**Display:**
- Explains payment was cancelled
- Provides option to retry or return to booking

---

### markInstallmentPaid(RevolutOrder $revolutOrder, Quote $quote) → void

**Purpose:** Private helper to mark installment as paid and record Payment.

| Step | Action |
|------|--------|
| 1 | Find Installment by ID from RevolutOrder |
| 2 | Check if installment not already marked paid |
| 3 | Mark installment `paid_at = now()` and save |
| 4 | Create Payment record with: |
|    | - payment_method_id |
|    | - quote_id |
|    | - installment_id |
|    | - amount |
|    | - currency |
|    | - state = 'paid' |

**Parameters:**
- `$revolutOrder` — completed Revolut order
- `$quote` — quote being paid

**Safety:** Only marks as paid if not already marked (idempotent).

---

## 📊 Data Flow

```
User Request
    ↓
show() — Fetch quote, validate, create Revolut customer & order
    ↓
Render Payment Form (with Revolut iframe)
    ↓
User submits card via Revolut UI
    ↓
Revolut processes payment (3DS authentication)
    ↓
Revolut redirects back to return() with ?state=...
    ↓
return() — Poll Revolut status
    ↓
If paid:
    ├─ Mark installment paid
    ├─ Create Payment record
    └─ Redirect to success()
    
If failed:
    └─ Redirect to show() with error
    
If pending (optimistic):
    └─ Redirect to success() with "processing" status
    
success() — Show confirmation
    ↓
User sees paid installments and remaining balance
```

---

## ⚠️ Issues / Concerns

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ High | **Optimistic Success Redirect** — Redirects to success even if payment status is pending. User may see "paid" before actual settlement. | May confuse users; async settlement could fail silently |
| 2 | ⚠️ High | **No CSRF Check Visible** — `return()` method lacks explicit CSRF validation. | If Revolut redirect is user-triggered, vulnerable to CSRF |
| 3 | ⚠️ Medium | **Hardcoded Italian Messages** — Error/success messages in Italian only. | Not i18n-friendly |
| 4 | ⚠️ Medium | **Silent Polling Exception** — On Revolut API error, logs warning but still redirects to success optimistically. | Might mask API issues; user thinks payment processed when it didn't |
| 5 | ⚠️ Medium | **No Idempotency Check on Order Creation** — If `show()` is called twice, creates duplicate Revolut orders. | Could overcharge or create reconciliation issues |
| 6 | ℹ️ Low | **Single Payment Method** — Only supports credit_card via Revolut. | No fallback for other payment methods |
| 7 | ⚠️ Medium | **Webhook Missing** — No webhook handler for Revolut payment updates. | Relies entirely on user-initiated polling; delayed confirmations |
| 8 | ⚠️ Medium | **No Amount Validation** — Doesn't verify Revolut order amount matches expected installment. | Could process wrong amount if Revolut order becomes stale |

---

## 📝 Migration Notes for Base44

### Strategy: Backend Functions + Entity-based Flow

**Migrate to:**
1. Backend functions for payment processing
2. Quote and Installment entities
3. Payment tracking entity
4. Revolut webhook automation (for real-time updates)

### Entities Required

```json
// entities/Quote.json
{
  "recovery_token": {"type": "string", "unique": true},
  "customer_id": {"type": "string"},
  "payment_method": {"type": "string"},
  "currency": {"type": "string"},
  "total_amount": {"type": "number"},
  "status": {"type": "string", "enum": ["pending", "paid", "cancelled"]}
}

// entities/Installment.json
{
  "quote_id": {"type": "string"},
  "sequence": {"type": "integer"},
  "amount": {"type": "number"},
  "due_date": {"type": "string", "format": "date"},
  "paid_at": {"type": "string", "format": "date-time"}
}

// entities/Payment.json
{
  "payment_method_id": {"type": "string"},
  "quote_id": {"type": "string"},
  "installment_id": {"type": "string"},
  "amount": {"type": "number"},
  "currency": {"type": "string"},
  "state": {"type": "string", "enum": ["pending", "processing", "paid", "failed"]},
  "provider_order_id": {"type": "string"}
}

// entities/RevolutOrder.json
{
  "quote_id": {"type": "string"},
  "installment_id": {"type": "string"},
  "provider_order_id": {"type": "string"},
  "status": {"type": "string"},
  "created_at": {"type": "string", "format": "date-time"}
}
```

### Backend Functions

**Function: initializePayment**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { quoteToken } = await req.json();

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch quote
  const quotes = await base44.entities.Quote.filter({ recovery_token: quoteToken });
  if (!quotes.length) return Response.json({ error: 'Quote not found' }, { status: 404 });

  const quote = quotes[0];

  // Check cancellation condition
  if (quote.status === 'cancelled') {
    return Response.json({ error: 'Quote is cancelled' }, { status: 400 });
  }

  // Create Revolut customer
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('revolut');
  const customerRes = await fetch('https://api.revolut.com/api/1.0/customers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      email: user.email,
      phone: user.phone,
      name: user.full_name,
    }),
  });

  const customer = await customerRes.json();

  // Create Revolut order
  const orderRes = await fetch('https://api.revolut.com/api/1.0/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      customer_id: customer.id,
      amount: quote.total_amount * 100, // cents
      currency: quote.currency.toUpperCase(),
      description: `Quote ${quote.id}`,
    }),
  });

  const order = await orderRes.json();

  // Store order in database
  await base44.entities.RevolutOrder.create({
    quote_id: quote.id,
    provider_order_id: order.id,
    status: 'pending',
  });

  return Response.json({ order, checkoutUrl: order.checkout_url });
});
```

**Function: handlePaymentReturn**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { quoteToken, orderId } = await req.json();

  // Fetch quote
  const quotes = await base44.entities.Quote.filter({ recovery_token: quoteToken });
  const quote = quotes[0];

  // Get payment status from Revolut
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('revolut');
  const payRes = await fetch(`https://api.revolut.com/api/1.0/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const payment = await payRes.json();

  if (payment.state === 'COMPLETED') {
    // Mark installment as paid
    const revolutOrders = await base44.entities.RevolutOrder.filter({ provider_order_id: orderId });
    const rOrder = revolutOrders[0];

    const installments = await base44.entities.Installment.filter({ id: rOrder.installment_id });
    const installment = installments[0];

    await base44.entities.Installment.update(installment.id, { paid_at: new Date().toISOString() });

    // Create Payment record
    await base44.entities.Payment.create({
      payment_method_id: quote.payment_method,
      quote_id: quote.id,
      installment_id: installment.id,
      amount: installment.amount,
      currency: quote.currency,
      state: 'paid',
      provider_order_id: orderId,
    });

    return Response.json({ status: 'success' });
  }

  if (['DECLINED', 'FAILED'].includes(payment.state)) {
    return Response.json({ status: 'failed', message: 'Payment declined' }, { status: 400 });
  }

  return Response.json({ status: 'pending' });
});
```

### React Component: Payment Flow

```tsx
// pages/Checkout/PaymentPage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const { quoteToken } = useParams();
  const [quote, setQuote] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const res = await base44.functions.invoke('initializePayment', { quoteToken });
        setCheckoutUrl(res.data.checkoutUrl);
        // Fetch quote separately
        const quoteRes = await base44.functions.invoke('getQuote', { quoteToken });
        setQuote(quoteRes.data);
      } catch (err) {
        console.error('Payment init failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [quoteToken]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>
        <p className="text-muted-foreground mb-6">
          Total: {quote?.total_amount} {quote?.currency}
        </p>

        {/* Revolut Embed iframe */}
        {checkoutUrl && (
          <iframe
            src={checkoutUrl}
            className="w-full h-96 border rounded-lg"
            title="Revolut Checkout"
          />
        )}

        <Button onClick={() => (window.location.href = `${window.location.origin}/checkout/return/${quoteToken}`)}>
          Complete Payment
        </Button>
      </Card>
    </div>
  );
}
```

### Key Improvements

1. **Idempotency:** Check if order already exists before creating
2. **Real-time Updates:** Use Revolut webhook automation instead of optimistic redirect
3. **Explicit Status:** Use database state instead of optimistic assumptions
4. **I18n:** Move error messages to config/locales
5. **Amount Validation:** Verify Revolut order amount matches expected
6. **Webhook Handler:** Create automation for Revolut payment updates
7. **Retry Logic:** Allow safe retries without duplicate charges
8. **Better Error Handling:** Don't mask API failures with optimistic redirect

### Summary

Checkout Payment Controller manages multi-step payment flow for cruise bookings via Revolut. In Base44:

- **Create entities:** Quote, Installment, Payment, RevolutOrder
- **Use backend functions:** For secure payment processing
- **Implement Revolut webhook:** For real-time payment confirmations (instead of polling)
- **Avoid optimistic redirects:** Use database state as source of truth
- **Add idempotency:** Prevent duplicate charges on retry

This approach is more secure, scalable, and reliable than the current implementation.