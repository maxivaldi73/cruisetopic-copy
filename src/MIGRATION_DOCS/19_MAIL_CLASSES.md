# Mail Classes

**Purpose:** Laravel Mail classes for generating and sending transactional emails. Extends Mailable with queueable support for async delivery.  
**Framework:** Laravel Mail with Queueable & SerializesModels traits

---

## Overview

Mail classes handle email generation and delivery for key application events:

| Mail Class | Trigger | Recipients | Features |
|-----------|---------|-----------|----------|
| LeadEmailVerificationMail | Lead created | Lead email | Email verification link |
| QuoteSentMail | Quote sent | Customer/salesperson | Quote PDF attachment |
| SystemNotificationMail | Generic event | Admin/system | Flexible subject/body |
| TicketCommentMail | Comment added to ticket | Ticket assignee | HTML content, attachments |
| TicketCreatedConfirmationMail | Ticket created | Submitter | Ticket reference in subject |

---

## 1️⃣ LeadEmailVerificationMail

**Location:** `App\Mail\LeadEmailVerificationMail`  
**Trigger:** Lead creation or email verification workflow  
**Channels:** Mail only  
**Queue:** Queueable trait enabled (async delivery)  
**Language:** Italian

### Constructor

```php
public function __construct(public Lead $lead)
```
- **Parameter:** `$lead` - Lead model instance
- **Access:** Available as `$this->lead` throughout class

### Methods

#### `envelope(): Envelope`
- **Subject:** "Verifica indirizzo email" (Verify email address)
- **Static subject:** Not personalized
- **Language:** Italian

#### `content(): Content`
- **View:** `emails.lead-email-verification` (Blade template)
- **Data Passed:**
  ```php
  [
      'lead' => $this->lead,
      'url'  => route('lead.verify.email', [
          'id'   => $this->lead->id,
          'hash' => sha1($this->lead->email),
      ])
  ]
  ```
- **Verification Token:** Uses SHA1 hash of email as security token
- **Verification Route:** `lead.verify.email` - must exist in routes

#### `attachments(): array`
- **Returns:** Empty array (no attachments)

### Data Dependencies

| Variable | Source | Purpose |
|----------|--------|---------|
| lead | Constructor param | Lead instance |
| url | Calculated | Email verification link |
| hash | sha1(email) | Security token (not cryptographically secure) |

### Security Issues

⚠️ **Concerns:**
1. SHA1 hash for token (deprecated, vulnerable)
2. No expiration on verification link
3. No rate limiting on verification attempts
4. Token derivable from public email

**Recommendation for Base44:**
- Use secure random tokens (bin2hex(random_bytes(32)))
- Add token expiration (15 minutes)
- Store token in database with TTL
- Rate limit verification attempts

### Flow

```
Lead created
  ↓
LeadEmailVerificationMail dispatched
  ↓
Generate verification URL with email hash
  ↓
Send email with 'Verifica indirizzo email'
  ↓
Lead clicks link → route('lead.verify.email', [id, hash])
  ↓
Verify email confirmed
```

---

## 2️⃣ QuoteSentMail

**Location:** `App\Mail\QuoteSentMail`  
**Trigger:** Quote sent to customer  
**Channels:** Mail only  
**Queue:** Queueable trait enabled  
**Language:** Italian  
**Attachments:** Quote PDF

### Constructor

```php
public function __construct(Quote $quote, array $options = [], ?User $salesperson = null)
{
    $this->quote = $quote;
    $this->options = $options;
    $this->salesperson = $salesperson?->loadMissing('seller');
}
```
- **Parameters:**
  - `$quote` - Quote model (required)
  - `$options` - Optional configuration array
  - `$salesperson` - Optional User with seller relation
- **Eager Loading:** `salesperson` loaded with seller relation

### Methods

#### `envelope(): Envelope`
- **Subject:** "Il tuo preventivo #{quote_number}"
- **Personalized:** Includes quote number
- **Language:** Italian ("Your quote")

#### `content(): Content`
- **View:** `emails.quote-sent` (Blade template)
- **Data Passed:**
  ```php
  [
      'quote'      => $this->quote,
      'options'    => $this->options,
      'salesperson' => $this->salesperson,
  ]
  ```
- **View Responsibility:** Render quote details, salesperson info, etc.

