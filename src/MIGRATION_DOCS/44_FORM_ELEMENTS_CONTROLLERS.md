# Form Elements Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for form element showcase pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\form_elements`  
**Location:** `App/Http/Controllers/Materio/form_elements/`  
**Total Controllers:** 10

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| BasicInput | `content.form-elements.forms-basic-inputs` | Basic text, email, password, number inputs | `/form-elements/basic-input` |
| InputGroups | `content.form-elements.forms-input-groups` | Input groups with prefixes/suffixes | `/form-elements/input-groups` |
| Selects | `content.form-elements.forms-selects` | Select dropdowns, multi-select | `/form-elements/selects` |
| Switches | `content.form-elements.forms-switches` | Toggle switches, checkboxes | `/form-elements/switches` |
| Sliders | `content.form-elements.forms-sliders` | Range sliders, slider inputs | `/form-elements/sliders` |
| FileUpload | `content.form-elements.forms-file-upload` | File upload input demos | `/form-elements/file-upload` |
| Picker | `content.form-elements.forms-pickers` | Date/time pickers, color pickers | `/form-elements/picker` |
| CustomOptions | `content.form-elements.forms-custom-options` | Custom styled options, radio buttons | `/form-elements/custom-options` |
| Editors | `content.form-elements.forms-editors` | Rich text editors, code editors | `/form-elements/editors` |
| Extras | `content.form-elements.forms-extras` | Additional form elements (counters, spinners, etc.) | `/form-elements/extras` |

---

## 🔧 Controller Details

All 10 controllers follow the same pattern:

```php
namespace App\Http\Controllers\Materio\form_elements;

use App\Http\Controllers\Controller;

class {ControllerName} extends Controller
{
  public function index()
  {
    return view('content.form-elements.{view-name}');
  }
}
```

### BasicInput

```php
public function index()
{
    return view('content.form-elements.forms-basic-inputs');
}
```

- **Purpose:** Display basic input field types
- **Examples:** text, email, password, number, tel, url, search, color
- **Use Case:** Foundational form input reference

---

### InputGroups

```php
public function index()
{
    return view('content.form-elements.forms-input-groups');
}
```

- **Purpose:** Display input groups with prefixes and suffixes
- **Examples:** Currency symbols, icons, units ($, €, kg, m), button addons
- **Use Case:** Contextual input labels and unit indicators

---

### Selects

```php
public function index()
{
    return view('content.form-elements.forms-selects');
}
```

- **Purpose:** Display select dropdown options
- **Examples:** Single select, multi-select, optgroup, searchable select
- **Use Case:** Dropdown list selection patterns

---

### Switches

```php
public function index()
{
    return view('content.form-elements.forms-switches');
}
```

- **Purpose:** Display toggle switches and checkboxes
- **Examples:** Toggle switches, checkboxes, radio buttons, button groups
- **Use Case:** Boolean and multiple choice selection

---

### Sliders

```php
public function index()
{
    return view('content.form-elements.forms-sliders');
}
```

- **Purpose:** Display range sliders
- **Examples:** Single-handle slider, dual-handle range slider, vertical slider
- **Use Case:** Range/continuous value selection

---

### FileUpload

```php
public function index()
{
    return view('content.form-elements.forms-file-upload');
}
```

- **Purpose:** Display file upload input
- **Examples:** Basic file input, drag-and-drop, multiple files, preview
- **Use Case:** File attachment/upload patterns

---

### Picker

```php
public function index()
{
    return view('content.form-elements.forms-pickers');
}
```

- **Purpose:** Display date/time and color picker inputs
- **Examples:** Date picker, date-time picker, time picker, color picker
- **Use Case:** Temporal and color selection

---

### CustomOptions

```php
public function index()
{
    return view('content.form-elements.forms-custom-options');
}
```

- **Purpose:** Display custom styled radio buttons and options
- **Examples:** Card-based options, outlined radio buttons, custom styling
- **Use Case:** Styled multi-choice selection patterns

---

### Editors

```php
public function index()
{
    return view('content.form-elements.forms-editors');
}
```

- **Purpose:** Display rich text and code editors
- **Examples:** WYSIWYG editor, markdown editor, code editor
- **Use Case:** Long-form text editing

---

### Extras

```php
public function index()
{
    return view('content.form-elements.forms-extras');
}
```

- **Purpose:** Display additional form elements
- **Examples:** Number spinners, counters, input with button, custom patterns
- **Use Case:** Specialized input variations

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

