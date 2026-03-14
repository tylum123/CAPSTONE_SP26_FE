"use client";

/**
 * Hook to check if Google OAuth is configured
 * Returns true if NEXT_PUBLIC_GOOGLE_CLIENT_ID is set
 */
export function useGoogleOAuthConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return !!clientId && clientId !== 'dummy-client-id';
}
