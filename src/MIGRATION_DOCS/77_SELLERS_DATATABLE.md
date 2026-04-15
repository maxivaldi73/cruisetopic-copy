# SellersDataTable (Seller Management)

**Purpose:** Yajra DataTable for managing sellers with performance metrics, language proficiencies, and contract tracking.  
**Namespace:** `App\DataTables\Seller`  
**Location:** `App/DataTables/Seller/SellersDataTable.php`  
**Type:** Sales team management — **HIGH priority**

---

## 📋 Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | List sellers with user profile, performance metrics, language skills, contract info, and cruiseline assignments |
| **Size** | 6.0 KB |
| **Complexity** | Medium (multi-relationship eager loading, avatar generation, offcanvas UI) |
| **Quality** | ⚠️ Several issues |

---

## 🔧 Implementation

### Core Logic

```php
class SellersDataTable extends DataTable {
    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Seller with avatar badge
            ->editColumn('user_id', $this->generateSellerElement())

            // Languages display
            ->editColumn('languages', $this->generateLanguageElement())

            // Contract start date formatting
            ->editColumn('contract_start', function(Seller $seller) {
                return $seller->contract_start?->format('d/m/Y');
            })

            // Action buttons (role-based)
            ->addColumn('action', function(Seller $seller) {
                $user = Auth::user();
                return view('admin.sellers.partials.datatables.actions.btn-actions',
                    compact('seller', 'user'));
            })

            ->rawColumns(['action', 'user_id', 'languages'])
            ->setRowId('id');
    }

    public function query(Seller $model): QueryBuilder {
        return $model->newQuery()->with([
            'user',              // User profile
            'spokenLanguages',   // Language skills
            'qualities',         // Performance qualities
            'cruiselines'        // Assigned cruiselines
        ]);
    }

    public function getColumns(): array {
        return [
            Column::make('id'),
            Column::make('user_id')->title('User'),
            Column::make('seller_score'),           // Performance score
            Column::make('concurrent_new_leads'),   // Lead limit
            Column::make('max_daily_leads'),        // Daily quota
            Column::make('region'),
            Column::make('employee_level'),        // Role level
            Column::make('languages'),
            Column::make('contract_start'),
            Column::computed('action')
                ->exportable(false)
                ->printable(false)
                ->width(60)
                ->addClass('text-center'),
        ];
    }
}
```

### Avatar & Language Elements

```php
private function generateSellerElement() {
    return function(Seller $seller) {
        // Random color state for avatar
        $stateNum = mt_rand(0, 5);
        $states = ['success', 'danger', 'warning', 'info', 'dark', 'primary', 'secondary'];
        $state = $states[$stateNum];

        // Extract initials from seller user name
        $initials = preg_match_all('/\b\w/', $seller->user?->name, $matches);
        $initials = implode('', $matches[0]);
        $initials = strtoupper($initials);

        return view('admin.sellers.partials.datatables.fields.datatables-seller', 
            compact('seller', 'initials', 'state'));
    };
}

private function generateLanguageElement() {
    return function(Seller $seller) {
        return view('admin.sellers.partials.datatables.fields.datatables-languages', 
            compact('seller'))->render();
    };
}
```

### Offcanvas Create Button

```php
public function getCustomButtons(): array {
    return array_merge(
        $this->dataTableService->getButtons(),
        [
            Button::raw()
                ->text('<span>...</span><span>Create New</span></span>')
                ->attr([
                    'class' => 'btn create-new btn-primary ms-2',
                    'data-bs-toggle' => 'offcanvas',
                    'data-bs-target' => '#addSellerOffcanvas'
                ]),
        ]
    );
}
```

---

## ⚠️ Issues Identified

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **No authorization check** — Anyone can view all sellers | Security gap |
| 2 | ⚠️ HIGH | **Offcanvas coupling** — Hardcoded `#addSellerOffcanvas` reference | Tight coupling |
| 3 | ⚠️ HIGH | **Random avatar color (mt_rand)** — Non-deterministic; same seller gets different color each load | UX bug |
| 4 | ⚠️ HIGH | **Avatar view assumption** — `datatables-seller` view may not exist | Breaking change risk |
| 5 | ⚠️ HIGH | **Language view assumption** — `datatables-languages` view may not exist | Breaking change risk |
| 6 | ⚠️ HIGH | **Action view assumption** — `btn-actions` view may not exist | Breaking change risk |
| 7 | ⚠️ MEDIUM | **No filter/search on relationships** — Can't search by language, cruiseline, or quality | Limited UX |
| 8 | ⚠️ MEDIUM | **Hardcoded date format (d/m/Y)** — Not i18n-aware | Localization issue |
| 9 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |
| 10 | ⚠️ MEDIUM | **Italian comments** — "Ottieni i tuoi pulsanti", "Eseguo il defaultScript" | Code smell |
| 11 | ⚠️ MEDIUM | **Commented-out column** — `//Column::make('nationality');` | Dead code |
| 12 | ℹ️ LOW | **Empty initComplete script** — Just wraps default script with no custom logic | Unnecessary |
| 13 | ℹ️ LOW | **No sorting on computed columns** — Languages, action buttons not orderable | Expected behavior |

