# Layout Example Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for layout variation demo pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\layouts`  
**Location:** `App/Http/Controllers/Materio/layouts/`  
**Total Controllers:** 10

---

## 📋 Controller Index

| Controller | View Rendered | pageConfigs | Purpose |
|-----------|--------------|-----------|---------|
| Blank | `content.layouts-example.layouts-blank` | `['myLayout' => 'blank']` | Minimal layout, no sidebar/navbar |
| CollapsedMenu | `content.layouts-example.layouts-collapsed-menu` | `['menuCollapsed' => true]` | Sidebar in collapsed state |
| Container | `content.layouts-example.layouts-container` | `['contentLayout' => 'compact']` | Compact/boxed content layout |
| ContentNavSidebar | `content.layouts-example.layouts-content-navbar-with-sidebar` | None | Standard layout with navbar + sidebar |
| ContentNavbar | `content.layouts-example.layouts-content-navbar` | None | Content with navbar only |
| Fluid | `content.layouts-example.layouts-fluid` | `['contentLayout' => 'wide']` | Full-width/fluid content layout |
| Horizontal | `content.dashboard.dashboards-analytics` | `['myLayout' => 'horizontal']` | Horizontal navbar layout |
| Vertical | `content.dashboard.dashboards-analytics` | `['myLayout' => 'vertical']` | Vertical sidebar layout (default) |
| WithoutMenu | `content.layouts-example.layouts-without-menu` | None | Layout without sidebar menu |
| WithoutNavbar | `content.layouts-example.layouts-without-navbar` | None | Layout without top navbar |

---

## 🔧 Controller Details

### Blank
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'blank'];
    return view('content.layouts-example.layouts-blank', ['pageConfigs' => $pageConfigs]);
}
```
- Minimal layout — no sidebar, no navbar
- Useful for error pages, login screens, public content
- Route: `GET /layouts-example/blank`

---

### CollapsedMenu
```php
public function index()
{
    $pageConfigs = ['menuCollapsed' => true];
    return view('content.layouts-example.layouts-collapsed-menu', ['pageConfigs' => $pageConfigs]);
}
```
- Sidebar in collapsed (minimized) state
- Shows icons only, expanded on hover
- Route: `GET /layouts-example/collapsed-menu`

---

### Container
```php
public function index()
{
    $pageConfigs = ['contentLayout' => 'compact'];
    return view('content.layouts-example.layouts-container', ['pageConfigs' => $pageConfigs]);
}
```
- Compact/boxed content layout
- Content constrained to max-width container (not full-width)
- Route: `GET /layouts-example/container`

---

### ContentNavSidebar
```php
public function index()
{
    return view('content.layouts-example.layouts-content-navbar-with-sidebar');
}
```
- Standard layout: navbar + sidebar
- No special page configs (uses defaults)
- Route: `GET /layouts-example/content-navbar-sidebar`

---

### ContentNavbar
```php
public function index()
{
    return view('content.layouts-example.layouts-content-navbar');
}
```
- Navbar only, no sidebar
- Useful for alternative navigation styles
- Route: `GET /layouts-example/content-navbar`

---

### Fluid
```php
public function index()
{
    $pageConfigs = ['contentLayout' => 'wide'];
    return view('content.layouts-example.layouts-fluid', ['pageConfigs' => $pageConfigs]);
}
```
- Full-width/fluid content layout
- Content spans entire viewport width
- Route: `GET /layouts-example/fluid`

---

### Horizontal
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'horizontal'];
    return view('content.dashboard.dashboards-analytics', ['pageConfigs' => $pageConfigs]);
}
```
- Horizontal navbar layout (menu items in top bar)
- Alternative to vertical sidebar
- Route: `GET /layouts-example/horizontal`

---

### Vertical
```php
public function index()
{
    $pageConfigs = ['myLayout' => 'vertical'];
    return view('content.dashboard.dashboards-analytics', ['pageConfigs' => $pageConfigs]);
}
```
- Vertical sidebar layout (default)
- Standard admin template layout
- Route: `GET /layouts-example/vertical`

