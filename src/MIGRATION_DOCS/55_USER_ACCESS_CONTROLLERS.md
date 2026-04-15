# User & Access Control Controllers

**Purpose:** Manage users, roles, and permissions for multi-tenant admin platform.  
**Namespace:** `App\Http\Controllers\Admin\User`  
**Location:** `App/Http/Controllers/Admin/User/`  
**Total Controllers:** 3  
**Type:** Core access control — critical for security

---

## 📋 Controller Index

| Controller | Purpose | Key Methods | Priority |
|-----------|---------|-------------|----------|
| PermissionController | Manage individual permissions | index, store, update | MEDIUM |
| RoleController | Manage role-to-permission mappings | index, create, edit, save, delete | HIGH |
| UserController | Manage user profiles and assignments | index, store, show, update, destroy, switchUser | CRITICAL |

---

## 🔧 Detailed Controllers

### PermissionController

**File:** `PermissionController.php`

**Purpose:** CRUD for granular permissions (uses Spatie/Permission package).

| Method | Purpose | Route (inferred) |
|--------|---------|------------------|
| index() | List permissions via DataTable | `GET /admin/permissions` |
| create() | Stub (incomplete) | `GET /admin/permissions/create` |
| store() | Create or get permission | `POST /admin/permissions` |
| show() | Stub (incomplete) | `GET /admin/permissions/{id}` |
| edit() | Stub (incomplete) | `GET /admin/permissions/{id}/edit` |
| update() | Update permission | `PATCH /admin/permissions/{id}` |
| destroy() | Stub (incomplete) | `DELETE /admin/permissions/{id}` |

**Key Features:**

```php
store(Request $request) {
    // Create permission with guard 'web'
    $permission = Permission::firstOrCreate(
        ['name' => $request->name, 'guard_name' => 'web'],
        ['name' => $request->name, 'guard_name' => 'web']
    );
    
    // Check if newly created
    if (!$permission->wasRecentlyCreated) {
        return error (permission already exists)
    }
    return success redirect
}

update(Request $request, Permission $permission) {
    // Update permission attributes
    $permission->update($request->all());
    return success redirect
}
```

**Dependencies:**
- `Spatie\Permission\Models\Permission` — permission model
- `PermissionDataTable` — DataTable for listing

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ High | **No Input Validation** — store() accepts request->name directly, no validation |
| 2 | ⚠️ Medium | **No Authorization Checks** — any authenticated user can create/update permissions |
| 3 | ℹ️ Low | **Incomplete Stubs** — create(), show(), edit(), destroy() not implemented |
| 4 | ⚠️ Medium | **Hardcoded Guard** — guard_name hardcoded to 'web', not configurable |
| 5 | ⚠️ Medium | **No Soft Deletes** — destroy() stub, but permissions may be in use elsewhere |

---

### RoleController

**File:** `RoleController.php`

**Purpose:** Manage roles and their permission assignments.

| Method | Purpose | Route (inferred) |
|--------|---------|------------------|
| index() | List roles with users | `GET /admin/roles` |
| create() | Show role creation form | `GET /admin/roles/create` |
| edit() | Show role edit form | `GET /admin/roles/{id}/edit` |
| save() | Create/update role (custom name) | `POST /admin/roles` or `PATCH /admin/roles/{id}` |
| delete() | Delete role (custom name) | `POST /admin/roles/{id}/delete` or `DELETE /admin/roles/{id}` |
| destroy() | JSON delete (custom) | `DELETE /admin/roles/{id}` (JSON) |

**Key Features:**

```php
save(Request $request) {
    // Find or create role
    if (isset($data['id'])) {
        $role = Role::findOrFail($data['id']);
    } else {
        $role = new Role();
    }
    
    // Update attributes
    $role->fill($data);
    
    // Sync permissions (replaces old with new)
    $role->syncPermissions($request->input('permissions', []));
    
    // Save and redirect
    $role->save();
    return redirect to index
}

delete($id) {
    $role = Role::findOrFail($id);
    $role->delete();
    return redirect with message
}

destroy(Role $role) {
    $role->delete();
    return JSON response
}
```

**Key Points:**
- Uses `syncPermissions()` to replace all role permissions
- Excludes 'Super-Admin' role from listing
- Groups permissions by category (via `getGroupedPermissions()`)
- Dual delete methods (delete() for HTML, destroy() for JSON)

**Dependencies:**
- `Role` model (Spatie/Permission)
- `UsersDataTable` — for user listing
- `Role::getGroupedPermissions()` — custom method

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ High | **Duplicate Delete Methods** — delete() and destroy() both delete, with different responses |
| 2 | ⚠️ High | **No Input Validation** — save() accepts $data without validation |
| 3 | ⚠️ Medium | **No Authorization** — any user can create/edit/delete roles |
| 4 | ⚠️ Medium | **Wrong DataTable** — uses UsersDataTable instead of RolesDataTable |
| 5 | ⚠️ Medium | **No Confirmation** — delete without confirmation or verification |
| 6 | ⚠️ Low | **Custom Method Names** — uses save()/delete() instead of store()/destroy() (confusing) |
| 7 | ℹ️ Low | **Italian Comments** — code comments in Italian, not i18n-friendly |

