# Form Wizard Controllers (Materio)

**Purpose:** Simple Blade view rendering controllers for form wizard UI demo pages (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\form_wizard`  
**Location:** `App/Http/Controllers/Materio/form_wizard/`  
**Total Controllers:** 2

---

## 📋 Controller Index

| Controller | View Rendered | Purpose | Route (inferred) |
|-----------|--------------|---------|------------------|
| Icons | `content.form-wizard.form-wizard-icons` | Form wizard with icon-based step indicators | `/form-wizard/icons` |
| Numbered | `content.form-wizard.form-wizard-numbered` | Form wizard with numbered step indicators | `/form-wizard/numbered` |

---

## 🔧 Controller Details

### Icons

**File:** `Icons.php`

```php
<?php

namespace App\Http\Controllers\Materio\form_wizard;

use App\Http\Controllers\Controller;

class Icons extends Controller
{
  public function index()
  {
    return view('content.form-wizard.form-wizard-icons');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /form-wizard/icons` |
| View | `content.form-wizard.form-wizard-icons` |
| Business Logic | None |
| Purpose | Render form wizard with icon-based step indicators (Lucide icons or similar) |

**Likely Features:**
- Multi-step form interface
- Step 1, 2, 3, etc. displayed as icons
- Progress indication with icons
- Navigation between steps (Previous/Next buttons)
- Form validation per step

---

### Numbered

**File:** `Numbered.php`

```php
<?php

namespace App\Http\Controllers\Materio\form_wizard;

use App\Http\Controllers\Controller;

class Numbered extends Controller
{
  public function index()
  {
    return view('content.form-wizard.form-wizard-numbered');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /form-wizard/numbered` |
| View | `content.form-wizard.form-wizard-numbered` |
| Business Logic | None |
| Purpose | Render form wizard with numbered step indicators (1, 2, 3...) |

**Likely Features:**
- Multi-step form interface
- Steps displayed as numbers
- Progress indication with step numbers
- Navigation between steps (Previous/Next buttons)
- Form validation per step

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Pure view-rendering (no business logic) |
| Auth | Likely admin-only via route middleware |
| Data | None injected — static UI demo |
| Layout | Default admin layout |
| Pattern | One method per controller (`index()`) |
| Theme | Materio admin UI kit |

---

## ⚠️ Issues / Concerns

1. **No Data Injection:** Wizard steps/form fields are static or configured in the view template
2. **No Form Submission:** Controllers don't handle form POST — likely client-side or handled separately
3. **No Validation Logic:** Step validation presumably handled on frontend or in separate endpoints
4. **One Controller Per Variant:** Could be consolidated into single `FormWizardController` with 2 methods

---

## 📝 Migration Notes for Base44

### Strategy: React Wizard Components

These are **Materio template demo pages** for form wizard UI patterns. In Base44, replace with reusable React wizard components with optional step validation and submission.

### Base44 Equivalent: Reusable Wizard Component

**Component: FormWizard.jsx**

```tsx
// components/FormWizard.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function FormWizard({ 
  steps, 
  onSubmit, 
  variant = 'numbered' // 'numbered' | 'icons'
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentStep === steps.length - 1) {
      onSubmit(formData);
    } else {
      handleNext();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <StepIndicator 
              step={s} 
              index={idx} 
              isActive={idx === currentStep}
              isCompleted={idx < currentStep}
              variant={variant}
            />
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${idx < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
          <p className="text-muted-foreground mb-6">{step.description}</p>
          
          {/* Step Content - Render form fields dynamically */}
          <div className="space-y-4">
            {step.fields?.map(field => (
              <FormField 
                key={field.name}
                field={field}
                value={formData[field.name]}
                onChange={(value) => setFormData({...formData, [field.name]: value})}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button type="submit">
            {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Step indicator component
function StepIndicator({ step, index, isActive, isCompleted, variant }) {
  const baseClass = `flex items-center justify-center w-10 h-10 rounded-full font-bold transition`;
  
  if (variant === 'icons' && step.icon) {
    const Icon = step.icon;
    return (
      <div className={`${baseClass} ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-5 h-5" />
      </div>
    );
  }
  
  return (
    <div className={`${baseClass} ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
      {index + 1}
    </div>
  );
}

// Simple form field renderer
function FormField({ field, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="font-medium">{field.label}</label>
      {field.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      )}
      {field.type === 'email' && (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      )}
      {field.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows="4"
        />
      )}
    </div>
  );
}
```

### Page: Numbered Step Wizard Demo

```tsx
// pages/wizards/FormWizardNumberedDemo.jsx
import FormWizard from '@/components/FormWizard';

const wizardSteps = [
  {
    title: 'Step 1: Personal Information',
    description: 'Enter your basic information',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ]
  },
  {
    title: 'Step 2: Address',
    description: 'Where do you live?',
    fields: [
      { name: 'street', label: 'Street', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
    ]
  },
  {
    title: 'Step 3: Confirmation',
    description: 'Review your information',
    fields: []
  },
];

export default function FormWizardNumberedDemo() {
  const handleSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return <FormWizard steps={wizardSteps} onSubmit={handleSubmit} variant="numbered" />;
}
```

### Page: Icon-based Step Wizard Demo

```tsx
// pages/wizards/FormWizardIconsDemo.jsx
import FormWizard from '@/components/FormWizard';
import { User, MapPin, CheckCircle } from 'lucide-react';

const wizardSteps = [
  {
    title: 'Step 1: Personal Information',
    description: 'Enter your basic information',
    icon: User,
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ]
  },
  {
    title: 'Step 2: Address',
    description: 'Where do you live?',
    icon: MapPin,
    fields: [
      { name: 'street', label: 'Street', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
    ]
  },
  {
    title: 'Step 3: Confirmation',
    description: 'Review your information',
    icon: CheckCircle,
    fields: []
  },
];

export default function FormWizardIconsDemo() {
  const handleSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return <FormWizard steps={wizardSteps} onSubmit={handleSubmit} variant="icons" />;
}
```

### Route Registration (App.jsx)

```jsx
import FormWizardNumberedDemo from './pages/wizards/FormWizardNumberedDemo';
import FormWizardIconsDemo from './pages/wizards/FormWizardIconsDemo';

<Route path="/form-wizard/numbered" element={<FormWizardNumberedDemo />} />
<Route path="/form-wizard/icons" element={<FormWizardIconsDemo />} />
```

### Key Points

1. **Reusable Component:** `FormWizard` handles both numbered and icon variants
2. **Step Validation:** Add validation per step by extending `FormWizard`
3. **Form Submission:** Pass `onSubmit` handler to process form data
4. **Icons:** Use lucide-react icons for step indicators
5. **Responsive Design:** Mobile-friendly step indicators and form layout
6. **Low migration priority:** Demo pages, but wizard pattern is useful for actual forms
7. **Total effort: Low** — straightforward React component with step management

### Production Use Cases

When implementing actual multi-step forms (checkout, registration, surveys):

```tsx
<FormWizard 
  steps={checkoutSteps}
  onSubmit={handleCheckoutSubmit}
  variant="numbered"
/>
```

### Summary

Both form wizard controllers are **Materio template demo pages** showcasing different step indicator styles (numbered vs. icon-based). In Base44, create a reusable `FormWizard` component that handles both variants, with dynamic step content and optional validation. Use lucide-react icons and Tailwind CSS for styling.