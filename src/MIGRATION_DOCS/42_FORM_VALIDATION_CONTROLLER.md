# Form Validation Controller (Materio)

**Purpose:** Simple Blade view rendering controller for form validation UI demo page (Materio admin theme).  
**Namespace:** `App\Http\Controllers\Materio\form_validation`  
**Location:** `App/Http/Controllers/Materio/form_validation/Validation.php`  
**Type:** Demo controller for form validation patterns

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | View-rendering controller (no business logic) |
| Primary Use | Display form validation examples and patterns |
| Extends | `Controller` |
| Dependencies | None (pure view rendering) |
| Auth | Assumed admin-only via route middleware |
| Routes | 1 |

---

## 🔧 Method

### Validation() → View

```php
<?php

namespace App\Http\Controllers\Materio\form_validation;

use App\Http\Controllers\Controller;

class Validation extends Controller
{
  public function index()
  {
    return view('content.form-validation.form-validation');
  }
}
```

| Aspect | Detail |
|--------|--------|
| Route (inferred) | `GET /form-validation` |
| View | `content.form-validation.form-validation` |
| Business Logic | None |
| Purpose | Render form validation demo page with validation examples |

---

## 📦 Form Validation Context

The view likely demonstrates form validation UI patterns:

**Examples:**
- Real-time validation feedback (email, phone, password strength)
- Error message display
- Success/valid state indicators
- Field highlighting (valid/invalid borders)
- Required vs. optional field styling
- Custom validation rules
- Validation error messages
- Form submission with validation
- Loading states during validation

---

## ⚠️ Notes

### No Business Logic
This controller is purely presentational:
- No database queries
- No service dependencies
- No authorization (relies on route middleware)
- No form submission handling
- No input validation logic
- No state mutation

### Materio Theme
The view belongs to the **Materio** Bootstrap admin theme. The `content.form-validation.*` namespace maps to `resources/views/content/form-validation/` Blade templates that demonstrate form validation UI/UX patterns.

### Validation Patterns Showcase
The page likely shows:
- Input field validation states (valid, invalid, pristine)
- Error message formatting
- Validation timing (real-time, on blur, on submit)
- Different field types with validation
- Custom validation rules
- Form-level validation
- Accessibility features (aria-invalid, aria-describedby)

---

## 📝 Migration Notes for Base44

### Strategy: React Form Component with react-hook-form + Zod

Base44 has `react-hook-form` and `zod` installed. Use these for form validation instead of creating custom validation logic.

### Base44 Equivalent: Validation Demo Page

**Component: FormValidationField.jsx**

```tsx
// components/FormValidationField.jsx
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function FormValidationField({ 
  label, 
  value, 
  error, 
  touched, 
  onChange, 
  placeholder,
  type = 'text'
}) {
  const hasError = error && touched;
  const isValid = !error && touched && value;

  return (
    <div className="space-y-2">
      <label className="font-medium text-sm">{label}</label>
      
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${
            hasError ? 'border-red-500 focus:ring-red-500' : 
            isValid ? 'border-green-500 focus:ring-green-500' : 
            ''
          }`}
        />
        
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
        )}
        {isValid && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
      </div>

      {hasError && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
```

**Page: Form Validation Demo**

```tsx
// pages/forms/FormValidationDemo.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import FormValidationField from '@/components/FormValidationField';

// Define validation schema
const validationSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  
  website: z.string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
  
  age: z.coerce.number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Please enter a valid age'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function FormValidationDemo() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
    reset,
  } = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur', // Validate on blur
  });

  const formValues = watch();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (data) => {
    console.log('Form submitted:', data);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      reset();
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Form Validation Examples</h1>
        <p className="text-muted-foreground mt-2">
          Real-time validation with react-hook-form and Zod
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <FormValidationField
          label="Email Address"
          placeholder="user@example.com"
          type="email"
          value={formValues.email || ''}
          error={errors.email?.message}
          touched={touchedFields.email}
          {...register('email')}
        />

        {/* Phone Field */}
        <FormValidationField
          label="Phone Number"
          placeholder="1234567890"
          type="tel"
          value={formValues.phone || ''}
          error={errors.phone?.message}
          touched={touchedFields.phone}
          {...register('phone')}
        />

        {/* Age Field */}
        <FormValidationField
          label="Age"
          placeholder="18"
          type="number"
          value={formValues.age || ''}
          error={errors.age?.message}
          touched={touchedFields.age}
          {...register('age')}
        />

        {/* Website Field (Optional) */}
        <FormValidationField
          label="Website (Optional)"
          placeholder="https://example.com"
          type="url"
          value={formValues.website || ''}
          error={errors.website?.message}
          touched={touchedFields.website}
          {...register('website')}
        />

        {/* Password Field */}
        <FormValidationField
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          type="password"
          value={formValues.password || ''}
          error={errors.password?.message}
          touched={touchedFields.password}
          {...register('password')}
        />

        {/* Confirm Password Field */}
        <FormValidationField
          label="Confirm Password"
          placeholder="Re-enter your password"
          type="password"
          value={formValues.confirmPassword || ''}
          error={errors.confirmPassword?.message}
          touched={touchedFields.confirmPassword}
          {...register('confirmPassword')}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={submitted}>
          {submitted ? 'Submitting...' : 'Submit Form'}
        </Button>

        {submitted && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✓ Form submitted successfully!</p>
          </div>
        )}
      </form>

      {/* Validation Rules Documentation */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Validation Rules</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 border rounded-lg space-y-2">
            <p className="font-bold">Email</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Required</li>
              <li>Valid email format</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <p className="font-bold">Password</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Minimum 8 characters</li>
              <li>Uppercase letter required</li>
              <li>Number required</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <p className="font-bold">Phone</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Minimum 10 digits</li>
              <li>Numbers only</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <p className="font-bold">Age</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Minimum 18 years</li>
              <li>Maximum 120 years</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Route Registration (App.jsx)

```jsx
import FormValidationDemo from './pages/forms/FormValidationDemo';

<Route path="/form-validation" element={<FormValidationDemo />} />
```

### Key Points

1. **react-hook-form** — lightweight form state management
2. **Zod validation schema** — type-safe runtime schema validation
3. **Real-time validation** — validate on blur/change with `mode: 'onBlur'`
4. **Error display** — show/hide error messages based on touched state
5. **Visual feedback** — green checkmark for valid fields, red border for errors
6. **Type safety** — Zod schema provides TypeScript types
7. **Reusable component** — `FormValidationField` handles display logic
8. **Low migration priority** — demo page, but validation patterns are useful
9. **Total effort: Low** — straightforward React form with Zod validation

### Production Use Cases

When validating actual forms (registration, checkout, profiles):

```tsx
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars'),
  // ... more fields
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange', // Real-time validation
});
```

### Validation Modes

- `onSubmit` — validate only on form submission
- `onBlur` — validate when field loses focus
- `onChange` — validate on every keystroke (real-time)
- `onTouched` — validate after field is touched and changed
- `all` — validate on blur and change

### Summary

The Validation controller is a **Materio template demo page** showcasing form validation UI patterns. In Base44, create a demo form with `react-hook-form` and `Zod` validation schema, displaying real-time validation feedback with error messages and visual indicators (green checkmarks, red borders). Provides practical examples for implementing form validation in production.