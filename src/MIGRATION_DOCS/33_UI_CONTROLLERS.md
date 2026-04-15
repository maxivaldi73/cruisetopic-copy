# UI Controllers (Materio/user_interface)

**Purpose:** Simple Blade view rendering controllers for the UI component showcase/demo pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\user_interface`  
**Location:** `App/Http/Controllers/Materio/user_interface/`  
**Total Controllers:** 19  
**Pattern:** All controllers follow the same minimal pattern — extend `Controller`, expose a single `index()` method that returns a Blade view.

---

## 📋 Controller Index

| Controller | View Rendered | Route (inferred) |
|-----------|--------------|------------------|
| Accordion | `content.user-interface.ui-accordion` | `/ui/accordion` |
| Alerts | `content.user-interface.ui-alerts` | `/ui/alerts` |
| Badges | `content.user-interface.ui-badges` | `/ui/badges` |
| Buttons | `content.user-interface.ui-buttons` | `/ui/buttons` |
| Carousel | `content.user-interface.ui-carousel` | `/ui/carousel` |
| Collapse | `content.user-interface.ui-collapse` | `/ui/collapse` |
| Dropdowns | `content.user-interface.ui-dropdowns` | `/ui/dropdowns` |
| Footer | `content.user-interface.ui-footer` | `/ui/footer` |
| ListGroups | `content.user-interface.ui-list-groups` | `/ui/list-groups` |
| Modals | `content.user-interface.ui-modals` | `/ui/modals` |
| Navbar | `content.user-interface.ui-navbar` | `/ui/navbar` |
| Offcanvas | `content.user-interface.ui-offcanvas` | `/ui/offcanvas` |
| PaginationBreadcrumbs | `content.user-interface.ui-pagination-breadcrumbs` | `/ui/pagination-breadcrumbs` |
| Progress | `content.user-interface.ui-progress` | `/ui/progress` |
| Spinners | `content.user-interface.ui-spinners` | `/ui/spinners` |
| TabsPills | `content.user-interface.ui-tabs-pills` | `/ui/tabs-pills` |
| Toasts | `content.user-interface.ui-toasts` | `/ui/toasts` |
| TooltipsPopovers | `content.user-interface.ui-tooltips-popovers` | `/ui/tooltips-popovers` |
| Typography | `content.user-interface.ui-typography` | `/ui/typography` |

---

## 🔧 Shared Pattern

Every controller in this group follows this exact structure:

```php
<?php

namespace App\Http\Controllers\Materio\user_interface;

use App\Http\Controllers\Controller;

