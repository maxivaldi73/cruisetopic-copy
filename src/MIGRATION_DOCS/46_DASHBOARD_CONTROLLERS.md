# Dashboard Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for dashboard showcase pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\dashboard`  
**Location:** `App/Http/Controllers/Materio/dashboard/`  
**Total Controllers:** 2

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| Analytics | `content.dashboard.dashboards-analytics` | Analytics dashboard with charts and metrics | `/dashboard/analytics` |
| Crm | `content.dashboard.dashboards-crm` | CRM dashboard with sales and customer data | `/dashboard/crm` |

---

## 🔧 Controller Details

### Analytics

**File:** `Analytics.php`

```php
<?php

namespace App\Http\Controllers\Materio\dashboard;

use App\Http\Controllers\Controller;

class Analytics extends Controller
{
  public function index()
  {
    return view('content.dashboard.dashboards-analytics');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /dashboard/analytics` |
| View | `content.dashboard.dashboards-analytics` |
| Business Logic | None |
| Purpose | Render analytics dashboard with performance metrics, charts, and KPIs |

**Likely Features:**
- Revenue charts (line, bar, area)
- Traffic analytics (visitors, pageviews, sessions)
- Performance metrics (conversion rate, bounce rate)
- Top pages/referrers
- User engagement graphs
- Time-series data visualization
- Multiple chart types (Charts.js, Recharts, etc.)

---

### Crm

**File:** `Crm.php`

```php
<?php

namespace App\Http\Controllers\Materio\dashboard;

use App\Http\Controllers\Controller;

class Crm extends Controller
{
  public function index()
  {
    return view('content.dashboard.dashboards-crm');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /dashboard/crm` |
| View | `content.dashboard.dashboards-crm` |
| Business Logic | None |
| Purpose | Render CRM dashboard with sales pipeline, customer data, and activities |

**Likely Features:**
- Sales pipeline visualization
- Deal progress tracking
- Customer lists with contact info
- Activity feed/timeline
- Revenue metrics and forecasts
- Customer acquisition metrics
- Sales team performance
- Recent activities/notes

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Likely admin/user-specific via route middleware or authorization |
| Data | No data injection (static demo) OR injected via middleware context |
| Layout | Default admin layout with sidebar |
| Pattern | One method per controller (`index()`) |
| Theme | Materio admin UI kit |

### Dashboard Patterns

Both dashboards are **Materio template demonstration pages**. In a real application:
- Analytics dashboard would fetch metrics from database or analytics service
- CRM dashboard would fetch leads, deals, and customer data from CRM entity

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** Dashboards are likely static hardcoded data in views
2. **No Real-time Updates:** Data not refreshed automatically
3. **No Authorization:** No role-based access control (relies on route middleware)
4. **No Filtering:** No date range, metric selection, or custom filtering
5. **Demo Only:** Template showcase pages, not production-ready

---

## 📝 Migration Notes for Base44

### Strategy: React Dashboard Pages with Backend Functions

Dashboards should fetch real data from entities and backend services.

### Backend Functions

**Function: getAnalyticsDashboardData**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch analytics data
  // In production, these would query real database or analytics service
  const analyticsData = {
    revenue: {
      current: 45250,
      previous: 38500,
      change: 17.5, // percentage
      data: [
        { date: '2024-01-01', value: 3200 },
        { date: '2024-01-02', value: 4100 },
        { date: '2024-01-03', value: 3800 },
        // ... more data points
      ],
    },
    traffic: {
      visitors: 12453,
      pageviews: 45230,
      sessions: 8920,
      bounceRate: 32.5,
      avgSessionDuration: '4m 23s',
    },
    topPages: [
      { page: '/home', views: 12453, avgTime: '2m 15s' },
      { page: '/products', views: 8920, avgTime: '3m 45s' },
      { page: '/about', views: 5340, avgTime: '1m 30s' },
    ],
    conversionRate: 3.2,
    devices: {
      desktop: 65,
      mobile: 30,
      tablet: 5,
    },
  };

  return Response.json(analyticsData);
});
```

**Function: getCrmDashboardData**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch CRM data
  const crmData = {
    totalDeals: 156,
    pipelineValue: 2450000,
    deals: [
      {
        id: '1',
        name: 'Acme Corp Contract',
        value: 450000,
        stage: 'negotiation',
        daysInStage: 12,
        customer: 'Acme Corporation',
        owner: 'John Doe',
      },
      {
        id: '2',
        name: 'Tech Startup Deal',
        value: 320000,
        stage: 'proposal',
        daysInStage: 5,
        customer: 'TechStart Inc',
        owner: 'Jane Smith',
      },
      // ... more deals
    ],
    pipeline: {
      new: { count: 45, value: 650000 },
      qualified: { count: 32, value: 580000 },
      proposal: { count: 24, value: 520000 },
      negotiation: { count: 18, value: 480000 },
      won: { count: 156, value: 5200000 },
      lost: { count: 42, value: 380000 },
    },
    recentActivities: [
      { type: 'call', description: 'Called Acme Corp about contract', time: '2 hours ago' },
      { type: 'email', description: 'Sent proposal to TechStart Inc', time: '4 hours ago' },
      { type: 'meeting', description: 'Met with ABC Company', time: '1 day ago' },
    ],
    topCustomers: [
      { name: 'Acme Corporation', value: 450000, contact: 'John Smith' },
      { name: 'TechStart Inc', value: 320000, contact: 'Sarah Johnson' },
      { name: 'Global Systems', value: 280000, contact: 'Mike Brown' },
    ],
  };

  return Response.json(crmData);
});
```

