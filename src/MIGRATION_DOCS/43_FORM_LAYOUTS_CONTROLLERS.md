# Form Layouts Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for form layout variations (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\form_layouts`  
**Location:** `App/Http/Controllers/Materio/form_layouts/`  
**Total Controllers:** 3

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| HorizontalForm | `content.form-layout.form-layouts-horizontal` | Form with horizontal label-input layout | `/form-layouts/horizontal` |
| StickyActions | `content.form-layout.form-layouts-sticky` | Form with sticky submit/action buttons | `/form-layouts/sticky` |
| VerticalForm | `content.form-layout.form-layouts-vertical` | Form with vertical label-input layout | `/form-layouts/vertical` |

---

## 🔧 Controller Details

### HorizontalForm

**File:** `HorizontalForm.php`

```php
<?php

namespace App\Http\Controllers\Materio\form_layouts;

use App\Http\Controllers\Controller;

class HorizontalForm extends Controller
{
  public function index()
  {
    return view('content.form-layout.form-layouts-horizontal');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /form-layouts/horizontal` |
| View | `content.form-layout.form-layouts-horizontal` |
| Business Logic | None |
| Purpose | Render form with horizontal label-input layout (labels and inputs on same row) |

**Layout Style:**
- Labels aligned left (fixed width or percentage)
- Input fields aligned right
- Fields in a grid/table-like structure
- Compact, space-efficient on large screens
- May collapse to vertical on mobile

---

### StickyActions

**File:** `StickyActions.php`

```php
<?php

namespace App\Http\Controllers\Materio\form_layouts;

use App\Http\Controllers\Controller;

class StickyActions extends Controller
{
  public function index()
  {
    return view('content.form-layout.form-layouts-sticky');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /form-layouts/sticky` |
| View | `content.form-layout.form-layouts-sticky` |
| Business Logic | None |
| Purpose | Render form with sticky/fixed submit and action buttons (remain visible during scroll) |

**Layout Style:**
- Form fields scroll normally
- Submit, Cancel, Reset buttons fixed to bottom of viewport
- Buttons remain visible while scrolling through long forms
- Improves UX for multi-page/long forms
- Common in admin panels and data entry applications

---

### VerticalForm

**File:** `VerticalForm.php`

```php
<?php

namespace App\Http\Controllers\Materio\form_layouts;

use App\Http\Controllers\Controller;

class VerticalForm extends Controller
{
  public function index()
  {
    return view('content.form-layout.form-layouts-vertical');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /form-layouts/vertical` |
| View | `content.form-layout.form-layouts-vertical` |
| Business Logic | None |
| Purpose | Render form with vertical label-input layout (label above input on separate rows) |

**Layout Style:**
- Labels stacked above input fields
- Inputs full-width below labels
- Traditional vertical form layout
- Most common and mobile-friendly
- Easy to scan vertically

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

### Form Layout Comparison

| Layout | Label Position | Input Position | Use Case | Mobile |
|--------|----------------|----------------|----------|--------|
| Vertical | Above | Full-width below | General, mobile-first | Excellent |
| Horizontal | Left (fixed width) | Right of label | Compact, data tables | Poor |
| Sticky Actions | N/A (both vertical) | Full-width | Long forms | Good (with sticky footer) |

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** Form fields are static or configured in view templates
2. **No Form Submission:** Controllers don't handle form POST — likely client-side or handled separately
3. **No Validation Logic:** Form validation presumably handled on frontend or in separate endpoints
4. **One Controller Per Layout:** Could be consolidated into single `FormLayoutsController` with 3 methods (minor)
5. **Sticky Actions Limitations:** Fixed footer may overlap content on very small screens

---

## 📝 Migration Notes for Base44

### Strategy: React Form Components with Layout Variants

These are **Materio template demo pages** for form layout variations. In Base44, create reusable form components with layout options.

### Base44 Equivalent: Form Layout Components

**Component: FormLayout.jsx (Wrapper)**

```tsx
// components/FormLayout.jsx
export default function FormLayout({ 
  children, 
  variant = 'vertical', // 'vertical' | 'horizontal'
  actions, // { submit, cancel, reset }
  stickyActions = false
}) {
  return (
    <div className={`
      ${variant === 'horizontal' ? 'space-y-0' : 'space-y-6'}
      pb-24
    `}>
      {children}
      
      {stickyActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-2">
          {actions?.cancel && <Button variant="outline">{actions.cancel}</Button>}
          {actions?.reset && <Button variant="outline">{actions.reset}</Button>}
          {actions?.submit && <Button>{actions.submit}</Button>}
        </div>
      )}
    </div>
  );
}
```

**Component: FormField.jsx (Vertical & Horizontal)**

```tsx
// components/FormField.jsx
export default function FormField({ 
  label, 
  children, 
  error, 
  required,
  variant = 'vertical' // 'vertical' | 'horizontal'
}) {
  return variant === 'vertical' ? (
    <div className="space-y-2">
      <label className="block font-medium text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  ) : (
    // Horizontal layout
    <div className="grid grid-cols-12 gap-4 items-start py-4 border-b">
      <label className="col-span-3 font-medium text-sm pt-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="col-span-9">
        {children}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
```

### Page 1: Vertical Form Layout Demo

