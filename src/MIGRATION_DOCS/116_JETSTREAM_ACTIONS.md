# Jetstream Action Classes (7 files)

**Directory:** `App/Actions/Jetstream/`  
**Namespace:** `App\Actions\Jetstream`  
**Type:** Laravel Jetstream framework action classes (team management lifecycle)  
**Priority:** LOW — standard Jetstream scaffolding with minimal customization; entirely replaced by Base44's native auth and invite system

---

## 📋 Overview

| Class | Contract | Method | Purpose |
|-------|----------|--------|---------|
| `AddTeamMember` | `AddsTeamMembers` | `add($user, $team, $email, $role)` | Add an existing user to a team with role assignment |
| `CreateTeam` | `CreatesTeams` | `create($user, $input)` | Create a new non-personal team for a user |
| `DeleteTeam` | `DeletesTeams` | `delete($team)` | Purge a team and all associated data |
| `DeleteUser` | `DeletesUsers` | `delete($user)` | Transactionally delete user, their teams, tokens, and photo |
| `InviteTeamMember` | `InvitesTeamMembers` | `invite($user, $team, $email, $role)` | Send email invitation for non-registered users to join a team |
| `RemoveTeamMember` | `RemovesTeamMembers` | `remove($user, $team, $teamMember)` | Remove a member from a team (with ownership guard) |
| `UpdateTeamName` | `UpdatesTeamNames` | `update($user, $team, $input)` | Validate and rename a team |

---

## 🔧 Implementation

### 1. `AddTeamMember` (81 lines)

```php
class AddTeamMember implements AddsTeamMembers
{
    public function add(User $user, Team $team, string $email, ?string $role = null): void
    {
        Gate::forUser($user)->authorize('addTeamMember', $team);
        // ✅ Policy-based authorization — checks caller has permission on team

        $this->validate($team, $email, $role);
        // ✅ Validates email exists in users table + role is valid Jetstream role
        // ✅ Custom after-validator ensures user isn't already on team

        $newTeamMember = Jetstream::findUserByEmailOrFail($email);
        // ✅ Throws ModelNotFoundException if email not found (belt-and-suspenders after 'exists:users' rule)

        AddingTeamMember::dispatch($team, $newTeamMember);
        // ✅ Pre-action event — allows listeners to veto or audit

        $team->users()->attach($newTeamMember, ['role' => $role]);
        // ✅ Pivot table insert with role

        TeamMemberAdded::dispatch($team, $newTeamMember);
        // ✅ Post-action event — triggers notifications/audit
    }

    protected function validate(Team $team, string $email, ?string $role): void
    {
        Validator::make(
            ['email' => $email, 'role' => $role],
            $this->rules(),
            ['email.exists' => __('We were unable to find a registered user with this email address.')]
        )->after(
            $this->ensureUserIsNotAlreadyOnTeam($team, $email)
        )->validateWithBag('addTeamMember');
    }

    protected function rules(): array
    {
        return array_filter([
            'email' => ['required', 'email', 'exists:users'],
            'role'  => Jetstream::hasRoles() ? ['required', 'string', new Role] : null,
        ]);
        // ✅ Conditional role validation — only enforced if Jetstream roles are enabled
    }

    protected function ensureUserIsNotAlreadyOnTeam(Team $team, string $email): Closure
    {
        return function ($validator) use ($team, $email) {
            $validator->errors()->addIf(
                $team->hasUserWithEmail($email),
                'email',
                __('This user already belongs to the team.')
            );
        };
        // ✅ Clean duplicate guard using after-validator pattern
    }
}
```

**Assessment:** This is **clean, standard Jetstream code** with proper authorization, validation, duplicate guard, and event dispatching. No bugs or customization detected.

---

### 2. `CreateTeam` (38 lines)

```php
class CreateTeam implements CreatesTeams
{
    public function create(User $user, array $input): Team
    {
        Gate::forUser($user)->authorize('create', Jetstream::newTeamModel());
        // ✅ Policy check — user must have 'create' permission on Team model

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
        ])->validateWithBag('createTeam');

        AddingTeam::dispatch($user);
        // ✅ Pre-action event

        $user->switchTeam($team = $user->ownedTeams()->create([
            'name' => $input['name'],
            'personal_team' => false,
        ]));
        // ✅ Creates non-personal team + auto-switches user's current team context
        // ⚠️ No uniqueness constraint on team name per user — user can create multiple teams with same name

        return $team;
    }
}
```

**Assessment:** Standard Jetstream team creation. Minor issue: no team name uniqueness check, but this is Jetstream's default behavior and not a bug.

---

### 3. `DeleteTeam` (12 lines)

