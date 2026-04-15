# Front Pages Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for front-end/marketing pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\front_pages`  
**Location:** `App/Http/Controllers/Materio/front_pages/`  
**Total Controllers:** 6

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| Checkout | `content.front-pages.checkout-page` | Checkout/purchase flow page | `/checkout` |
| HelpCenter | `content.front-pages.help-center-landing` | Help center landing page | `/help-center` |
| HelpCenterArticle | `content.front-pages.help-center-article` | Individual help article page | `/help-center/article` |
| Landing | `content.front-pages.landing-page` | Marketing landing page | `/landing` or `/` |
| Payment | `content.front-pages.payment-page` | Payment processing page | `/payment` |
| Pricing | `content.front-pages.pricing-page` | Pricing/plans page | `/pricing` |

---

## 🔧 Controller Details

All 6 controllers follow the same pattern:

```php
namespace App\Http\Controllers\Materio\front_pages;

use App\Http\Controllers\Controller;

class {ControllerName} extends Controller
{
  public function index()
  {
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.{view-name}', ['pageConfigs' => $pageConfigs]);
  }
}
```

### Checkout

```php
public function index()
{
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.checkout-page', ['pageConfigs' => $pageConfigs]);
}
```

- **Purpose:** Display checkout/purchase flow UI
- **Layout:** Front-end layout (simplified, no admin chrome)
- **View:** `content.front-pages.checkout-page`

---

### HelpCenter

```php
public function index()
{
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.help-center-landing', ['pageConfigs' => $pageConfigs]);
}
```

- **Purpose:** Display help center landing page (article listing, search, categories)
- **Layout:** Front-end layout
- **View:** `content.front-pages.help-center-landing`

---

### HelpCenterArticle

```php
public function index()
{
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.help-center-article', ['pageConfigs' => $pageConfigs]);
}
```

- **Purpose:** Display individual help article page
- **Layout:** Front-end layout
- **View:** `content.front-pages.help-center-article`
- **Note:** No article ID passed — article likely determined by URL slug or middleware context

---

### Landing

```php
public function index()
{
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.landing-page', ['pageConfigs' => $pageConfigs]);
}
```

- **Purpose:** Display marketing landing page (hero, features, CTA)
- **Layout:** Front-end layout
- **View:** `content.front-pages.landing-page`

---

### Payment

```php
public function index()
{
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.payment-page', ['pageConfigs' => $pageConfigs]);
}
```

- **Purpose:** Display payment processing/confirmation page
- **Layout:** Front-end layout
- **View:** `content.front-pages.payment-page`

---

### Pricing

```php
public function index()
{
    $pageConfigs = ['myLayout' => 'front'];
    return view('content.front-pages.pricing-page', ['pageConfigs' => $pageConfigs]);
}
```

- **Purpose:** Display pricing/subscription plans page
- **Layout:** Front-end layout
- **View:** `content.front-pages.pricing-page`

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Public pages (no authentication required) |
| Data | **No data injection** — static or client-side only |
| Layout | All use `['myLayout' => 'front']` configuration |
| Pattern | One method per controller (`index()`) |
| Theme | Materio admin UI kit (front-end variant layout) |

### pageConfigs Pattern

All controllers pass `['myLayout' => 'front']` to configure a simplified/public layout variant (no sidebar, simplified navbar). This is a view-level configuration pattern.

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** Pages don't receive dynamic data (pricing tiers, help articles, checkout details, etc.)
   - Pricing page should fetch subscription plans from database
   - Help center should list articles from CMS/database
   - Checkout should receive cart/quote details
   - Payment should receive transaction/order info

2. **Article ID Missing:** HelpCenterArticle doesn't pass article identifier to view
   - Likely determined by URL slug or middleware context
   - No URL parameter visible in controller

3. **Static Content Only:** All content appears to be static or loaded client-side
   - No service dependencies
   - No API integration
   - No database queries

4. **One Controller Per Page:** Could be consolidated into a single `FrontPagesController` with 6 methods (minor)

---

## 📝 Migration Notes for Base44

### Strategy: React Pages + Optional Backend Functions

These are **Materio template demo pages** for marketing/front-end. In Base44, replace with React pages. Some pages may need backend functions for dynamic content.

### Base44 Equivalent Pages

#### Landing Page (Static)

```tsx
// pages/Landing.jsx
export default function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-accent text-white text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to Our Platform</h1>
        <p className="text-xl mb-8">Build amazing things with ease</p>
        <Link to="/pricing" className="btn btn-lg">Get Started</Link>
      </section>

      <section className="py-12 px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <h3 className="font-bold">Fast</h3>
            <p>Lightning quick performance</p>
          </Card>
          {/* More feature cards */}
        </div>
      </section>
    </div>
  );
}
```

