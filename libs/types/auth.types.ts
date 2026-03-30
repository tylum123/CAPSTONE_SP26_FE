export interface LoginRequest {
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface AuthData {
  token: string;
  expiresAt: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  email: string;
  role: string;
  isVerified: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  roleId: number;
}

export interface VerifyEmail {
  email: string;
  otp: string;
}

export interface ResendVerificationEmail {
  email: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  googleToken: string;
  roleId: number;
}


export interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (user: any, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: any) => void;
}
