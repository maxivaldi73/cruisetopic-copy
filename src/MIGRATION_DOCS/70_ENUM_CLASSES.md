# Enum Classes (Type-Safe Domain Values)

**Purpose:** PHP 8.1 enums for domain-driven design (CRM, ticketing, documents).  
**Namespace:** `App\Enums`  
**Location:** `App/Enums/` (8 files)  
**Type:** Value objects — low priority

---

## 📋 Overview

| Enum | Domain | Cases | Methods | Status |
|------|--------|-------|---------|--------|
| ActivityType | CRM Activity | 10 | label, icon, color, toArray, all | ✅ Excellent |
| QuoteStatusEnums | Quote Workflow | 4 | label, icon, color, buttonClass, toArray, all | ✅ Excellent |
| DocumentType | Document Mgmt | 5 | label, icon, toArray, all | ✅ Good |
| SellerChannel | Sales Channels | 11 | label, icon, color, toArray, all | ✅ Excellent |
| Seniority | User Levels | 4 | label, icon, color, toArray, all | ✅ Good |
| TextGenerationModel | AI Models | 5 | values() | ⚠️ Minimal |
| TicketChannel | Support Channels | 3 | label, resolve, toArray, all | ✅ Good |
| TicketSubject | Support Topics | 6 | label, resolve, toArray, all | ✅ Good |

---

## 🔧 Enum Patterns & Features

### Pattern 1: Rich Enums (ActivityType, SellerChannel)

```php
enum ActivityType: string
{
    case CALL_BACK = 'call_back';
    // ...
    
    public function label(): string { }
    public function icon(): string { }
    public function color(): string { }
    public function toArray(): array { }
    public static function all(): array { }
}
```

**Features:**
- ✅ label() — Human-readable text
- ✅ icon() — RemixIcon classnames
- ✅ color() — Hex colors for UI
- ✅ toArray() — Serialization
- ✅ all() — Collection for dropdowns
- ✅ Well-commented
- ✅ Type-safe

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ MEDIUM | **Hardcoded colors** — Can't be customized per theme | Not dynamic |
| 2 | ⚠️ MEDIUM | **Hardcoded icons** — Couples to RemixIcon library | No flexibility |
| 3 | ⚠️ MEDIUM | **Hardcoded labels** — English/Italian mixed, not i18n | Not translatable |
| 4 | ℹ️ LOW | **No documentation** — Cases lack descriptions | Missing context |

---

### Pattern 2: Extended Enums (QuoteStatusEnums)

```php
enum QuoteStatusEnums: string
{
    case DRAFT = 'draft';
    
    public function label(): string { }
    public function icon(): string { }
    public function color(): string { }
    public function buttonClass(): string { } // ⚠️ Bootstrap-specific
    public function toArray(): array { }
    public static function all(): array { }
}
```

**Features:**
- ✅ Same as Pattern 1
- ✅ buttonClass() — UI framework integration
- ⚠️ Tightly coupled to Bootstrap

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **buttonClass() returns Bootstrap classes** — Hard to change frameworks |
| 2 | ⚠️ MEDIUM | **Hardcoded labels in Italian** — Not i18n |
| 3 | ⚠️ MEDIUM | **Colors hardcoded** — Not customizable |
| 4 | ⚠️ MEDIUM | **Mixed English/Italian comments** — Inconsistent |

---

### Pattern 3: Resolver Enums (TicketChannel, TicketSubject)

```php
enum TicketChannel: string
{
    case EMAIL = 'Email';
    
    public static function resolve(string|null $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }
        
        $normalized = strtolower(trim($value));
        
        foreach (self::cases() as $case) {
            if ($normalized === strtolower($case->value) 
                || $normalized === strtolower($case->label())) {
                return $case;
            }
        }
        
        return null;
    }
}
```

**Features:**
- ✅ resolve() — Fuzzy matching by value or label
- ✅ Case-insensitive
- ✅ Whitespace trimmed
- ✅ Safe null handling

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ MEDIUM | **resolve() performance** — O(n) loop per call |
| 2 | ⚠️ MEDIUM | **Hardcoded labels in English** — Not i18n |
| 3 | ⚠️ MEDIUM | **No caching** — resolve() recalculates on each call |
| 4 | ℹ️ LOW | **Duplication** — Same pattern in 2 enums |

---

### Pattern 4: Minimal Enum (TextGenerationModel)

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

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ HIGH | **Missing all() method** — Not consistent with other enums |
| 2 | ⚠️ MEDIUM | **No label()** — No human-readable names |
| 3 | ⚠️ MEDIUM | **values() method unusual** — Should be all() |
| 4 | ⚠️ MEDIUM | **Not extensible** — No icon/color/toArray |

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 0 | - |
| ⚠️ HIGH | 2 | buttonClass() couples to Bootstrap, TextGenerationModel missing all() |
| ⚠️ MEDIUM | 16 | Hardcoded colors/icons/labels, not i18n, resolve() performance, duplication, inconsistent patterns |
| ℹ️ LOW | 4 | Mixed Italian/English comments, no documentation, unusual method names |