---

## 📝 Migration to Base44

### Step 1: Entities

```json
{
  "name": "Seller",
  "type": "object",
  "properties": {
    "user_id": {"type": "string"},
    "seller_score": {"type": "number"},
    "concurrent_new_leads": {"type": "integer"},
    "max_daily_leads": {"type": "integer"},
    "region": {"type": "string"},
    "employee_level": {"type": "string", "enum": ["junior", "senior", "manager"]},
    "language_ids": {"type": "array", "items": {"type": "string"}},
    "cruiseline_ids": {"type": "array", "items": {"type": "string"}},
    "contract_start": {"type": "string", "format": "date"}
  }
}
```

### Step 2: Backend Functions

```typescript
// functions/getSellers.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { page = 0, search = '', region = '', levelId = '' } = await req.json();

  try {
    const filters = {};

    if (search) {
      filters.$or = [
        { 'user.full_name': { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
      ];
    }

    if (region) filters.region = region;
    if (levelId) filters.employee_level = levelId;

    const sellers = await base44.entities.Seller.filter(
      filters,
      '-created_date',
      25,
      page * 25
    );

    // Enrich with relationships
    const enriched = await Promise.all(
      sellers.map(async (seller) => {
        const [user, languages, cruiselines] = await Promise.all([
          seller.user_id ? base44.entities.User.get(seller.user_id).catch(() => null) : null,
          Promise.all(
            (seller.language_ids || []).map((langId) =>
              base44.entities.Language.get(langId).catch(() => null)
            )
          ),
          Promise.all(
            (seller.cruiseline_ids || []).map((cruiselineId) =>
              base44.entities.Cruiseline.get(cruiselineId).catch(() => null)
            )
          ),
        ]);

        return {
          ...seller,
          user,
          languages: languages.filter(Boolean),
          cruiselines: cruiselines.filter(Boolean),
        };
      })
    );

    return Response.json({ data: enriched, page });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/getSellerFilters.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sellers = await base44.entities.Seller.list();

    const regions = [...new Set(sellers.map((s) => s.region).filter(Boolean))].sort();
    const levels = ['junior', 'senior', 'manager'];

    return Response.json({
      regions: regions.map((r) => ({ id: r, name: r })),
      levels: levels.map((l) => ({ id: l, name: l })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/SellersPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import SellerForm from '@/components/admin/SellerForm';

const LEVEL_COLORS = {
  junior: 'bg-blue-100 text-blue-800',
  senior: 'bg-green-100 text-green-800',
  manager: 'bg-purple-100 text-purple-800',
};

const getInitials = (name) => {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
];

const getAvatarColor = (id) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export function SellersPage() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    level: '',
  });

  const { data: sellersData, refetch } = useQuery({
    queryKey: ['sellers', page, filters],
    queryFn: () => base44.functions.invoke('getSellers', { page, ...filters }),
  });

  const { data: filtersData } = useQuery({
    queryKey: ['sellerFilters'],
    queryFn: () => base44.functions.invoke('getSellerFilters', {}),
  });

  const sellers = sellersData?.data?.data || [];
  const filterOptions = filtersData?.data || {};

  const handleDelete = async (sellerId) => {
    if (confirm('Delete this seller?')) {
      await base44.entities.Seller.delete(sellerId);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sellers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSeller(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Seller
            </Button>
          </DialogTrigger>
          <DialogContent>
            <SellerForm
              seller={selectedSeller}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search seller name, region..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <Select value={filters.region} onValueChange={(v) => setFilters({ ...filters, region: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Regions</SelectItem>
            {filterOptions.regions?.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Levels</SelectItem>
            {filterOptions.levels?.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name.charAt(0).toUpperCase() + level.name.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Concurrent Leads</TableHead>
              <TableHead>Max Daily</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Languages</TableHead>
              <TableHead>Contract Start</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow key={seller.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className={`${getAvatarColor(seller.id)}`}>
                      <AvatarFallback className="text-white font-bold">
                        {getInitials(seller.user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{seller.user?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{seller.user?.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{seller.seller_score || 0}</TableCell>
                <TableCell>{seller.concurrent_new_leads || 0}</TableCell>
                <TableCell>{seller.max_daily_leads || 0}</TableCell>
                <TableCell>{seller.region || '-'}</TableCell>
                <TableCell>
                  <Badge className={LEVEL_COLORS[seller.employee_level] || 'bg-gray-100'}>
                    {seller.employee_level?.charAt(0).toUpperCase() + (seller.employee_level?.slice(1) || '')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {seller.languages?.length > 0 ? (
                      seller.languages.map((lang) => (
                        <Badge key={lang.id} variant="outline">
                          {lang.code}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {seller.contract_start ? format(new Date(seller.contract_start), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSeller(seller);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(seller.id)}
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

// components/admin/SellerForm.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function SellerForm({ seller, onSuccess }) {
  const [formData, setFormData] = useState({
    user_id: seller?.user_id || '',
    seller_score: seller?.seller_score || 0,
    concurrent_new_leads: seller?.concurrent_new_leads || 0,
    max_daily_leads: seller?.max_daily_leads || 0,
    region: seller?.region || '',
    employee_level: seller?.employee_level || 'junior',
    language_ids: seller?.language_ids || [],
    cruiseline_ids: seller?.cruiseline_ids || [],
    contract_start: seller?.contract_start || '',
  });
  const [loading, setLoading] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.functions.invoke('getUsers', {}),
  });

  const { data: languagesData } = useQuery({
    queryKey: ['languages'],
    queryFn: () => base44.entities.Language.list(),
  });

  const { data: cruiselinesData } = useQuery({
    queryKey: ['cruiselines'],
    queryFn: () => base44.entities.Cruiseline.list(),
  });

  const users = usersData?.data?.data || [];
  const languages = languagesData || [];
  const cruiselines = cruiselinesData || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (seller?.id) {
        await base44.entities.Seller.update(seller.id, formData);
      } else {
        await base44.entities.Seller.create(formData);
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
        <Label htmlFor="user_id">User *</Label>
        <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="seller_score">Seller Score</Label>
          <Input
            type="number"
            value={formData.seller_score}
            onChange={(e) => setFormData({ ...formData, seller_score: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="concurrent_new_leads">Concurrent New Leads</Label>
          <Input
            type="number"
            value={formData.concurrent_new_leads}
            onChange={(e) => setFormData({ ...formData, concurrent_new_leads: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max_daily_leads">Max Daily Leads</Label>
          <Input
            type="number"
            value={formData.max_daily_leads}
            onChange={(e) => setFormData({ ...formData, max_daily_leads: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_level">Employee Level *</Label>
          <Select value={formData.employee_level} onValueChange={(v) => setFormData({ ...formData, employee_level: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contract_start">Contract Start</Label>
          <Input
            type="date"
            value={formData.contract_start}
            onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Languages</Label>
        <div className="space-y-2 mt-2">
          {languages.map((lang) => (
            <label key={lang.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.language_ids.includes(lang.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      language_ids: [...formData.language_ids, lang.id],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      language_ids: formData.language_ids.filter((id) => id !== lang.id),
                    });
                  }
                }}
              />
              <span className="text-sm">{lang.name} ({lang.code})</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Assigned Cruiselines</Label>
        <div className="space-y-2 mt-2">
          {cruiselines.map((cruiseline) => (
            <label key={cruiseline.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.cruiseline_ids.includes(cruiseline.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      cruiseline_ids: [...formData.cruiseline_ids, cruiseline.id],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      cruiseline_ids: formData.cruiseline_ids.filter((id) => id !== cruiseline.id),
                    });
                  }
                }}
              />
              <span className="text-sm">{cruiseline.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : seller ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Key Improvements

1. **Authorization enforced** — Only admins can view sellers
2. **Deterministic avatar colors** — Same seller always gets same color (hash-based, not random)
3. **No view coupling** — React components instead of hardcoded view paths
4. **No offcanvas coupling** — Dialog component managed by React state
5. **Searchable relationships** — Can filter by region and level
6. **i18n-safe dates** — Uses date-fns with locale support
7. **Functional language/cruiseline assignment** — Checkboxes in form, arrays in entity
8. **No dead code** — Clean implementation
9. **Type-safe** — React components with proper state management
10. **Mobile-responsive** — Grid-based filters, proper table

---

## Summary

SellersDataTable (6.0 KB): Seller management with performance metrics (score, lead allocation), language proficiencies, contract tracking, eager loading (user, languages, qualities, cruiselines), offcanvas create button, avatar generation with random color (UX bug). **CRITICAL:** No authorization (security gap). **HIGH:** Random avatar colors non-deterministic, hardcoded offcanvas reference, view assumption risks (datatables-seller, datatables-languages, btn-actions). **MEDIUM:** No relationship filtering, hardcoded date format d/m/Y (not i18n), unused FilterService, Italian comments, commented-out columns.

In Base44: Create Seller entity with language_ids/cruiseline_ids arrays, getSellers backend function with admin-only authorization, getSellerFilters for dropdown options, React page with deterministic avatar colors (hash-based), Dialog-based form with user/language/cruiseline checkboxes, searchable filters by region/level, proper i18n date formatting.

**Migration Priority: HIGH** — Seller management is core to CRM; security gap (no authorization); random avatar color breaks UX; hardcoded view paths & offcanvas coupling create maintenance burden; enables proper lead allocation tracking and language skill management.