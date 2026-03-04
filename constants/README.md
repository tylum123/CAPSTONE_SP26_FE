# Constants Package

This package contains application-wide constants and configuration values.

## Purpose
Centralized constants to avoid magic strings/numbers and ensure consistency.

## Structure
```
constants/
├── index.ts              # All constants
└── README.md            # This file
```

## Usage

### Importing Constants
```tsx
import { ROUTES, API_ENDPOINTS, STORAGE_KEYS, ROLES } from '@/constants';

// Use in navigation
router.push(ROUTES.FARMER_DASHBOARD);

// Use in API calls
fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/login`);

// Use in localStorage
localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

// Use for role checks
if (user.role === ROLES.FARMER) { ... }
```

## Available Constants

### ROUTES
Application routing paths for all pages.

### API_ENDPOINTS
API endpoint base paths.

### STORAGE_KEYS
LocalStorage/SessionStorage keys.

### ROLES
User role constants.

### PAGINATION
Default pagination settings.

### DATE_FORMATS
Date formatting patterns.

### STATUS
Application status values.

## Guidelines
- Use `const` with `as const` for immutability
- Use UPPER_SNAKE_CASE for constant names
- Group related constants in objects
- Never hardcode values that appear in constants
