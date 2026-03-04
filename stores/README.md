# Stores Package

This package contains state management stores and context providers.

## Purpose
Centralized state management for the application using React Context API or other state management libraries.

## Structure
```
stores/
├── auth.store.tsx         # Authentication state management
└── README.md             # This file
```

## Usage

### Auth Store
```tsx
import { AuthProvider, useAuth } from '@/stores/auth.store';

// Wrap your app with the provider
<AuthProvider>
  <App />
</AuthProvider>

// Use in components
function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  // ...
}
```

## Guidelines
- Keep stores focused on a single domain (auth, user, jobs, etc.)
- Export both the Provider and hook from the same file
- Use TypeScript types from `@/types`
- Use constants from `@/constants`
