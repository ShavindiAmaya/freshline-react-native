import type { User } from '@supabase/supabase-js';

// Auth types

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type LoginFormErrors = {
  [K in keyof LoginFormValues]?: string;
};

export type RegisterFormErrors = {
  [K in keyof RegisterFormValues]?: string;
};

// Login Screen props
export interface LoginScreenProps {
  onLogin?: (values: LoginFormValues) => void | Promise<void>;
  onNavigateToRegister?: () => void;
  isLoading?: boolean;
  serverError?: string | null;
  onForgotPassword?: () => void;
}

// Register Screen props
export interface RegisterScreenProps {
  onRegister?: (values: RegisterFormValues) => void | Promise<void>;
  onNavigateToLogin?: () => void;
  isLoading?: boolean;
  serverError?: string | null;
  onPressTerms?: () => void;
  onPressPrivacy?: () => void;
}

// Profile Screen props
export interface ProfileScreenProps {
  user: User;
  onSignOut?: () => void | Promise<void>;
  isLoading?: boolean;
}

// Password reset types
export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordFormErrors {
  newPassword?: string;
  confirmPassword?: string;
}
