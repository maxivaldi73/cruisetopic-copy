# User Action Classes (3 files)

**Directory:** `App/Actions/User/`  
**Namespace:** `App\Actions\User`  
**Type:** Single-responsibility action classes (Laravel Actions pattern)  
**Priority:** MEDIUM — user lifecycle management; partially replaced by Base44 auth

---

## 📋 Overview

| Class | Method | Purpose |
|-------|--------|---------|
| `CreateAdminUser` | `create(array $input): User` | Register new user with role + personal team; implements Fortify contract |
| `DestroyUser` | `destroy(User $user)` | Delete user with Super-Admin protection guards |
| `IndexUser` | `getUser()` | Render user index with stats (counts, duplicates, roles) |

---

## 🔧 Implementation

### 1. `CreateAdminUser`

Implements `Laravel\Fortify\Contracts\CreatesNewUsers` — hooked into the Fortify registration pipeline.

```php
class CreateAdminUser implements CreatesNewUsers
{
    use PasswordValidationRules;  // ⚠️ trait included but $this->passwordRules() NOT used
                                  //    — inline 'min:8' rule used instead (comment says "oppure $this->passwordRules()")

    public function create(array $input): User
    {
        // 1. Validate
        Validator::make($input, [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],  // ⚠️ weaker than PasswordValidationRules trait
        ])->validate();

        // 2. Create user in DB transaction
        return DB::transaction(function () use ($input) {
            return tap(User::create([
                'name'              => $input['name'],
                'email'             => $input['email'],
                'password'          => Hash::make($input['password']),
                'email_verified_at' => null,  // ⚠️ user must verify email — but no verification email sent here
            ]), function (User $user) use ($input) {

                // 3. Create personal team (Jetstream pattern)
                $this->createTeam($user);

                // 4. Assign role if provided
                if (isset($input['role'])) {
                    $user->assignRole($input['role']);    // Spatie permissions
                    $roles = $user->getRoleNames()->toArray();
                    event(new UserRoleChangedEvent($user, $roles));  // ✅ fires event for audit/notification
                }

                return redirect()->route('users.index');
                // 🔴 CRITICAL BUG: redirect() inside a tap() callback inside DB::transaction()
                //    — the return value of tap() is $user (not the redirect), so this redirect is IGNORED
                //    — the caller receives the User object, not a redirect response
                //    — the redirect was intended to go after user creation, but is unreachable here
            });
        });
    }

    protected function createTeam(User $user): void
    {
        $user->ownedTeams()->save(Team::forceCreate([
            'user_id'       => $user->id,
            'name'          => explode(' ', $user->name, 2)[0] . "'s Team",
            'personal_team' => true,
        ]));
        // ✅ Standard Jetstream personal team creation
        // ⚠️ Team::forceCreate() bypasses mass-assignment protection — minor risk if Team model has guarded fields
    }
}
```

#### `UserRoleChangedEvent` (imported)
Already documented in `69_EVENT_CLASSES.md` — fires when a user's role is changed, triggers notification/audit listeners.

---

### 2. `DestroyUser`

```php
class DestroyUser
{
    public function destroy(User $user) {
        try {
            // Guard 1: cannot delete Super-Admin
            if ($user->isSuperAdmin()) {
                return (new AlertService())->alertBackWithError(
                    'Un utente Super-Admin non può essere cancellato'
                );
                // ⚠️ Error message in Italian
            }

            // Guard 2: only Super-Admin can delete Admin
            if ($user->isAdmin() && !auth()->user()->isSuperAdmin()) {
                return (new AlertService())->alertBackWithError(
                    'Un utente Super-Admin non può essere cancellato'  // 🔴 WRONG MESSAGE
                    // Should say "Solo un Super-Admin può cancellare un Admin"
                    // Uses the Super-Admin deletion message for a different guard condition
                );
            }

            $user->delete();  // ⚠️ Hard delete — no soft delete
            return (new AlertService())->alertOperazioneEseguita('users.index');

        } catch (\Exception $e) {
            return (new AlertService())->alertBackWithError(
                'Si è verificato un errore durante la cancellazione dell\'utente'
            );
            // ⚠️ Swallows exception — $e never logged
            // ⚠️ Italian error messages
        }
    }
}
```

**Role hierarchy implied:**
```
Super-Admin > Admin > (regular user)
```
- Super-Admin cannot be deleted by anyone
- Admin can only be deleted by Super-Admin
- Regular users can be deleted by anyone who calls this action (no explicit caller auth check)

---

### 3. `IndexUser`