1. **No Data Injection:** Form elements are static or configured in view templates
2. **No Form Submission:** Controllers don't handle form POST — likely client-side or handled separately
3. **No Validation Logic:** Validation presumably handled on frontend or in separate endpoints
4. **One Controller Per Element Type:** Could be consolidated into single `FormElementsController` with 10 methods (minor)
5. **Limited Interactivity:** Examples may not show functional behavior (e.g., slider drag, file upload)

---

## 📝 Migration Notes for Base44

### Strategy: React Components with shadcn/ui + Additional Libraries

Base44 already has most required libraries installed. Create reusable demo pages for each form element type.

### Base44 Equivalent Demo Pages

**Page 1: BasicInput Demo**

```tsx
// pages/forms/FormElementsBasicInputDemo.jsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BasicInputDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Basic Input Fields</h1>

      <div className="space-y-6">
        <div>
          <Label htmlFor="text">Text Input</Label>
          <Input id="text" type="text" placeholder="Enter text" />
        </div>

        <div>
          <Label htmlFor="email">Email Input</Label>
          <Input id="email" type="email" placeholder="user@example.com" />
        </div>

        <div>
          <Label htmlFor="password">Password Input</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>

        <div>
          <Label htmlFor="number">Number Input</Label>
          <Input id="number" type="number" placeholder="0" />
        </div>

        <div>
          <Label htmlFor="tel">Phone Input</Label>
          <Input id="tel" type="tel" placeholder="123-456-7890" />
        </div>

        <div>
          <Label htmlFor="url">URL Input</Label>
          <Input id="url" type="url" placeholder="https://example.com" />
        </div>

        <div>
          <Label htmlFor="search">Search Input</Label>
          <Input id="search" type="search" placeholder="Search..." />
        </div>

        <div>
          <Label htmlFor="color">Color Input</Label>
          <Input id="color" type="color" />
        </div>

        <div>
          <Label htmlFor="date">Date Input</Label>
          <Input id="date" type="date" />
        </div>

        <div>
          <Label htmlFor="textarea">Textarea</Label>
          <textarea id="textarea" placeholder="Multi-line text" rows="4" className="w-full px-3 py-2 border rounded-md" />
        </div>
      </div>
    </div>
  );
}
```

**Page 2: InputGroups Demo**

```tsx
// pages/forms/FormElementsInputGroupsDemo.jsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, Euro, Mail, Search } from 'lucide-react';

export default function InputGroupsDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Input Groups</h1>

      <div className="space-y-6">
        <div>
          <Label>Price (USD)</Label>
          <div className="flex">
            <span className="px-3 py-2 bg-muted border border-r-0 rounded-l-md flex items-center">
              <DollarSign className="w-4 h-4" />
            </span>
            <Input type="number" placeholder="0.00" className="rounded-l-none" />
          </div>
        </div>

        <div>
          <Label>Price (EUR)</Label>
          <div className="flex">
            <Input type="number" placeholder="0.00" className="rounded-r-none" />
            <span className="px-3 py-2 bg-muted border border-l-0 rounded-r-md flex items-center">
              <Euro className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <div className="flex">
            <span className="px-3 py-2 bg-muted border border-r-0 rounded-l-md flex items-center">
              <Mail className="w-4 h-4" />
            </span>
            <Input type="email" placeholder="user@example.com" className="rounded-l-none" />
          </div>
        </div>

        <div>
          <Label>Search with Button</Label>
          <div className="flex">
            <Input type="text" placeholder="Search..." className="rounded-r-none" />
            <Button className="rounded-l-none">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Page 3: Selects Demo**

```tsx
// pages/forms/FormElementsSelectsDemo.jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function SelectsDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Select Dropdowns</h1>

      <div className="space-y-6">
        <div>
          <Label>Basic Select</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Country Select</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="uk">United Kingdom</SelectItem>
              <SelectItem value="de">Germany</SelectItem>
              <SelectItem value="fr">France</SelectItem>
              <SelectItem value="it">Italy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category Select</Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Disabled select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cat1">Category 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

**Page 4: Switches Demo**