---

### WithoutMenu
```php
public function index()
{
    return view('content.layouts-example.layouts-without-menu');
}
```
- Layout without sidebar menu
- Content + navbar only
- Route: `GET /layouts-example/without-menu`

---

### WithoutNavbar
```php
public function index()
{
    return view('content.layouts-example.layouts-without-navbar');
}
```
- Layout without top navbar
- Sidebar + content only
- Route: `GET /layouts-example/without-navbar`

---

## ⚠️ Notes

### Pattern: pageConfigs
Most layout controllers pass `$pageConfigs` array to the view. This is a **configuration-driven layout system** where the view template checks these flags to apply different CSS classes / structure variations.

**Common flags:**
- `myLayout` — layout type (`blank`, `horizontal`, `vertical`)
- `contentLayout` — content width (`compact`, `wide`)
- `menuCollapsed` — sidebar state (boolean)

### No Business Logic
All 10 controllers are purely presentational:
- No database queries
- No service dependencies
- No authorization (relies on route middleware)
- No input processing
- No state mutation

### Materio Theme
All views are part of the **Materio** Bootstrap admin template. The layouts namespace maps to `resources/views/content/layouts-example/` Blade templates that demonstrate various layout configurations.

---

## 📝 Migration Notes for Base44

### Strategy: React Layout Components

In Base44, layouts are typically implemented as React components or context providers. These static demo pages don't require backend functions.

### Base44 Equivalent Pattern

```tsx
// Create reusable layout components
// components/layouts/BlankLayout.jsx
export default function BlankLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}

// components/layouts/WithSidebar.jsx
export default function WithSidebarLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

// Then in pages, use the appropriate layout
// pages/layouts/BlankDemo.jsx
import BlankLayout from "@/components/layouts/BlankLayout";

export default function BlankDemo() {
  return (
    <BlankLayout>
      <div className="p-8">
        <h1>Blank Layout Demo</h1>
        <p>This page uses a minimal blank layout.</p>
      </div>
    </BlankLayout>
  );
}
```

### Route Registration (App.jsx)

```jsx
import BlankDemo from './pages/layouts/BlankDemo';
import CollapsedMenuDemo from './pages/layouts/CollapsedMenuDemo';
// ... etc.

<Route path="/layouts-example/blank" element={<BlankDemo />} />
<Route path="/layouts-example/collapsed-menu" element={<CollapsedMenuDemo />} />
// ... etc.
```

### Key Points

1. **Zero backend functions needed** — static layout demo pages
2. **No entities required** — no data persistence
3. **Reusable layout components** — create once, use in multiple pages
4. **Low migration priority** — demo pages, not core functionality
5. **Total effort: Low** — straightforward React component wrapping
6. **Context for layout state** — use React Context if app needs dynamic layout switching

### Production Use Case

If the application needs dynamic layout switching:

```tsx
// context/LayoutContext.jsx
import { createContext, useState } from 'react';

export const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [layout, setLayout] = useState('vertical'); // 'vertical' | 'horizontal' | 'blank'
  const [contentLayout, setContentLayout] = useState('compact'); // 'compact' | 'wide'
  
  return (
    <LayoutContext.Provider value={{ layout, setLayout, contentLayout, setContentLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

// Hook to use layout context
export function useLayout() {
  return useContext(LayoutContext);
}

// Then in a page:
import { useLayout } from '@/context/LayoutContext';

export default function DashboardPage() {
  const { layout } = useLayout();
  
  return layout === 'horizontal' ? (
    <HorizontalLayout>...</HorizontalLayout>
  ) : (
    <VerticalLayout>...</VerticalLayout>
  );
}
```

### Summary

All 10 layout controllers are **Materio template demo pages** for showcasing different layout configurations. In Base44, replace with React layout components and optional Context for dynamic switching. These are reference implementations, not production-critical features.