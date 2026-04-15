# Cards Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for card component showcase pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\cards`  
**Location:** `App/Http/Controllers/Materio/cards/`  
**Total Controllers:** 6

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| CardBasic | `content.cards.cards-basic` | Basic card component variations | `/cards/basic` |
| CardAdvance | `content.cards.cards-advance` | Advanced card layouts and features | `/cards/advance` |
| CardActions | `content.cards.cards-actions` | Cards with action buttons and interactions | `/cards/actions` |
| CardAnalytics | `content.cards.cards-analytics` | Cards displaying analytics/metrics | `/cards/analytics` |
| CardStatistics | `content.cards.cards-statistics` | Cards for statistical displays | `/cards/statistics` |
| CardGamifications | `content.cards.cards-gamifications` | Gamified card designs with badges/rewards | `/cards/gamifications` |

---

## 🔧 Controller Details

### CardBasic

```php
<?php

namespace App\Http\Controllers\Materio\cards;

use App\Http\Controllers\Controller;

class CardBasic extends Controller
{
  public function index()
  {
    return view('content.cards.cards-basic');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /cards/basic` |
| View | `content.cards.cards-basic` |
| Purpose | Display basic card component patterns |

**Likely Examples:**
- Simple card with title and content
- Cards with headers and footers
- Card with image
- Cards with borders and shadows
- Responsive card layouts
- Card sizing variations

---

### CardAdvance

```php
<?php

namespace App\Http\Controllers\Materio\cards;

use App\Http\Controllers\Controller;

class CardAdvance extends Controller
{
  public function index()
  {
    return view('content.cards.cards-advance');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /cards/advance` |
| View | `content.cards.cards-advance` |
| Purpose | Display advanced card layouts and features |

**Likely Examples:**
- Cards with tabs or collapsible sections
- Multi-column card layouts
- Cards with nested components
- Hover effects and transitions
- Cards with different styling variants
- Complex card structures

---

### CardActions

```php
<?php

namespace App\Http\Controllers\Materio\cards;

use App\Http\Controllers\Controller;

class CardActions extends Controller
{
  public function index()
  {
    return view('content.cards.cards-actions');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /cards/actions` |
| View | `content.cards.cards-actions` |
| Purpose | Display cards with interactive action buttons |

**Likely Examples:**
- Cards with edit/delete buttons
- Action menus (dropdown, context menu)
- Cards with primary/secondary actions
- Card selection/checkbox
- Drag-drop enabled cards
- Cards with swipe actions (mobile)

---

### CardAnalytics

```php
<?php

namespace App\Http\Controllers\Materio\cards;

use App\Http\Controllers\Controller;

class CardAnalytics extends Controller
{
  public function index()
  {
    return view('content.cards.cards-analytics');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /cards/analytics` |
| View | `content.cards.cards-analytics` |
| Purpose | Display cards for analytics/metrics presentation |

**Likely Examples:**
- KPI cards with values and trends
- Mini charts within cards
- Progress bars in cards
- Metric cards with sparklines
- Comparison cards (this vs. last period)
- Cards with mini statistics

---

### CardStatistics

```php
<?php

namespace App\Http\Controllers\Materio\cards;

use App\Http\Controllers\Controller;

class CardStatistics extends Controller
{
  public function index()
  {
    return view('content.cards.cards-statistics');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /cards/statistics` |
| View | `content.cards.cards-statistics` |
| Purpose | Display cards for statistical data presentation |

**Likely Examples:**
- Stat cards with large numbers
- Cards with icon + stat value
- Cards with percentage/change indicators
- Cards with badges or labels
- Colored stat cards by category
- Cards with multiple statistics

---

### CardGamifications

```php
<?php

namespace App\Http\Controllers\Materio\cards;

use App\Http\Controllers\Controller;

class CardGamifications extends Controller
{
  public function index()
  {
    return view('content.cards.cards-gamifications');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /cards/gamifications` |
| View | `content.cards.cards-gamifications` |
| Purpose | Display gamified card designs with badges and rewards |

