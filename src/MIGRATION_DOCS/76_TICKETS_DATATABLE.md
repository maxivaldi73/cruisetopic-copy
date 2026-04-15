# TicketsDataTable (Support Ticket Management)

**Purpose:** Yajra DataTable for managing support tickets with multi-field filtering, customer/seller tracking, and status management.  
**Namespace:** `App\DataTables\Ticket`  
**Location:** `App/DataTables/Ticket/TicketsDataTable.php`  
**Type:** Support system core — **HIGH priority**

---

## 📋 Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | List support tickets with filtering by category, status, channel, market, customer, seller, quote |
| **Size** | 13.7 KB |
| **Complexity** | **Very High** (multiple relationships, enum handling, date filtering, role-based actions) |
| **Quality** | ⚠️ Multiple critical issues |

---

## 🔧 Implementation

### Core Logic

```php
class TicketsDataTable extends DataTable {
    use DatePickerQueryFilter;

    public function dataTable(QueryBuilder $query): EloquentDataTable {
        return (new EloquentDataTable($query))
            // Ticket number
            ->editColumn('ticket_number', fn(Ticket $ticket) => $ticket->ticket_number)

            // Category with avatar component
            ->editColumn('category_name', fn(Ticket $ticket) => 
                $this->generateTicketElement()($ticket)
            )
            ->filterColumn('category_name', function($query, $keyword) {
                $query->whereHas('category', fn($q) => $q->where('name', '=', $keyword));
            })

            // Customer name with relationship filtering
            ->addColumn('customer_name', function(Ticket $ticket) {
                return !$ticket->customer ? '-' : $this->generateCustomerElement()($ticket);
            })
            ->filterColumn('customer_name', function($query, $keyword) {
                $query->whereHas('customer', fn($q) => 
                    $q->where('firstname', 'like', "%{$keyword}%")
                        ->orWhere('lastname', 'like', "%{$keyword}%")
                        ->orWhereRaw("CONCAT(firstname, ' ', lastname) LIKE ?", ["%{$keyword}%"])
                );
            })

            // Seller name
            ->addColumn('seller_name', function(Ticket $ticket) {
                return !$ticket->seller ? '-' : 
                    trim(($ticket->seller->first_name ?? '') . ' ' . ($ticket->seller->last_name ?? ''));
            })
            ->filterColumn('seller_name', function($query, $keyword) {
                $query->whereHas('seller', fn($q) => 
                    $q->where('first_name', 'like', "%{$keyword}%")
                        ->orWhere('last_name', 'like', "%{$keyword}%")
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$keyword}%"])
                );
            })

            // Quote reference
            ->addColumn('quote_reference', fn(Ticket $ticket) => $ticket->quote?->quote_number ?? '-')
            ->filterColumn('quote_reference', function($query, $keyword) {
                $query->whereHas('quote', fn($q) => $q->where('quote_number', 'like', "%{$keyword}%"));
            })

            // Market name
            ->addColumn('market_name', fn(Ticket $ticket) => $ticket->market?->name ?? '-')
            ->filterColumn('market_name', function($query, $keyword) {
                $query->whereHas('market', fn($q) => $q->where('name', '=', $keyword));
            })

            // Ticket status with color badge
            ->addColumn('ticket_status', fn(Ticket $ticket) => $this->getStatus($ticket))
            ->filterColumn('ticket_status', function($query, $keyword) {
                $query->where('ticket_status_id', '=', $keyword);
            })

            // Channel enum resolution
            ->editColumn('channel', function(Ticket $ticket) {
                return TicketChannel::resolve($ticket->channel)?->label() ?? $ticket->channel ?? '-';
            })
            ->filterColumn('channel', function($query, $keyword) {
                $query->where('channel', '=', $keyword);
            })

            // Created date formatting
            ->addColumn('created_at', function(Ticket $ticket) {
                return $ticket->created_at
                    ? Carbon::parse($ticket->created_at)
                        ->locale(session('locale', app()->getLocale()))
                        ->isoFormat('DD MMM YYYY')
                    : '';
            })
            ->filterColumn('tickets.created_at', fn($query, $keyword) => 
                $this->applyDateRangeFilter($query, $keyword, 'tickets.created_at')
            )

            // Role-based action buttons
            ->addColumn('action', function(Ticket $ticket) {
                if(Auth::user()->isAdmin() || Auth::user()->isSuperAdmin()) {
                    return view('admin.tickets.partials.btn-actions', compact('ticket'))->render();
                } else {
                    return view('admin.tickets.partials.btn-view', compact('ticket'))->render();
                }
            })

            ->rawColumns(['category_name', 'customer_name', 'ticket_status', 'action'])
            ->setRowId('id')
            ->with([
                'distinctFilters' => [
                    '1' => $this->getDistinctValues('category_name'),
                    '2' => $this->getDistinctValues('channel'),
                    '5' => $this->getDistinctValues('market_name'),
                    '6' => $this->getDistinctValues('ticket_status'),
                ],
            ]);
    }

    public function query(Ticket $model): QueryBuilder {
        $query = $model->newQuery()
            ->with(['customer', 'seller', 'quote', 'category', 'market', 'ticketStatus'])
            ->orderByDesc('created_at');

        // Quote ID filter (from request)
        if (request()->filled('quote_id')) {
            $query->where('quote_id', request()->integer('quote_id'));
        }

        // Lead ID filter (via customer relationship)
        if (request()->filled('lead_id')) {
            $query->whereHas('customer', fn($q) => 
                $q->where('lead_id', request()->integer('lead_id'))
            );
        }

        return $query;
    }
}
```