```php
class DeleteTeam implements DeletesTeams
{
    public function delete(Team $team): void
    {
        $team->purge();
        // ✅ Delegates to Team model's purge() method — cascades related data cleanup
        // ⚠️ No authorization check at this layer — relies entirely on caller (controller/policy)
        // ⚠️ No soft delete — hard purge with no audit trail
    }
}
```

**Assessment:** Minimal wrapper — all logic lives in `Team::purge()`. Standard Jetstream pattern. Authorization is handled upstream by the Jetstream controller before calling this action.

---

### 4. `DeleteUser` (40 lines)

```php
class DeleteUser implements DeletesUsers
{
    public function __construct(protected DeletesTeams $deletesTeams)
    {
        // ✅ Injects DeletesTeams contract — proper DI (unlike most other action classes in the codebase)
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            $this->deleteTeams($user);
            $user->deleteProfilePhoto();
            $user->tokens->each->delete();
            $user->delete();
        });
        // ✅ Transaction wraps the full cascade — atomically deletes teams, photo, tokens, user
        // ⚠️ $user->tokens->each->delete() — loads ALL tokens into memory before deleting;
        //    for users with many tokens, Token::where('user_id', $user->id)->delete() would be cheaper
        // ⚠️ No event dispatch — no UserDeleted event for audit/notification listeners
    }

    protected function deleteTeams(User $user): void
    {
        $user->teams()->detach();
        // ✅ Removes user from all teams they're a member of (pivot cleanup)

        $user->ownedTeams->each(function (Team $team) {
            $this->deletesTeams->delete($team);
        });
        // ✅ Deletes all teams the user owns — uses injected DeletesTeams contract
        // ⚠️ Loads all ownedTeams into memory — acceptable for typical team counts
    }
}
```

**Assessment:** Well-structured with proper DI and transactional integrity. The only notable Jetstream action class that uses constructor injection. Minor performance concern with token eager-loading.

---

### 5. `InviteTeamMember` (88 lines)

```php
class InviteTeamMember implements InvitesTeamMembers
{
    public function invite(User $user, Team $team, string $email, ?string $role = null): void
    {
        Gate::forUser($user)->authorize('addTeamMember', $team);
        // ✅ Same authorization as AddTeamMember — reuses 'addTeamMember' policy ability

        $this->validate($team, $email, $role);
        // ✅ Validates email uniqueness within team_invitations table (prevents duplicate invites)
        // ✅ Also checks user is not already on team

        InvitingTeamMember::dispatch($team, $email, $role);
        // ✅ Pre-action event

        $invitation = $team->teamInvitations()->create([
            'email' => $email,
            'role' => $role,
        ]);
        // ✅ Creates invitation record in team_invitations table

        Mail::to($email)->send(new TeamInvitation($invitation));
        // ✅ Sends invitation email via Laravel Mail
        // ⚠️ Synchronous mail send — blocks the request until email is dispatched
        //    Should use Mail::to($email)->queue() for async delivery
    }

    protected function validate(Team $team, string $email, ?string $role): void
    {
        Validator::make(
            ['email' => $email, 'role' => $role],
            $this->rules($team),
            ['email.unique' => __('This user has already been invited to the team.')]
        )->after(
            $this->ensureUserIsNotAlreadyOnTeam($team, $email)
        )->validateWithBag('addTeamMember');
    }

    protected function rules(Team $team): array
    {
        return array_filter([
            'email' => [
                'required', 'email',
                Rule::unique(Jetstream::teamInvitationModel())->where(function (Builder $query) use ($team) {
                    $query->where('team_id', $team->id);
                }),
            ],
            // ✅ Scoped uniqueness — same email can be invited to different teams, but not twice to the same team
            'role' => Jetstream::hasRoles() ? ['required', 'string', new Role] : null,
        ]);
    }

    protected function ensureUserIsNotAlreadyOnTeam(Team $team, string $email): Closure
    {
        return function ($validator) use ($team, $email) {
            $validator->errors()->addIf(
                $team->hasUserWithEmail($email),
                'email',
                __('This user already belongs to the team.')
            );
        };
    }
}
```

**Assessment:** Clean implementation. Parallel to `AddTeamMember` but for non-registered users. The synchronous `Mail::send()` is the main concern — should be queued for production performance.

---

### 6. `RemoveTeamMember` (51 lines)

