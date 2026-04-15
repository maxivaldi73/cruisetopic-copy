# Notifications

**Purpose:** Multi-channel notification system (mail, database, SMS) triggered by application events.  
**Framework:** Laravel Notifications with Queueable support for async delivery.

---

## Overview

Notifications are used throughout the app to alert users of important events. They support multiple delivery channels (mail, database) and can be queued for performance.

| Notification | Trigger | Channels | Purpose |
|--------------|---------|----------|---------|
| MegaJsonReadyNotification | Export completion | Mail | Notify user of JSON export file ready |
| NewUserPasswordNotification | User creation | Mail | Send initial login credentials |
| ReviewNotification | Review submission | Mail | Notify admin of new review |
| TicketAssignedNotification | Ticket assignment | Mail + Database | Multi-channel ticket assignment alert |

---

## 1️⃣ MegaJsonReadyNotification

**Location:** `App\Notifications\MegaJsonReadyNotification`  
**Trigger:** After JSON export completes (Cruiselines, Ships, Itineraries, ItineraryElements)  
**Channels:** Mail only  
**Queue:** Queueable trait enabled (async delivery)

### Constructor

```php
public function __construct(string $filePath)
```
- **Parameter:** `$filePath` - Relative path in `storage/app/public`
- **Storage:** File persisted on public disk for permanent access

### Methods

#### `via(object $notifiable): array`
- **Returns:** `['mail']`
- Single channel: email delivery

#### `toMail(object $notifiable): MailMessage`
- **Subject:** "Esportazione Cruiselines completata" (Italian)
- **Greeting:** Personalized with user name
- **Body:**
  - Line 1: "Il file JSON con tutte le Cruiselines, Ships, Itineraries e Itinerary Elements è pronto." (JSON file ready)
  - Action: "Scarica il file" button with Storage::url() link
  - Line 2: File always available for download
  - Line 3: Thanks message
- **File Link:** `Storage::disk('public')->url($filePath)` generates permanent public URL

#### `toArray(object $notifiable): array`
- **Returns:** `['file_path' => $this->filePath]`
- Used by database channel (if enabled in future)

### Usage Pattern

```php
$user->notify(new MegaJsonReadyNotification('exports/mega_2025_04_15.json'));
// Or queued:
$user->notifyLater(now()->addMinutes(5), new MegaJsonReadyNotification(...));
```

### Storage Considerations

- **Disk:** `public` (web-accessible)
- **URL:** Permanent, shared with user via email
- **Cleanup:** Admin must manually delete old exports or implement automated cleanup

---

## 2️⃣ NewUserPasswordNotification

**Location:** `App\Notifications\NewUserPasswordNotification`  
**Trigger:** User account creation (admin creates new user)  
**Channels:** Mail only  
**Queue:** Queueable trait enabled

### Constructor

```php
public function __construct(private $password)
```
- **Parameter:** `$password` - Plain text password (sent in email)
- **Security Note:** Password transmitted in email (not ideal, but common in legacy systems)

### Methods

#### `via(object $notifiable): array`
- **Returns:** `['mail']`
- Single channel: email delivery