---

### UserController

**File:** `UserController.php` (8KB — large)

**Purpose:** Manage user profiles, roles, and team assignments.

| Method | Purpose | Route (inferred) |
|--------|---------|------------------|
| index() | List users via action | `GET /admin/users` |
| create() | Stub | `GET /admin/users/create` |
| store() | Create user | `POST /admin/users` |
| show() | Display user profile | `GET /admin/users/{id}` |
| edit() | Return user JSON | `GET /admin/users/{id}/edit` |
| update() | Update user and roles | `PATCH /admin/users/{id}` |
| destroy() | Delete user via action | `DELETE /admin/users/{id}` |
| switchUser() | Impersonate user | `POST /admin/users/{id}/switch` |
| terminateImpersonation() | End impersonation | `POST /admin/impersonation/terminate` |

**Key Features:**

```php
show($id) {
    // Fetch user with relations
    $user = User::with([
        'roles.permissions',
        'teams',
        'seller.company',
        'seller.sector',
        // ... 16 relationships
    ])->findOrFail($id);
    
    // Check permission: CustomerSupport:management
    $hasAgentDetailsAccess = Role::query()
        ->whereIn('id', $assignedRoleIds)
        ->whereHas('permissions', function ($query) {
            $query->where('name', 'CustomerSupport:management');
        })
        ->exists();
    
    // Fetch dropdown data
    $roles = Role::whereNotIn('name', ['Super-Admin'])->get();
    $languages = Language::pluck('name', 'id');
    $qualities = LeadQuality::pluck('name', 'id');
    // ... 10+ more dropdowns
    
    return view with all data
}

update(Request $request, $id) {
    // Validate
    $validatedData = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $id,
        'role' => 'required|string',
    ]);
    
    // Update user
    $user->name = $validatedData['name'];
    $user->email = $validatedData['email'];
    
    // Sync roles (replace)
    if (method_exists($user, 'syncRoles')) {
        $user->syncRoles([$validatedData['role']]);
    }
    
    // Create personal team if missing
    if ($user->ownedTeams()->where('personal_team', true)->doesntExist()) {
        $user->ownedTeams()->save(Team::forceCreate([...]));
    }
    
    // Fire event for audit/logging
    event(new UserRoleChangedEvent($user, $roles));
    
    return redirect with success
}

switchUser(User $user) {
    // Store original user ID
    session()->put('original_user_id', Auth::id());
    
    // Login as target user
    Auth::loginUsingId($user->id);
    
    return redirect to dashboard
}

terminateImpersonation() {
    // Get original user ID
    $originalUserId = session()->pull('original_user_id');
    
    // Logout impersonated user
    Auth::logout();
    
    // Login original user
    Auth::loginUsingId($originalUserId);
    
    return redirect to dashboard
}
```

**Dependencies:**
- 19 model imports (Area, Channel, Company, ContractType, Cruiseline, JobRole, Language, LeadQuality, Market, NationalContract, Seller, Sector, Team, Role, User)
- Actions: CreateAdminUser, DestroyUser, IndexUser
- Events: UserRoleChangedEvent
- Spatie/Permission for roles

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 CRITICAL | **Impersonation Without Audit** — switchUser() allows admin impersonation with no logging, audit trail, or two-factor confirmation |
| 2 | ⚠️ High | **Over-eager Relationship Loading** — show() loads 16 relationships (N+1 vulnerability with nested queries) |
| 3 | ⚠️ High | **No Authorization Checks** — switchUser() has commented-out authorization (security risk) |
| 4 | ⚠️ High | **No Input Validation in store()** — passes $input directly to CreateAdminUser action without validation |
| 5 | ⚠️ Medium | **Dynamic Permission Checks** — hardcoded permission strings ('CustomerSupport:management', 'Seller:index') instead of centralized config |
| 6 | ⚠️ Medium | **Too Many Dependencies** — 19 model imports for a single form (bloated) |
| 7 | ⚠️ Medium | **Team Creation Side Effect** — update() creates personal team if missing (hidden behavior) |
| 8 | ⚠️ Medium | **No Soft Deletes** — destroy() permanently deletes users (no recovery) |
| 9 | ⚠️ Medium | **edit() Returns JSON** — inconsistent with other methods (REST confusion) |
| 10 | ℹ️ Low | **Italian Comments/Messages** — not i18n-friendly |

---

## 📊 Architecture Notes