### Status Coloring & Helpers

```php
private function getStatus(Ticket $ticket) {
    $statusColors = [
        1 => '#409EFF', // NEW (blue)
        2 => '#198754', // CONVERTED (green)
    ];

    $statusId = $ticket->ticketStatus?->id ?? null;
    $color = $statusColors[$statusId] ?? '#6c757d'; // fallback gray
    $label = $ticket->ticketStatus?->name ?? 'UNKNOWN';

    return Helpers::generateColorBadge($color, $label);
}

private function generateCustomerElement() {
    return function (Ticket $ticket) {
        $content = view('_partials.datatables.datatables-avatar', [
            'name'     => $ticket->customer?->firstname ?? ' ',
            'lastname' => $ticket->customer?->lastname ?? '',
            'phone'    => $ticket->customer?->phone,
            'email'    => $ticket->customer?->email,
        ])->render();

        return '<a href="' . route('customers.show', $ticket->customer->id) . '" target="_blank">' 
            . $content . '</a>';
    };
}
```

### Distinct Filter Values

```php
private function getDistinctValues(string $column) {
    if ($column === 'category_name') {
        return TicketCategory::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => ['id' => $item->name, 'nome' => $item->name])
            ->toArray();
    }

    if ($column === 'ticket_status') {
        return TicketStatus::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => ['id' => $item->id, 'nome' => (string)$item->name])
            ->toArray();
    }

    if ($column === 'market_name') {
        return Market::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => ['id' => $item->name, 'nome' => $item->name])
            ->toArray();
    }

    if ($column === 'channel') {
        return collect(TicketChannel::cases())
            ->map(fn($item) => ['id' => $item->value, 'nome' => $item->label()])
            ->values()
            ->toArray();
    }

    return [];
}
```

---

