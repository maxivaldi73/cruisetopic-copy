# Authentication & Authorization (User, Role, Permission)

**Purpose:** User authentication system with role-based access control (RBAC) via Spatie Permissions package.  
**Package:** spatie/laravel-permission (Role + Permission models, HasRoles trait)

---

## Overview

Hierarchical permission system:
- **User** (authenticated person) → hasMany through teams (Jetstream), hasRoles (Spatie)
- **Role** (named role like 'admin', 'seller') → hasMany Permissions, belongsToMany TicketCategory
- **Permission** (named ability like 'user:create', 'post:edit') → mapped to Roles

---

## 1️⃣ User (App\Models\User\User)

**Location:** `App\Models\User\User`  
**Extends:** Illuminate\Foundation\Auth\User (Authenticatable)  
**Traits:** HasRoles (Spatie), HasApiTokens, HasFactory, HasProfilePhoto, HasTeams, Notifiable, TwoFactorAuthenticatable

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| name | string | First name |
| lastname | string | Last name |
| email | string | Unique email (login credential) |
| password | string | Hashed password (Illuminate hash cast) |
| enabled | boolean | Account active status |
| email_verified_at | datetime | Email verification timestamp |
| profile_photo_path | string | Jetstream profile photo (HasProfilePhoto) |
| two_factor_secret, two_factor_recovery_codes | string | 2FA data (TwoFactorAuthenticatable) |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| group() | belongsTo Group | User's department/team |
| reviews() | hasMany Review | User-authored reviews |
| customer() | hasOne Customer | Customer profile (if user is a customer) |
| seller() | hasOne Seller | Seller profile (if user is a seller) |
| mscCredential() | hasOne SellerMscCredential | MSC booking credentials |
| leads() | hasMany Lead | Leads assigned to user (via assignee_id) |
| roles() | belongsToMany Role | Spatie: assigned roles (many-to-many) |
| permissions() | belongsToMany Permission | Spatie: direct permissions (inherited + own) |
| teams() | belongsToMany Team | Jetstream: team membership |

### Key Methods

**Role Checking:**
```php
isSuperAdmin()              // Check if user has role with id=1 (Super-Admin)
isAdmin()                   // Check if user has role named 'admin'
isSeller()                  // Check if seller() relation exists
isActiveSeller()            // Check if seller exists AND seller.active = true
```

**Spatie RBAC (inherited from HasRoles trait):**
```php
roles()                     // Get assigned roles
permissions()               // Get all permissions (direct + via roles)
hasRole('admin')            // Check specific role
hasPermission('user:edit')  // Check specific permission
can('user:edit')            // Gate helper (uses hasPermission)
```

**Translations:**
```php
storeTranslations($array)   // Persist translations to Translation table
```

### Hidden Fields

- password
- remember_token
- two_factor_recovery_codes
- two_factor_secret

### Appended Attributes

- profile_photo_url (from HasProfilePhoto trait)

### Casts

- email_verified_at → datetime
- password → hashed (automatic bcrypt on set)

### Security Features

1. **Spatie Permission/Role:** Role-based authorization via middleware/gates
2. **Two-Factor Auth:** TwoFactorAuthenticatable for optional 2FA
3. **Teams:** Multi-tenancy via Jetstream (isolates data per team)
4. **API Tokens:** Sanctum tokens for stateless API auth

### Global Scope (Implied)

Lead model has a global scope that filters to `assignee_id = auth()->id()` for non-admins.

---

## 2️⃣ Role (App\Models\User\Role)

**Location:** `App\Models\User\Role`  
**Extends:** Spatie\Permission\Models\Role  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Role name (admin, seller, moderator, Super-Admin) |
| guard_name | string | Guard name (default: 'web') |
| created_at, updated_at | datetime | Timestamps (enabled on this model) |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| permissions() | belongsToMany Permission | Spatie: permissions assigned to role |
| ticketCategories() | belongsToMany TicketCategory | Ticket categories role can manage |
| users() | belongsToMany User | Spatie: users with this role |

### Class Methods

#### `static getAllRoles(): Collection`
Returns all roles EXCEPT 'Super-Admin', ordered by name.