```php
class RemoveTeamMember implements RemovesTeamMembers
{
    public function remove(User $user, Team $team, User $teamMember): void
    {
        $this->authorize($user, $team, $teamMember);
        $this->ensureUserDoesNotOwnTeam($teamMember, $team);
        // ✅ Two-phase guard: authorization + ownership check

        $team->removeUser($teamMember);
        // ✅ Delegates to Team model — handles pivot detach + current_team_id cleanup

        TeamMemberRemoved::dispatch($team, $teamMember);
        // ✅ Post-action event
    }

    protected function authorize(User $user, Team $team, User $teamMember): void
    {
        if (! Gate::forUser($user)->check('removeTeamMember', $team) &&
            $user->id !== $teamMember->id) {
            throw new AuthorizationException;
        }
        // ✅ Dual authorization: either user has 'removeTeamMember' policy ability,
        //    OR user is removing themselves (self-leave). Correct Jetstream behavior.
    }

    protected function ensureUserDoesNotOwnTeam(User $teamMember, Team $team): void
    {
        if ($teamMember->id === $team->owner->id) {
            throw ValidationException::withMessages([
                'team' => [__('You may not leave a team that you created.')],
            ])->errorBag('removeTeamMember');
        }
        // ✅ Prevents team owner from leaving their own team — must delete team instead
        // ⚠️ $team->owner triggers a query — could be eager-loaded if performance matters
    }
}
```

**Assessment:** Clean implementation with proper dual-authorization (admin remove OR self-leave) and ownership guard.

---

### 7. `UpdateTeamName` (29 lines)

```php
class UpdateTeamName implements UpdatesTeamNames
{
    public function update(User $user, Team $team, array $input): void
    {
        Gate::forUser($user)->authorize('update', $team);
        // ✅ Policy check — user must have 'update' permission on team

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
        ])->validateWithBag('updateTeamName');

        $team->forceFill([
            'name' => $input['name'],
        ])->save();
        // ✅ forceFill bypasses guarded — acceptable since input is validated
        // ⚠️ No event dispatch — no TeamNameUpdated event for audit
        // ⚠️ Same uniqueness gap as CreateTeam — duplicate names allowed
    }
}
```

**Assessment:** Minimal and correct. Standard Jetstream scaffolding.

---

## ⚠️ Issues Summary

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | ⚠️ MEDIUM | `InviteTeamMember` | **Synchronous mail send** — `Mail::send()` blocks the HTTP request; should use `Mail::queue()` or `->queue()` for async delivery |
| 2 | ⚠️ MEDIUM | `DeleteUser` | **`$user->tokens->each->delete()`** loads all tokens into memory — bulk `Token::where(...)->delete()` would be cheaper |
| 3 | ⚠️ MEDIUM | `DeleteUser` | **No `UserDeleted` event dispatched** — no audit trail or notification hook for user account deletion |
| 4 | ⚠️ MEDIUM | `DeleteTeam` | **No authorization at action layer** — relies entirely on upstream controller policy (standard Jetstream pattern but fragile if action is called from another context) |
| 5 | ℹ️ LOW | `CreateTeam` | **No team name uniqueness per user** — duplicate team names allowed (Jetstream default, not a bug) |
| 6 | ℹ️ LOW | `UpdateTeamName` | **No event dispatched** on team rename — no audit trail |
| 7 | ℹ️ LOW | `RemoveTeamMember` | **`$team->owner` not eager-loaded** — triggers extra query on each removal |

**Overall assessment:** These are **largely unmodified Jetstream scaffolding files** — well-structured, properly authorized, and following Jetstream's contract-based patterns. The code quality is significantly higher than the custom action classes elsewhere in the codebase (e.g., `FibosSetting`, `SyncJob`, `Ship` actions). The issues found are minor and mostly relate to Jetstream's own design decisions rather than custom bugs.

---

## 🏗️ Architectural Notes

### Jetstream Teams Concept

Jetstream's "Team" model represents a multi-tenancy layer:
- Each user gets a **personal team** (created at registration — see `CreateAdminUser` in `107_USER_ACTIONS.md`)
- Users can create **additional teams** (non-personal) and invite members
- Teams have **roles** (via pivot table) — typically `admin` and `editor`
- The `current_team_id` on the User model tracks which team context is active

### Event Dispatching Pattern

These classes consistently use Jetstream's event system:

| Event | Dispatch Point | Purpose |
|-------|---------------|---------|
| `AddingTeamMember` | Before attach | Pre-action hook (can veto) |
| `TeamMemberAdded` | After attach | Post-action notification |
| `InvitingTeamMember` | Before invitation | Pre-action hook |
| `TeamMemberRemoved` | After detach | Post-action cleanup |
| `AddingTeam` | Before create | Pre-action hook |

### Relationship to `CreateAdminUser` (doc 107)

`CreateAdminUser` calls `$this->createTeam($user)` which creates the **personal team** at registration. The `CreateTeam` action here handles **non-personal team creation** by the user post-registration. These are complementary, not redundant.

---

## 📝 Migration to Base44