#### Pricing Page (Dynamic)

```tsx
// Backend function: getPricingPlans
async function getPricingPlans(req) {
  const base44 = createClientFromRequest(req);
  const plans = await base44.entities.PricingPlan.list();
  return Response.json({ plans });
}

// pages/Pricing.jsx
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PricingPage() {
  const { data } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => base44.functions.invoke('getPricingPlans', {})
  });

  return (
    <div className="py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Pricing Plans</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {data?.plans?.map(plan => (
          <Card key={plan.id}>
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <p className="text-3xl font-bold my-4">${plan.price}</p>
            <ul className="space-y-2 mb-6">
              {plan.features?.map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> {f}
                </li>
              ))}
            </ul>
            <Button>Choose Plan</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### Checkout Page (With Cart Data)

```tsx
// Backend function: getCheckoutData
async function getCheckoutData(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  const cartId = await req.json().cartId;
  
  const cart = await base44.entities.Cart.get(cartId);
  return Response.json({ cart, user });
}

// pages/Checkout.jsx
export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getCheckoutData', { cartId }).then(r => setCheckoutData(r.data));
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Billing Details</h2>
        {/* Checkout form */}
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
        {/* Cart summary */}
      </div>
    </div>
  );
}
```

#### Help Center (Dynamic)

```tsx
// Backend function: getHelpArticles
async function getHelpArticles(req) {
  const base44 = createClientFromRequest(req);
  const articles = await base44.entities.HelpArticle.list();
  return Response.json({ articles });
}

// pages/HelpCenter.jsx
export default function HelpCenterPage() {
  const { data } = useQuery({
    queryKey: ['help-articles'],
    queryFn: () => base44.functions.invoke('getHelpArticles', {})
  });

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>
      <Input placeholder="Search articles..." className="mb-8" />
      <div className="space-y-4">
        {data?.articles?.map(article => (
          <Link key={article.id} to={`/help-center/${article.slug}`}>
            <Card className="hover:shadow-lg transition">
              <h3 className="font-bold">{article.title}</h3>
              <p className="text-sm text-muted-foreground">{article.excerpt}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

#### Help Center Article (Dynamic)

```tsx
// pages/HelpCenterArticle.jsx
import { useParams } from 'react-router-dom';

export default function HelpCenterArticlePage() {
  const { slug } = useParams();
  const { data: article } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => base44.functions.invoke('getHelpArticle', { slug })
  });

  if (!article) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <div className="prose prose-sm max-w-none">
        {/* Render article content (markdown or HTML) */}
        {article.content}
      </div>
    </div>
  );
}
```

#### Payment Page (Transaction Callback)

```tsx
// pages/Payment.jsx
import { useSearchParams } from 'react-router-dom';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  
  const { data: payment } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => base44.functions.invoke('getPaymentStatus', { paymentId })
  });

  return (
    <div className="text-center py-12">
      {payment?.status === 'paid' ? (
        <div>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Payment Successful</h1>
          <p>Order #{payment.order_id} confirmed</p>
        </div>
      ) : (
        <div>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p>Please try again</p>
        </div>
      )}
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import HelpCenter from './pages/HelpCenter';
import HelpCenterArticle from './pages/HelpCenterArticle';
import Payment from './pages/Payment';

<Route path="/" element={<Landing />} />
<Route path="/pricing" element={<Pricing />} />
<Route path="/checkout" element={<Checkout />} />
<Route path="/help-center" element={<HelpCenter />} />
<Route path="/help-center/:slug" element={<HelpCenterArticle />} />
<Route path="/payment" element={<Payment />} />
```

### Entities Required

| Entity | Purpose |
|--------|---------|
| `PricingPlan` | Store pricing tier data |
| `HelpArticle` | Store help/documentation articles |
| `Cart` | Store shopping cart items |
| `Payment` | Track payment transactions |
| `Order` | Store customer orders |

### Key Points

1. **Zero backend functions for static pages** (Landing) — pure React
2. **Backend functions for dynamic pages** (Pricing, Help Center, Checkout, Payment)
3. **Front-end layout:** Use a simple wrapper component without sidebars
4. **Public routes:** No authentication required
5. **Responsive design:** Mobile-first Tailwind styling
6. **Low migration priority:** Materio template demo pages
7. **Total effort: Medium** — some pages need backend functions

### Summary

All 6 Materio front page controllers are pure view renderers. In Base44, replace with simple React pages. Static pages (Landing) require no backend; dynamic pages (Pricing, Help Center, Checkout, Payment) use backend functions to fetch data from entities. Use `useQuery` for client-side data fetching and `react-router-dom` for dynamic route segments (article slugs, payment IDs).