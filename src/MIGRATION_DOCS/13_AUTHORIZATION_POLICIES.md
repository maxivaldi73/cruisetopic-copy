# Authorization Policies

**Purpose:** Laravel authorization policies for model-based access control.

---

## Overview

Policies define fine-grained authorization rules for models, used with the `authorize()` helper in controllers.

| Policy | Model | Purpose |
|--------|-------|---------|
| TeamPolicy | Team | Team & member management |
| LeadPolicy | Lead | Lead access control (registered, not shown) |

---

## TeamPolicy

**Location:** `App\Policies\TeamPolicy`  
**Model:** `App\Models\Team`  
**Trait:** `HandlesAuthorization` (provides helper methods)

### Methods

#### `viewAny(User $user): bool`
- **Condition:** Always true
- **Use:** Check if user can list teams
- **Logic:** All authenticated users can see team list

#### `view(User $user, Team $team): bool`
- **Condition:** `$user->belongsToTeam($team)`
- **Use:** Check if user can view specific team
- **Logic:** Only team members can view

#### `create(User $user): bool`
- **Condition:** Always true
- **Use:** Check if user can create a team
- **Logic:** All authenticated users can create teams

#### `update(User $user, Team $team): bool`
- **Condition:** `$user->ownsTeam($team)`
- **Use:** Check if user can update team settings
- **Logic:** Only team owner can update

#### `addTeamMember(User $user, Team $team): bool`
- **Condition:** `$user->ownsTeam($team)`
- **Use:** Check if user can invite members
- **Logic:** Only team owner can invite

#### `updateTeamMember(User $user, Team $team): bool`
- **Condition:** `$user->ownsTeam($team)`
- **Use:** Check if user can change member roles/permissions
- **Logic:** Only team owner can manage permissions

#### `removeTeamMember(User $user, Team $team): bool`
- **Condition:** `$user->ownsTeam($team)`
- **Use:** Check if user can remove members
- **Logic:** Only team owner can remove

#### `delete(User $user, Team $team): bool`
- **Condition:** `$user->ownsTeam($team)`
- **Use:** Check if user can delete team
- **Logic:** Only team owner can delete

### User Model Methods (Required)

The policy relies on User model methods:
- `belongsToTeam(Team $team): bool` - Check membership
- `ownsTeam(Team $team): bool` - Check ownership

---

## LeadPolicy

**Status:** Registered in AuthServiceProvider, content not shown

```php
protected $policies = [
    Lead::class => LeadPolicy::class,
];
```

---

## HandlesSpatiePermissions Trait

**Location:** `App\Policies\Traits\HandlesSpatiePermissions`  
**Purpose:** Generic mapping of policy methods to Spatie permissions  
**Package:** Spatie Laravel Permissions

### How It Works

Uses `__call()` magic method to automatically resolve Spatie permissions from policy method calls.

**Ability Map (Method → Suffix):**
```php
viewAny      → index
view         → show
create       → create
update       → edit
delete       → delete
restore      → restore
forceDelete  → force_delete
```

**Permission Name Construction:**
```
{permissionPrefix}{suffix}
// Example: "contract" + "edit" = "contract_edit"
```

### Properties

#### `$permissionPrefix: string`
- Default: `''` (empty)
- Overridable per policy class
- Example: `protected string $permissionPrefix = 'contract_';`

#### `$abilityMap: array`
- Maps policy method names to permission suffixes
- Can be overridden in policy class

### Usage Pattern

**In Policy:**
```php
class ContractPolicy
{
    use HandlesSpatiePermissions;
    
    protected string $permissionPrefix = 'contract_';
    // Now:
    // update($user, $contract) → checks "contract_edit"
    // delete($user, $contract) → checks "contract_delete"
}
```

**In Controller:**
```php
// Automatically resolves via trait
$this->authorize('update', $contract); 
// → user->can('contract_edit')

if (auth()->user()->can('delete', $contract)) {
    // user->can('contract_delete')
}
```

### How __call() Works

1. **Receives:** Method name (e.g., 'update') + arguments (User, Model)
2. **Extracts:** User from first argument
3. **Maps:** Method name → suffix (update → edit)
4. **Constructs:** Permission string (prefix + suffix)
5. **Checks:** `$user->can($permission)`

---

## Usage Pattern

**In Controller:**
```php
// Check authorization
$this->authorize('update', $team);

// Or with method
if (auth()->user()->can('delete', $team)) {
    // User can delete
}

// Gate alternative
if (Gate::allows('update', $team)) {
    // User can update
}
```

**In Blade:**
```blade
@can('update', $team)
    <a href="#edit">Edit Team</a>
@endcan
```

---

## 📝 Migration Notes for Base44

### Policy Pattern
- **Current:** Class-based policies with authorization trait
- **Laravel Way:** Clean separation of concerns
- **Base44:** Use backend function authorization + role-based checks

### Authorization Levels
- **Current:** Owner-based (binary: owner or not)
- **Better:** Role-based (admin, editor, member)
- **Pattern:** Extend to support multiple permission levels

### User Model Methods
- **Current:** `belongsToTeam()`, `ownsTeam()` (inferred)
- **Dependency:** Policy depends on these model methods
- **Best Practice:** Document required model interface

### Base44 Approach

Since Base44 has built-in auth with roles, translate as:

```typescript
// Backend function authorization
const user = await base44.auth.me();
if (user?.role !== 'admin' && !userOwnsTeam(user.id, team.id)) {
  return Response.json({ error: 'Unauthorized' }, { status: 403 });
}
```

Or use entity-level RLS (Row-Level Security):

```json
{
  "name": "Team",
  "rls": [
    {
      "role": "admin",
      "permissions": ["read", "create", "update", "delete"]
    },
    {
      "role": "user",
      "permissions": ["read"],
      "filter": "created_by = $user.id OR is_member = true"
    }
  ]
}
`