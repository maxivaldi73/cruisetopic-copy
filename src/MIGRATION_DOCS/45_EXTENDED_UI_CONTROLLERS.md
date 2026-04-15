# Extended UI Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for extended/advanced UI component showcase pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\extended_ui`  
**Location:** `App/Http/Controllers/Materio/extended_ui/`  
**Total Controllers:** 13

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| Avatar | `content.extended-ui.extended-ui-avatar` | Avatar component variations | `/extended-ui/avatar` |
| BlockUI | `content.extended-ui.extended-ui-blockui` | Block UI overlay functionality | `/extended-ui/blockui` |
| DragAndDrop | `content.extended-ui.extended-ui-drag-and-drop` | Drag and drop interactions | `/extended-ui/drag-and-drop` |
| MediaPlayer | `content.extended-ui.extended-ui-media-player` | Media player component | `/extended-ui/media-player` |
| PerfectScrollbar | `content.extended-ui.extended-ui-perfect-scrollbar` | Perfect scrollbar library demo | `/extended-ui/perfect-scrollbar` |
| StarRatings | `content.extended-ui.extended-ui-star-ratings` | Star rating input component | `/extended-ui/star-ratings` |
| SweetAlert | `content.extended-ui.extended-ui-sweetalert2` | SweetAlert2 dialog library | `/extended-ui/sweetalert` |
| TextDivider | `content.extended-ui.extended-ui-text-divider` | Text divider component | `/extended-ui/text-divider` |
| Timeline (Basic) | `content.extended-ui.extended-ui-timeline-basic` | Basic timeline component | `/extended-ui/timeline-basic` |
| Timeline (Fullscreen) | `content.extended-ui.extended-ui-timeline-fullscreen` | Fullscreen timeline layout | `/extended-ui/timeline-fullscreen` |
| Tour | `content.extended-ui.extended-ui-tour` | Product tour/guide component | `/extended-ui/tour` |
| Treeview | `content.extended-ui.extended-ui-treeview` | Hierarchical tree view component | `/extended-ui/treeview` |
| Misc | `content.extended-ui.extended-ui-misc` | Miscellaneous extended UI components | `/extended-ui/misc` |

---

## 🔧 Controller Details

All 13 controllers follow the same pattern:

```php
namespace App\Http\Controllers\Materio\extended_ui;

use App\Http\Controllers\Controller;

class {ControllerName} extends Controller
{
  public function index()
  {
    return view('content.extended-ui.{view-name}');
  }
}
```

### Avatar

```php
public function index()
{
    return view('content.extended-ui.extended-ui-avatar');
}
```

- **Purpose:** Display avatar component variations
- **Examples:** User avatars, initials, images, sizes, shapes (circle, square), status badges
- **Use Case:** User profile and team member representations

---

### BlockUI

```php
public function index()
{
    return view('content.extended-ui.extended-ui-blockui');
}
```

- **Purpose:** Display block UI overlay functionality
- **Examples:** Loading overlay, disabled content area, blocking interactions
- **Use Case:** Show loading states while preventing user interaction

---

### DragAndDrop

```php
public function index()
{
    return view('content.extended-ui.extended-ui-drag-and-drop');
}
```

- **Purpose:** Display drag and drop functionality
- **Examples:** Reorderable lists, drag between containers, drag from palettes
- **Use Case:** Interactive content reordering and file uploads

---

### MediaPlayer

```php
public function index()
{
    return view('content.extended-ui.extended-ui-media-player');
}
```

- **Purpose:** Display media player component
- **Examples:** Video player, audio player, controls, progress bar, playlist
- **Use Case:** Embedded media content playback

---

### PerfectScrollbar

```php
public function index()
{
    return view('content.extended-ui.extended-ui-perfect-scrollbar');
}
```

- **Purpose:** Display perfect scrollbar library demo
- **Examples:** Custom scrollbar styling, smooth scroll, rtl support
- **Use Case:** Enhanced scrollbar appearance for better UX

---

### StarRatings

```php
public function index()
{
    return view('content.extended-ui.extended-ui-star-ratings');
}
```

- **Purpose:** Display star rating input component
- **Examples:** 5-star ratings, half-star ratings, hover effects, readonly
- **Use Case:** Review ratings, feedback, quality ratings

---

### SweetAlert

```php
public function index()
{
    return view('content.extended-ui.extended-ui-sweetalert2');
}
```

- **Purpose:** Display SweetAlert2 dialog library demos
- **Examples:** Confirmation dialogs, alerts, input dialogs, custom styling
- **Use Case:** User confirmations, notifications, alerts

