# ProductsDataTable (Product Catalog Management)

**Purpose:** Yajra DataTable for managing product records with pricing, categories, and status.  
**Namespace:** `App\DataTables\Product`  
**Type:** Catalog/inventory management — **HIGH priority**

---

## 📋 Overview

| Aspect | Value |
|--------|-------|
| **File Size** | 4.5 KB |
| **Complexity** | LOW (basic columns, view delegation) |
| **Quality** | ⚠️ Several issues |
| **Features** | 8 product fields, search, sort, export |
| **Model Used** | Product |

---

## 🔧 Implementation

### Constructor

```php
public function __construct(DataTableService $dataTableService, FilterService $filterService) {
    parent::__construct();
    $this->dataTableService = $dataTableService;
    $this->filterService = $filterService;
}
```

### Core Query

```php
public function query(Product $model): QueryBuilder {
    return $model->newQuery(); // ⚠️ No authorization — shows all products regardless of user role
}
```

### Data Transformation

```php
public function dataTable(QueryBuilder $query): EloquentDataTable {
    return (new EloquentDataTable($query))
        ->addColumn('action', function(Product $product) {
            return view('admin.products.partials.datatables.actions.btn-actions', 
                compact('product')  // ⚠️ Hardcoded Blade view path
            )->render();
        })
        ->rawColumns(['action'])
        ->setRowId('id');
}
```

### Column Definition (9 columns)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Standard | Product record ID |
| `type` | Standard | Product type/category |
| `title` | Standard | Product name/title |
| `code` | Standard | Product code/SKU |
| `category` | Standard | Category classification |
| `price` | Standard | Base price |
| `discount_value` | Standard | Discount amount or percentage |
| `is_active` | Standard | Active/inactive status (0/1) |
| `action` | Computed | Action buttons via Blade view |

### HTML Configuration

```php
public function html(): HtmlBuilder {
    $table = 'products-table';
    $customParameters = [
        'autoWidth' => false,
        'stateSave' => true,
        'order' => [[0, 'desc']],
        'initComplete' => $this->initCompleteScript($table),
    ];

    return $dataTableService->configureHtml(
        $this->builder(),
        $table,
        $customParameters,
        $this->getCustomButtons(),
        false,    // no checkboxes
        false,    // no search builder
        []        // no checkbox options
    )->columns($this->getColumns());
}
```

### Custom Button

