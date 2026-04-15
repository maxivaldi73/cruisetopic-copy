# Charts Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for chart library showcase pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\charts`  
**Location:** `App/Http/Controllers/Materio/charts/`  
**Total Controllers:** 2

---

## 📋 Controller Index

| Controller | View Rendered | Library | Route (inferred) |
|-----------|--------------|---------|------------------|
| ApexCharts | `content.charts.charts-apex` | ApexCharts.js | `/charts/apex` |
| ChartJs | `content.charts.charts-chartjs` | Chart.js | `/charts/chartjs` |

---

## 🔧 Controller Details

### ApexCharts

**File:** `ApexCharts.php`

```php
<?php

namespace App\Http\Controllers\Materio\charts;

use App\Http\Controllers\Controller;

class ApexCharts extends Controller
{
  public function index()
  {
    return view('content.charts.charts-apex');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /charts/apex` |
| View | `content.charts.charts-apex` |
| Business Logic | None |
| Purpose | Showcase ApexCharts.js library with various chart types and configurations |

**Library Info:**
- **ApexCharts.js** — Modern, interactive JavaScript charting library
- **Features:** Line, Area, Bar, Column, Scatter, Bubble, Heatmap, Candlestick, Radar, Polar
- **Website:** https://apexcharts.com
- **NPM:** `apexcharts` + `react-apexcharts`

**Likely Examples:**
- Basic line charts
- Area charts with multiple series
- Bar and column charts
- Mixed chart types
- Real-time data updates
- Dark mode support
- Animations and interactions

---

### ChartJs

**File:** `ChartJs.php`

```php
<?php

namespace App\Http\Controllers\Materio\charts;

use App\Http\Controllers\Controller;

class ChartJs extends Controller
{
  public function index()
  {
    return view('content.charts.charts-chartjs');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /charts/chartjs` |
| View | `content.charts.charts-chartjs` |
| Business Logic | None |
| Purpose | Showcase Chart.js library with various chart types and configurations |

**Library Info:**
- **Chart.js** — Popular, lightweight JavaScript charting library
- **Features:** Line, Bar, Radar, Doughnut, Pie, Bubble, Scatter
- **Website:** https://www.chartjs.org
- **NPM:** `chart.js` + `react-chartjs-2`

**Likely Examples:**
- Simple line charts
- Bar and horizontal bar charts
- Pie and doughnut charts
- Radar/spider charts
- Mixed chart types
- Dataset configurations
- Tooltips and legends

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Assumed admin-only via route middleware |
| Data | No data injection — hardcoded examples in views |
| Layout | Default admin layout |
| Pattern | One method per controller (`index()`) |
| Theme | Materio admin UI kit |

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** Chart examples are static/hardcoded
2. **No Real-time Updates:** Data not refreshed or reactive
3. **Library Duplication:** Could consolidate to single charting library
4. **No Interactivity:** Charts likely don't respond to user input
5. **Demo Only:** Template showcase pages

---

## 📝 Migration Notes for Base44

### Strategy: Use Recharts (Already Installed)

Base44 already has `recharts` installed, which is:
- **Modern and React-native**
- **Composable component-based API**
- **Lightweight and performant**
- **Excellent TypeScript support**
- **Responsive by default**

ApexCharts and Chart.js are overkill for most applications when Recharts is available.

### If ApexCharts or Chart.js Required

**Install ApexCharts:**
```bash
npm install apexcharts react-apexcharts
```

**Install Chart.js:**
```bash
npm install chart.js react-chartjs-2
```

### Base44 Equivalent: Recharts Demo Page

**Page: Chart Showcase**