#### `attachments(): array`
- **Returns:** Array with PDF attachment
- **PDF Generation:**
  ```php
  return [
      Attachment::fromStorageDisk('local', $path)
          ->as('quote-filename.pdf')
          ->withMime('application/pdf'),
  ];
  ```
- **Storage:** Uses local disk (app/storage)
- **Filename:** Dynamic based on quote

### Public Properties

| Property | Type | Purpose |
|----------|------|---------|
| quote | Quote | Quote model instance |
| options | array | Configuration options (salesperson name, custom message, etc.) |
| salesperson | ?User | Salesperson contact info |

### Data Dependencies

| Field | Source | Type | Purpose |
|-------|--------|------|---------|
| quote_number | $quote->quote_number | string | Unique quote identifier |
| salesperson.seller | relation | Seller | Salesperson's seller profile |
| options | constructor | array | Custom email options |

### Features

- **PDF Attachment:** Automatically attaches quote PDF
- **Salesperson Info:** Optional seller contact information
- **Flexible Options:** Supports custom configuration per email

### Usage Pattern

```php
// Send quote
$mail = new QuoteSentMail($quote, [
    'salesperson_name' => 'John Doe',
    'custom_message' => 'Check your quote'
], $user);

Mail::to($quote->customer->email)->send($mail);
```

---

## 3️⃣ SystemNotificationMail

**Location:** `App\Mail\SystemNotificationMail`  
**Trigger:** Generic system events  
**Channels:** Mail only  
**Queue:** Queueable trait enabled  
**Language:** Configurable (English by default)  
**Purpose:** Flexible notification for admin/system events

### Constructor

```php
public function __construct(
    string $subject,
    string $message,
    array $data = [],
    string $env = null
)
{
    $this->mailSubject = $subject;
    $this->mailMessage = $message;
    $this->data = $data;
    $this->env = $env ?? config('app.env');
}
```
- **Parameters:**
  - `$subject` - Email subject line
  - `$message` - Email body text
  - `$data` - Additional context data (optional)
  - `$env` - Environment (prod/staging/dev) - defaults to config
- **Property Naming:** `mailMessage` (renamed from generic `message` to avoid conflicts)

### Methods

#### `envelope(): Envelope`
- **Subject:** `$this->mailSubject`
- **Dynamic:** Uses constructor parameter
- **From Address:** Configured from `config('support.smtp.from')`

#### `content(): Content`
- **View:** `emails.system-notification`
- **Data Passed:**
  ```php
  [
      'subject'  => $this->mailSubject,
      'message'  => $this->mailMessage,
      'data'     => $this->data,
      'env'      => $this->env,
  ]
  ```
- **Purpose:** Render generic notification template

#### `attachments(): array`
- **Returns:** Empty array (no attachments)

### Public Properties

| Property | Type | Purpose |
|----------|------|---------|
| mailSubject | string | Email subject |
| mailMessage | string | Email body text |
| data | array | Additional context (key-value pairs) |
| env | string | Environment (prod/dev/staging) |

### Use Cases

```php
// Send sync error notification
$mail = new SystemNotificationMail(
    'Fibos Sync Failed',
    'Sync job 123 failed with error',
    ['job_id' => 123, 'error_code' => 'API_TIMEOUT'],
    'production'
);

Mail::to('admin@example.com')->send($mail);

// Send generic alert
$mail = new SystemNotificationMail(
    'Database Backup Complete',
    'Backup completed successfully',
    ['size' => '500MB', 'duration' => '5 minutes']
);
```

### Features

- **Flexible Subject/Body:** Not tied to specific events
- **Context Data:** Pass arbitrary data to template
- **Environment-Aware:** Includes environment in email (useful for debugging)
- **Configurable From Address:** Uses support config

### Notes

- Generic/reusable for any system notification
- Template must handle arbitrary data gracefully
- Email address must be specified in caller (to->send)

---

## 4️⃣ TicketCommentMail

**Location:** `App\Mail\TicketCommentMail`  
**Trigger:** Comment added to ticket  
**Channels:** Mail only  
**Queue:** Queueable trait enabled  
**Language:** English (support.smtp config)

### Constructor

```php
public function __construct(
    public Ticket $ticket,
    public Comment $comment,
) {
    $this->salesperson = $comment->user?->loadMissing('seller');
}
```
- **Parameters:**
  - `$ticket` - Ticket model (required)
  - `$comment` - Comment model (required)
