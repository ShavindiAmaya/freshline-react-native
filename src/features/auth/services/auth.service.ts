
import { supabase } from '@/lib/supabase';
import type {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js';
import type {
  LoginFormValues,
  RegisterFormValues,
} from '../types/auth.types';

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  isEmailConfirmationRequired: boolean;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
}

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

//  Registers a new user with email and password

export async function signUp(values: RegisterFormValues): Promise<SignUpResult> {
  const normalizedEmail = values.email.trim().toLowerCase();
  const trimmedFullName = values.fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: values.password,
    options: {
      data: {
        full_name: trimmedFullName,
        display_name: trimmedFullName,
      },
    },
  });

  if (error) {
    console.log('Signup Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    throw error;
  }

  console.log('Signup request successful');

  return {
    user: data.user,
    session: data.session,
    isEmailConfirmationRequired: !data.session,
  };
}


//  Signs in an existing user with email and password.

export async function signIn(values: LoginFormValues): Promise<SignInResult> {
  const normalizedEmail = values.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: values.password,
  });

  if (error) {
    console.log(error.message);
    throw error;
  }

  console.log('Login successful');

  return {
    user: data.user,
    session: data.session,
  };
}


//  Signs out the currently authenticated user.

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error.message);
    throw error;
  }

  console.log('Logout successful');
}

//  Retrieves the current active Supabase session

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session ?? null;
}

//  Retrieves the currently authenticated Supabase user

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user ?? null;
}


//  Subscribes to Supabase authentication state transitions

export function subscribeToAuthChanges(
  callback: AuthStateChangeCallback
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => {
    subscription.unsubscribe();
  };
}


//  Requests a password reset email for the given email address.

export async function resetPassword(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: 'http://localhost:8081/auth-reset-password',
  });

  if (error) {
    throw error;
  }
}


//  Updates the password for the currently authenticated user.

export async function updatePassword(newPassword: string): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data.user;
}


//  Consolidated Authentication Service namespace.

export const authService = {
  signUp,
  signIn,
  signOut,
  getCurrentSession,
  getCurrentUser,
  subscribeToAuthChanges,
  resetPassword,
  updatePassword,
};
