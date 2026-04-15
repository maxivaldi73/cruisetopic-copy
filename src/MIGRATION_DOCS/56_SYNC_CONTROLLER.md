# Sync Controller

**Purpose:** Trigger Fibos data synchronization job.  
**Namespace:** `App\Http\Controllers\Admin\Sync`  
**Location:** `App/Http/Controllers/Admin/Sync/SyncController.php`  
**Total Controllers:** 1  
**Type:** Async job dispatcher — low priority

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| File Size | 249 bytes (stub) |
| Methods | 1 (sync) |
| Auth | Likely admin-only via middleware |
| Purpose | Dispatch Fibos data sync job |
| Queue | 'default' |

---

## 🔧 Controller Details

### SyncController

**File:** `SyncController.php`

**Purpose:** Minimal wrapper to dispatch asynchronous Fibos synchronization job.

```php
public function sync() {
    SyncFibosJob::dispatch()->onQueue('default');
}
```

| Aspect | Detail |
|--------|--------|
| Method | sync() |
| Route (inferred) | `GET /admin/sync` or `POST /admin/sync` |
| Logic | Dispatch job to queue |
| Response | None (void) |
| Error Handling | None |

---

## ⚠️ Issues & Concerns

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 HIGH | **No Response** — sync() dispatches but returns nothing (user doesn't know if job queued) | UI hangs, no feedback |
| 2 | ⚠️ HIGH | **No Error Handling** — if job fails to queue, exception not caught or reported | Silent failure |
| 3 | ⚠️ HIGH | **No Authorization** — no gate/permission checks visible (assumed via middleware) | Security risk if misconfigured |
| 4 | ⚠️ MEDIUM | **No Job Monitoring** — doesn't return job ID or status | Can't track progress |
| 5 | ⚠️ MEDIUM | **No Rate Limiting** — can be triggered repeatedly, queuing duplicate jobs | Performance issue |
| 6 | ⚠️ MEDIUM | **Hardcoded Queue** — queue name hardcoded to 'default', not configurable | Inflexible |
| 7 | ℹ️ LOW | **Minimal Class** — only 1 method, could be inlined into another controller | Code smell |
| 8 | ℹ️ LOW | **No Documentation** — no docblocks or comments | Confusing for developers |

---

## 📝 Migration Notes for Base44

### Current Architecture

```
GET /admin/sync
  → SyncController::sync()
  → SyncFibosJob::dispatch()
  → Queue (default)
  → Job executes asynchronously
  → No feedback to user
```

### Base44 Approach: Backend Function + Automation

**Step 1: Create Backend Function**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { cruiselineId } = await req.json();

    if (!cruiselineId) {
      return Response.json({ error: 'cruiselineId required' }, { status: 400 });
    }

    // Trigger async job (via automation or manual dispatch)
    const jobId = crypto.randomUUID();
    
    // Store job status in database for tracking
    await base44.asServiceRole.entities.SyncJob.create({
      id: jobId,
      cruiseline_id: cruiselineId,
      status: 'queued',
      started_at: new Date().toISOString(),
    });

    // Invoke async function via automation or service
    await base44.asServiceRole.functions.invoke('processFibosSync', {
      cruiselineId,
      jobId,
    });

    return Response.json({
      success: true,
      jobId,
      message: `Fibos sync queued (job ${jobId})`,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
```

**Step 2: Create Async Job Function**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { cruiselineId, jobId } = await req.json();

  try {
    // Update job status
    await base44.asServiceRole.entities.SyncJob.update(jobId, {
      status: 'running',
    });

    // Actual sync logic here
    const result = await syncFibosData(cruiselineId);

    // Update job status with result
    await base44.asServiceRole.entities.SyncJob.update(jobId, {
      status: 'completed',
      result_count: result.count,
      completed_at: new Date().toISOString(),
    });

    return Response.json({ success: true, result });
  } catch (error) {
    // Update job status with error
    await base44.asServiceRole.entities.SyncJob.update(jobId, {
      status: 'failed',
      error_message: error.message,
      failed_at: new Date().toISOString(),
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function syncFibosData(cruiselineId) {
  // Implement Fibos sync logic
  // ...
  return { count: 100 };
}
```

**Step 3: Create React Component**

```tsx
// pages/admin/FibosSyncPage.jsx
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { usePolling } from '@/hooks/usePolling';

export function FibosSyncPage() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Poll job status every 2 seconds
  usePolling(
    () => base44.functions.invoke('getJobStatus', { jobId }),
    2000,
    !!jobId && status !== 'completed' && status !== 'failed'
  );

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('triggerFibosSync', {
        cruiselineId: 1,
      });
      setJobId(res.data.jobId);
      setStatus('queued');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fibos Synchronization</h1>

      <Button onClick={handleSync} disabled={loading || !!jobId}>
        {loading ? 'Starting...' : 'Start Sync'}
      </Button>

      {jobId && (
        <div className="p-4 border rounded">
          <p className="text-sm">Job ID: {jobId}</p>
          <p className="text-sm">Status: {status}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create Automation (Optional)**

If you want scheduled syncs:

```typescript
// Create automation in Base44
{
  automation_type: "scheduled",
  name: "Daily Fibos Sync",
  function_name: "processFibosSync",
  repeat_interval: 1,
  repeat_unit: "days",
  start_time: "02:00" // 2am daily
}
```

### Entities Required

```json
// entities/SyncJob.json
{
  "cruiseline_id": {"type": "string"},
  "status": {"type": "string", "enum": ["queued", "running", "completed", "failed"]},
  "started_at": {"type": "string", "format": "date-time"},
  "completed_at": {"type": "string", "format": "date-time"},
  "failed_at": {"type": "string", "format": "date-time"},
  "result_count": {"type": "integer"},
  "error_message": {"type": "string"}
}
```

### Key Improvements

1. **User Feedback** — Returns job ID so user can track progress
2. **Error Handling** — Catches and reports errors
3. **Job Tracking** — Store sync jobs in database for history
4. **Status Polling** — Frontend can poll job status
5. **Authorization** — Enforces admin-only access
6. **Rate Limiting** — Can add throttling per cruiseline
7. **Scheduled Syncs** — Use Base44 automations for recurring tasks
8. **Audit Trail** — Log all sync attempts and results

---

## Summary

Minimal SyncController with single sync() method that dispatches SyncFibosJob. No response, error handling, or authorization checks. In Base44, replace with backend function returning job ID, add job tracking entity, implement status polling UI, and optionally use automations for scheduled syncs.

**Migration Priority: LOW** — straightforward 1-to-1 conversion to backend function.