- **Eager Loading:** Loads salesperson seller relation from comment.user

### Methods

#### `envelope(): Envelope`
- **From Address:** Support config address (configured)
  ```php
  new Address(
      (string) config('support.smtp.from.address'),
      (string) config('support.smtp.from.name')
  )
  ```
- **Subject:** "Re: [{ticket.formatted_reference}] Comment"
- **Ticket Reference:** Includes formatted ticket reference (e.g., "#TK-001234")
- **Reply Format:** Uses "Re:" to indicate response

#### `content(): Content`
- **View:** `emails.ticket-comment`
- **Data Passed:**
  ```php
  [
      'ticket'      => $this->ticket,
      'comment'     => $this->comment,
      'salesperson' => $this->salesperson,
  ]
  ```
- **Purpose:** Render comment and context

#### `attachments(): array`
- **Returns:** Array with attachments
- **Attachment Logic:**
  - If comment has attachments (Spatie MediaLibrary):
    ```php
    $comment->getMedia('attachments')->map(fn($media) =>
        Attachment::fromPath($media->getFullUrl())
    )
    ```
- **Source:** Media collection on Comment model

### Public Properties

| Property | Type | Purpose |
|----------|------|---------|
| ticket | Ticket | Ticket instance |
| comment | Comment | Comment instance |
| salesperson | ?User | Commenter's seller profile |

### Data Dependencies

