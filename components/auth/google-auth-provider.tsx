"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  // Get client ID from environment variable
  // Use a dummy ID if not set to prevent provider errors
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';

  if (clientId === 'dummy-client-id') {
    console.warn('⚠️ Google Client ID not found. Google login will not work. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.');
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
