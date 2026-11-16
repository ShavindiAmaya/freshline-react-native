import type { User } from '@supabase/supabase-js';

/**
 * Authentication Types for FreshLine
 *
 * Defines form values, errors, screen props, and submission payloads
 * for Login and Registration flows. Designed for future Supabase client integration.
 */

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

export interface LoginScreenProps {
  /**
   * Callback fired when login form is submitted with valid inputs.
   */
  onLogin?: (values: LoginFormValues) => void | Promise<void>;

  /**
   * Navigation callback to transition to the Register screen.
   */
  onNavigateToRegister?: () => void;

  /**
   * External loading state (e.g. from async authentication request).
   */
  isLoading?: boolean;

  /**
   * Optional server error message to display at the top of the form.
   */
  serverError?: string | null;

  /**
   * Optional callback for forgot password link.
   */
  onForgotPassword?: () => void;
}

export interface RegisterScreenProps {
  /**
   * Callback fired when registration form is submitted with valid inputs.
   */
  onRegister?: (values: RegisterFormValues) => void | Promise<void>;

  /**
   * Navigation callback to transition to the Login screen.
   */
  onNavigateToLogin?: () => void;

  /**
   * External loading state (e.g. from async registration request).
   */
  isLoading?: boolean;

  /**
   * Optional server error message to display at the top of the form.
   */
  serverError?: string | null;

  /**
   * Optional callback when user taps Terms of Service.
   */
  onPressTerms?: () => void;

  /**
   * Optional callback when user taps Privacy Policy.
   */
  onPressPrivacy?: () => void;
}

export interface ProfileScreenProps {
  /**
   * Authenticated Supabase user object containing metadata, email, and timestamps.
   */
  user: User;

  /**
   * Callback fired when user initiates sign out.
   */
  onSignOut?: () => void | Promise<void>;

  /**
   * Loading state during sign out or background refresh operations.
   */
  isLoading?: boolean;
}

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordFormErrors {
  newPassword?: string;
  confirmPassword?: string;
}