class {ComponentName} extends Controller
{
    public function index()
    {
        return view('content.user-interface.ui-{component-slug}');
    }
}
```

- **No constructor injection** — zero dependencies
- **No parameters** — no route model binding, no query params
- **No authorization** — relies on route middleware group (likely `auth` + `admin`)
- **Single method** — `index()` only
- **Pure view rendering** — all data sourced from Blade/JS on the view side

---

## 📦 Individual Controller Details

### Accordion
- **File:** `Accordion.php`
- **View:** `content.user-interface.ui-accordion`
- **Purpose:** Showcase Bootstrap/custom accordion component variants

### Alerts
- **File:** `Alerts.php`
- **View:** `content.user-interface.ui-alerts`
- **Purpose:** Showcase alert styles (success, danger, warning, info, dismissible)

### Badges
- **File:** `Badges.php`
- **View:** `content.user-interface.ui-badges`
- **Purpose:** Showcase badge variants (colors, pill, positioned on buttons/icons)

### Buttons
- **File:** `Buttons.php`
- **View:** `content.user-interface.ui-buttons`
- **Purpose:** Showcase button variants, sizes, states (loading, disabled), icon buttons

### Carousel
- **File:** `Carousel.php`
- **View:** `content.user-interface.ui-carousel`
- **Purpose:** Showcase image/content carousel/slider component

### Collapse
- **File:** `Collapse.php`
- **View:** `content.user-interface.ui-collapse`
- **Purpose:** Showcase collapsible content panels (Bootstrap collapse)

### Dropdowns
- **File:** `Dropdowns.php`
- **View:** `content.user-interface.ui-dropdowns`
- **Purpose:** Showcase dropdown menus (directions, dividers, headers, icons)

### Footer
- **File:** `Footer.php`
- **View:** `content.user-interface.ui-footer`
- **Purpose:** Showcase footer layout variants

### ListGroups
- **File:** `ListGroups.php`
- **View:** `content.user-interface.ui-list-groups`
- **Purpose:** Showcase list group component (basic, linked, flush, numbered, badges)

### Modals
- **File:** `Modals.php`
- **View:** `content.user-interface.ui-modals`
- **Purpose:** Showcase modal dialog variants (sizes, scrollable, fullscreen, static backdrop)

### Navbar
- **File:** `Navbar.php`
- **View:** `content.user-interface.ui-navbar`
- **Purpose:** Showcase navbar layout and configuration examples

### Offcanvas
- **File:** `Offcanvas.php`
- **View:** `content.user-interface.ui-offcanvas`
- **Purpose:** Showcase offcanvas (drawer) component — positions, backdrop, scrolling

### PaginationBreadcrumbs
- **File:** `PaginationBreadcrumbs.php`
- **View:** `content.user-interface.ui-pagination-breadcrumbs`
- **Purpose:** Showcase pagination controls and breadcrumb navigation variants

### Progress
- **File:** `Progress.php`
- **View:** `content.user-interface.ui-progress`
- **Purpose:** Showcase progress bar variants (colors, striped, animated, stacked)

### Spinners
- **File:** `Spinners.php`
- **View:** `content.user-interface.ui-spinners`
- **Purpose:** Showcase loading spinner variants (border, grow, sizes, colors)

### TabsPills
- **File:** `TabsPills.php`
- **View:** `content.user-interface.ui-tabs-pills`
- **Purpose:** Showcase tab and pill navigation variants (horizontal, vertical, justified)

### Toasts
- **File:** `Toasts.php`
- **View:** `content.user-interface.ui-toasts`
- **Purpose:** Showcase toast notification component (positions, colors, auto-dismiss)

### TooltipsPopovers
- **File:** `TooltipsPopovers.php`
- **View:** `content.user-interface.ui-tooltips-popovers`
- **Purpose:** Showcase tooltip and popover components (placements, triggers, HTML content)

### Typography
- **File:** `Typography.php`
- **View:** `content.user-interface.ui-typography`
- **Purpose:** Showcase typography scale (headings, display, lead, inline elements, lists, blockquote)

---

## ⚠️ Notes

### No Business Logic
These controllers are purely presentational. They contain zero:
- Database queries
- Service dependencies
- Authorization checks (beyond route middleware)
- Input processing
- State mutation

### Materio Theme
All views belong to the **Materio** Bootstrap admin theme. The `content.user-interface.*` view namespace maps to `resources/views/content/user-interface/` Blade templates that demonstrate the theme's UI component library.

### Authorization
Routes are assumed to be protected by an `auth` middleware group at the route file level (not enforced in the controller itself).

---

## 📝 Migration Notes for Base44

### Strategy: No Backend Needed

Since all 19 controllers are pure view renderers with zero data, they map directly to **static React pages** with no backend function required.

### One-to-One React Page Mapping

| Laravel Controller | Base44 React Page |
|-------------------|-------------------|
| `Accordion` | `pages/ui/Accordion.jsx` |
| `Alerts` | `pages/ui/Alerts.jsx` |
| `Badges` | `pages/ui/Badges.jsx` |
| `Buttons` | `pages/ui/Buttons.jsx` |
| `Carousel` | `pages/ui/Carousel.jsx` |
| `Collapse` | `pages/ui/Collapse.jsx` |
| `Dropdowns` | `pages/ui/Dropdowns.jsx` |
| `Footer` | `pages/ui/Footer.jsx` |
| `ListGroups` | `pages/ui/ListGroups.jsx` |
| `Modals` | `pages/ui/Modals.jsx` |
| `Navbar` | `pages/ui/Navbar.jsx` |
| `Offcanvas` | `pages/ui/Offcanvas.jsx` |
| `PaginationBreadcrumbs` | `pages/ui/PaginationBreadcrumbs.jsx` |
| `Progress` | `pages/ui/Progress.jsx` |
| `Spinners` | `pages/ui/Spinners.jsx` |
| `TabsPills` | `pages/ui/TabsPills.jsx` |
| `Toasts` | `pages/ui/Toasts.jsx` |
| `TooltipsPopovers` | `pages/ui/TooltipsPopovers.jsx` |
| `Typography` | `pages/ui/Typography.jsx` |

### Component Library Mapping (Bootstrap → shadcn/ui)

Since Base44 uses **shadcn/ui** + **Tailwind CSS** instead of Bootstrap, each UI component maps to a shadcn equivalent:

| Materio (Bootstrap) | Base44 (shadcn/ui) |
|--------------------|-------------------|
| Accordion | `@/components/ui/accordion` |
| Alert | `@/components/ui/alert` |
| Badge | `@/components/ui/badge` |
| Button | `@/components/ui/button` |
| Carousel | `@/components/ui/carousel` |
| Collapse | `@/components/ui/collapsible` |
| Dropdown | `@/components/ui/dropdown-menu` |
| Modal | `@/components/ui/dialog` |
| Offcanvas | `@/components/ui/sheet` |
| Pagination | `@/components/ui/pagination` |
| Breadcrumb | `@/components/ui/breadcrumb` |
| Progress | `@/components/ui/progress` |
| Tabs / Pills | `@/components/ui/tabs` |
| Toast | `@/components/ui/toast` + `useToast` |
| Tooltip | `@/components/ui/tooltip` |
| Popover | `@/components/ui/popover` |

### Example React Page Pattern

```tsx
// pages/ui/Accordion.jsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AccordionPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Accordion</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Basic</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>Yes — built on Radix UI primitives.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>Yes — styled with Tailwind CSS.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
// In App.jsx Routes:
import Accordion from './pages/ui/Accordion';
import Alerts from './pages/ui/Alerts';
// ... etc.

<Route path="/ui/accordion" element={<Accordion />} />
<Route path="/ui/alerts" element={<Alerts />} />
// ... etc.
```

### Key Points

1. **Zero backend functions needed** — all pages are static demos
2. **No entities required** — no data persistence
3. **No auth required** — these are typically admin-only demo pages but can be public
4. **shadcn/ui replaces Bootstrap** — all components available out of the box
5. **Low migration priority** — these are demo/showcase pages, not core business functionality
6. **Total effort: Low** — each page is a straightforward component showcase