```tsx
// pages/forms/FormElementsSwitchesDemo.jsx
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function SwitchesDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Switches & Checkboxes</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-bold mb-4">Toggle Switches</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch id="switch1" />
              <Label htmlFor="switch1">Enable notifications</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="switch2" defaultChecked />
              <Label htmlFor="switch2">Enable dark mode</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="switch3" disabled />
              <Label htmlFor="switch3">Disabled switch</Label>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Checkboxes</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="check1" />
              <Label htmlFor="check1">Option 1</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="check2" defaultChecked />
              <Label htmlFor="check2">Option 2 (checked)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="check3" disabled />
              <Label htmlFor="check3">Option 3 (disabled)</Label>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Radio Buttons</h2>
          <RadioGroup>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="radio1" id="radio1" />
              <Label htmlFor="radio1">Option A</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="radio2" id="radio2" />
              <Label htmlFor="radio2">Option B</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="radio3" id="radio3" />
              <Label htmlFor="radio3">Option C</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
```

**Page 5: Sliders Demo**

```tsx
// pages/forms/FormElementsSlidersDemo.jsx
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function SlidersDemo() {
  const [singleValue, setSingleValue] = useState([50]);
  const [rangeValue, setRangeValue] = useState([20, 80]);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Range Sliders</h1>

      <div className="space-y-8">
        <div>
          <Label>Single Value Slider: {singleValue[0]}</Label>
          <Slider value={singleValue} onValueChange={setSingleValue} max={100} step={1} className="mt-2" />
        </div>

        <div>
          <Label>Range Slider: {rangeValue[0]} - {rangeValue[1]}</Label>
          <Slider value={rangeValue} onValueChange={setRangeValue} max={100} step={1} className="mt-2" />
        </div>

        <div>
          <Label>Price Range: ${rangeValue[0]} - ${rangeValue[1]}</Label>
          <Slider value={rangeValue} onValueChange={setRangeValue} min={0} max={1000} step={10} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
```

**Page 6: FileUpload Demo**

