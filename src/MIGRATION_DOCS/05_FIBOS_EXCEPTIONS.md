# Fibos Exception Classes

## 📋 Overview

Two custom exception classes for error handling in Fibos services.

---

## 1️⃣ FibosApiException

**Purpose:** Generic exception for Fibos API-related errors.

### Implementation

```php
namespace App\Services\Fibos\Exceptions;

class FibosApiException extends \Exception
{
    public function __construct($message, $code = 0, \Exception $previous = null) {
        $message = $message ?? "Fibos API Exception";
        parent::__construct($message, $code, $previous);
    }
}
```

### Characteristics

- Extends native PHP `Exception`
- Custom constructor with null coalescing for default message
- Supports exception chaining (previous exception)
- Used for SOAP API failures, network errors, invalid responses

### Typical Usage Cases

- SOAP request failures
- API response parsing errors
- Network connectivity issues
- Invalid SOAP envelope responses
- Timeout errors

---

## 2️⃣ ConfigurationException

**Purpose:** Exception for Fibos configuration errors.

### Implementation

```php
namespace App\Services\Fibos\Exceptions;

class ConfigurationException extends \Exception
{
}
```

### Characteristics

- Extends native PHP `Exception`
- Minimal implementation (standard exception)
- Used for missing/invalid configuration

### Typical Usage Cases

- Missing WSDL endpoints in config
- Invalid or missing API credentials
- Missing required settings in `FibosSetting` table
- Invalid configuration values

---

## 🔗 Where They're Used

### FibosApiException
- **FibosApi.php** - When SOAP requests fail
- **FibosContentsApi.php** - When contents API calls fail
- **FibosSyncService.php** - During sync operations
- **FibosContentsService.php** - During content imports

### ConfigurationException
- **FibosApi.php** - Missing/invalid WSDL config
- **FibosService.php** - Invalid cruiseline configuration
- **FibosContentsApi.php** - Missing language-specific config
- **FibosMapsService.php** - Configuration validation

---

## 📝 Migration Notes

### Base44 Approach
- Keep similar custom exception hierarchy
- Consider more specific exceptions:
  - `FibosWsdlException` - SOAP/WSDL specific
  - `FibosAuthenticationException` - API credentials
  - `FibosResponseException` - Invalid/malformed responses

### Error Handling Pattern
- Current: Generic try/catch with logging
- Improved: Specific exception types for different failure modes
- Could add retry logic for transient failures