```tsx
// pages/charts/ChartsShowcase.jsx
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts';
import { Card } from '@/components/ui/card';

const lineData = [
  { month: 'Jan', sales: 4000, revenue: 2400 },
  { month: 'Feb', sales: 3000, revenue: 1398 },
  { month: 'Mar', sales: 2000, revenue: 9800 },
  { month: 'Apr', sales: 2780, revenue: 3908 },
  { month: 'May', sales: 1890, revenue: 4800 },
  { month: 'Jun', sales: 2390, revenue: 3800 },
];

const pieData = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];

const radarData = [
  { subject: 'Math', A: 120, B: 110 },
  { subject: 'Chinese', A: 98, B: 130 },
  { subject: 'English', A: 86, B: 130 },
  { subject: 'Geography', A: 99, B: 100 },
  { subject: 'Physics', A: 65, B: 90 },
  { subject: 'History', A: 79, B: 110 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ChartsShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Charts & Visualizations</h1>
        <p className="text-muted-foreground">Using Recharts for data visualization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Line Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Area Chart */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Area Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stackId="1" fill="#3b82f6" stroke="#1d4ed8" />
              <Area type="monotone" dataKey="revenue" stackId="1" fill="#10b981" stroke="#059669" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Bar Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Pie Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar Chart */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Radar Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="Student A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Student B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Scatter Chart */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Scatter Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis dataKey="sales" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Sales" data={lineData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Chart Type Comparison */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Chart Types Supported</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 border rounded-lg">
            <p className="font-bold">Line Charts</p>
            <p className="text-muted-foreground">Trends over time</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-bold">Area Charts</p>
            <p className="text-muted-foreground">Stacked values</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-bold">Bar Charts</p>
            <p className="text-muted-foreground">Comparisons</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-bold">Pie Charts</p>
            <p className="text-muted-foreground">Proportions</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-bold">Radar Charts</p>
            <p className="text-muted-foreground">Multi-variable</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-bold">Scatter Charts</p>
            <p className="text-muted-foreground">Correlations</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

### If User Specifically Needs ApexCharts

```tsx
// pages/charts/ApexChartsShowcase.jsx
import React from 'react';
import Chart from 'react-apexcharts';
import { Card } from '@/components/ui/card';

export default function ApexChartsShowcase() {
  const lineChartOptions = {
    chart: { type: 'line' },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
  };

  const lineChartSeries = [
    {
      name: 'Sales',
      data: [30, 40, 35, 50, 49, 60],
    },
  ];

  const barChartOptions = {
    chart: { type: 'bar' },
    xaxis: { categories: ['A', 'B', 'C', 'D', 'E'] },
  };

  const barChartSeries = [
    {
      name: 'Series 1',
      data: [30, 40, 35, 50, 49],
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">ApexCharts Examples</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Line Chart</h3>
          <Chart options={lineChartOptions} series={lineChartSeries} type="line" height={300} />
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Bar Chart</h3>
          <Chart options={barChartOptions} series={barChartSeries} type="bar" height={300} />
        </Card>
      </div>
    </div>
  );
}
```

### If User Specifically Needs Chart.js

```tsx
// pages/charts/ChartJsShowcase.jsx
import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Card } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function ChartJsShowcase() {
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [30, 40, 35, 50, 49, 60],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const barChartData = {
    labels: ['A', 'B', 'C', 'D', 'E'],
    datasets: [
      {
        label: 'Series 1',
        data: [30, 40, 35, 50, 49],
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const pieChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: ['#ef4444', '#3b82f6', '#fbbf24'],
      },
    ],
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Chart.js Examples</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Line Chart</h3>
          <Line data={lineChartData} options={{ responsive: true }} />
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Bar Chart</h3>
          <Bar data={barChartData} options={{ responsive: true }} />
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Pie Chart</h3>
          <Pie data={pieChartData} options={{ responsive: true }} />
        </Card>
      </div>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import ChartsShowcase from './pages/charts/ChartsShowcase';

<Route path="/charts/showcase" element={<ChartsShowcase />} />
```

### Key Points

1. **Recharts recommended** — Already installed, React-native, composable
2. **ApexCharts** — If advanced interactive features needed
3. **Chart.js** — If simplicity and compatibility needed
4. **Dynamic data** — Connect to backend functions for real data
5. **Responsive** — All charts responsive by default
6. **Accessible** — Proper legends, tooltips, keyboard navigation
7. **Low migration priority** — Demo pages
8. **Total effort: Low** — Mostly copy-paste with Recharts or simple wrappers with other libraries

### Production Use Cases

Charts used in dashboards, reports, analytics pages:
- Sales trends over time
- Performance metrics
- Distribution/composition views
- Comparisons between categories
- Correlations and relationships

### Summary

Both chart library controllers are **Materio template demo pages** showcasing ApexCharts.js and Chart.js. In Base44, use Recharts (already installed) for most needs—it's modern, composable, and React-native. If ApexCharts or Chart.js required, install and create wrapper components. All charts support dynamic data via backend functions.