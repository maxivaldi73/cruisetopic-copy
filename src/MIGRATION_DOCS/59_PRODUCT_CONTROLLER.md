# Product Controller

**Purpose:** Manage products (add-on services for cruise bookings).  
**Namespace:** `App\Http\Controllers\Admin\Product`  
**Location:** `App/Http/Controllers/Admin/Product/ProductController.php`  
**Type:** CRUD controller — medium priority

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| File Size | 3.2 KB |
| Methods | 6 (index, create, store, show, edit, update, destroy) |
| Auth | Likely admin-only |
| Purpose | CRUD products (extras, add-ons for quotes) |
| Related Models | Product, Market, Cruiseline, Ship, CabinType |
| Traits | MediaUploadingTrait, DropzoneMediaSyncTrait |

---

## 🔧 Controller Methods

### index(IndexProduct $action)
List all products using action.

```php
public function index(IndexProduct $action)
{
    return $action->getProducts();
}
```

**Notes:**
- Delegates to IndexProduct action (encapsulation good)
- No data injection visible in controller

---

### create(): View
Display product creation form with dropdown data.

```php
public function create(): View
{
    $markets = Market::pluck('name', 'id');
    $cruiselines = Cruiseline::pluck('name', 'id');
    $cabinTypes = CabinType::pluck('name', 'id');
    
    // Ships empty initially, populated dynamically via JS
    $ships = collect();
    
    $product = null;
    
    return view('admin.products.edit', compact(...));
}
```

**Logic:**
- Fetch all markets, cruiselines, cabin types
- Ships initialized as empty collection (populated client-side via AJAX)
- Pass null product (create mode)

---

### store(StoreProductRequest $request, ProductService $productService): RedirectResponse
Create new product.

```php
public function store(StoreProductRequest $request, ProductService $productService): RedirectResponse
{
    $productService->create($request->validated());
    
    return redirect()->route('products.index')
        ->with('success', 'Product created successfully.');
}
```

**Logic:**
- Validate using StoreProductRequest (form request validation)
- Delegate creation to ProductService
- Redirect to index with success message

**Good Pattern:** Uses form request validation and service for business logic.

---

### show(Product $product): View
Display single product.

```php
public function show(Product $product): View
{
    return view('admin.products.show', compact('product'));
}
```

Simple view rendering with model binding.

---

### edit(Product $product): View
Display product edit form.

```php
public function edit(Product $product): View
{
    $markets = Market::pluck('name', 'id');
    $cruiselines = Cruiseline::pluck('name', 'id');
    $cabinTypes = CabinType::pluck('name', 'id');
    
    // Only ships already assigned to product
    $ships = Ship::whereIn('id', $product->ships->pluck('id'))->pluck('name', 'id');
    
    return view('admin.products.edit', compact(...));
}
```

**Logic:**
- Same dropdowns as create
- Load only ships related to product (filters properly)
- Reuses 'admin.products.edit' view for create + edit

---

### update(UpdateProductRequest $request, Product $product, ProductService $service): RedirectResponse
Update product.

```php
public function update(UpdateProductRequest $request, Product $product, ProductService $service): RedirectResponse
{
    $service->update($product, $request->validated());
    
    return redirect()->route('products.index')
        ->with('success', 'Product updated successfully.');
}
```

**Logic:**
- Validate using UpdateProductRequest
- Delegate to ProductService
- Redirect to index with success

---

### destroy(Product $product): RedirectResponse
Delete product.

```php
public function destroy(Product $product): RedirectResponse
{
    $product->delete();
    
    return redirect()->route('products.index')
        ->with('success', 'Product deleted successfully.');
}
```

**Notes:**
- Direct model deletion (no service, no checks for associations)
- May cascade delete if product_id is foreign key elsewhere

---

## ⚠️ Issues & Concerns

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ MEDIUM | **No Authorization** — no gate/permission checks visible | Security risk |
| 2 | ⚠️ MEDIUM | **Unused Traits** — MediaUploadingTrait, DropzoneMediaSyncTrait declared but not used in methods | Code smell |
| 3 | ⚠️ MEDIUM | **No Cascade Protection** — destroy() doesn't check if product is in use | Data integrity risk |
| 4 | ⚠️ MEDIUM | **Inconsistent Service Use** — store/update use ProductService, destroy doesn't | Pattern inconsistency |
| 5 | ℹ️ LOW | **Italian Comments** — "Ships vuoto all'inizio, verrà popolato dinamicamente" not i18n | Localization issue |
| 6 | ℹ️ LOW | **No Input Validation in Destroy** — destroy() accepts model but no validation | Could cascade delete |
| 7 | ℹ️ LOW | **Duplicate Code** — create() and edit() fetch same dropdowns | DRY violation |
| 8 | ℹ️ LOW | **AJAX Ships Loading** — Handled client-side, depends on JS implementation | Runtime dependency |