---

### TextDivider

```php
public function index()
{
    return view('content.extended-ui.extended-ui-text-divider');
}
```

- **Purpose:** Display text divider component
- **Examples:** Divider with text, icons, styling variations
- **Use Case:** Section separators with labels

---

### TimelineBasic

```php
public function index()
{
    return view('content.extended-ui.extended-ui-timeline-basic');
}
```

- **Purpose:** Display basic timeline component
- **Examples:** Vertical timeline, items with dates, icons, connections
- **Use Case:** Event history, process steps, milestones

---

### TimelineFullscreen

```php
public function index()
{
    return view('content.extended-ui.extended-ui-timeline-fullscreen');
}
```

- **Purpose:** Display fullscreen timeline layout
- **Examples:** Alternating left-right timeline, large items, detailed view
- **Use Case:** Detailed timeline stories, journey maps

---

### Tour

```php
public function index()
{
    return view('content.extended-ui.extended-ui-tour');
}
```

- **Purpose:** Display product tour/guide component
- **Examples:** Highlighted elements, tutorial steps, tooltips
- **Use Case:** Onboarding guides, feature walkthroughs

---

### Treeview

```php
public function index()
{
    return view('content.extended-ui.extended-ui-treeview');
}
```

- **Purpose:** Display hierarchical tree view component
- **Examples:** Nested items, expandable/collapsible, checkboxes, icons
- **Use Case:** File browsers, category hierarchies, navigation trees

---

### Misc

```php
public function index()
{
    return view('content.extended-ui.extended-ui-misc');
}
```

- **Purpose:** Display miscellaneous extended UI components
- **Examples:** Badges, ribbons, tooltips, breadcrumbs, and other components
- **Use Case:** Catch-all for various UI patterns

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Assumed admin-only via route middleware |
| Data | No data injection — static UI demo |
| Layout | Default admin layout |
| Pattern | One method per controller (`index()`) |
| Theme | Materio admin UI kit |

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** UI examples are static or configured in view templates
2. **No Interactivity:** Examples may not be fully functional (especially drag-drop, tour)
3. **Library Dependencies:** Some features require external libraries (SweetAlert2, drag-drop libs)
4. **No Business Logic:** Pure presentation layer
5. **One Controller Per Component:** Could be consolidated into single `ExtendedUIController` (minor)

---

## 📝 Migration Notes for Base44

### Strategy: React Components with Third-Party Libraries

Most of these components require external libraries or custom React implementations.

### Required Installations

```bash
npm install react-beautiful-dnd sonner react-joyride
```

Already installed in Base44:
- `@hello-pangea/dnd` (drag & drop alternative)
- `sonner` (toast notifications, alternative to SweetAlert)
- `framer-motion` (animations)

### Base44 Equivalent Components

#### Avatar Demo

```tsx
// pages/extended_ui/AvatarDemo.jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function AvatarDemo() {
  const users = [
    { name: 'John Doe', initials: 'JD', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { name: 'Jane Smith', initials: 'JS', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
    { name: 'Bob Johnson', initials: 'BJ' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Avatar Component</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-4">Sizes</h2>
          <div className="flex gap-4 items-center">
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar className="w-12 h-12">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">With Status Badge</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Badge className="absolute bottom-0 right-0 w-4 h-4 p-0 bg-green-500" />
            </div>
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <Badge className="absolute bottom-0 right-0 w-4 h-4 p-0 bg-red-500" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Avatar Group</h2>
          <div className="flex -space-x-4">
            {users.map((user, i) => (
              <Avatar key={i} className="border-2 border-background">
                <AvatarImage src={user.image} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Star Ratings Demo

```tsx
// pages/extended_ui/StarRatingsDemo.jsx
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRatingsDemo() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Star Ratings</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-4">Interactive 5-Star Rating</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Rating: {rating}/5</p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Read-only Rating</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">4.0/5 Stars (250 reviews)</p>
        </div>
      </div>
    </div>
  );
}
```

#### Timeline Demo

```tsx
// pages/extended_ui/TimelineBasicDemo.jsx
import { CheckCircle2, Circle } from 'lucide-react';