```tsx
// pages/forms/FormElementsFileUploadDemo.jsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export default function FileUploadDemo() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    setFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">File Upload</h1>

      <div className="space-y-6">
        <div>
          <Label>Basic File Input</Label>
          <Input type="file" />
        </div>

        <div>
          <Label>Multiple Files</Label>
          <Input type="file" multiple />
        </div>

        <div>
          <Label>Image Only</Label>
          <Input type="file" accept="image/*" />
        </div>

        <div>
          <Label>Drag & Drop Area</Label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Drag and drop files here or click to select</p>
            <input type="file" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </div>
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <p key={i} className="text-sm">{f.name}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Page 7: Picker Demo**

```tsx
// pages/forms/FormElementsPickerDemo.jsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PickerDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Date & Time Pickers</h1>

      <div className="space-y-6">
        <div>
          <Label htmlFor="date">Date Picker</Label>
          <Input id="date" type="date" />
        </div>

        <div>
          <Label htmlFor="datetime">Date & Time Picker</Label>
          <Input id="datetime" type="datetime-local" />
        </div>

        <div>
          <Label htmlFor="time">Time Picker</Label>
          <Input id="time" type="time" />
        </div>

        <div>
          <Label htmlFor="month">Month Picker</Label>
          <Input id="month" type="month" />
        </div>

        <div>
          <Label htmlFor="week">Week Picker</Label>
          <Input id="week" type="week" />
        </div>

        <div>
          <Label htmlFor="color">Color Picker</Label>
          <Input id="color" type="color" defaultValue="#0000ff" />
        </div>
      </div>
    </div>
  );
}
```

**Page 8: CustomOptions Demo**

```tsx
// pages/forms/FormElementsCustomOptionsDemo.jsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function CustomOptionsDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Custom Options</h1>

      <div className="space-y-6">
        <div>
          <Label className="mb-4 block">Card-based Options</Label>
          <RadioGroup>
            <div className="space-y-3">
              {['Basic', 'Pro', 'Enterprise'].map((plan) => (
                <Card key={plan} className="p-4 cursor-pointer hover:bg-accent transition">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={plan} id={plan} />
                    <Label htmlFor={plan} className="flex-1 cursor-pointer mb-0">
                      <div className="font-bold">{plan}</div>
                      <div className="text-sm text-muted-foreground">Description of {plan} plan</div>
                    </Label>
                  </div>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-4 block">Outlined Options</Label>
          <RadioGroup>
            <div className="grid grid-cols-3 gap-3">
              {['Small', 'Medium', 'Large'].map((size) => (
                <Card key={size} className="p-4 cursor-pointer border-2 hover:border-primary transition">
                  <div className="flex flex-col items-center gap-2">
                    <RadioGroupItem value={size} id={`size-${size}`} />
                    <Label htmlFor={`size-${size}`} className="cursor-pointer mb-0">
                      {size}
                    </Label>
                  </div>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
```

**Page 9: Editors Demo**

```tsx
// pages/forms/FormElementsEditorsDemo.jsx
import { Label } from '@/components/ui/label';

export default function EditorsDemo() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Text Editors</h1>

      <div className="space-y-6">
        <div>
          <Label>Basic Textarea</Label>
          <textarea
            placeholder="Write your content here..."
            rows="6"
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          />
        </div>

        <div>
          <Label>Code Editor (Monospace)</Label>
          <textarea
            placeholder="// Write your code here"
            rows="8"
            className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-slate-950 text-slate-50"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Note: For rich text editors, integrate react-quill which is already installed.
          For code editors, use Monaco Editor or similar via npm.
        </p>
      </div>
    </div>
  );
}
```

**Page 10: Extras Demo**

```tsx
// pages/forms/FormElementsExtrasDemo.jsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

export default function ExtrasDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Form Extras</h1>

      <div className="space-y-6">
        <div>
          <Label>Number Counter</Label>
          <div className="flex items-center gap-2 max-w-xs">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCount(count - 1)}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCount(count + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label>Input with Button</Label>
          <div className="flex gap-2">
            <Input placeholder="Enter value" />
            <Button>Apply</Button>
          </div>
        </div>

        <div>
          <Label>Input with Feedback</Label>
          <Input placeholder="Type to see feedback" />
          <p className="text-xs text-muted-foreground mt-1">Max 100 characters</p>
        </div>
      </div>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import BasicInputDemo from './pages/forms/FormElementsBasicInputDemo';
import InputGroupsDemo from './pages/forms/FormElementsInputGroupsDemo';
import SelectsDemo from './pages/forms/FormElementsSelectsDemo';
import SwitchesDemo from './pages/forms/FormElementsSwitchesDemo';
import SlidersDemo from './pages/forms/FormElementsSlidersDemo';
import FileUploadDemo from './pages/forms/FormElementsFileUploadDemo';
import PickerDemo from './pages/forms/FormElementsPickerDemo';
import CustomOptionsDemo from './pages/forms/FormElementsCustomOptionsDemo';
import EditorsDemo from './pages/forms/FormElementsEditorsDemo';
import ExtrasDemo from './pages/forms/FormElementsExtrasDemo';

<Route path="/form-elements/basic-input" element={<BasicInputDemo />} />
<Route path="/form-elements/input-groups" element={<InputGroupsDemo />} />
<Route path="/form-elements/selects" element={<SelectsDemo />} />
<Route path="/form-elements/switches" element={<SwitchesDemo />} />
<Route path="/form-elements/sliders" element={<SlidersDemo />} />
<Route path="/form-elements/file-upload" element={<FileUploadDemo />} />
<Route path="/form-elements/picker" element={<PickerDemo />} />
<Route path="/form-elements/custom-options" element={<CustomOptionsDemo />} />
<Route path="/form-elements/editors" element={<EditorsDemo />} />
<Route path="/form-elements/extras" element={<ExtrasDemo />} />
```

### Key Points

1. **shadcn/ui components** — use built-in Input, Select, Checkbox, Switch, Slider, etc.
2. **HTML5 input types** — date, time, datetime-local, color, file, etc.
3. **Lucide icons** — for visual enhancements
4. **State management** — use React `useState` for interactive elements
5. **Drag-and-drop** — File upload with drag-and-drop support
6. **Rich text** — react-quill already installed for WYSIWYG editing
7. **Code editors** — Monaco or similar if needed (install separately)
8. **Accessibility** — Labels properly associated with inputs (htmlFor)
9. **Low migration priority** — demo pages, but components are production-ready
10. **Total effort: Low** — each demo is a simple component with shadcn/ui elements

### Production Usage

All these form elements are used in actual forms (checkout, registration, profile update, etc.). The demo pages serve as a reference for available component variants.

### Summary

All 10 form element controllers are **Materio template demo pages** showcasing different input types and form element variations. In Base44, create individual demo pages using shadcn/ui components (Input, Select, Checkbox, Switch, Slider, etc.) and HTML5 input types. Each demo is self-contained and serves as a reference for implementing forms in production.