### Dashboard Pages

**Page: Analytics Dashboard**

```tsx
// pages/Dashboard/AnalyticsDashboard.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Eye, Zap } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => base44.functions.invoke('getAnalyticsDashboardData', {}),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const dashData = data?.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview of your website performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">${(dashData?.revenue.current / 1000).toFixed(1)}K</p>
              <p className={`text-xs ${dashData?.revenue.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashData?.revenue.change > 0 ? '+' : ''}{dashData?.revenue.change}% from last period
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Visitors</p>
              <p className="text-2xl font-bold">{(dashData?.traffic.visitors / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">Unique visitors</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pageviews</p>
              <p className="text-2xl font-bold">{(dashData?.traffic.pageviews / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">Total pageviews</p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
              <p className="text-2xl font-bold">{dashData?.traffic.bounceRate}%</p>
              <p className="text-xs text-muted-foreground">Lower is better</p>
            </div>
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashData?.revenue.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" fill="#3b82f6" stroke="#1d4ed8" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Device Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={[
                { name: 'Desktop', value: dashData?.devices.desktop },
                { name: 'Mobile', value: dashData?.devices.mobile },
                { name: 'Tablet', value: dashData?.devices.tablet },
              ]} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`}>
                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Pages */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Top Pages</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Page</th>
              <th className="text-right py-2">Views</th>
              <th className="text-right py-2">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {dashData?.topPages.map((page, i) => (
              <tr key={i} className="border-b hover:bg-accent">
                <td className="py-3">{page.page}</td>
                <td className="text-right">{page.views.toLocaleString()}</td>
                <td className="text-right text-muted-foreground">{page.avgTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

**Page: CRM Dashboard**

```tsx
// pages/Dashboard/CrmDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const stageColors = {
  new: '#ef4444',
  qualified: '#f97316',
  proposal: '#eab308',
  negotiation: '#84cc16',
  won: '#22c55e',
  lost: '#64748b',
};

export default function CrmDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm'],
    queryFn: () => base44.functions.invoke('getCrmDashboardData', {}),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const dashData = data?.data;
  const pipelineChartData = Object.entries(dashData?.pipeline || {}).map(([stage, data]) => ({
    stage,
    count: data.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground">Sales pipeline and customer overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Deals</p>
              <p className="text-2xl font-bold">{dashData?.totalDeals}</p>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pipeline Value</p>
              <p className="text-2xl font-bold">${(dashData?.pipelineValue / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Total value</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Won Deals</p>
              <p className="text-2xl font-bold">{dashData?.pipeline.won?.count}</p>
              <p className="text-xs text-muted-foreground">Closed deals</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Negotiation</p>
              <p className="text-2xl font-bold">{dashData?.pipeline.negotiation?.count}</p>
              <p className="text-xs text-muted-foreground">Active deals</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Sales Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Sales Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Pipeline Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pipelineChartData.map((d, i) => ({ ...d, fill: Object.values(stageColors)[i] }))} cx="50%" cy="50%" labelLine={false} label={({ stage, count }) => `${stage}: ${count}`}>
                {pipelineChartData.map((d, i) => (
                  <Cell key={i} fill={Object.values(stageColors)[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Top Deals</h3>
        <div className="space-y-3">
          {dashData?.deals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition">
              <div className="flex-1">
                <p className="font-bold">{deal.name}</p>
                <p className="text-sm text-muted-foreground">{deal.customer} • {deal.owner}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${(deal.value / 1000).toFixed(0)}K</p>
                <Badge variant="outline">{deal.stage}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activities */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {dashData?.recentActivities.map((activity, i) => (
            <div key={i} className="flex gap-3 p-3 border-b last:border-b-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import AnalyticsDashboard from './pages/Dashboard/AnalyticsDashboard';
import CrmDashboard from './pages/Dashboard/CrmDashboard';

<Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
<Route path="/dashboard/crm" element={<CrmDashboard />} />
```

### Key Points

1. **Backend functions** — fetch data from entities/database
2. **Recharts** — for data visualization (already installed)
3. **useQuery** — React Query for data fetching and caching
4. **shadcn/ui** — Cards, Badges for UI components
5. **Lucide icons** — for visual indicators
6. **Responsive grid** — Mobile-friendly dashboard layout
7. **Real-time capable** — Can add polling or WebSocket for live updates
8. **Low migration priority** — Demo pages, but pattern is production-ready
9. **Total effort: Medium** — requires backend functions and chart integration
10. **Scalable design** — Can add filters, date ranges, exports, etc.

### Production Use Cases

Real dashboards would:
- Query actual business entities (Deal, Lead, Customer)
- Filter by date range, user, department
- Support exporting to PDF/CSV
- Show real-time updates via WebSockets
- Include drill-down capabilities
- Support custom metrics

### Summary

Both dashboard controllers are **Materio template demo pages** for analytics and CRM views. In Base44, create pages that fetch real data via backend functions and display with Recharts. Design is responsive with KPI cards, multiple chart types, and data tables. Backend functions would query entities for actual metrics.