### Key Decision: Teams → Not Migrated

**The Jetstream team system is NOT needed in Base44.** Base44 has its own built-in:
- **User management** with roles (`admin`, `user`, or custom roles)
- **Invite system** via `base44.users.inviteUser(email, role)`
- **Row-level security (RLS)** on entities for data access control

The Jetstream team/multi-tenancy layer adds complexity that Base44's native auth replaces entirely.

### What Each Class Maps To

| Legacy Class | Base44 Equivalent | Notes |
|-------------|-------------------|-------|
| `AddTeamMember` | ❌ Not needed | Base44 users belong to the app directly, not teams |
| `CreateTeam` | ❌ Not needed | No team concept in Base44 |
| `DeleteTeam` | ❌ Not needed | No team concept in Base44 |
| `DeleteUser` | `base44.asServiceRole.entities.User.delete(userId)` | See `DestroyUser` in `107_USER_ACTIONS.md` for role guards |
| `InviteTeamMember` | `base44.users.inviteUser(email, role)` | Built-in SDK method — handles email invitation natively |
| `RemoveTeamMember` | ❌ Not needed | Users are app-level, not team-scoped |
| `UpdateTeamName` | ❌ Not needed | No team concept in Base44 |

### If Multi-Tenancy Is Needed Later

If the application requires team-like grouping (e.g., agencies, departments), model it as a custom entity:

```json
{
  "name": "Organization",
  "properties": {
    "name":       { "type": "string" },
    "owner_id":   { "type": "string", "description": "User ID of the organization owner" },
    "member_ids": { "type": "array", "items": { "type": "string" }, "description": "Array of User IDs" }
  }
}
```

With a backend function for invite/remove:

```typescript
// functions/manageOrgMember.js
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
const { orgId, action, email, role } = await req.json();

const org = await base44.asServiceRole.entities.Organization.get(orgId);

// Authorization: only owner can manage members
if (org.owner_id !== user.id) {
  return Response.json({ error: 'Only the organization owner can manage members' }, { status: 403 });
}

if (action === 'invite') {
  await base44.users.inviteUser(email, role || 'user');
  // Add to member_ids after invitation acceptance
} else if (action === 'remove') {
  const updatedMembers = org.member_ids.filter(id => id !== targetUserId);
  await base44.asServiceRole.entities.Organization.update(orgId, { member_ids: updatedMembers });
}

return Response.json({ success: true });
```

### `DeleteUser` Cascade — Backend Function

The legacy `DeleteUser` action's cascade logic (detach teams, delete owned teams, delete tokens, delete photo) simplifies in Base44:

```typescript
// functions/deleteUser.js — see 107_USER_ACTIONS.md for role guard implementation
const base44 = createClientFromRequest(req);
const caller = await base44.auth.me();
if (caller?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

const { userId } = await req.json();

// If Organization entity exists, clean up memberships
const orgs = await base44.asServiceRole.entities.Organization.filter({ owner_id: userId });
for (const org of orgs) {
  await base44.asServiceRole.entities.Organization.delete(org.id);
}

await base44.asServiceRole.entities.User.delete(userId);
return Response.json({ success: true });
```

### `InviteTeamMember` → Direct SDK Call

```tsx
// Frontend: Admin invites a new user
const handleInvite = async (email, role) => {
  await base44.users.inviteUser(email, role);
  toast({ title: 'Invitation sent', description: `Invited ${email} as ${role}` });
};
```

No backend function needed — `inviteUser` is a built-in SDK method that handles email dispatch and user creation flow natively. The synchronous mail issue in the legacy code is a non-issue since Base44 handles email delivery asynchronously.

---

## Summary

**`Actions/Jetstream/`** — 7 standard Jetstream scaffolding classes managing team lifecycle (create, delete, rename, add/invite/remove members, delete user). These are **largely unmodified from Jetstream's defaults** with proper authorization via Gate policies, comprehensive validation, and consistent event dispatching. Code quality is notably higher than custom action classes elsewhere in the codebase. **Main issues:** `InviteTeamMember` sends email synchronously (should queue), `DeleteUser` eager-loads tokens into memory (should bulk-delete), and no `UserDeleted` event is dispatched during account deletion.

**Migration priority: LOW** — the entire Jetstream team system is replaced by Base44's native user management and invite system. All 7 classes become obsolete. `InviteTeamMember` maps to `base44.users.inviteUser()`. `DeleteUser` cascade logic simplifies to a backend function that cleans up owned entities before calling `User.delete()`. If multi-tenancy is needed in the future, model it as a custom `Organization` entity rather than recreating the Jetstream team paradigm.

**File count: 7 files → 0 files in Base44** (fully absorbed by platform)