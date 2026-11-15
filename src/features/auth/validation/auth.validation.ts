/**
 * Authentication Validation Utilities for FreshLine
 *
 * Provides pure validation functions and form validation runners
 * with clear, user-friendly error messages.
 */

import {
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
} from '../types/auth.types';

// RFC 5322 compliant regex pattern for standard email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates an email address.
 * @returns Error string if invalid, or null if valid.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
}

/**
 * Validates a password. Minimum 6 characters as required by Supabase auth.
 * @returns Error string if invalid, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

/**
 * Validates a user's full name.
 * @returns Error string if invalid, or null if valid.
 */
export function validateFullName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return 'Full name is required.';
  }
  if (trimmed.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  return null;
}

/**
 * Validates that confirmPassword matches password.
 * @returns Error string if invalid, or null if valid.
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

/**
 * Validates the entire Login form.
 */
export function validateLoginForm(values: LoginFormValues): {
  isValid: boolean;
  errors: LoginFormErrors;
} {
  const errors: LoginFormErrors = {};

  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the entire Register form.
 */
export function validateRegisterForm(values: RegisterFormValues): {
  isValid: boolean;
  errors: RegisterFormErrors;
} {
  const errors: RegisterFormErrors = {};

  const nameError = validateFullName(values.fullName);
  if (nameError) {
    errors.fullName = nameError;
  }

  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  const confirmError = validateConfirmPassword(
    values.password,
    values.confirmPassword
  );
  if (confirmError) {
    errors.confirmPassword = confirmError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

