# Fortify Action Classes (5 files)

**Directory:** `App/Actions/Fortify/`  
**Namespace:** `App\Actions\Fortify`  
**Type:** Laravel Fortify / Jetstream authentication action classes  
**Priority:** NONE — **entirely replaced by Base44 platform**; authentication, registration, password management, and profile updates are all handled natively

---

## 📋 Overview

| Class | Implements | Purpose | Status |
|-------|-----------|---------|--------|
| `CreateNewUser` | `CreatesNewUsers` | User registration with validation + personal team creation | ✅ Implemented |
| `PasswordValidationRules` | *(trait)* | Shared password validation rule set | ✅ Implemented |
| `ResetUserPassword` | `ResetsUserPasswords` | Forgotten password reset with validation | ✅ Implemented |
| `UpdateUserPassword` | `UpdatesUserPasswords` | Authenticated password change with current-password verification | ✅ Implemented |
| `UpdateUserProfileInformation` | `UpdatesUserProfileInformation` | Profile name/email/photo update with email re-verification | ✅ Implemented |

All five classes are **standard Fortify/Jetstream scaffolding** with minimal customization.

---

## 🔧 Implementation

### 1. `PasswordValidationRules` (Trait)

```php
trait PasswordValidationRules
{
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
        // ✅ Uses Password::default() — respects app-level password complexity config
        // ✅ Requires 'confirmed' — paired confirmation field
        // ℹ️ Shared by CreateNewUser, ResetUserPassword, UpdateUserPassword
    }
}
```

**Assessment:** Clean, minimal trait. No issues. Used by all three password-related action classes.

---

### 2. `CreateNewUser`

```php
class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => $this->passwordRules(),
            'terms' => Jetstream::hasTermsAndPrivacyPolicyFeature() ? ['accepted', 'required'] : '',
            // ✅ Conditional terms acceptance based on Jetstream feature flag
        ])->validate();

        return DB::transaction(function () use ($input) {
            return tap(User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => Hash::make($input['password']),
            ]), function (User $user) {
                $this->createTeam($user);
                // ✅ Wrapped in DB transaction — user + team are atomic
            });
        });
    }

    protected function createTeam(User $user): void
    {
        $user->ownedTeams()->save(Team::forceCreate([
            'user_id' => $user->id,
            'name' => explode(' ', $user->name, 2)[0] . "'s Team",
            'personal_team' => true,
            // ✅ Personal team auto-created on registration (Jetstream convention)
            // ⚠️ Team name uses first word of user's name — fragile for single-name users
            //    e.g. "Madonna" → "Madonna's Team" (works), but empty name → "'s Team"
        ]));
    }
}
```

