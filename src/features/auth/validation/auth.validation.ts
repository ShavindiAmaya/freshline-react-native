// Auth validation helpers

import {
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
} from '../types/auth.types';

// Email regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Validate email address
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

// Validate password
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

// Validate full name
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

// Validate confirm password
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

// Validate login form
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

// Validate register form
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
