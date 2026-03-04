# Project Layer Architecture

This document describes the layered architecture of the CAPSTONE_SP25_FE project.

## 📐 Architecture Overview

The project follows a **clean layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│         Application Layer                   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │    Presentation Layer                 │ │
│  ├───────────────┬───────────────────────┤ │
│  │   app/        │   components/         │ │
│  └───────────────┴───────────────────────┘ │
│              ↓ depends on                  │
│  ┌───────────────────────────────────────┐ │
│  │    Business Logic Layer               │ │
│  ├───────────────┬───────────────────────┤ │
│  │   hooks/      │   utils/              │ │
│  └───────────────┴───────────────────────┘ │
│              ↓ depends on                  │
│  ┌───────────────────────────────────────┐ │
│  │    Business Logic Layer (Core)        │ │
│  ├─────────┬────────┬──────────┬─────────┤ │
│  │ stores/ │ libs/  │constants/│ types/  │ │
│  └─────────┴────────┴──────────┴─────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │    Assets Layer                       │ │
│  ├───────────────────────────────────────┤ │
│  │   public/                             │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 📦 Package Structure

### 🎨 Presentation Layer

#### `app/`
- **Purpose**: Next.js App Router pages and layouts
- **Contains**: Route components, page components, layouts
- **Imports from**: components/, hooks/, stores/, types, constants
- **Examples**: [app/auth/login/page.tsx](app/auth/login/page.tsx), [app/layout.tsx](app/layout.tsx)

#### `components/`
- **Purpose**: Reusable React components
- **Contains**: UI components, feature components, domain components
- **Subdirectories**:
  - `ui/` - shadcn/ui components
  - `landing/` - Landing page sections
  - `farmer/` - Farmer-specific components
  - `worker/` - Worker-specific components
  - `admin/` - Admin-specific components
  - `auth/` - Authentication components
- **Imports from**: hooks/, utils/, libs/, types, constants
- **Examples**: [components/ui/button.tsx](components/ui/button.tsx)

### ⚙️ Business Logic Layer

#### `hooks/`
- **Purpose**: Custom React hooks
- **Contains**: Reusable logic hooks
- **Imports from**: stores/, libs/, types, constants
- **Examples**: [hooks/use-auth.ts](hooks/use-auth.ts), [hooks/use-toast.ts](hooks/use-toast.ts)
- **Documentation**: See individual hook files

#### `utils/`
- **Purpose**: Utility functions (if exists separately from libs)
- **Contains**: Helper functions, formatters
- **Imports from**: types, constants
- **Examples**: String manipulation, date formatting

### 💾 Business Logic Layer (Core)

#### `stores/`
- **Purpose**: State management (Context API, Zustand, Redux, etc.)
- **Contains**: Application state and state management logic
- **Imports from**: types, constants
- **Examples**: [stores/auth.store.tsx](stores/auth.store.tsx)
- **Documentation**: [stores/README.md](stores/README.md)

#### `libs/`
- **Purpose**: Core libraries and API services
- **Contains**: 
  - API clients and configurations
  - Service layers for API communication
  - Core business logic utilities
- **Subdirectories**:
  - `api/` - API services and configurations
  - `utils/` - Utility functions
- **Imports from**: types, constants
- **Examples**: [libs/api/services/auth.service.ts](libs/api/services/auth.service.ts)

#### `constants/`
- **Purpose**: Application-wide constants
- **Contains**: Routes, API endpoints, storage keys, enums
- **Imports from**: None (leaf package)
- **Examples**: ROUTES, API_ENDPOINTS, ROLES, STATUS
- **Documentation**: [constants/README.md](constants/README.md)

#### `types/`
- **Purpose**: TypeScript type definitions
- **Contains**: Interfaces, types, and type utilities
- **Imports from**: None (leaf package)
- **Examples**: User, ApiResponse, AuthTokens
- **Documentation**: [types/README.md](types/README.md)

### 📁 Assets Layer

#### `public/`
- **Purpose**: Static assets
- **Contains**: Images, fonts, icons, static files
- **Accessed via**: `/` path in the application

## 🔄 Dependency Flow Rules

### ✅ Allowed Dependencies

```
Presentation → Business Logic → Core Business Logic → Assets
     ↓              ↓                   ↓
   hooks/        stores/           (no deps)
   utils/         libs/
              constants/
                types/
```

### ❌ Forbidden Dependencies

- Core packages (`types/`, `constants/`) **cannot** import from anywhere
- Business logic **cannot** import from presentation
- Lower layers **cannot** import from upper layers

## 📝 Import Path Aliases

Configured in [tsconfig.json](tsconfig.json):

```typescript
{
  "@/*": "./*",                    // Root
  "@/components/*": "./components/*",
  "@/app/*": "./app/*",
  "@/libs/*": "./libs/*",          // Changed from @/lib
  "@/hooks/*": "./hooks/*",
  "@/utils/*": "./utils/*",
  "@/stores/*": "./stores/*",      // New
  "@/constants/*": "./constants/*", // New
  "@/types/*": "./types/*",        // New
  "@/public/*": "./public/*",
  "@/styles/*": "./styles/*"
}
```

## 🎯 Usage Examples

### Importing Types
```typescript
import type { User, ApiResponse } from '@/types';
```

### Importing Constants
```typescript
import { ROUTES, STORAGE_KEYS, ROLES } from '@/constants';
```

### Using Stores
```typescript
import { useAuth } from '@/stores/auth.store';
```

### Importing Services
```typescript
import { authService } from '@/libs/api/services/auth.service';
```

### Importing Components
```typescript
import { Button } from '@/components/ui/button';
```

## 🚀 Benefits

1. **Clear Separation of Concerns**: Each layer has a specific responsibility
2. **Type Safety**: Centralized type definitions
3. **Maintainability**: Easy to locate and update code
4. **Scalability**: New features follow consistent patterns
5. **Testability**: Isolated layers are easier to test
6. **Reusability**: Shared code in appropriate layers

## 📚 Further Reading

- [Next.js Project Structure](https://nextjs.org/docs/app/building-your-application/routing)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

Last Updated: March 4, 2026