**Use:** Show available roles to admins (don't show Super-Admin as selectable).

#### `static getGroupedPermissions(): array`
Organizes all permissions by category with activity status matrix.

**Logic:**
1. Fetch all permissions from DB
2. Split by first part of name (e.g., 'user:create' → category 'user')
3. Build activity matrix:
   - Rows: categories (user, post, contract, etc.)
   - Columns: activities (create, delete, edit, index, management, show)
   - Values: activity name if exists, '--' if not

**Example Output:**
```php
[
    'user' => [
        0 => 'create',
        1 => '--',
        2 => 'edit',
        3 => 'index',
        4 => '--',
        5 => 'show'
    ],
    'post' => [...]
]
```

**Use:** Admin permission matrix UI for role assignment.

### Methods

**Translations:**
```php
storeTranslations($array)   // Persist translations to Translation table
```

### Permission Naming Convention

Permissions follow pattern: `category:action`
- category: resource (user, post, contract, team, etc.)
- action: activity (create, read, update, delete, index, show, management)

Example permissions:
- user:create, user:edit, user:delete, user:index, user:show
- contract:create, contract:edit, contract:delete, contract:management

---

## 3️⃣ Permission (App\Models\User\Permission)

**Location:** `App\Models\User\Permission`  
**Extends:** Spatie\Permission\Models\Permission  
**Traits:** HasFactory

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Permission name (e.g., 'user:edit') |
| guard_name | string | Guard name (default: 'web') |
| created_at, updated_at | datetime | Timestamps |

### Relations

| Relation | Type | Purpose |
|----------|------|---------|
| roles() | belongsToMany Role | Spatie: roles with this permission |
| users() | belongsToMany User | Spatie: users with direct permission |

### Methods

**Translations:**
```php
storeTranslations($array)   // Persist translations to Translation table
```

---

## Authorization Flow

### Check Permissions

```php
// User checking
auth()->user()->can('user:edit');           // Spatie/Laravel Gate
auth()->user()->hasPermission('user:edit'); // Spatie direct
auth()->user()->hasRole('admin');           // Role check

// Gate middleware (controller/route)
authorize('user.edit');                     // Throws 403 if can't

// Policy (resource-based)
Gate::allows('view', $user);                // Uses LeadPolicy, TeamPolicy, etc.
```

### Assign Roles/Permissions

```php
$user->assignRole('admin');                 // Spatie: add role
$user->givePermissionTo('user:edit');       // Spatie: direct permission
$role->givePermissionTo('user:edit');       // Give permission to role
```

### Middleware

Spatie provides middleware:
```php
'role:admin'                    // Require specific role
'permission:user:edit'          // Require specific permission
'role_or_permission:...'        // Multiple roles or permissions
```

---

## Integration with Other Systems

### Policies

**TeamPolicy** and **LeadPolicy** use `HandlesSpatiePermissions` trait:
- Automatically maps policy methods to Spatie permissions
- Permission prefix per policy (e.g., 'Lead:')
- Falls back to `user->can()` if method not defined

### TicketCategory Role Relationship

**TicketCategory** uses pivot table `role_ticket_category`:
- Limits which roles can manage which ticket categories
- Used in ticket assignment/routing logic

### Seller & Admin Flags

- **isSuperAdmin():** Hardcoded to check role.id = 1 (Super-Admin)
- **isAdmin():** Checks role name = 'admin'
- **isSeller():** Checks Seller relation exists
- Better approach: use Spatie permissions (role:seller, role:admin)

---

## 📝 Migration Notes for Base44

### Spatie Permission Usage
- Currently: Extends Spatie models with translation support
- **Recommendation:** Move translation logic to Translation table queries (already done)
- **Consideration:** Consider caching permission/role lookups (expensive N+1 queries)

### Super-Admin Detection
- **Current:** `isSuperAdmin()` hardcoded to id=1
- **Better:** Use `hasRole('Super-Admin')` for consistency
- **Risk:** Role name/id assumptions are fragile

### Permission Matrix Generation
- **Current:** `getGroupedPermissions()` builds UI array from DB
- **Inefficient:** Fetches all permissions on each call (no caching)
- **Better:** Cache permission groups or pre-seed in seeder

### Two-Factor Authentication
- **Enabled:** TwoFactorAuthenticatable trait present
- **Usage:** Jetstream handles 2FA UI/logic
- **Consideration:** Optional (users must enable in profile)

### Teams (Multi-Tenancy)
- **Enabled:** HasTeams trait present
- **Jetstream:** Manages team creation, switching, invitations
- **Isolation:** Data should be scoped by team in queries
- **Current:** Models don't show team scoping (check scopes in controllers)

### API Authentication
- **Enabled:** HasApiTokens (Sanctum)
- **Usage:** Token-based stateless authentication for API clients
- **Implementation:** Generate tokens via `/api/tokens` endpoint (Sanctum built-in)

### Architecture Recommendations

**For Base44 Migration:**

1. **Role-Based Access Control:**
   - Use Spatie roles/permissions (already structured)
   - Implement role-based entity filters (RLS at DB level)
   - Use middleware for route protection

2. **User Types:**
   - Keep seller/customer as relations (not roles)
   - Use roles for: admin, seller, moderator, viewer
   - Combine role + relation checks (e.g., isActiveSeller)

3. **Permission Caching:**
   ```typescript
   // Backend function: cache permission matrix
   const permissions = await cache.remember(
     'permissions_matrix',
     3600,
     () => buildPermissionMatrix()
   );
   ```

4. **Authorization in Functions:**
   ```typescript
   const user = await base44.auth.me();
   if (!user?.roles?.includes('admin')) {
     return { error: 'Forbidden' };
   }
   ``