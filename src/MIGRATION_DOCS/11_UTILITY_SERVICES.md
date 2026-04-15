# Utility Services

**Purpose:** Support services for UI feedback, data transformation, and common operations.

---

## 1️⃣ AlertService

**Location:** `App\Services\Alerts\AlertService`  
**Dependencies:** RealRashid\SweetAlert (SweetAlert2 wrapper)  
**Purpose:** Unified toast notification system for user feedback.

### Configuration

- Uses SweetAlert2 library (Facade pattern)
- Toast notifications (non-modal popups)
- Positioned at top of screen
- Auto-close after 3000ms with progress bar
- Italian message strings (locale-specific)

### Public Methods

#### `alertOperazioneEseguita($route, $parameters = null): RedirectResponse`
- **Message:** "Operazione eseguita con successo" (Operation completed successfully)
- **Type:** Success (green)
- **Behavior:** Redirect to named route after showing toast
- **Use case:** Create/update/delete operations completed

#### `alertRelazioniEsistenti($route, $parameters = null): RedirectResponse`
- **Message:** "Operazione annullata, ci sono relazioni esistenti" (Operation cancelled, existing relations found)
- **Type:** Info (blue)
- **Behavior:** Redirect to named route after showing toast
- **Use case:** Delete blocked by foreign keys

#### `alertBackWithError($message): RedirectResponse`
- **Message:** Custom message (passed as parameter)
- **Type:** Error (red)
- **Behavior:** Redirect back to previous page, preserve form input
- **Use case:** Validation errors, operation failures

### Private Methods

#### `routeRedirect($route, $parameters = null): RedirectResponse`
- Helper for route-based redirects
- Called by success/info alerts
- Centralizes redirect logic

### Usage Pattern

```php
// In controller
try {
    $model->delete();
    return app(AlertService::class)->alertOperazioneEseguita('products.index');
} catch (\Exception $e) {
    return app(AlertService::class)->alertBackWithError($e->getMessage());
}
```

### SweetAlert2 Configuration

```
Position:       top
Duration:       3000ms
Progress Bar:   enabled
Modal:          no (toast mode)
```

### Note on Localization

- All messages are hardcoded in Italian
- Not suitable for multi-language apps
- Should use translation keys (Laravel `trans()`) in migration

---

## 📝 Migration Notes for Base44

### UI Feedback Pattern
- **Current:** Server-side toast via SweetAlert2 Facade
- **Base44 Approach:** Client-side feedback (Sonner, React Toast, or built-in)
- **Decision:** Use React-based toast (already installed: react-hot-toast, sonner)

### Message Localization
- **Current:** Hardcoded Italian
- **Better:** Use Laravel translation files with `trans()` helper
- **Base44:** Define messages in frontend code with i18n support

### Redirect Handling
- **Current:** Server-side redirect with Alert
- **Base44:** Return JSON response, handle UI on frontend
- **Pattern:** Backend returns status → Frontend shows toast + redirects

### Implementation for Base44

```typescript
// Response pattern
return response.json({ 
  success: true, 
  message: 'Operation completed',
  redirect: '/products'
});

// Frontend handling
const response = await fetch('/api/products', { method: 'DELETE' });
if (response.ok) {
  toast.success('Operation completed');
  navigate('/products');
}
```

### Refactoring Priority

- Extract to API response layer
- Use translation keys (not hardcoded strings)
- Return JSON from controllers (not redirects)
- Let frontend handle toast + navigation