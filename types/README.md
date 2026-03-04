# Types Package

This package contains all TypeScript type definitions and interfaces.

## Purpose
Centralized type definitions to ensure type safety across the application.

## Structure
```
types/
├── index.ts              # Central export point
├── auth.types.ts         # Authentication types
├── common.types.ts       # Common/shared types
└── README.md            # This file
```

## Usage

### Importing Types
```tsx
// Import from the central export
import type { User, ApiResponse, AuthTokens } from '@/types';

// Or import specific type files
import type { User } from '@/types/auth.types';
```

## Guidelines
- Use `type` keyword for type aliases
- Use `interface` for object shapes
- Export all types from `index.ts`
- Group related types in domain-specific files
- Use descriptive names (avoid generic names like `Data` or `Info`)
- Document complex types with JSDoc comments