| Aspect | Detail |
|--------|--------|
| Type | Access control controllers (RBAC - Role-Based Access Control) |
| Package | Spatie/Permission (Laravel's standard RBAC) |
| Auth | Uses Laravel's built-in auth with impersonation |
| Teams | Jetstream teams (multi-tenancy support) |
| Events | Custom UserRoleChangedEvent for audit logging |

### Permission Model

Spatie/Permission provides:
- `Permission` model (granular permissions)
- `Role` model (groups of permissions)
- `Middleware\Authenticate` (check auth)
- `Middleware\Permission` (check permission)
- `Middleware\Role` (check role)

---

## ⚠️ Security Concerns

| Issue | Severity | Risk |
|-------|----------|------|
| **Impersonation without audit** | 🔴 CRITICAL | Admin can switch to any user without logging. No trail of who impersonated whom. |
| **No 2FA for impersonation** | 🔴 CRITICAL | Anyone with 'switchUser' permission can become any user. |
| **No authorization checks** | 🔴 HIGH | Permission/Role/User operations lack gate checks. |
| **No soft deletes** | 🟡 HIGH | Deleting users cascades and may break foreign keys. |
| **No input validation** | 🟡 HIGH | store() methods don't validate input before passing to actions. |
| **Hardcoded permissions** | 🟡 MEDIUM | Permission names ('Seller:index') scattered throughout code. |

---

## 📝 Migration Notes for Base44

### Strategy: Extract to Backend Functions + React Pages

Base44 has built-in User and auth, but you'll need to extend for custom roles/permissions.

### Entities Required

```json
// entities/Role.json
{
  "name": {"type": "string", "unique": true},
  "description": {"type": "string"},
  "permissions": {"type": "array"},
  "is_system": {"type": "boolean", "default": false}
}

// entities/Permission.json
{
  "name": {"type": "string", "unique": true},
  "description": {"type": "string"},
  "resource": {"type": "string"},
  "action": {"type": "string"}
}

// Extend User entity with roles
{
  "roles": {"type": "array"},
  "team_id": {"type": "string"},
  "impersonate_allowed": {"type": "boolean", "default": false}
}
```

### Backend Functions

**Function: createRole**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // Only admins can create roles
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, description, permissions } = await req.json();

  // Validate
  if (!name) {
    return Response.json({ error: 'Role name required' }, { status: 400 });
  }

  // Create role
  const role = await base44.entities.Role.create({
    name,
    description,
    permissions: permissions || [],
  });

  return Response.json({ role });
});
```

**Function: updateUserRoles**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, roleIds } = await req.json();

  // Validate
  if (!userId || !Array.isArray(roleIds)) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Update user roles
  await base44.asServiceRole.entities.User.update(userId, { roles: roleIds });

  // Log role change for audit
  await base44.asServiceRole.functions.invoke('auditLog', {
    action: 'user_role_changed',
    userId,
    roles: roleIds,
  });

  return Response.json({ success: true });
});
```

**Function: switchUserImpersonation**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const currentUser = await base44.auth.me();

  // Only super-admins can impersonate
  if (currentUser?.role !== 'admin' || !currentUser?.can_impersonate) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { targetUserId } = await req.json();

  // Verify target user exists
  const targetUser = await base44.entities.User.filter({ id: targetUserId });
  if (!targetUser.length) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Create impersonation session
  const session = {
    original_user_id: currentUser.id,
    impersonated_user_id: targetUserId,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  };

  // Store in database for audit
  await base44.asServiceRole.functions.invoke('logImpersonation', {
    originalUserId: currentUser.id,
    impersonatedUserId: targetUserId,
    action: 'start',
  });

  return Response.json({
    session,
    message: `Impersonating ${targetUser[0].full_name}`,
  });
});
```

### React Component: Users Management

```tsx
// pages/admin/UsersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DataGrid } from '@/components/DataGrid';
import { Button } from '@/components/ui/button';

export function UsersPage() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.functions.invoke('listUsers', {}),
  });

  const updateRolesMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateUserRoles', data),
  });

  const handleRoleChange = async (userId, roleIds) => {
    await updateRolesMutation.mutateAsync({ userId, roleIds });
  };

  const handleImpersonate = async (userId) => {
    const res = await base44.functions.invoke('switchUserImpersonation', {
      targetUserId: userId,
    });
    
    // Store impersonation session
    sessionStorage.setItem('impersonation_session', JSON.stringify(res.data.session));
    window.location.href = '/dashboard';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <DataGrid
        columns={[
          { key: 'full_name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button onClick={() => handleRoleChange(row.id, ['user'])}>
                  Change Role
                </Button>
                <Button onClick={() => handleImpersonate(row.id)}>
                  Impersonate
                </Button>
              </div>
            ),
          },
        ]}
        data={users?.data || []}
      />
    </div>
  );
}
```

### Key Improvements for Base44

1. **Impersonation Logging** — Audit trail of who impersonated whom and when
2. **2FA for Impersonation** — Require additional verification
3. **Time-Limited Sessions** — Impersonation expires after N hours
4. **Permission Audit** — Log all permission/role changes
5. **Soft Deletes** — Archive users instead of permanent deletion
6. **Centralized Permissions** — Define permissions in config, not hardcoded
7. **Input Validation** — Validate all inputs in backend functions
8. **Authorization Middleware** — Check permissions in backend before operations

### Summary

Three controllers managing users, roles, and permissions using Spatie/Permission. **UserController is largest and most critical.** Major security concerns:
- Impersonation without audit/2FA
- No authorization checks
- Too many model dependencies
- Hardcoded permissions

In Base44:
- Create Role and Permission entities
- Use backend functions with proper authorization
- Add impersonation audit logging
- Implement time-limited impersonation sessions
- Centralize permission definitions

**Priority: CRITICAL** — these controllers handle access control and security.