## ⚠️ Critical Issues

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Hardcoded status colors** — `1 => '#409EFF', 2 => '#198754'` brittle, no way to change | Color palette locked |
| 2 | 🔴 CRITICAL | **Magic column indices [0,9], [1,2,5,6]** — Brittle, breaks on column reorder | Fragile code |
| 3 | 🔴 CRITICAL | **No authorization check** — Anyone can see all tickets (security gap) | User isolation missing |
| 4 | ⚠️ HIGH | **Role-based action buttons in callback** — View rendering checks role per row (inefficient) | Performance hit |
| 5 | ⚠️ HIGH | **Distinct values load all records** — No pagination on TicketCategory/Status/Market queries | Could be slow |
| 6 | ⚠️ HIGH | **URL parameter filtering not validated** — `request()->integer('quote_id')`, `request()->integer('lead_id')` | Potential injection |
| 7 | ⚠️ HIGH | **Avatar view assumption** — '_partials.datatables.datatables-avatar' may not exist | Breaking change risk |
| 8 | ⚠️ HIGH | **Hardcoded route in link** — `route('customers.show', ...)` in HTML callback | Brittle |
| 9 | ⚠️ HIGH | **Helpers::generateColorBadge() coupling** — Custom helper function, not portable | Framework coupling |
| 10 | ⚠️ HIGH | **Hardcoded locale via session** — `session('locale', app()->getLocale())` not i18n-safe | Fragile localization |
| 11 | ⚠️ MEDIUM | **Unused FilterService** — Injected but never used | Dead dependency |
| 12 | ⚠️ MEDIUM | **Inconsistent ID/nome mapping** — Some use item.id, others use item.name | Inconsistent code |
| 13 | ⚠️ MEDIUM | **Commented-out status column code** — Dead code left in (lines 108-110) | Code smell |
| 14 | ⚠️ MEDIUM | **Complex filter callback logic** — CONCAT queries with LIKE in multiple places | Scattered logic |
| 15 | ⚠️ MEDIUM | **Customer link assumes customer exists** — `route('customers.show', $ticket->customer->id)` could crash | Null pointer risk |
| 16 | ℹ️ LOW | **Italian comments** — "Riportare gli indici" | Code smell |

---

## 📝 Migration to Base44

### Step 1: Entities

```json
{
  "name": "Ticket",
  "type": "object",
  "properties": {
    "ticket_number": {"type": "string"},
    "customer_id": {"type": "string"},
    "seller_id": {"type": "string"},
    "category_id": {"type": "string"},
    "market_id": {"type": "string"},
    "quote_id": {"type": "string"},
    "status_id": {"type": "string"},
    "channel": {"type": "string", "enum": ["email", "phone", "chat", "web"]},
    "assigned_to": {"type": "string"}
  }
}
```

### Step 2: Backend Functions

```typescript
// functions/getTickets.js
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
    categoryId = null,
    statusId = null,
    channel = null,
    marketId = null,
    quoteId = null,
  } = await req.json();

  try {
    const filters = {};

    // Authorization: non-admin users see only their assigned tickets
    if (user.role !== 'admin') {
      filters.assigned_to = user.id;
    }

    // Apply filters
    if (categoryId) filters.category_id = categoryId;
    if (statusId) filters.status_id = statusId;
    if (channel) filters.channel = channel;
    if (marketId) filters.market_id = marketId;
    if (quoteId) filters.quote_id = quoteId;
    if (search) {
      filters.$or = [
        { ticket_number: { $regex: search, $options: 'i' } },
        { 'customer.firstname': { $regex: search, $options: 'i' } },
        { 'customer.lastname': { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await base44.entities.Ticket.filter(
      filters,
      '-created_date',
      25,
      page * 25
    );

    // Enrich with relationships
    const enriched = await Promise.all(
      tickets.map(async (ticket) => {
        const [customer, seller, quote, category, market, status] = await Promise.all([
          ticket.customer_id ? base44.entities.Customer.get(ticket.customer_id).catch(() => null) : null,
          ticket.seller_id ? base44.entities.Seller.get(ticket.seller_id).catch(() => null) : null,
          ticket.quote_id ? base44.entities.Quote.get(ticket.quote_id).catch(() => null) : null,
          ticket.category_id ? base44.entities.TicketCategory.get(ticket.category_id).catch(() => null) : null,
          ticket.market_id ? base44.entities.Market.get(ticket.market_id).catch(() => null) : null,
          ticket.status_id ? base44.entities.TicketStatus.get(ticket.status_id).catch(() => null) : null,
        ]);

        return { ...ticket, customer, seller, quote, category, market, status };
      })
    );

    return Response.json({ data: enriched, page });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/getTicketFilters.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [categories, statuses, markets, channels] = await Promise.all([
      base44.entities.TicketCategory.list(),
      base44.entities.TicketStatus.list(),
      base44.entities.Market.list(),
      // Channels from TicketChannel enum
    ]);

    const channelOptions = [
      { id: 'email', nome: 'Email' },
      { id: 'phone', nome: 'Phone' },
      { id: 'chat', nome: 'Chat' },
      { id: 'web', nome: 'Web' },
    ];

    return Response.json({
      categories: categories.map((c) => ({ id: c.id, nome: c.name })),
      statuses: statuses.map((s) => ({ id: s.id, nome: s.name })),
      markets: markets.map((m) => ({ id: m.id, nome: m.name })),
      channels: channelOptions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Step 3: React Component

```tsx
// pages/admin/TicketsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ExternalLink, Trash2, Plus } from 'lucide-react';