| Field | Source | Purpose |
|-------|--------|---------|
| formatted_reference | $ticket | Formatted ticket ID (e.g., #TK-001) |
| comment.body | Comment | Comment text |
| comment.attachments | MediaLibrary | Files attached to comment |
| salesperson | comment.user.seller | Commenter's profile |

### Special Features

- **Ticket Reference in Subject:** Easy identification in email thread
- **Dynamic Attachments:** Attaches files from comment
- **Salesperson Context:** Includes commenter's seller profile
- **Reply Threading:** "Re:" prefix suggests email conversation

### Flow

```
Comment added to ticket
  ↓
TicketCommentMail created (ticket, comment)
  ↓
Load salesperson from comment.user.seller
  ↓
Generate subject with ticket reference
  ↓
Attach comment files from MediaLibrary
  ↓
Send to ticket assignee/followers
```

---

## 5️⃣ TicketCreatedConfirmationMail

**Location:** `App\Mail\TicketCreatedConfirmationMail`  
**Trigger:** Ticket created (confirmation to submitter)  
**Channels:** Mail only  
**Queue:** Queueable trait enabled  
**Language:** English (support.smtp config)

### Constructor

```php
public function __construct(
    public Ticket $ticket,
    public string $originalSubject,
) {
}
```
- **Parameters:**
  - `$ticket` - Ticket model (required)
  - `$originalSubject` - Original email subject from submitter
- **Purpose:** Preserve original subject line from incoming email

### Methods

#### `envelope(): Envelope`
- **From Address:** Support config address
  ```php
  new Address(
      (string) config('support.smtp.from.address'),
      (string) config('support.smtp.from.name')
  )
  ```
- **Subject:** "Re: [{ticket.formatted_reference}] {originalSubject}"
- **Format:** Reply prefix with ticket reference and original subject
- **Example:** "Re: [#TK-001234] My Ship is broken"

#### `content(): Content`
- **View:** `admin.email-samples.emails-ticket-created`
- **Data Passed:**
  ```php
  [
      'ticket' => $this->ticket,
      'originalSubject' => $this->originalSubject,
  ]
  ```
- **Path:** Located in `admin` view folder (admin panel)

#### `attachments(): array`
- **Returns:** Empty array (no attachments)

### Public Properties

| Property | Type | Purpose |
|----------|------|---------|
| ticket | Ticket | Ticket instance |
| originalSubject | string | Original email subject |

### Data Dependencies

| Field | Source | Purpose |
|-------|--------|---------|
| formatted_reference | $ticket | Formatted ticket ID |
| originalSubject | constructor | Original subject line |
| ticket.description | $ticket | Ticket details |

### Features

- **Subject Preservation:** Keeps original email subject for context
- **Ticket Reference:** Includes auto-generated ticket ID
- **Confirmation:** Confirms ticket was created from email
- **Threading:** "Re:" prefix for email conversation appearance

### Flow

```
Incoming email received → Ticket created
  ↓
Extract original subject
  ↓
Create TicketCreatedConfirmationMail(ticket, originalSubject)
  ↓
Subject: "Re: [#TK-001234] Original Subject"
  ↓
Send confirmation to original sender
```

---

## 📊 Comparison Table

| Feature | LeadVerify | QuoteSent | SystemNotif | TicketComment | TicketCreated |
|---------|-----------|-----------|------------|---------------|---------------|
| Queue | Queueable | Queueable | Queueable | Queueable | Queueable |
| Subject | Static | Dynamic | Dynamic | Dynamic (ref) | Dynamic (ref) |
| View Template | ✓ | ✓ | ✓ | ✓ | ✓ |
| Attachments | None | PDF | None | Yes (media) | None |
| From Address | Default | Default | Config | Config | Config |
| Language | IT | IT | EN | EN | EN |
| Security Token | SHA1 (weak) | None | None | None | None |
| Salesperson | None | ✓ | None | ✓ | None |
| Generic | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Configuration Dependencies

### support.smtp Config
Used by TicketCommentMail and TicketCreatedConfirmationMail:
```php
config('support.smtp.from.address')  // From email address
config('support.smtp.from.name')     // From display name
```

### Routes Required
Used by LeadEmailVerificationMail:
```php
route('lead.verify.email', ['id' => $id, 'hash' => $hash])
```

### Views Required
```
resources/views/emails/lead-email-verification.blade.php
resources/views/emails/quote-sent.blade.php
resources/views/emails/system-notification.blade.php
resources/views/emails/ticket-comment.blade.php
resources/views/admin/email-samples/emails-ticket-created.blade.php
```

---

## 📝 Migration Notes for Base44

### Email Generation Pattern
- **Current:** Mailable classes with Blade views
- **Base44 Approach:** Backend functions with email integration
- **Pattern:**
  ```typescript
  // Send email via integration
  await base44.integrations.Core.SendEmail({
    to: 'customer@example.com',
    subject: 'Your quote #12345',
    body: renderQuoteEmail(quote)  // Template rendering
  });
  ```

### Queue/Async
- **Current:** Queueable trait with Laravel Queue
- **Base44:** Use automations + backend functions
- **Pattern:** Event triggers automation → backend function → SendEmail

### Security Tokens
- **LeadEmailVerificationMail:**
  - Current: SHA1 hash (insecure)
  - Better: Random token + database storage + expiration
  - Base44: Use secure token in backend function

### Attachment Handling
- **Current:** Spatie MediaLibrary on Comment
- **QuoteSentMail:** PDF from local storage
- **Base44:** Store files in cloud (e.g., S3) → include signed URLs

### View Rendering
- **Current:** Blade templates
- **Base44:** TypeScript/HTML templates
- **Pattern:**
  ```typescript
  // Simple email HTML
  const html = `
    <h1>Your Quote #${quote.number}</h1>
    <p>Price: $${quote.total}</p>
  `;
  ```

### Configuration Management
- **Current:** config('support.smtp.*')
- **Base44:** Use environment variables + secrets
- **Pattern:**
  ```typescript
  const fromEmail = Deno.env.get('SUPPORT_EMAIL');
  const fromName = Deno.env.get('SUPPORT_NAME');
  ```

### Event Triggers
- **Current:** Implicit via model events
- **Better:** Explicit automations
- **Pattern:**
  ```
  1. Quote created → entity automation
  2. Triggers: sendQuoteEmail backend function
  3. Function sends via Core.SendEmail
  ```

### Refactoring Steps for Base44

1. **Create backend functions:**
   - sendLeadVerificationEmail(leadId)
   - sendQuoteEmail(quoteId)
   - sendSystemNotification(subject, message, data)
   - sendTicketCommentEmail(ticketId, commentId)
   - sendTicketCreationConfirmation(ticketId)

2. **Move templates to HTML strings**

3. **Create automations:**
   - Entity: Quote.create → sendQuoteEmail
   - Entity: Comment.create → sendTicketCommentEmail
   - Entity: Ticket.create → sendTicketCreationConfirmation

4. **Replace Mailable classes:**
   - No longer needed
   - Logic moves to backend functions

5. **Remove Queueable:**
   - Base44 automations handle async
   - No Laravel Queue needed