```tsx
// pages/forms/FormLayoutVerticalDemo.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormLayout from '@/components/FormLayout';
import FormField from '@/components/FormField';

export default function FormLayoutVerticalDemo() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name required';
    if (!formData.email) newErrors.email = 'Email required';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Vertical Form Layout</h1>
        <p className="text-muted-foreground mt-2">
          Labels stacked above inputs — mobile-friendly default
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField 
          label="First Name" 
          required
          error={errors.firstName}
          variant="vertical"
        >
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
          />
        </FormField>

        <FormField 
          label="Last Name"
          variant="vertical"
        >
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
          />
        </FormField>

        <FormField 
          label="Email Address" 
          required
          error={errors.email}
          variant="vertical"
        >
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />
        </FormField>

        <FormField 
          label="Phone Number"
          variant="vertical"
        >
          <Input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="123-456-7890"
          />
        </FormField>

        <FormField 
          label="Message"
          variant="vertical"
        >
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your message here"
            rows="5"
            className="w-full px-3 py-2 border rounded-md"
          />
        </FormField>

        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="reset" variant="outline">Reset</Button>
          <Button type="button" variant="outline">Cancel</Button>
        </div>
      </form>
    </div>
  );
}
```

### Page 2: Horizontal Form Layout Demo

```tsx
// pages/forms/FormLayoutHorizontalDemo.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormLayout from '@/components/FormLayout';
import FormField from '@/components/FormField';

export default function FormLayoutHorizontalDemo() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Horizontal Form Layout</h1>
        <p className="text-muted-foreground mt-2">
          Labels and inputs on same row — space-efficient for wide screens
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0">
        <FormField 
          label="First Name" 
          required
          variant="horizontal"
        >
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
          />
        </FormField>

        <FormField 
          label="Last Name"
          variant="horizontal"
        >
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
          />
        </FormField>

        <FormField 
          label="Email Address" 
          required
          variant="horizontal"
        >
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />
        </FormField>

        <FormField 
          label="Phone Number"
          variant="horizontal"
        >
          <Input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="123-456-7890"
          />
        </FormField>

        <div className="border-t pt-4 grid grid-cols-12 gap-4">
          <div className="col-span-3" />
          <div className="col-span-9 flex gap-2">
            <Button type="submit">Submit</Button>
            <Button type="reset" variant="outline">Reset</Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

### Page 3: Sticky Actions Form Demo

```tsx
// pages/forms/FormLayoutStickyActionsDemo.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormLayout from '@/components/FormLayout';
import FormField from '@/components/FormField';

export default function FormLayoutStickyActionsDemo() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    details: '',
    // ... more fields for a long form
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <FormLayout 
      variant="vertical"
      stickyActions={true}
      actions={{ submit: 'Save', cancel: 'Cancel', reset: 'Reset' }}
    >
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Form with Sticky Actions</h1>
          <p className="text-muted-foreground mt-2">
            Submit button stays visible while scrolling through long forms
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField label="Title" required variant="vertical">
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter title"
            />
          </FormField>

          <FormField label="Description" variant="vertical">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              rows="4"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>

          {/* Add multiple fields to simulate long form */}
          {Array.from({ length: 10 }).map((_, i) => (
            <FormField key={i} label={`Field ${i + 1}`} variant="vertical">
              <Input
                placeholder={`Enter field ${i + 1}`}
                defaultValue=""
              />
            </FormField>
          ))}

          <FormField label="Additional Details" variant="vertical">
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              placeholder="Add any additional details"
              rows="5"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>
        </form>
      </div>
    </FormLayout>
  );
}
```

### Route Registration (App.jsx)

```jsx
import FormLayoutVerticalDemo from './pages/forms/FormLayoutVerticalDemo';
import FormLayoutHorizontalDemo from './pages/forms/FormLayoutHorizontalDemo';
import FormLayoutStickyActionsDemo from './pages/forms/FormLayoutStickyActionsDemo';

<Route path="/form-layouts/vertical" element={<FormLayoutVerticalDemo />} />
<Route path="/form-layouts/horizontal" element={<FormLayoutHorizontalDemo />} />
<Route path="/form-layouts/sticky" element={<FormLayoutStickyActionsDemo />} />
```

### Key Points

1. **Vertical Layout** — mobile-first, traditional, most common
2. **Horizontal Layout** — compact, space-efficient on large screens
3. **Sticky Actions** — buttons remain visible during scroll, improves UX for long forms
4. **Reusable Components** — `FormLayout` and `FormField` support multiple variants
5. **Responsive Design** — horizontal layout collapses to vertical on mobile
6. **Low migration priority** — demo pages, but layout patterns are production-ready
7. **Total effort: Low** — straightforward React components with CSS Grid/Tailwind

### Production Use Cases

Mix and match layouts based on context:

```tsx
// Admin: horizontal (compact)
<FormLayout variant="horizontal" />

// Mobile app: vertical (mobile-first)
<FormLayout variant="vertical" />

// Long checkout form: vertical with sticky actions
<FormLayout variant="vertical" stickyActions={true} />
```

### Summary

All 3 form layout controllers are **Materio template demo pages** showcasing different form layout approaches. In Base44, create reusable `FormLayout` and `FormField` components supporting vertical, horizontal, and sticky action variants. Vertical is default (mobile-friendly), horizontal is optional for admin/desktop, and sticky actions improve UX for multi-section forms.