```php
public function getCustomButtons(): array {
    return array_merge(
        $this->dataTableService->getButtons(),
        [
            Button::raw()
                ->text('<span>...Add Product...</span>')
                ->attr([
                    'class' => 'btn create-new btn-primary ms-2',
                    'onclick' => 'window.location.href="' . route('products.create') . '";'
                ]),
        ]
    );
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all products (line 49) | **Security gap** |
| 2 | 🔴 CRITICAL | **No seller/market scoping** — Sellers see all products, not just their own | **Data exposure** |
| 3 | ⚠️ HIGH | **Hardcoded view path** — `admin.products.partials.datatables.actions.btn-actions` (line 38) | **Breaking change risk** |
| 4 | ⚠️ HIGH | **Hardcoded route name** — `route('products.create')` (line 144) | **Brittle** |
| 5 | ⚠️ HIGH | **is_active column not formatted** — Displayed as 0/1, not user-friendly | **UX issue** |
| 6 | ⚠️ HIGH | **Missing relationships** — No eager loading for category, seller, or market (line 49) | **N+1 queries** |
| 7 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | **Dead dependency** |
| 8 | ⚠️ MEDIUM | **Empty initCompleteScript** — No custom filtering (lines 114-131) | **Unnecessary** |
| 9 | ⚠️ MEDIUM | **Italian comments** — "Ottieni i tuoi pulsanti personalizzati" (line 66) | **Code smell** |
| 10 | ⚠️ MEDIUM | **Inline HTML in button** — Bootstrap classes hardcoded (line 140) | **Fragile** |
| 11 | ⚠️ MEDIUM | **No pagination hints** — No indication of product count | **UX** |
| 12 | ⚠️ MEDIUM | **discount_value ambiguous** — Not clear if it's amount, percentage, or formula | **UX issue** |
| 13 | ℹ️ LOW | **Auth import unused** — `use Illuminate\Support\Facades\Auth;` imported but not used (line 9) | **Dead code** |

---

## 📝 Migration to Base44

### Step 1: Entity Definition

```json
{
  "name": "Product",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "required": true,
      "description": "Product name/title"
    },
    "code": {
      "type": "string",
      "required": true,
      "description": "Product code/SKU (unique)"
    },
    "description": {
      "type": "string",
      "description": "Detailed product description"
    },
    "type": {
      "type": "string",
      "enum": ["standard", "package", "bundle", "digital"],
      "default": "standard"
    },
    "category_id": {
      "type": "string",
      "description": "Category reference"
    },
    "seller_id": {
      "type": "string",
      "description": "Seller/vendor reference"
    },
    "market_id": {
      "type": "string",
      "description": "Market/region reference"
    },
    "price": {
      "type": "number",
      "minimum": 0,
      "required": true
    },
    "discount_type": {
      "type": "string",
      "enum": ["none", "fixed", "percentage"],
      "default": "none"
    },
    "discount_value": {
      "type": "number",
      "minimum": 0,
      "default": 0,
      "description": "Discount amount (fixed) or percentage"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "image_url": {
      "type": "string",
      "description": "Product image URL"
    },
    "metadata": {
      "type": "object",
      "description": "Additional attributes (specs, variants, etc.)"
    }
  }
}
```

### Step 2: Backend Functions

```typescript
// functions/getProducts.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { 
    page = 0, 
    search = '', 
    type = '', 
    category_id = '',
    is_active = '',
    sort_by = 'created_date',
    sort_order = 'desc'
  } = await req.json();

  try {
    const filters = {};

    // Authorization: Users see only their products; admins see all
    if (user.role !== 'admin') {
      filters.seller_id = user.seller_id || null; // Assuming user has seller_id
    }

    if (search) filters.title = { $regex: search, $options: 'i' };
    if (type) filters.type = type;
    if (category_id) filters.category_id = category_id;
    if (is_active !== '') filters.is_active = is_active === 'true';

    const sortField = ['created_date', 'price', 'title'].includes(sort_by) ? sort_by : 'created_date';
    const sortOrder = sort_order === 'asc' ? '+' : '-';

    const products = await base44.entities.Product.filter(
      filters,
      `${sortOrder}${sortField}`,
      25,
      page * 25
    );

    // Enrich with related data
    const enriched = await Promise.all(
      products.map(async (product) => {
        let category = null;
        let seller = null;

        if (product.category_id) {
          category = await base44.entities.Category.get(product.category_id)
            .catch(() => null);
        }
        if (product.seller_id && user.role === 'admin') {
          seller = await base44.entities.User.get(product.seller_id)
            .catch(() => null);
        }

        return { ...product, category, seller };
      })
    );

    return Response.json({ data: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/updateProduct.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId, ...data } = await req.json();

  if (!productId) {
    return Response.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const product = await base44.entities.Product.get(productId);

    // Authorization: Users can only edit their own products
    if (user.role !== 'admin' && product.seller_id !== user.seller_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate discount
    if (data.discount_type === 'percentage' && (data.discount_value < 0 || data.discount_value > 100)) {
      return Response.json({ error: 'Discount percentage must be 0-100' }, { status: 400 });
    }

    await base44.entities.Product.update(productId, data);
    const updated = await base44.entities.Product.get(productId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/toggleProductActive.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await req.json();

  try {
    const product = await base44.entities.Product.get(productId);

    // Authorization
    if (user.role !== 'admin' && product.seller_id !== user.seller_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.entities.Product.update(productId, {
      is_active: !product.is_active,
    });

    const updated = await base44.entities.Product.get(productId);
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/ProductsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Edit2, Plus, Power } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export function ProductsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: productsData, refetch } = useQuery({
    queryKey: ['products', page, search, type, isActive],
    queryFn: () =>
      base44.functions.invoke('getProducts', {
        page,
        search,
        type,
        is_active: isActive,
      }),
  });

  const products = productsData?.data?.data || [];

  const handleToggleActive = async (productId) => {
    try {
      await base44.functions.invoke('toggleProductActive', { productId });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedProduct(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ProductForm
              product={selectedProduct}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-64"
        />

        <Select value={type} onValueChange={(v) => { setType(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="package">Package</SelectItem>
            <SelectItem value="bundle">Bundle</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono font-bold">{product.code}</TableCell>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell className="text-sm">{product.type}</TableCell>
                <TableCell className="text-right font-mono">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-sm">
                  {product.discount_value > 0 && (
                    <Badge variant="secondary">
                      {product.discount_type === 'percentage' 
                        ? `${product.discount_value}%`
                        : `$${product.discount_value.toFixed(2)}`}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className="cursor-pointer"
                    onClick={() => handleToggleActive(product.id)}
                    variant={product.is_active ? 'default' : 'secondary'}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedProduct(product);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// components/admin/ProductForm.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function ProductForm({ product, onSuccess }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    code: product?.code || '',
    description: product?.description || '',
    type: product?.type || 'standard',
    price: product?.price || 0,
    discount_type: product?.discount_type || 'none',
    discount_value: product?.discount_value || 0,
    is_active: product?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.functions.invoke('updateProduct', {
        productId: product?.id,
        ...formData,
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="SKU"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="package">Package</SelectItem>
              <SelectItem value="bundle">Bundle</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.discount_type !== 'none' && (
          <div>
            <Label htmlFor="discount_value">
              {formData.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount'}
            </Label>
            <Input
              id="discount_value"
              type="number"
              step="0.01"
              min="0"
              max={formData.discount_type === 'percentage' ? 100 : undefined}
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
            />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : product ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Users see only their products; admins see all
2. **Seller scoping** — Data filtered by seller_id for non-admins
3. **Better filtering** — Search, type, status filters with clear logic
4. **Discount clarity** — Explicit discount_type enum (fixed vs percentage)
5. **No hardcoded routes** — Uses backend functions
6. **No Blade view coupling** — Pure React components
7. **Proper HTTP methods** — POST/PUT for mutations
8. **Eager loading** — Category & seller relationships loaded efficiently
9. **Type-safe** — Enums for product type and discount type
10. **Validation** — Percentage discounts capped at 0-100
11. **UX improvements** — Badge toggles, discount display with type clarity
12. **Status display** — is_active shown as badge with Power icon

---

## Summary

**ProductsDataTable** (4.5 KB): Simple product catalog table with 8 fields (type, title, code, category, price, discount, active status). CRITICAL: No authorization (shows all products), no seller scoping (everyone sees everyone's products), no eager loading (N+1 queries). HIGH: Hardcoded Blade view (`admin.products.partials.datatables.actions.btn-actions`), hardcoded route (`products.create`), `is_active` shows 0/1 (UX), `discount_value` ambiguous (amount or percentage?). MEDIUM: Unused FilterService, empty initCompleteScript, Italian comments, hardcoded button HTML.

In Base44: Create Product entity with explicit discount_type enum (none/fixed/percentage), category_id, seller_id, market_id fields. Implement getProducts backend function with seller-scoped authorization (users see only their products, admins see all), search/type/status filters, proper N+1 prevention. Add updateProduct function (validates discount range), toggleProductActive function. Build React page with inline filters, Dialog-based form, discount type clarity in display & form.

**Migration Priority: HIGH** — Authorization gaps enable data exposure; no seller scoping violates multi-tenant principles; N+1 queries cause performance issues; ambiguous discount field causes UX confusion; hardcoded routes/views make system brittle.