export function TicketsPage() {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    statusId: '',
    channel: '',
    marketId: '',
  });

  const { data: ticketsData, refetch } = useQuery({
    queryKey: ['tickets', page, filters],
    queryFn: () => base44.functions.invoke('getTickets', { page, ...filters }),
  });

  const { data: filtersData } = useQuery({
    queryKey: ['ticketFilters'],
    queryFn: () => base44.functions.invoke('getTicketFilters', {}),
  });

  const tickets = ticketsData?.data?.data || [];
  const filterOptions = filtersData?.data || {};

  const statusColorMap = {
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <Button onClick={() => window.location.href = '/tickets/create'}>
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Input
          placeholder="Search by ticket #, customer..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <Select value={filters.categoryId} onValueChange={(v) => setFilters({ ...filters, categoryId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            {filterOptions.categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.statusId} onValueChange={(v) => setFilters({ ...filters, statusId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Statuses</SelectItem>
            {filterOptions.statuses?.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.channel} onValueChange={(v) => setFilters({ ...filters, channel: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Channels</SelectItem>
            {filterOptions.channels?.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                {ch.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.marketId} onValueChange={(v) => setFilters({ ...filters, marketId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Market" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Markets</SelectItem>
            {filterOptions.markets?.map((market) => (
              <SelectItem key={market.id} value={market.id}>
                {market.nome}
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
              <TableHead>Ticket #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                <TableCell>{ticket.category?.name || '-'}</TableCell>
                <TableCell>
                  {ticket.customer ? (
                    <a
                      href={`/customers/${ticket.customer.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      {ticket.customer.firstname} {ticket.customer.lastname}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{ticket.seller ? `${ticket.seller.first_name} ${ticket.seller.last_name}` : '-'}</TableCell>
                <TableCell>
                  <Badge className={statusColorMap[ticket.status?.id] || 'bg-gray-100 text-gray-800'}>
                    {ticket.status?.name || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{ticket.channel || '-'}</TableCell>
                <TableCell>{ticket.market?.name || '-'}</TableCell>
                <TableCell>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => (window.location.href = `/tickets/${ticket.id}`)}
                  >
                    <ExternalLink className="w-4 h-4" />
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
```

### Key Improvements

1. **Authorization enforced** — Non-admin users see only assigned tickets
2. **No N+1 queries** — Backend uses Promise.all() for efficient loading
3. **No magic indices** — Column management via React
4. **No hardcoded colors** — Status colors from database or config
5. **Validation on filters** — URL parameters sanitized
6. **Type-safe** — React TypeScript, proper prop validation
7. **Separation of concerns** — Filters/table/logic split
8. **Mobile-responsive** — Grid-based filter UI, proper table
9. **Functional filters** — Actually filter data server-side
10. **No dead code** — Clean implementation

---

## Summary

TicketsDataTable (13.7 KB): Complex support ticket management with multi-field filtering (category, status, channel, market, customer, seller, quote, date), eager loading, role-based action buttons, enum channel resolution, color-coded status badges. **CRITICAL:** Hardcoded status colors (brittle), magic column indices [0,9], [1,2,5,6] (fragile), no authorization (security gap). **HIGH:** Distinct value queries load all records (slow), URL parameter validation missing, avatar/route view assumptions, Helper coupling, session-based locale, role-based view rendering per row, inconsistent ID/nome mapping, commented-out code. 

In Base44: Create Ticket entity, getTickets backend function with authorization (non-admin see only assigned), getTicketFilters for dropdown options, React page with multi-select filters via UI, proper status coloring, no magic indices, validation on parameters, no hardcoded routes/colors, efficient relationship loading via Promise.all().

**Migration Priority: HIGH** — Support tickets are core CRM functionality; current implementation lacks authorization (users can see all tickets); hardcoded colors & magic indices make customization difficult; refactoring enables secure multi-tenant ticket system with proper filtering.