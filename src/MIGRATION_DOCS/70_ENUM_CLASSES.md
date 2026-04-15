# Enum Classes (Type Safety & Configuration)

**Purpose:** PHP 8.1+ enums for domain values (activities, quote status, documents, channels, seniority, ticket types).  
**Namespace:** `App\Enums`  
**Location:** `App/Enums/` (8 files)  
**Type:** Type-safe value objects — low priority

---

## 📋 Overview

| Enum | Purpose | Cases | Pattern | Size |
|------|---------|-------|---------|------|
| ActivityType | CRM activity types | 10 | Full (label/icon/color/all) | 1.5 KB |
| QuoteStatusEnums | Quote workflow states | 4 | Full + buttonClass | 1.4 KB |
| DocumentType | Document categories | 5 | Full (label/icon/all) | 0.9 KB |
| SellerChannel | Sales channels (digital/physical) | 11 | Full (label/icon/color/all) | 1.9 KB |
| Seniority | Job seniority levels | 4 | Full (label/icon/color/all) | 1.1 KB |
| TextGenerationModel | AI model types | 5 | Minimal (values only) | 0.3 KB |
| TicketChannel | Support ticket channels | 3 | Medium (label/resolve/all) | 1.0 KB |
| TicketSubject | Ticket categories | 6 | Medium (label/resolve/all) | 1.1 KB |

**Total:** 8 enums, 48 cases, ~9.2 KB

---

## 🔧 Enum Patterns

### Full Pattern (ActivityType, QuoteStatusEnums, DocumentType, SellerChannel, Seniority)

```php
enum ActivityType: string
{
    case CALL_BACK = 'call_back';
    case EMAIL_SEND = 'email_send';
    // ... more cases

    public function label(): string { /* ... */ }
    public function icon(): string { /* ... */ }
    public function color(): string { /* ... */ }
    public function toArray(): array { /* ... */ }
    public static function all(): array { /* ... */ }
}
```

**Features:**
- ✅ Type-safe cases
- ✅ Human-readable labels (English or Italian)
- ✅ Icon names (Remixicon)
- ✅ Colors (Tailwind hex)
- ✅ toArray() for API responses
- ✅ all() for dropdowns/selects

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ MEDIUM | **Hardcoded Italian labels** — QuoteStatusEnums, DocumentType use Italian | Not i18n-friendly |
| 2 | ⚠️ MEDIUM | **No icon validation** — Assumes Remixicon icons exist | XSS/render errors if wrong |
| 3 | ⚠️ MEDIUM | **Colors hardcoded** — Not theme-aware (dark mode) | Poor UX in dark theme |
| 4 | ⚠️ MEDIUM | **buttonClass mix** — QuoteStatusEnums uses Bootstrap classes (btn-outline-secondary) | Deprecated pattern |
| 5 | ℹ️ LOW | **Duplicate match statements** — icon() and color() repeat case matching | DRY violation |

---

### Minimal Pattern (TextGenerationModel)

```php
enum TextGenerationModel: string
{
    case CRUISELINE = 'cruiseline';
    case SHIP = 'ship';
    // ...

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

**Issues:**
- ⚠️ MEDIUM: No label/icon/color methods (limited UI support)
- ⚠️ MEDIUM: Only used in backend, not frontend-friendly

---

### Resolver Pattern (TicketChannel, TicketSubject)

```php
enum TicketChannel: string
{
    case EMAIL = 'Email';  // ⚠️ Values match labels
    case CHAT = 'Chat';

    public function label(): string { /* ... */ }
    
    public static function resolve(string|null $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = strtolower(trim($value));

        foreach (self::cases() as $case) {
            if ($normalized === strtolower($case->value) || 
                $normalized === strtolower($case->label())) {
                return $case;
            }
        }

        return null;
    }

    public function toArray(): array { /* ... */ }
    public static function all(): array { /* ... */ }
}
```

**Good:**
- ✅ resolve() for flexible parsing (from string input)
- ✅ Case-insensitive matching
- ✅ Matches both value and label

**Issues:**
- ⚠️ Values match labels — redundant (Email/Email)
- ⚠️ No icon/color methods
- ⚠️ Inefficient O(n) resolve loop (could use array_column cache)

---

## ⚠️ Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 0 | - |
| ⚠️ MEDIUM | 10 | Hardcoded Italian, icon validation, theme-unaware colors, Bootstrap classes, no i18n, inefficient resolve |
| ℹ️ LOW | 3 | DRY violations (duplicate matches), redundant values, poor resolver performance |

---

## 📝 Migration Notes for Base44

### Strategy: Unified Enum System with i18n & Theme Support

**Step 1: Create Enum Config Entity**

```json
// entities/EnumConfig.json
{
  "enum_type": {"type": "string"},
  "enum_key": {"type": "string"},
  "label": {"type": "string"},
  "label_en": {"type": "string"},
  "label_it": {"type": "string"},
  "icon": {"type": "string"},
  "color_light": {"type": "string"},
  "color_dark": {"type": "string"},
  "description": {"type": "string"}
}
```

**Step 2: Backend Function (Get Enums)**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { enum_type, lang = 'en' } = await req.json();

  if (!enum_type) {
    return Response.json({ error: 'enum_type required' }, { status: 400 });
  }

  try {
    const configs = await base44.entities.EnumConfig.filter({
      enum_type,
    });

    const enums = configs.map(config => ({
      value: config.enum_key,
      label: lang === 'it' ? config.label_it : config.label_en,
      icon: config.icon,
      color: config.color_light, // Client can request color_dark
      description: config.description,
    }));

    return Response.json({ enums });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

**Step 3: React Hooks for Enums**

```tsx
// hooks/useEnums.ts
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useEnums(enumType, lang = 'en') {
  const { data, isLoading } = useQuery({
    queryKey: ['enums', enumType, lang],
    queryFn: () =>
      base44.functions.invoke('getEnums', {
        enum_type: enumType,
        lang,
      }),
  });

  return {
    enums: data?.data?.enums || [],
    isLoading,
    getLabel: (value) =>
      data?.data?.enums?.find(e => e.value === value)?.label || value,
    getIcon: (value) =>
      data?.data?.enums?.find(e => e.value === value)?.icon,
    getColor: (value) =>
      data?.data?.enums?.find(e => e.value === value)?.color,
  };
}
```

**Step 4: Reusable Enum Components**

```tsx
// components/EnumBadge.jsx
import { useEnums } from '@/hooks/useEnums';