```php
class IndexUser
{
    public function getUser() {
        $dataTableService = new DataTableService();
        $filterService    = new FilterService();
        $dataTable        = new UsersDataTable($dataTableService, $filterService);
        // ⚠️ All dependencies instantiated with `new` — not container-resolved, not testable

        // Dashboard stats
        $userCount        = User::count();                               // total users
        $roles            = Role::with('users')
                                ->whereNotIn('name', ['Super-Admin'])    // ✅ hides Super-Admin role
                                ->get();
        $verified         = User::whereNotNull('email_verified_at')->count();
        $notVerified      = User::whereNull('email_verified_at')->count();
        $uniqueEmailCount = User::distinct('email')->count('email');
        $userDuplicates   = $userCount - $uniqueEmailCount;
        // ✅ Duplicate email detection — useful data quality metric
        // ⚠️ 5 separate COUNT queries — could be a single aggregated query
        // ⚠️ Role::with('users') eager-loads ALL users per role — potential memory issue at scale

        // ⚠️ ItinerariesDataTable imported but never used — dead import
        // ⚠️ Method name 'getUser' — misleading (renders index, not a record)

        return $dataTable->render('admin.users.index', [
            'totalUser'      => $userCount,
            'verified'       => $verified,
            'notVerified'    => $notVerified,
            'userDuplicates' => $userDuplicates,
            'roles'          => $roles,
        ]);
    }
}
```

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | 🔴 CRITICAL | `CreateAdminUser` | **`redirect()` inside `tap()` callback is silently ignored** — `tap()` always returns its first argument (`$user`); the redirect is dead code |
| 2 | 🔴 CRITICAL | `DestroyUser` | **Wrong error message on Admin guard** — "Un utente Super-Admin non può essere cancellato" shown when trying to delete an Admin as non-Super-Admin; should say admin-specific message |
| 3 | ⚠️ HIGH | `CreateAdminUser` | **`email_verified_at = null` but no verification email dispatched** — user account created but never prompted to verify |
| 4 | ⚠️ HIGH | `CreateAdminUser` | **`PasswordValidationRules` trait included but not used** — weaker `'min:8'` rule used inline instead |
| 5 | ⚠️ HIGH | `DestroyUser` | **Exception caught but never logged** — `$e` silently swallowed; no `Log::error()` |
| 6 | ⚠️ HIGH | `IndexUser` | **`Role::with('users')` loads all users per role** — N+1 risk at scale; only counts needed, not full user objects |
| 7 | ⚠️ HIGH | `IndexUser` | **5 separate COUNT queries** — should be consolidated or cached |
| 8 | ⚠️ MEDIUM | All | **All dependencies instantiated with `new`** — bypasses DI container |
| 9 | ⚠️ MEDIUM | `CreateAdminUser` | **`Team::forceCreate()` bypasses mass-assignment protection** |
| 10 | ⚠️ MEDIUM | `DestroyUser` | **Hard delete** — no soft delete / audit trail |
| 11 | ⚠️ MEDIUM | `IndexUser` | **`ItinerariesDataTable` imported but never used** — dead import |
| 12 | ⚠️ MEDIUM | All | **All error/info messages in Italian** |
| 13 | ℹ️ LOW | `IndexUser` | **`getUser()` misleading name** — should be `renderIndex()` |

---

## 📝 Migration to Base44

### `CreateAdminUser` → Base44 invite system

Base44 handles user creation natively via `base44.users.inviteUser(email, role)`. No `CreateAdminUser` equivalent needed.

```tsx
// Admin UI: invite user
await base44.users.inviteUser(email, 'admin'); // or 'user'
```

If custom role assignment on creation is needed, use a backend function that calls `inviteUser` then updates the user record.

### `DestroyUser` → Backend function with role guards

```typescript
// functions/deleteUser.js
const base44 = createClientFromRequest(req);
const caller = await base44.auth.me();
if (caller?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

const { userId } = await req.json();
const target = await base44.asServiceRole.entities.User.get(userId);

// Guard: cannot delete super_admin
if (target.role === 'super_admin') {
  return Response.json({ error: 'Cannot delete a Super Admin user' }, { status: 403 });
}
// Guard: only super_admin can delete admin
if (target.role === 'admin' && caller.role !== 'super_admin') {
  return Response.json({ error: 'Only a Super Admin can delete an Admin user' }, { status: 403 });
}

await base44.asServiceRole.entities.User.delete(userId);
return Response.json({ success: true });
```

### `IndexUser` → React page with stats

```tsx
// Dashboard stats via parallel queries
const [users, roles] = await Promise.all([
  base44.entities.User.list(),
  base44.entities.User.list() // compute stats client-side or via backend function
]);

const stats = {
  total: users.length,
  verified: users.filter(u => u.email_verified_at).length,
  duplicates: users.length - new Set(users.map(u => u.email)).size,
};
```

---

## Summary

**`Actions/User/CreateAdminUser`** (64 lines): Fortify `CreatesNewUsers` implementation that validates input, creates a User in a DB transaction, creates a personal Jetstream team, and optionally assigns a Spatie role. **Critical bug:** `redirect()->route('users.index')` inside a `tap()` callback is always ignored — `tap()` returns `$user`, not the redirect. Also: `PasswordValidationRules` trait included but bypassed, no verification email dispatched despite `email_verified_at = null`.

**`Actions/User/DestroyUser`** (26 lines): Role-aware user deletion with Super-Admin protection. **Critical bug:** wrong error message on Admin guard — both Super-Admin and Admin deletion attempts show the same Italian "Super-Admin cannot be deleted" message. Exception caught but never logged.

**`Actions/User/IndexUser`** (35 lines): Renders user management index with 5 stats (total, verified, unverified, duplicates, roles). Dead import of `ItinerariesDataTable`. `Role::with('users')` loads full user objects when only counts are needed.

**Migration priority: MEDIUM** — `CreateAdminUser` and `IndexUser` are fully replaced by Base44's native invite system and React pages; `DestroyUser` needs a backend function with corrected role guard messages.