#### `toMail(object $notifiable): MailMessage`
- **Greeting:** "Ciao {user_name}"
- **Body:**
  - Line 1: "Con questa mail ti comunichiamo le tue credenziali di accesso:" (We're sending your login credentials)
  - Line 2: "Username: {user_email}"
  - Line 3: "Password: {password}"
- **No CTA:** No action button provided
- **Language:** Italian

#### `toArray(object $notifiable): array`
- **Returns:** Empty array `[]`
- No database channel support

### Security Issues

⚠️ **Concerns:**
1. Plain text password in email (interceptable)
2. No password reset link provided
3. No expiration on initial password

**Recommendation for Base44:**
- Use password reset token instead of plain password
- Send secure link with expiration
- Require password change on first login

---

## 3️⃣ ReviewNotification

**Location:** `App\Notifications\ReviewNotification`  
**Trigger:** New review submission (user leaves review)  
**Channels:** Mail only  
**Queue:** Queueable trait enabled

### Constructor

```php
public function __construct($review, $isNew)
```
- **Parameters:**
  - `$review` - Review model instance
  - `$isNew` - Boolean flag (new review vs. updated)
- **Usage:** Currently only checks `$isNew` in future implementations

### Methods

#### `via(object $notifiable): array`
- **Returns:** `['mail']`
- Single channel: email delivery

#### `toMail(object $notifiable): MailMessage`
- **Subject:** None explicitly set (defaults to class name)
- **Body:**
  - Line 1: "New review received with rating: {review_rating}"
  - Line 2: "Review from {reviewer_email}"
- **No CTA:** No action button
- **No Greeting:** Missing greeting
- **Minimal Content:** Very basic email

#### `toArray(object $notifiable): array`
- **Returns:** Empty array `[]`
- No database channel support

### Data Dependencies

| Field | Source | Type |
|-------|--------|------|
| rating | $review->rating | int (1-5) |
| user email | $review->user->email | string |

### Improvements Needed

- Add proper greeting
- Add review content summary
- Add link to review in admin panel
- Set meaningful subject line
- Support database channel for admin notifications

---

## 4️⃣ TicketAssignedNotification

**Location:** `App\Notifications\TicketAssignedNotification`  
**Trigger:** Ticket assigned or reassigned to agent  
**Channels:** Mail + Database (conditional)  
**Queue:** Implements ShouldQueue (mandatory async delivery)  
**Registration:** EventServiceProvider (TicketAssigned event listener)

### Constructor

```php
public function __construct(
    private readonly Ticket $ticket,
    private readonly bool $isReassignment = false
)
{
    $this->afterCommit();
}
```
- **Parameters:**
  - `$ticket` - Ticket model instance
  - `$isReassignment` - Flag: new assignment vs. reassignment
- **Timing:** `afterCommit()` - Sends after DB transaction commits (ensures data persistence)

### Methods

#### `via(object $notifiable): array`
- **Logic:** Dynamic channel selection
  ```php
  return array_values(array_filter([
      'database',  // Always include
      filled($notifiable->email ?? null) ? 'mail' : null,  // Only if email exists
  ]));
  ```
- **Result:** 
  - Always sends to database channel (in-app notification)
  - Sends to mail if user has email address
- **Robustness:** Guards against missing/null email

#### `toMail(object $notifiable): MailMessage`
- **Subject:** Conditional based on type
  - New: "New ticket assigned: {ticket_reference}"
  - Reassign: "Ticket reassigned: {ticket_reference}"
- **Greeting:** "Hello {agent_name},"
- **Body:**
  - Message: "A new ticket has been assigned to you." or "A ticket has been reassigned to you."
  - Reference: Ticket reference number
  - Customer: Customer full name (or N/A)
  - Status: Current ticket status
  - Action: "Open ticket" button with route link
- **Data Source:** `buildPayload()` method

#### `toArray(object $notifiable): array`
- **Returns:** Full payload for database channel storage
- **Fields:** Same as `buildPayload()`

### Protected Methods

#### `buildPayload(): array`
- **Purpose:** Centralize data extraction (DRY principle)
- **Logic:**
  ```php
  $ticket = $this->ticket->fresh(['customer', 'ticketStatus']);
  // Refresh with eager loads: customer, ticketStatus
  
  $customerName = trim((string) ($ticket?->customer?->firstname . ' ' . $ticket?->customer?->lastname));
  $reference = $ticket?->ticket_number ?: ('#T-' . str_pad((string) $ticket?->id, 6, '0', STR_PAD_LEFT));
  // Generate reference: use ticket_number or format ID as #T-000001
  ```
- **Returns:**
  ```php
  [
      'ticket_id' => $ticket?->id,
      'reference' => $reference,
      'customer' => $customerName !== '' ? $customerName : 'N/A',
      'status' => $ticket?->ticketStatus?->name ?? 'Open',
      'message' => $this->isReassignment ? 'reassigned...' : 'assigned...',
      'is_reassignment' => $this->isReassignment,
      'url' => $ticket ? route('tickets.show', $ticket) : route('tickets.index'),
  ]
  ```
- **Defensive:** Uses null-safe operators (`?->`) and defaults (e.g., 'Open' status)

### Data Dependencies

| Field | Source | Type | Fallback |
|-------|--------|------|----------|
| ticket_number | $ticket->ticket_number | string | Generated #T-XXXXXX |
| customer name | $ticket->customer->firstname/lastname | string | 'N/A' |
| status | $ticket->ticketStatus->name | string | 'Open' |
| ticket route | route('tickets.show', $ticket) | URL | route('tickets.index') |

### Design Patterns

1. **afterCommit():** Ensures database consistency before sending notifications
2. **Dynamic Channels:** Gracefully handles missing email
3. **Payload Centralization:** Single `buildPayload()` for both mail and database
4. **Defensive Null Handling:** Guards against missing relationships

---

## 📊 Comparison Table

| Feature | MegaJson | NewPassword | Review | Ticket |
|---------|----------|-------------|--------|--------|
| Channels | Mail | Mail | Mail | Mail + DB |
| Queue | Queueable | Queueable | Queueable | ShouldQueue |
| Multi-language | IT | IT | EN | Mixed (IT/EN) |
| Subject Line | ✅ | ❌ | ❌ | ✅ |
| Greeting | ✅ | ✅ | ❌ | ✅ |
| Action Button | ✅ | ❌ | ❌ | ✅ |
| Database Storage | ❌ | ❌ | ❌ | ✅ |
| Event Listener | ? | ? | ? | ✅ (EventServiceProvider) |

---

## 📝 Migration Notes for Base44

### Notification Pattern
- **Current:** Laravel Notifications with mail/database channels
- **Base44 Approach:** Backend functions + email integration (Core.SendEmail)
- **Pattern:** Trigger event → Backend function → SendEmail integration

### Mail Content
- **Current:** PHP code generates HTML
- **Better:** Template files + view rendering
- **Base44:** Markdown emails or HTML templates

### Queue/Async
- **Current:** Laravel Queue with ShouldQueue interface
- **Base44:** Use automations for async delivery
- **Pattern:** Entity event triggers automation → backend function

### Multi-Channel
- **Current:** TicketAssignedNotification supports mail + database
- **Base44:** Implement per-channel separately
  - Mail: SendEmail integration
  - Database: Store notification entity manually
  - SMS: Conditional based on user preference

### Implementation for Base44

**Notification Flow:**
```
1. Entity event (Ticket created/assigned)
   └─ Trigger automation (entity type="create"/"update")
      └─ Call backend function (sendTicketNotification)
         ├─ Get recipient (assigned_to user)
         ├─ Prepare data (payload)
         ├─ Send email (base44.integrations.Core.SendEmail)
         └─ Store in database (optional notification table)
```

**Code Example:**
```typescript
// Function: sendTicketNotification
async function handler(req) {
  const { event, data } = req.body;
  const ticket = data;
  
  const user = await base44.entities.User.get(ticket.assigned_to_id);
  const payload = buildTicketPayload(ticket);
  
  await base44.integrations.Core.SendEmail({
    to: user.email,
    subject: `New ticket assigned: ${payload.reference}`,
    body: renderTicketEmail(payload)
  });
  
  // Optional: Store in notification table
  await base44.entities.Notification.create({
    user_id: user.id,
    type: 'ticket_assigned',
    data: payload
  });
}
```

### Security Considerations
- **NewUserPasswordNotification:** Avoid plain text passwords in email
  - Use reset token + secure link instead
  - Force password change on first login
- **Email Validation:** Ensure recipient email exists before sending
- **Template Injection:** Use template rendering, not string interpolation