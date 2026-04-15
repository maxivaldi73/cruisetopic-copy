# User Management Controller (Materio Laravel Example)

**Purpose:** Demonstrates CRUD operations and DataTables.js server-side processing for user management (Materio template example).  
**Namespace:** `App\Http\Controllers\Materio\laravel_example`  
**Location:** `App/Http/Controllers/Materio/laravel_example/UserManagement.php`  
**Type:** Demo controller with business logic (user listing, creation, updates, deletion)

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| Type | Laravel example controller (Materio template demo) |
| Primary Use | Demonstrate user CRUD + DataTables server-side processing |
| Extends | `Controller` |
| Dependencies | `User` model, `Request`, `Str` helper |
| Auth | Assumed admin-only via route group |
| Database | Reads/writes to `users` table |

---

## 🔧 Methods

### UserManagement() → View

```php
public function UserManagement(): View
{
    $users = User::all();
    $userCount = $users->count();
    $verified = User::whereNotNull('email_verified_at')->get()->count();
    $notVerified = User::whereNull('email_verified_at')->get()->count();
    $usersUnique = $users->unique(['email']);
    $userDuplicates = $users->diff($usersUnique)->count();

    return view('content.laravel-example.user-management', [
        'totalUser' => $userCount,
        'verified' => $verified,
        'notVerified' => $notVerified,
        'userDuplicates' => $userDuplicates,
    ]);
}
```

**Purpose:** Render the user management dashboard view with summary statistics.

| Statistic | Logic |
|-----------|-------|
| `totalUser` | Total user count |
| `verified` | Users with `email_verified_at` not null |
| `notVerified` | Users with `email_verified_at` null |
| `userDuplicates` | Duplicate users (by email) |

**Issues:**
- Loads **all users** in memory (`User::all()`) — inefficient for large datasets
- Performs multiple separate queries — should use aggregations
- Duplicate detection is in-memory and inefficient

---

### index(Request $request) → JsonResponse

```php
public function index(Request $request): JsonResponse
{
    $columns = [
        1 => 'id',
        2 => 'name',
        3 => 'email',
        4 => 'email_verified_at',
    ];

    $totalData = User::count();
    $totalFiltered = $totalData;

    $limit = $request->input('length');
    $start = $request->input('start');
    $order = $columns[$request->input('order.0.column')] ?? 'id';
    $dir = $request->input('order.0.dir') ?? 'desc';

    $query = User::query();

    // Search handling
    if (!empty($request->input('search.value'))) {
        $search = $request->input('search.value');
        $query->where(function ($q) use ($search) {
            $q->where('id', 'LIKE', "%{$search}%")
              ->orWhere('name', 'LIKE', "%{$search}%")
              ->orWhere('email', 'LIKE', "%{$search}%");
        });
        $totalFiltered = $query->count();
    }

    $users = $query->offset($start)
        ->limit($limit)
        ->orderBy($order, $dir)
        ->get();

    $data = [];
    $ids = $start;

    foreach ($users as $user) {
        $data[] = [
            'id' => $user->id,
            'fake_id' => ++$ids,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
        ];
    }

    return response()->json([
        'draw' => intval($request->input('draw')),
        'recordsTotal' => intval($totalData),
        'recordsFiltered' => intval($totalFiltered),
        'data' => $data,
    ]);
}
```

**Purpose:** DataTables.js server-side processing endpoint — returns paginated, filtered, and sorted user list.

**Parameters:**
- `length` — rows per page
- `start` — pagination offset
- `order.0.column` — sort column index
- `order.0.dir` — sort direction (`asc` or `desc`)
- `search.value` — search term (optional)

**Issues:**
1. **SQL injection risk:** `LIKE "%{$search}%"` — no prepared statement escaping visible (Laravel parameterizes, but poor practice)
2. **Column index mapping is rigid:** Hard-coded column positions — if view order changes, mapping breaks
3. **No authorization:** Any authenticated user can list all users — no role check
4. **Inefficient search:** Searches 3 columns with OR — could be slow on large datasets
5. **No validation:** `$limit`, `$start`, `$order`, `$dir` not validated — could cause issues

---

### store(Request $request) → JsonResponse

```php
public function store(Request $request)
{
    $userID = $request->id;

    if ($userID) {
        // update the value
        $users = User::updateOrCreate(
            ['id' => $userID],
            ['name' => $request->name, 'email' => $request->email]
        );
        return response()->json('Updated');
    } else {
        // create new one if email is unique
        $userEmail = User::where('email', $request->email)->first();

        if (empty($userEmail)) {
            $users = User::updateOrCreate(
                ['id' => $userID],
                ['name' => $request->name, 'email' => $request->email, 'password' => bcrypt(Str::random(10))]
            );
            return response()->json('Created');
        } else {
            return response()->json(['message' => "already exits"], 422);
        }
    }
}
```

**Purpose:** Create or update a user via AJAX.

**Logic:**
1. If `id` is provided → update existing user (name, email only)
2. If `id` is missing → create new user with random password
3. Check email uniqueness before creating
4. Return plain text or JSON response

**Issues:**
1. **No input validation:** No `Request::validate()` — allows any data
2. **No authorization:** Any authenticated user can create/update any user
3. **Race condition:** Email uniqueness check (`first()`) then `updateOrCreate()` — another process could insert between check and create
4. **updateOrCreate() misuse:** With `['id' => null]`, this will never match — creates new record regardless
5. **Weak password:** `bcrypt(Str::random(10))` — very weak password generation
6. **Response inconsistency:** Returns plain string (`'Updated'`) instead of JSON object
7. **Typo in error message:** `"already exits"` should be `"already exists"`

