# API Configuration

This directory contains all API-related configurations and services for the AgroTemp application.

## Structure

```
lib/api/
├── axios-instance.ts      # Configured axios instance with interceptors
├── config.ts             # API configuration and endpoints
├── types.ts              # TypeScript types for API requests/responses
├── services/             # API service modules
│   ├── auth.service.ts   # Authentication services
│   ├── user.service.ts   # User profile services
│   ├── farmer.service.ts # Farmer portal services
│   ├── worker.service.ts # Worker portal services
│   ├── admin.service.ts  # Admin portal services
│   ├── common.service.ts # Common services (notifications, messages, upload)
│   └── index.ts          # Export all services
├── index.ts              # Main export file
└── README.md             # This file
```

## Usage

### Basic Example

```typescript
import { authService } from '@/lib/api';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123',
});

// Store tokens
localStorage.setItem('access_token', response.data.accessToken);
localStorage.setItem('refresh_token', response.data.refreshToken);
```

### Using Services

```typescript
import { farmerService, workerService } from '@/lib/api';

// Farmer: Get all jobs
const jobs = await farmerService.getJobs({ page: 1, limit: 10 });

// Worker: Search jobs
const searchResults = await workerService.searchJobs({
  keyword: 'harvest',
  location: 'Can Tho',
  minSalary: 100000,
});

// Worker: Apply for a job
await workerService.applyJob(jobId);
```

### Error Handling

```typescript
import { authService } from '@/lib/api';
import { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api';

try {
  await authService.login(credentials);
} catch (error) {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    console.error(apiError.message);
    // Handle specific error
  }
}
```

### Custom Axios Instance

If you need to make a custom request not covered by the services:

```typescript
import { axiosInstance } from '@/lib/api';

const response = await axiosInstance.get('/custom-endpoint', {
  params: { key: 'value' },
});
```

## Environment Variables

Configure these in your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Features

- **Automatic token management**: Access tokens are automatically added to requests
- **Token refresh**: Automatically refreshes expired tokens
- **Type safety**: Full TypeScript support with typed requests and responses
- **Error handling**: Consistent error handling across all services
- **Request/Response interceptors**: Handles authentication and error responses globally

## Adding New Endpoints

1. Add endpoint to `config.ts`:
```typescript
export const API_ENDPOINTS = {
  // ...existing endpoints
  NEW_FEATURE: {
    LIST: '/new-feature',
    DETAIL: (id: string) => `/new-feature/${id}`,
  },
};
```

2. Add types to `types.ts`:
```typescript
export interface NewFeature {
  id: string;
  name: string;
  // ...other fields
}
```

3. Create service in `services/new-feature.service.ts`:
```typescript
import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type { ApiResponse, NewFeature } from '../types';

export const newFeatureService = {
  getList: async (): Promise<ApiResponse<NewFeature[]>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.NEW_FEATURE.LIST);
    return response.data;
  },
};
```

4. Export from `services/index.ts`:
```typescript
export { newFeatureService } from './new-feature.service';
```

## Best Practices

- Always use the service functions instead of calling axios directly
- Handle errors appropriately in your components
- Store sensitive tokens securely (consider using httpOnly cookies in production)
- Keep types up to date with backend API changes
- Use environment variables for configuration