**Likely Examples:**
- Achievement/badge cards
- Points/reward cards
- Progress cards with badges
- Leaderboard cards
- Streak/milestone cards
- Cards with stars/ratings
- Level-up or tier cards

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Assumed admin-only via route middleware |
| Data | No data injection — static examples in views |
| Layout | Default admin layout |
| Pattern | One method per controller (`index()`) |
| Theme | Materio admin UI kit |

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** Cards are static/hardcoded
2. **No Real-time Updates:** Data not reactive
3. **6 Controllers for 1 Component:** Could consolidate to single controller with variants
4. **Demo Only:** Template showcase pages
5. **No Interactivity:** Limited user interaction examples

---

## 📝 Migration Notes for Base44

### Strategy: Reusable Card Components with Variants

Create a base Card component with composable subcomponents (Header, Footer, Content) and demonstrate variants.

### Base44 Card Components

**Component: BaseCard.jsx**

```tsx
// components/cards/BaseCard.jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function BaseCard({ 
  title, 
  description, 
  children, 
  footer,
  className = ''
}) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
```

### Demo Pages

**Page: Cards Showcase**

```tsx
// pages/cards/CardsShowcase.jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Share2, Edit, Trash2, TrendingUp, Star } from 'lucide-react';

export default function CardsShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Card Components</h1>
        <p className="text-muted-foreground">Various card layouts and variations</p>
      </div>

      {/* Basic Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Basic Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>A basic card with header</CardDescription>
            </CardHeader>
            <CardContent>
              This is the content area of the card. Add any information or components here.
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p>Card without header — minimal design</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card with Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=200&fit=crop" alt="Sample" className="w-full h-40 object-cover rounded-lg mb-4" />
              <p className="text-sm text-muted-foreground">Image cards work great for showcasing content</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards with Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Cards with Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card with Buttons</CardTitle>
            </CardHeader>
            <CardContent>
              Some card content goes here
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Card with Icons</CardTitle>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-accent rounded-lg"><Heart className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-accent rounded-lg"><Share2 className="w-4 h-4" /></button>
              </div>
            </CardHeader>
            <CardContent>Card content with action icons</CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics/Statistics Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Analytics & Statistics Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">$12,450</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-green-600 mt-2">+12% from last month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-2xl font-bold">3.2%</p>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">3.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">4.0 out of 5</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Advanced Cards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Collapsible Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Content that could be shown/hidden based on state</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Card with Badge</CardTitle>
                <Badge>New</Badge>
              </div>
            </CardHeader>
            <CardContent>
              Featured content with badge indicator
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gamification Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Gamification Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-2 border-yellow-400">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl mb-2">🏆</p>
              <p className="font-bold">Achievement Unlocked</p>
              <p className="text-sm text-muted-foreground">Completed 10 tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Level 5</CardTitle>
              <CardDescription>Next level: 750/1000 XP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-orange-500 mb-2">⭐</p>
              <p className="font-bold">5-Day Streak</p>
              <p className="text-sm text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Responsive Variants */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Responsive Design</h2>
        <Card>
          <CardHeader>
            <CardTitle>Responsive Card</CardTitle>
            <CardDescription>This card adapts to different screen sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">Column 1</div>
              <div className="p-4 border rounded-lg">Column 2</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import CardsShowcase from './pages/cards/CardsShowcase';

<Route path="/cards/showcase" element={<CardsShowcase />} />
```

### Key Points

1. **shadcn/ui Card component** — Already available with Header, Title, Description, Content, Footer subcomponents
2. **Composable structure** — Mix and match subcomponents based on needs
3. **No new libraries needed** — Uses existing shadcn/ui components
4. **Variants via props** — Pass className, style props for different looks
5. **Responsive grids** — Use Tailwind's grid system for responsive layouts
6. **Icons and badges** — Use Lucide icons and shadcn/ui Badge component
7. **Low migration priority** — Demo pages, but patterns are production-ready
8. **Total effort: Low** — Mostly composition of existing shadcn/ui components

### Production Use Cases

Cards used throughout applications:
- Product/content listings
- Stat dashboards
- User profiles
- Data summaries
- Feature showcases
- Form containers
- Action cards
- Achievement/badge displays

### Summary

All 6 card controllers are **Materio template demo pages** showcasing different card variations (basic, advanced, actions, analytics, statistics, gamifications). In Base44, use shadcn/ui Card component with subcomponents (Header, Title, Description, Content, Footer) to create all variations. Design is responsive, composable, and production-ready.