**Assessment:** Standard Jetstream registration scaffold. The only customization is the `Team` model import path (`App\Models\Team` vs Jetstream default). The personal team creation is a Jetstream multi-tenancy feature that has no equivalent in Base44 (and isn't needed — see migration notes).

---

### 3. `ResetUserPassword`

```php
class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
            // ✅ Reuses shared password rules including 'confirmed'
        ])->validate();

        $user->forceFill([
            'password' => Hash::make($input['password']),
        ])->save();
        // ✅ forceFill bypasses mass-assignment protection — correct for password field
        // ✅ Hash::make() uses bcrypt by default
    }
}
```

**Assessment:** Completely standard Fortify scaffold — zero customization from the default stub.

---

### 4. `UpdateUserPassword`

```php
class UpdateUserPassword implements UpdatesUserPasswords
{
    use PasswordValidationRules;

    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'current_password' => ['required', 'string', 'current_password:web'],
            // ✅ Verifies current password before allowing change — security best practice
            'password' => $this->passwordRules(),
        ], [
            'current_password.current_password' => __('The provided password does not match your current password.'),
            // ✅ Custom error message with i18n support via __()
        ])->validateWithBag('updatePassword');
        // ✅ Named error bag 'updatePassword' — prevents collision with other forms on same page

        $user->forceFill([
            'password' => Hash::make($input['password']),
        ])->save();
    }
}
```

**Assessment:** Standard Fortify scaffold with the addition of `current_password` verification. No customization beyond the default stub.

---

### 5. `UpdateUserProfileInformation`

```php
class UpdateUserProfileInformation implements UpdatesUserProfileInformation
{
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            // ✅ Email uniqueness check excluding current user — prevents self-conflict
            'photo' => ['nullable', 'mimes:jpg,jpeg,png', 'max:1024'],
            // ✅ Photo validation: jpg/jpeg/png only, max 1MB
        ])->validateWithBag('updateProfileInformation');

        if (isset($input['photo'])) {
            $user->updateProfilePhoto($input['photo']);
            // ✅ Jetstream's built-in profile photo handling (Spatie/Filesystem)
        }

        if ($input['email'] !== $user->email &&
            $user instanceof MustVerifyEmail) {
            $this->updateVerifiedUser($user, $input);
            // ✅ Email change triggers re-verification for MustVerifyEmail users
        } else {
            $user->forceFill([
                'name' => $input['name'],
                'email' => $input['email'],
            ])->save();
        }
    }

    protected function updateVerifiedUser(User $user, array $input): void
    {
        $user->forceFill([
            'name' => $input['name'],
            'email' => $input['email'],
            'email_verified_at' => null,
            // ✅ Nullifies verification timestamp — forces re-verification
        ])->save();

        $user->sendEmailVerificationNotification();
        // ✅ Sends verification email automatically
    }
}
```

**Assessment:** Standard Fortify scaffold. The only notable behavior is the email re-verification flow when a verified user changes their email address. Photo handling delegates to Jetstream's `HasProfilePhoto` trait (Spatie media library under the hood).

---

## ⚠️ Issues

| # | Severity | Class | Issue |
|---|----------|-------|-------|
| 1 | ℹ️ LOW | `CreateNewUser` | **Personal team auto-creation** — Jetstream multi-tenancy pattern; no equivalent needed in Base44 |
| 2 | ℹ️ LOW | `CreateNewUser` | **Team name from first word** — `explode(' ', $user->name, 2)[0]` fragile for edge-case names |
| 3 | ℹ️ LOW | `UpdateUserProfileInformation` | **Photo size limit 1MB** — may be insufficient for high-resolution profile photos |
| 4 | ℹ️ LOW | All | **No custom business logic** — all five files are default Fortify/Jetstream stubs with zero app-specific customization |

**No critical or high-severity issues.** These are clean, standard framework scaffolding files.

---

## 📝 Migration to Base44

### Complete Replacement — No Migration Needed

All five Fortify action classes are **entirely superseded by the Base44 platform's built-in authentication system**:

| Fortify Action | Base44 Equivalent |
|---|---|
| `CreateNewUser` | `base44.users.inviteUser(email, role)` — user registration handled by platform |
| `PasswordValidationRules` | ❌ Not needed — password policies managed by platform |
| `ResetUserPassword` | ❌ Not needed — password reset flow handled by platform |
| `UpdateUserPassword` | ❌ Not needed — password management handled by platform |
| `UpdateUserProfileInformation` | `base44.auth.updateMe(data)` — profile updates via SDK |

### Key Differences

1. **No self-registration**: Base44 uses an invite model (`base44.users.inviteUser`), not open self-registration. The `CreateNewUser` flow is replaced entirely.
2. **No password management**: Base44 handles password hashing, reset tokens, and email verification internally. No application-level code needed.
3. **No personal teams**: The Jetstream team/multi-tenancy pattern is not used. Base44 provides roles (`admin`, `user`, or custom) directly on the User entity.
4. **Profile updates**: Only `base44.auth.updateMe(data)` is needed for updating user profile data. Built-in fields (`full_name`, `email`) are read-only; custom fields can be added to the User entity schema.
5. **Profile photos**: Use `base44.integrations.Core.UploadFile({ file })` to upload, then store the URL on a custom User field.

### Profile Photo Migration (if needed)

```tsx
// Frontend: upload photo and save URL to user profile
const handlePhotoUpload = async (file) => {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  await base44.auth.updateMe({ profile_photo_url: file_url });
};
```

This requires adding `profile_photo_url` (type: string) to the User entity schema.

---

## 📊 File Inventory Update

These 5 files bring the total to **516 files documented**.

| File | Lines | Customization Level |
|------|-------|--------------------|
| `CreateNewUser.php` | 53 | Low — only Team model import path differs from default stub |
| `PasswordValidationRules.php` | 18 | None — exact default Fortify stub |
| `ResetUserPassword.php` | 22 | None — exact default Fortify stub |
| `UpdateUserPassword.php` | 30 | None — exact default Fortify stub |
| `UpdateUserProfileInformation.php` | 56 | None — exact default Fortify stub |

---

## Summary

**`Actions/Fortify/` (5 files, 179 lines total):** Standard Laravel Fortify/Jetstream authentication scaffolding with **zero app-specific customization**. Covers user registration with personal team creation (`CreateNewUser`), shared password validation rules (`PasswordValidationRules` trait), forgotten password reset (`ResetUserPassword`), authenticated password change with current-password verification (`UpdateUserPassword`), and profile name/email/photo update with email re-verification for `MustVerifyEmail` users (`UpdateUserProfileInformation`). All five files are clean default stubs — the cleanest code in the entire codebase audit. **No migration action required** — all functionality is natively handled by the Base44 platform's built-in authentication system.

**Migration priority: NONE** — delete all five files during migration; no replacement code needed.