---

### edit($id) → JsonResponse

```php
public function edit($id): JsonResponse
{
    $user = User::findOrFail($id);
    return response()->json($user);
}
```

**Purpose:** Fetch a single user by ID for editing via AJAX.

**Issues:**
- No authorization — any user can view any user's details
- No error handling — `findOrFail()` throws 404, which is acceptable but could be explicit

---

### destroy($id)

```php
public function destroy($id)
{
    $users = User::where('id', $id)->delete();
}
```

**Purpose:** Delete a user by ID.

**Issues:**
1. **No response:** Method returns nothing — caller can't tell if delete succeeded
2. **No authorization:** Any user can delete any user
3. **No soft deletes:** User is permanently deleted — no audit trail
4. **Unused variable:** `$users` is assigned but never used

---

### create(), show(), update()

```php
public function create() { }
public function show($id) { }
public function update(Request $request, $id) {}
```

All three are empty stubs — likely placeholder methods from resource controller scaffolding.

---

## ⚠️ Issues / Concerns Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🚨 Critical | No authorization on any method — access control missing |
| 2 | 🚨 Critical | No input validation on `store()` |
| 3 | ⚠️ High | `UserManagement()` loads all users in memory (inefficient) |
| 4 | ⚠️ High | Race condition in `store()` — email check then create |
| 5 | ⚠️ High | `destroy()` returns no response |
| 6 | ⚠️ High | `index()` - no pagination/sorting validation |
| 7 | ⚠️ Medium | Hard-coded column mapping in `index()` — brittle |
| 8 | ⚠️ Medium | updateOrCreate misuse with null ID |
| 9 | ⚠️ Medium | Typo in error message |
| 10 | ℹ️ Low | Response inconsistency (plain string vs JSON) |

---

## 📝 Migration Notes for Base44

### Current Architecture

```
GET /users (UserManagement) → view with stats
GET /users/index (AJAX) → DataTables server-side processing
POST /users (AJAX) → create/update user
GET /users/{id}/edit (AJAX) → fetch user for edit
DELETE /users/{id} → delete user
```

### Base44 Equivalent: Backend Functions + React

**Backend Function: getUserStatistics**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // Admin-only
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await base44.entities.User.list();
  const totalUser = users.length;
  const verified = users.filter(u => u.email_verified_at).length;
  const notVerified = totalUser - verified;
  
  const uniqueEmails = new Set(users.map(u => u.email));
  const userDuplicates = totalUser - uniqueEmails.size;

  return Response.json({
    totalUser,
    verified,
    notVerified,
    userDuplicates,
  });
});
```

**Backend Function: listUsers**

```typescript
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { search, sortBy = 'id', sortDir = 'desc', skip = 0, limit = 10 } = await req.json();

  let query = { $limit: limit, $skip: skip };
  if (sortBy) query.$sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { full_name: { $regex: search, $options: 'i' } },
    ];
  }

  const results = await base44.entities.User.filter(query);
  const totalCount = await base44.entities.User.filter({});

  return Response.json({
    recordsTotal: totalCount.length,
    recordsFiltered: results.length,
    data: results.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      email_verified_at: u.email_verified_at,
    })),
  });
});
```

**Backend Function: updateUser**

```typescript
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, name, email } = await req.json();

  if (!id || !name || !email) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existing = await base44.entities.User.filter({ email });
  if (existing.length > 0 && existing[0].id !== id) {
    return Response.json({ error: 'Email already exists' }, { status: 422 });
  }

  await base44.asServiceRole.entities.User.update(id, {
    full_name: name,
    email,
  });

  return Response.json({ message: 'Updated' });
});
```

**Frontend: React User Management Page**

```tsx
export default function UserManagementPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isEditing, setIsEditing] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getUserStatistics', {}).then(r => setStats(r.data));
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await base44.functions.invoke('listUsers', { search, skip: page * 10, limit: 10 });
    setUsers(res.data.data);
  };

  const handleSave = async (id, name, email) => {
    await base44.functions.invoke('updateUser', { id, name, email });
    fetchUsers();
    setIsEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{stats?.totalUser}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Verified</p>
          <p className="text-2xl font-bold">{stats?.verified}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Not Verified</p>
          <p className="text-2xl font-bold">{stats?.notVerified}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Duplicates</p>
          <p className="text-2xl font-bold">{stats?.userDuplicates}</p>
        </Card>
      </div>

      <Input
        placeholder="Search by email or name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onBlur={fetchUsers}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.email_verified_at ? '✓' : '✗'}</TableCell>
              <TableCell>
                <Button onClick={() => setIsEditing(u)}>Edit</Button>
                <Button variant="destructive">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Key Improvements

1. **Authorization:** All backend functions check `user.role === 'admin'`
2. **Input validation:** Validate required fields before processing
3. **Optimized queries:** Use aggregations instead of loading all data
4. **Race condition fixed:** Check email uniqueness within the update transaction
5. **Proper responses:** All endpoints return JSON with status codes
6. **Error handling:** Explicit error messages and HTTP status codes
7. **Audit trail:** Use Base44's built-in `created_by` and `updated_date` fields

### Entities Required

- Built-in `User` entity (already available in Base44)

### Summary

This is a **Materio template example** with basic CRUD logic. In Base44, migrate to backend functions with proper authorization, validation, and error handling. The React frontend becomes a simple data display + form component using `@tanstack/react-query` for data fetching.