export default function TimelineBasicDemo() {
  const events = [
    { title: 'Project Started', date: 'Jan 1, 2024', completed: true },
    { title: 'Design Phase', date: 'Jan 15, 2024', completed: true },
    { title: 'Development', date: 'Feb 1, 2024', completed: true },
    { title: 'Testing', date: 'Mar 1, 2024', completed: false },
    { title: 'Launch', date: 'Apr 1, 2024', completed: false },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Timeline</h1>

      <div className="relative space-y-6">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {events.map((event, i) => (
          <div key={i} className="flex gap-6">
            <div className="relative z-10">
              {event.completed ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Circle className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="pt-1">
              <p className="font-bold">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Drag & Drop Demo

```tsx
// pages/extended_ui/DragAndDropDemo.jsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';

function SortableItem({ id, item }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:shadow-md transition"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1">{item.title}</div>
    </div>
  );
}

export default function DragAndDropDemo() {
  const [items, setItems] = useState([
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Drag & Drop</h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map(item => (
              <SortableItem key={item.id} id={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

#### Text Divider Demo

```tsx
// pages/extended_ui/TextDividerDemo.jsx
import { Separator } from '@/components/ui/separator';

export default function TextDividerDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Text Divider</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-bold mb-4">Basic Divider</h2>
          <div>Section 1</div>
          <Separator className="my-4" />
          <div>Section 2</div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Divider with Text</h2>
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Vertical Divider</h2>
          <div className="flex gap-4 h-12">
            <div>Left</div>
            <Separator orientation="vertical" />
            <div>Right</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Treeview Demo

```tsx
// pages/extended_ui/TreeviewDemo.jsx
import { ChevronRight, Folder, File } from 'lucide-react';
import { useState } from 'react';

function TreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0 w-5 h-5">
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <div className="w-5" />
        )}
        {node.children ? (
          <Folder className="w-4 h-4 text-blue-400" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground" />
        )}
        <span>{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div className="ml-4">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeviewDemo() {
  const fileTree = {
    name: 'project',
    children: [
      {
        name: 'src',
        children: [
          { name: 'App.jsx' },
          { name: 'index.js' },
          {
            name: 'components',
            children: [
              { name: 'Header.jsx' },
              { name: 'Footer.jsx' },
            ],
          },
        ],
      },
      {
        name: 'public',
        children: [
          { name: 'index.html' },
          { name: 'favicon.ico' },
        ],
      },
      { name: 'package.json' },
    ],
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Tree View</h1>
      <div className="border rounded-lg p-4">
        <TreeNode node={fileTree} />
      </div>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import AvatarDemo from './pages/extended_ui/AvatarDemo';
import StarRatingsDemo from './pages/extended_ui/StarRatingsDemo';
import TimelineBasicDemo from './pages/extended_ui/TimelineBasicDemo';
import DragAndDropDemo from './pages/extended_ui/DragAndDropDemo';
import TextDividerDemo from './pages/extended_ui/TextDividerDemo';
import TreeviewDemo from './pages/extended_ui/TreeviewDemo';

<Route path="/extended-ui/avatar" element={<AvatarDemo />} />
<Route path="/extended-ui/star-ratings" element={<StarRatingsDemo />} />
<Route path="/extended-ui/timeline-basic" element={<TimelineBasicDemo />} />
<Route path="/extended-ui/drag-and-drop" element={<DragAndDropDemo />} />
<Route path="/extended-ui/text-divider" element={<TextDividerDemo />} />
<Route path="/extended-ui/treeview" element={<TreeviewDemo />} />
```

### Key Points

1. **shadcn/ui + Lucide icons** — for most components
2. **@dnd-kit or @hello-pangea/dnd** — for drag & drop
3. **Framer Motion** — for animations
4. **Sonner/React Toastify** — for notifications (not SweetAlert)
5. **HTML5 native APIs** — for file uploads, media player
6. **React Hooks** — for state management (expanded, collapsed, etc.)
7. **Custom components** — Treeview, Timeline can be custom React
8. **Low migration priority** — demo pages, but components are production-ready
9. **Total effort: Medium** — some components (drag-drop, tour) require more work
10. **Responsive design** — mobile-friendly with Tailwind

### Production Use Cases

These components are used in actual application features:
- Avatars in user lists and profiles
- Ratings in review/feedback systems
- Timelines in project tracking or order history
- Drag-drop in task management or file uploads
- Trees in navigation or file browsers
- Dividers in layout sections

### Summary

All 13 extended UI controllers are **Materio template demo pages** showcasing advanced/specialized UI components. In Base44, create reusable React components for each, using shadcn/ui, Lucide icons, and third-party libraries (dnd-kit for drag-drop). Most are static demo pages, but some require state management. Avatar, Star Ratings, Dividers, and Trees are simpler; Drag-Drop, Tour, and Media Player require more implementation.