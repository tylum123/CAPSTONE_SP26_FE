"use client";

import { GoogleLogin } from '@react-oauth/google';
import { authService } from '@/libs/api/services/auth.service';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { handleAuthError } from '@/libs/utils/error-handler';
import { useAuth } from '@/stores/auth.store';

interface GoogleLoginButtonProps {
  roleId: number;
  showDivider?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function GoogleLoginButton({ roleId, showDivider = false, onSuccess, onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if Google Client ID is configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    setIsConfigured(!!clientId && clientId !== 'dummy-client-id');
  }, []);

  // If Google OAuth is not configured, don't render anything
  if (!isConfigured) {
    return null;
  }

  const normalizeRole = (role: string | undefined): "admin" | "farmer" | "worker" | null => {
    const normalized = String(role || '').trim().toLowerCase();

    if (normalized === 'admin') return 'admin';
    if (normalized === 'farmer') return 'farmer';
    if (normalized === 'worker') return 'worker';

    return null;
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('Không nhận được thông tin từ Google');
      }

      const response = await authService.googleLogin(
        credentialResponse.credential,
        roleId
      );

      if (response.status_code === 200 || response.status_code === 0) {
        // Extract user data and tokens from response
        const userData = response.data;
        const accessToken = userData.token || '';
        const refreshToken = userData.refresh_token || '';
        const role = normalizeRole(userData.role);

        if (!role) {
          toast({
            title: "Lỗi",
            description: "Không xác định được vai trò tài khoản",
            variant: "destructive",
          });
          onError?.(new Error('Unknown role'));
          return;
        }

        if (role === 'worker') {
          toast({
            title: "Thông báo",
            description: "Vui lòng chuyển sang ứng dụng điện thoại AgroTemp nếu bạn là người tìm việc.",
            variant: "destructive",
          });

          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          onError?.(new Error('Worker role is mobile-only'));
          return;
        }
        
        // Create user object for auth context
        const user = {
          id: userData.id || '',
          email: userData.email || '',
          fullName: userData.fullName || '',
          role,
        };

        // Update auth context
        login(user, accessToken, refreshToken);

        toast({
          title: "Thành công",
          description: response.message || "Đăng nhập thành công",
        });
        
        onSuccess?.();
        router.push(role === 'admin' ? '/admin' : '/farmer/dashboard');
      } else {
        toast({
          title: "Lỗi",
          description: handleAuthError({ response: { data: response } }),
          variant: "destructive",
        });
        onError?.(response);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: handleAuthError(error),
        variant: "destructive",
      });
      onError?.(error);
    }
  };

  return (
    <>
      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Hoặc
            </span>
          </div>
        </div>
      )}
      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            toast({
              title: "Lỗi",
              description: "Đăng nhập Google thất bại. Vui lòng thử lại",
              variant: "destructive",
            });
            onError?.(new Error('Google login failed'));
          }}
          theme="outline"
          size="large"
          text="continue_with"
        />
      </div>
    </>
  );
}