---

## 📝 Migration Notes for Base44

### Strategy: Centralized Enum Configuration + i18n

**Step 1: Create Enum Config Entity**

```json
// entities/EnumConfig.json
{
  "enum_name": {"type": "string", "unique": true},
  "case_name": {"type": "string"},
  "label": {"type": "string"},
  "icon": {"type": "string"},
  "color": {"type": "string"},
  "description": {"type": "string"},
  "order": {"type": "integer"}
}
```

**Step 2: Backend Functions**

**Function: getEnumValues**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { enum_name } = await req.json();

  if (!enum_name) {
    return Response.json({ error: 'enum_name required' }, { status: 400 });
  }

  // Get enum config from database
  const configs = await base44.entities.EnumConfig.filter(
    { enum_name },
    'order',
    100
  );

  const values = configs.map(config => ({
    value: config.case_name,
    label: config.label,
    icon: config.icon,
    color: config.color,
    description: config.description,
  }));

  return Response.json({ values });
});
```

**Function: getEnumValue**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { enum_name, case_name } = await req.json();

  if (!enum_name || !case_name) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const config = await base44.entities.EnumConfig.filter({
    enum_name,
    case_name,
  }).then(results => results[0] || null);

  if (!config) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({
    value: config.case_name,
    label: config.label,
    icon: config.icon,
    color: config.color,
    description: config.description,
  });
});
```

**Step 3: React Enum Hooks**

```tsx
// hooks/useEnum.ts
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useEnum(enumName: string) {
  return useQuery({
    queryKey: ['enum', enumName],
    queryFn: () =>
      base44.functions.invoke('getEnumValues', { enum_name: enumName }),
  });
}

export function useEnumValue(enumName: string, caseName: string) {
  return useQuery({
    queryKey: ['enum', enumName, caseName],
    queryFn: () =>
      base44.functions.invoke('getEnumValue', {
        enum_name: enumName,
        case_name: caseName,
      }),
  });
}
```

**Step 4: React Select/Dropdown Component**

```tsx
// components/EnumSelect.jsx
import { useEnum } from '@/hooks/useEnum';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EnumSelect({ enumName, value, onChange }) {
  const { data, isLoading } = useEnum(enumName);
  const values = data?.data?.values || [];

  if (isLoading) return <div>Loading...</div>;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {values.map(v => (
          <SelectItem key={v.value} value={v.value}>
            {v.icon && <span className="mr-2">{v.icon}</span>}
            {v.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 5: Badge/Status Component**

```tsx
// components/EnumBadge.jsx
import { useEnumValue } from '@/hooks/useEnum';

export function EnumBadge({ enumName, caseName }) {
  const { data } = useEnumValue(enumName, caseName);
  const value = data?.data;

  if (!value) return null;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
      style={{ backgroundColor: value.color + '20', color: value.color }}
    >
      {value.icon && <i className={value.icon} />}
      <span>{value.label}</span>
    </div>
  );
}
```

### Key Improvements

1. **Centralized Configuration** — All enum values in database (not hardcoded)
2. **i18n Ready** — Labels/descriptions translatable per language/region
3. **Dynamic Colors/Icons** — Change without code deployment
4. **Framework Agnostic** — No Bootstrap coupling
5. **Performance** — Cache via React Query
6. **Consistency** — All enums follow same pattern
7. **Documentation** — description field for each case
8. **Ordering** — order field for UI presentation
9. **Single Source** — No duplication between Laravel + React
10. **Easy to Extend** — Add new enums via database

### Migration Path

1. **Phase 1** — Create EnumConfig entity, populate with existing enums
2. **Phase 2** — Create backend functions (getEnumValues, getEnumValue)
3. **Phase 3** — Create React hooks + components
4. **Phase 4** — Update all dropdown/select components to use hooks
5. **Phase 5** — Remove hardcoded enums from Laravel
6. **Phase 6** — Add i18n support (language-specific labels)

---

## Summary

8 enum classes: ActivityType, QuoteStatusEnums, DocumentType, SellerChannel (rich enums with label/icon/color/toArray/all); Seniority (similar pattern); TicketChannel, TicketSubject (resolver pattern with fuzzy matching); TextGenerationModel (minimal, missing all()). Issues: hardcoded colors/icons/labels (not i18n), buttonClass() couples to Bootstrap, resolve() performance O(n), TextGenerationModel inconsistent/minimal, mixed Italian/English comments, no documentation.

In Base44: Create EnumConfig entity (enum_name, case_name, label, icon, color, description, order), backend functions (getEnumValues, getEnumValue), React hooks (useEnum, useEnumValue), EnumSelect/EnumBadge components, database-driven instead of hardcoded, i18n-ready, framework-agnostic, centralized configuration, eliminates duplication.

**Migration Priority: LOW** — enums are stable/low-risk, but refactoring improves i18n support and maintainability significantly.