export function EnumBadge({ enumType, value, lang = 'en' }) {
  const { getLabel, getIcon, getColor } = useEnums(enumType, lang);
  const label = getLabel(value);
  const icon = getIcon(value);
  const color = getColor(value);

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {icon && <i className={icon}></i>}
      {label}
    </span>
  );
}

// components/EnumSelect.jsx
export function EnumSelect({ enumType, value, onChange, lang = 'en' }) {
  const { enums, isLoading } = useEnums(enumType, lang);

  if (isLoading) return <div>Loading...</div>;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2"
    >
      <option value="">Select...</option>
      {enums.map(e => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </select>
  );
}
```

**Step 5: Initialize Enum Data**

```typescript
// Seed EnumConfig with data from old enums
// Example: ActivityType → 10 EnumConfig records

const activityConfigs = [
  {
    enum_type: 'activity_type',
    enum_key: 'call_back',
    label_en: 'Call Back',
    label_it: 'Richiamata',
    icon: 'ri ri-phone-line',
    color_light: '#0ea5e9',
    color_dark: '#0284c7',
  },
  // ... more entries
];

for (const config of activityConfigs) {
  await base44.entities.EnumConfig.create(config);
}
```

### Key Improvements

1. **i18n Support** — All labels in multiple languages (database-driven)
2. **Theme-Aware Colors** — Separate light/dark theme colors
3. **Dynamic Enums** — Change values without code (database-backed)
4. **Icon Validation** — Icons configurable, no hardcoded strings
5. **Type-Safe** — Frontend and backend use same enum values
6. **Resolver Optimization** — Backend caches, no O(n) loops
7. **DRY** — No duplicate match statements
8. **API-Friendly** — Enums as JSON objects
9. **Bootstrap Removed** — Use Tailwind only
10. **Extensible** — Add new enums without code changes

### Usage Example

```tsx
// pages/LeadActivityPage.jsx
import { useEnums } from '@/hooks/useEnums';
import { EnumBadge, EnumSelect } from '@/components';

export function LeadActivityPage({ lang = 'en' }) {
  const { enums } = useEnums('activity_type', lang);

  return (
    <div>
      <h2>Activities</h2>
      <div className="grid grid-cols-3 gap-4">
        {enums.map(activity => (
          <EnumBadge
            key={activity.value}
            enumType="activity_type"
            value={activity.value}
            lang={lang}
          />
        ))}
      </div>

      <EnumSelect
        enumType="activity_type"
        onChange={(value) => console.log(value)}
        lang={lang}
      />
    </div>
  );
}
```

### Migration Steps

1. **Create EnumConfig entity** (template above)
2. **Export old enums to CSV** → Case name, label_en, label_it, icon, color_light, color_dark
3. **Bulk import** via import_data tool
4. **Create getEnums backend function** (template above)
5. **Create React hooks** (useEnums, useEnumLabel, etc.)
6. **Create reusable components** (EnumBadge, EnumSelect, EnumTimeline)
7. **Replace all enum references** in forms/displays with hooks + components
8. **Remove old enum files** from codebase

---

## Summary

8 enum classes (ActivityType, QuoteStatusEnums, DocumentType, SellerChannel, Seniority, TextGenerationModel, TicketChannel, TicketSubject): 5 full-featured (label/icon/color/all), 1 minimal (values only), 2 with resolver. Issues: hardcoded Italian labels (not i18n), icon strings not validated, colors theme-unaware, Bootstrap classes (deprecated), duplicate match statements (DRY), inefficient resolve() loops, redundant enum values matching labels.

In Base44: Create EnumConfig entity (label_en, label_it, icon, color_light, color_dark), backend function (getEnums) with language/theme support, React hooks (useEnums, useEnumLabel), reusable components (EnumBadge, EnumSelect), seed database with old enum data, remove hardcoded values, support dynamic enums without code changes.

**Migration Priority: LOW** — Type-safe enums are good (keep), but configurable/database-driven approach improves i18n/theme support significantly. No critical bugs, straightforward refactoring.