---

## 📝 Migration Notes for Base44

### Strategy: Backend Functions + Entity

**Step 1: Create Product Entity**

```json
// entities/Product.json
{
  "name": {"type": "string"},
  "description": {"type": "string"},
  "price": {"type": "number"},
  "currency": {"type": "string"},
  "market_id": {"type": "string"},
  "cruiseline_id": {"type": "string"},
  "cabin_type_id": {"type": "string"},
  "ships": {"type": "array"},
  "is_active": {"type": "boolean", "default": true}
}
```

**Step 2: Backend Functions**

**Function: listProducts**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const products = await base44.entities.Product.list('-created_date', 100);
  return Response.json({ products });
});
```

**Function: createProduct**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, description, price, currency, market_id, cruiseline_id, cabin_type_id, ships } = await req.json();

  // Validate
  if (!name || !price) {
    return Response.json(
      { error: 'Name and price required' },
      { status: 400 }
    );
  }

  const product = await base44.entities.Product.create({
    name,
    description,
    price,
    currency: currency || 'EUR',
    market_id,
    cruiseline_id,
    cabin_type_id,
    ships: ships || [],
  });

  return Response.json({ product }, { status: 201 });
});
```

**Function: updateProduct**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, ...data } = await req.json();

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  const product = await base44.entities.Product.update(id, data);
  return Response.json({ product });
});
```

**Function: deleteProduct**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  // Check if product is in use (optional)
  // const quotes = await base44.entities.Quote.filter({ product_id: id });
  // if (quotes.length > 0) {
  //   return Response.json(
  //     { error: 'Cannot delete product in use' },
  //     { status: 409 }
  //   );
  // }

  await base44.entities.Product.delete(id);
  return Response.json({ success: true });
});
```

**Step 3: React Component**

```tsx
// pages/admin/ProductsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'EUR',
    market_id: '',
    cruiseline_id: '',
    cabin_type_id: '',
  });

  const { data, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.functions.invoke('listProducts', {}),
  });

  const { data: dropdowns } = useQuery({
    queryKey: ['dropdowns'],
    queryFn: () => base44.functions.invoke('getProductDropdowns', {}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createProduct', data),
    onSuccess: () => {
      refetch();
      setOpen(false);
      setFormData({ name: '', description: '', price: 0, currency: 'EUR' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateProduct', data),
    onSuccess: () => {
      refetch();
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteProduct', { id }),
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ ...formData, id: editing.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => setOpen(true)}>Add Product</Button>
      </div>

      <DataGrid
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price' },
          { key: 'currency', label: 'Currency' },
          { key: 'description', label: 'Description' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setEditing(row);
                  setFormData(row);
                  setOpen(true);
                }}>Edit</Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate(row.id)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.products || []}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
            <Select value={formData.market_id} onValueChange={(v) => setFormData({ ...formData, market_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns?.markets?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">
              {editing ? 'Update' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Key Improvements

1. **Authorization** — Admin-only enforced in backend functions
2. **Validation** — Input validation before database operations
3. **Cascade Protection** — Optional check for product in use before deletion
4. **No Unused Traits** — Remove if not used
5. **Consistent Service Use** — All CRUD operations validate and handle errors
6. **English Messages** — i18n-friendly
7. **No Duplicate Code** — Consolidate dropdowns into helper function
8. **Server-side Ships** — Load ships via backend based on selected cruiseline

---

## Summary

ProductController (3.2KB) manages product CRUD using ProductService and form request validation. Issues: no authorization, unused media traits, no cascade protection on delete, duplicate code in create/edit. Good patterns: delegates to service, uses form request validation, model binding.

In Base44: Create Product entity, extract to backend functions with authorization/validation, implement React CRUD page with DataGrid and dialog forms.

**Migration Priority: MEDIUM** — straightforward conversion, good existing patterns, only security/validation improvements needed.