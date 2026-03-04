# Google OAuth Setup Guide

## Overview
This application supports Google OAuth login for farmers. Follow these steps to configure it.

## Setup Steps

### 1. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)
8. Click **Create** and copy your Client ID

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Google Client ID:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
   ```

### 3. Restart Development Server

After updating `.env.local`, restart your development server:
```bash
npm run dev
```

## How It Works

### Login Flow

1. User clicks "Sign in with Google" button
2. Google OAuth popup appears
3. User selects their Google account
4. Google returns a credential token
5. Token is sent to backend API at `/api/v1/google-login` with:
   ```json
   {
     "googleToken": "string",
     "roleId": 3
   }
   ```
6. Backend validates the token and returns:
   ```json
   {
     "message": "string",
     "status_code": 0,
     "data": {
       "token": "string",
       "expiresAt": "2026-02-27T08:48:56.714Z",
       "email": "string"
     }
   }
   ```
7. User is redirected to farmer dashboard

### Role IDs

- **Farmer**: roleId = 3
- **Worker**: roleId = 2 (can be added later)
- **Admin**: roleId = 1 (can be added later)

## Components

### GoogleAuthProvider
Location: `components/auth/google-auth-provider.tsx`
- Wraps the entire app in root layout
- Provides Google OAuth context
- Shows warning if Client ID is not configured

### GoogleLoginButton
Location: `components/auth/google-login-button.tsx`
- Reusable Google login button component
- Accepts `roleId` prop to specify user role
- Handles login success/error states
- Automatically redirects on success

## Usage in Pages

### Login Page
```tsx
import { GoogleLoginButton } from "@/components/auth/google-login-button";

// In your component:
<GoogleLoginButton roleId={3} />
```

### Register Page
The Google login button appears only on step 1 of the registration form.

## Troubleshooting

### Button doesn't appear
- Check if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the development server
- Check browser console for errors

### "Invalid Client ID" error
- Verify the Client ID is correct
- Ensure authorized origins are configured in Google Console
- Make sure you're using the correct Client ID (not Client Secret)

### Token verification fails
- Ensure your backend is configured to verify Google tokens
- Check that the API endpoint `/api/v1/google-login` is working
- Verify the roleId is being sent correctly (should be 3 for farmers)

## Security Notes

- Never commit `.env.local` to version control
- Client ID is public and safe to expose in frontend
- Client Secret should NEVER be in frontend code
- Token verification must happen on the backend
