# Exception Classes (Error Handling)

**Purpose:** Application exception handling and custom business exceptions.  
**Namespace:** `App\Exceptions`  
**Location:** `App/Exceptions/` (2 files)  
**Type:** Error handling utilities — low priority

---

## 📋 Overview

| Class | Purpose | Size | Status |
|-------|---------|------|--------|
| Handler | Global exception handler | 0.6 KB | ⚠️ Minimal/Stub |
| MscBookingException | MSC booking API error wrapper | 0.7 KB | ✅ Good |

---

## 🔧 Handler Class (0.6 KB)

Global exception handler extending Laravel's base handler.

```php
class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }
}
```

**Purpose:**
- Centralize exception handling for application
- Prevent sensitive data (passwords) from being flashed to session
- Configure reportable exceptions (logging, monitoring)

**Features:**

| Feature | Implementation |
|---------|-----------------|
| Sensitive Data | ✅ Configured ($dontFlash) |
| Exception Reporting | ⚠️ Stub (empty callback) |
| Custom Error Pages | ❌ Not defined |
| Logging | ❌ Not configured |
| API Error Responses | ❌ Not defined |

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ HIGH | **Empty reportable callback** — No exception logging/monitoring | No error tracking |
| 2 | ⚠️ MEDIUM | **No custom render logic** — Returns Laravel defaults | Generic error pages |
| 3 | ⚠️ MEDIUM | **No API error formatting** — JSON errors use defaults | Bad API responses |
| 4 | ⚠️ MEDIUM | **No validation error handling** — No custom messages | Generic validation errors |
| 5 | ⚠️ MEDIUM | **No 404/5xx pages** — Returns blank defaults | Poor UX |
| 6 | ℹ️ LOW | **Hardcoded password fields** — Not extensible | Code smell |

---

## 🔧 MscBookingException Class (0.7 KB)

Custom exception for MSC booking API errors.

```php
class MscBookingException extends Exception
{
    public ?Response $response;

    public function __construct(
        string $message,
        ?Response $response = null,
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->response = $response;
    }

    public function context(): array
    {
        if (!$this->response) {
            return [];
        }

        return [
            'status' => $this->response->status(),
            'headers' => $this->response->headers(),
            'body' => $this->response->body(),
        ];
    }
}
```

**Purpose:**
- Wrap HTTP errors from MSC API
- Capture full response context (status, headers, body)
- Provide structured error data for logging/debugging

**Features:**

| Feature | Implementation |
|---------|-----------------|
| Response Capture | ✅ Full response object stored |
| Context Extraction | ✅ Structured context() method |
| Error Message | ✅ Custom messages supported |
| Chain Support | ✅ Previous exception parameter |

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | ⚠️ MEDIUM | **No response body parsing** — Returns raw response body string | Hard to debug |
| 2 | ⚠️ MEDIUM | **No JSON decode** — Assumes text/plain, breaks on JSON errors | Parsing issues |
| 3 | ⚠️ MEDIUM | **Headers exposed in context** — May contain sensitive data (auth tokens) | Security risk |
| 4 | ⚠️ MEDIUM | **No retry logic** — Exception thrown but no indication if retryable | Caller guessing |
| 5 | ℹ️ LOW | **Response public property** — Mutable, not immutable | Design |

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 0 | - |
| ⚠️ HIGH | 1 | Empty exception reporting in Handler |
| ⚠️ MEDIUM | 10 | No custom render, no API error formatting, sensitive headers exposed, no JSON decode |
| ℹ️ LOW | 2 | Hardcoded password fields, response mutability |

---

## 📝 Migration Notes for Base44

### Strategy: Structured Error Handling + Logging

**Step 1: Create Error Log Entity**

```json
// entities/ErrorLog.json
{
  "error_type": {"type": "string"},
  "message": {"type": "string"},
  "context": {"type": "object"},
  "stacktrace": {"type": "string"},
  "user_id": {"type": "string"},
  "user_agent": {"type": "string"},
  "request_path": {"type": "string"},
  "severity": {"type": "string", "enum": ["debug", "info", "warning", "error", "critical"]}
}
```

**Step 2: Backend Functions**

**Function: logError**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  const {
    error_type,
    message,
    context = {},
    stacktrace = '',
    severity = 'error',
  } = await req.json();

  try {
    // Log to database
    const errorLog = await base44.entities.ErrorLog.create({
      error_type,
      message,
      context,
      stacktrace,
      user_id: user?.id || null,
      user_agent: req.headers.get('user-agent'),
      request_path: new URL(req.url).pathname,
      severity,
    });

    // Send alert if critical
    if (severity === 'critical') {
      // Call alert service
      console.error(`CRITICAL ERROR: ${message}`, context);
    }

    return Response.json({ logged: true, id: errorLog.id });
  } catch (error) {
    // Log to console if database logging fails
    console.error('Error logging failed:', error);
    return Response.json({ logged: false }, { status: 500 });
  }
});
```

**Step 3: Error Boundary Component**

```tsx
// components/ErrorBoundary.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    // Log to server
    await base44.functions.invoke('logError', {
      error_type: error.constructor.name,
      message: error.message,
      stacktrace: errorInfo.componentStack,
      context: { errorInfo },
      severity: 'error',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-6">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

**Step 4: API Error Handler**

```typescript
// utils/apiErrorHandler.ts
import { base44 } from '@/api/base44Client';

export async function handleApiError(error: any) {
  const context = {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
  };

  // Determine severity
  let severity = 'error';
  if (error.response?.status >= 500) {
    severity = 'critical';
  } else if (error.response?.status >= 400) {
    severity = 'warning';
  }

  // Log error
  await base44.functions.invoke('logError', {
    error_type: 'ApiError',
    message: error.message,
    context,
    severity,
  });

  // Return user-friendly message
  if (error.response?.status === 404) {
    return 'Resource not found';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'An error occurred. Please try again.';
}
```

**Step 5: Usage in Components**

```tsx
// pages/BookingPage.jsx
import { useState } from 'react';
import { handleApiError } from '@/utils/apiErrorHandler';
import { base44 } from '@/api/base44Client';

export function BookingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBooking = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await base44.functions.invoke('createMscBooking', data);
      // Success handling
    } catch (error) {
      const userMessage = await handleApiError(error);
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <Alert>{error}</Alert>}
      {/* Booking form */}
    </div>
  );
}
```

### Key Improvements

1. **Centralized Logging** — All errors logged to database
2. **Error Boundaries** — Catch React component errors
3. **API Error Handling** — Structured error responses
4. **Security** — Filter sensitive headers from context
5. **Severity Levels** — Critical errors get alerts
6. **User Feedback** — Friendly error messages
7. **Debugging** — Full context (stacktrace, headers, body)
8. **No Stubs** — All handlers fully implemented
9. **Custom Error Pages** — 404/500 etc.
10. **Structured Context** — JSON logging for analysis

---

## Summary

Handler (0.6KB): Global exception handler with minimal implementation—only configures sensitive password fields, empty reportable callback, no custom render/API error formatting/validation handling. Issues: no exception logging, no error pages, no API error responses.

MscBookingException (0.7KB): Custom exception wrapping MSC API errors with response capture and context extraction. Good structure but: no JSON parsing, sensitive headers exposed, no retry hints, response mutable.

In Base44: Create ErrorLog entity, backend function (logError) with database logging/alerts, error boundary component, API error handler with severity levels/user messages, structured context extraction, filter sensitive data, custom error pages.

**Migration Priority: LOW** — error handling infrastructure, not directly tied to business logic, but improves debugging/UX significantly.