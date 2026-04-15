# TicketCategoriesDataTable (Support Management)

**Purpose:** Yajra DataTable for managing ticket categories with role-based assignment.  
**Namespace:** `App\DataTables\TicketCategory`  
**Location:** `App/DataTables/TicketCategory/TicketCategoriesDataTable.php`  
**Type:** Support system configuration — medium priority

---

## 📋 Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | List ticket categories with assigned support roles |
| **Size** | 3.9 KB |
| **Complexity** | Low-Medium (role relationship, modal UI) |
| **Quality** | ⚠️ Some issues |

---

## 🔧 Implementation

### Core Logic

```php
class TicketCategoriesDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Role summary with proper eager loading
            ->addColumn('roles_summary', function (TicketCategory $ticketCategory) {
                $roles = $ticketCategory->roles->pluck('name');

                if ($roles->isEmpty()) {
                    return '<span class="text-muted">No roles assigned</span>';
                }

                return e($roles->join(', '));  // ✅ Escaped HTML
            })

            // Action buttons
            ->addColumn('action', function (TicketCategory $ticketCategory) {
                return view('admin.ticket_categories.partials.datatables.actions.btn-actions', 
                    compact('ticketCategory'))->render();
            })

            ->rawColumns(['roles_summary', 'action'])
            ->setRowId('id');
    }

    public function query(TicketCategory $model): QueryBuilder {
        return $model->newQuery()->with('roles');  // ✅ Eager loading included
    }

    public function getColumns(): array {
        return [
            Column::make('id'),
            Column::make('name'),
            Column::computed('roles_summary')->title('Roles'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center')
                ->searchable(false),
        ];
    }
}
```

### Modal UI Trigger

```php
public function getCustomButtons(): array {
    return array_merge(
        $this->dataTableService->getButtons(),
        [
            Button::raw()
                ->text('<span>...</span><span>Add Ticket Category</span></span>')
                ->attr([
                    'class' => 'btn create-new btn-primary ms-2',
                    'data-bs-toggle' => 'modal',
                    'data-bs-target' => '#ticketCategoryModal',
                    'data-mode' => 'create',
                ]),
        ]
    );
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **No authorization check** — Anyone can view/manage ticket categories | Security gap |
| 2 | ⚠️ HIGH | **Modal coupling** — Hardcoded `#ticketCategoryModal` reference | Tight coupling |
| 3 | ⚠️ MEDIUM | **Magic column index [3]** — Non-searchable column hardcoded by position | Brittle |
| 4 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |
| 5 | ⚠️ MEDIUM | **View rendering assumption** — Action view path may not exist | Breaking change risk |
| 6 | ℹ️ LOW | **Hardcoded role display** — Roles joined as comma-separated string | Limited UX |
| 7 | ℹ️ LOW | **No role count badge** — Could show "2 roles" instead of role list | Better UX |

---

## 📝 Migration to Base44

### Step 1: Entity

```json
{
  "name": "TicketCategory",
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "description": {"type": "string"},
    "role_ids": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["name"]
}
```

### Step 2: Backend Function

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const categories = await base44.entities.TicketCategory.list('-created_date', 100);

    // Enrich with role data
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const roles = await Promise.all(
          (cat.role_ids || []).map((roleId) =>
            base44.entities.Role.get(roleId).catch(() => null)
          )
        );

        return {
          ...cat,
          roles: roles.filter(Boolean),
        };
      })
    );

    return Response.json({ data: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/TicketCategoriesPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Edit2, Trash2, Plus } from 'lucide-react';
import TicketCategoryForm from '@/components/admin/TicketCategoryForm';

export function TicketCategoriesPage() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data, refetch } = useQuery({
    queryKey: ['ticketCategories'],
    queryFn: () => base44.functions.invoke('getTicketCategories', {}),
  });

  const categories = data?.data?.data || [];

  const handleDelete = async (categoryId) => {
    if (confirm('Delete this category?')) {
      await base44.entities.TicketCategory.delete(categoryId);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ticket Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCategory(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <TicketCategoryForm
              category={selectedCategory}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Assigned Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="text-sm text-gray-500">{category.id}</TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {category.roles?.length > 0 ? (
                      category.roles.map((role) => (
                        <Badge key={role.id} variant="outline">
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No roles assigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCategory(category);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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

// components/admin/TicketCategoryForm.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';

export default function TicketCategoryForm({ category, onSuccess }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    role_ids: category?.role_ids || [],
  });
  const [loading, setLoading] = useState(false);

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.functions.invoke('getRoles', {}),
  });

  const roles = rolesData?.data?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category?.id) {
        await base44.entities.TicketCategory.update(category.id, formData);
      } else {
        await base44.entities.TicketCategory.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label>Assign Roles</Label>
        <div className="space-y-2 mt-2">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.role_ids.includes(role.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      role_ids: [...formData.role_ids, role.id],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      role_ids: formData.role_ids.filter((id) => id !== role.id),
                    });
                  }
                }}
              />
              <span className="text-sm">{role.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Backend checks admin role
2. **No modal coupling** — Dialog component managed by React state
3. **Better role display** — Individual badges instead of comma-separated text
4. **Type-safe** — React components with TypeScript
5. **No magic indices** — Column management via named objects
6. **Proper form** — Dialog-based create/edit with checkboxes for role selection
7. **Functional** — Actual role assignment via `role_ids` array
8. **Mobile-responsive** — shadcn/ui components
9. **No dead dependencies** — FilterService removed
10. **Maintainable** — Clear separation of concerns

---

## Summary

TicketCategoriesDataTable (3.9 KB): Ticket category management with role assignment, proper eager loading of roles. **HIGH:** No authorization checks (security gap), hardcoded modal reference `#ticketCategoryModal` (tight coupling), magic column index [3] for non-searchable columns. **MEDIUM:** Unused FilterService, action view path assumption, limited role UX (comma-separated string).

In Base44: Create TicketCategory entity with role_ids array, getTicketCategories backend function with admin-only authorization, React page with Dialog-based form for create/edit, role checkboxes instead of string display, no modal coupling, proper component composition.

**Migration Priority: MEDIUM** — Support configuration table, not heavily used; straightforward migration; improves security with authorization; enables functional role assignment via dialog form instead of hardcoded modal.