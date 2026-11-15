import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Session, User } from '@supabase/supabase-js';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';
import {
  LoginFormValues,
  RegisterFormValues,
} from '@/features/auth/types/auth.types';
import {
  signIn,
  signUp,
  signOut,
  getCurrentSession,
  resetPassword,
} from '@/features/auth/services/auth.service';
import { FreshTheme } from '@/constants/freshline-theme';

/**
 * Temporary Authentication Preview Route
 *
 * Route: /auth-preview
 *
 * Integrates Login and Register screens with the shared Supabase authentication
 * service. Provides:
 * - Real email / password sign in with server error presentation
 * - Real registration with user metadata (full_name) and email confirmation handling
 * - Password reset requests with feedback
 * - Authenticated session state preview with real sign out
 */
export default function AuthPreviewRoute() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register'>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Forgot Password modal state
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);

  // Check for existing Supabase session on mount
  useEffect(() => {
    let isMounted = true;

    async function loadActiveSession() {
      try {
        const activeSession = await getCurrentSession();
        if (isMounted && activeSession) {
          setSession(activeSession);
          setUser(activeSession.user);
        }
      } catch {
        // Ignored: user is unauthenticated or credentials pending
      }
    }

    loadActiveSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Login submission
  const handleLogin = async (values: LoginFormValues) => {
    if (isLoading) return;

    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await signIn(values);
      setSession(result.session);
      setUser(result.user);

      const displayName =
        result.user?.user_metadata?.full_name || result.user?.email || 'User';

      Alert.alert(
        'Login Successful',
        `Welcome back, ${displayName}!`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const message = err?.message || 'Invalid login credentials.';
      setLoginError(message);
      Alert.alert('Sign In Failed', message, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegister = async (values: RegisterFormValues) => {
    if (isLoading) return;

    setIsLoading(true);
    setRegisterError(null);

    try {
      const result = await signUp(values);

      if (result.session) {
        setSession(result.session);
        setUser(result.user);
        Alert.alert(
          'Registration Successful',
          `Welcome to FreshLine, ${result.user?.user_metadata?.full_name || 'Member'}!`,
          [{ text: 'OK' }]
        );
      } else {
        // Email confirmation is enabled in Supabase: session is null
        Alert.alert(
          'Verification Required',
          'Account created. Please verify your email.',
          [
            {
              text: 'Go to Login',
              onPress: () => {
                setRegisterError(null);
                setCurrentScreen('login');
              },
            },
          ]
        );
      }
    } catch (err: any) {
      const message = err?.message || 'Registration failed. Please try again.';
      setRegisterError(message);
      Alert.alert('Registration Failed', message, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      await signOut();
      setSession(null);
      setUser(null);
      setLoginError(null);
      setRegisterError(null);
      Alert.alert('Signed Out', 'You have been signed out successfully.', [
        { text: 'OK' },
      ]);
    } catch (err: any) {
      const message = err?.message || 'Failed to sign out.';
      Alert.alert('Sign Out Error', message, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset submission
  const handleResetPasswordSubmit = async () => {
    const trimmed = resetEmail.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Email Required', 'Please enter your email address to receive reset instructions.');
      return;
    }

    if (isResettingPassword) return;

    setIsResettingPassword(true);

    try {
      await resetPassword(trimmed);
      setShowResetModal(false);
      setResetEmail('');
      Alert.alert(
        'Reset Email Sent',
        'If an account exists with this email, password reset instructions have been dispatched.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const message = err?.message || 'Failed to send password reset email.';
      Alert.alert('Reset Password Failed', message, [{ text: 'OK' }]);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePressTerms = () => {
    Alert.alert(
      'Terms of Service',
      'FreshLine Terms of Service preview. Full legal terms will be published at production release.',
      [{ text: 'OK' }]
    );
  };

  const handlePressPrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'FreshLine Privacy Policy preview. User data and inventory items are securely stored with Supabase PostgreSQL.',
      [{ text: 'OK' }]
    );
  };

  // 1. Authenticated Profile View
  if (session && user) {
    return (
      <ProfileScreen
        user={user}
        onSignOut={handleSignOut}
        isLoading={isLoading}
      />
    );
  }

  // 2. Unauthenticated Login / Register Flow
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {currentScreen === 'login' ? (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToRegister={() => {
            setLoginError(null);
            setRegisterError(null);
            setCurrentScreen('register');
          }}
          onForgotPassword={() => setShowResetModal(true)}
          isLoading={isLoading}
          serverError={loginError}
        />
      ) : (
        <RegisterScreen
          onRegister={handleRegister}
          onNavigateToLogin={() => {
            setLoginError(null);
            setRegisterError(null);
            setCurrentScreen('login');
          }}
          onPressTerms={handlePressTerms}
          onPressPrivacy={handlePressPrivacy}
          isLoading={isLoading}
          serverError={registerError}
        />
      )}

      {/* Forgot Password Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowResetModal(false)}>
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered email address to receive password reset instructions.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="you@example.com"
              placeholderTextColor={FreshTheme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={resetEmail}
              onChangeText={setResetEmail}
              editable={!isResettingPassword}
            />

            <View style={styles.modalActionsRow}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowResetModal(false);
                  setResetEmail('');
                }}
                disabled={isResettingPassword}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleResetPasswordSubmit}
                disabled={isResettingPassword}>
                {isResettingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Send Link</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: FreshTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...FreshTheme.shadows.floating,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginBottom: FreshTheme.spacing.md,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.borderLight,
    borderRadius: FreshTheme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: FreshTheme.colors.textPrimary,
    marginBottom: FreshTheme.spacing.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
  },
  modalSubmitButton: {
    backgroundColor: FreshTheme.colors.primary,
  },
  modalSubmitButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
