import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FreshTheme } from '@/constants/freshline-theme';
import { AuthButton } from '@/features/auth/components/AuthButton';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { signOut, updatePassword } from '@/features/auth/services/auth.service';
import {
  validateConfirmPassword,
  validatePassword,
} from '@/features/auth/validation/auth.validation';
import { supabase } from '@/lib/supabase';

type VerificationStatus = 'verifying' | 'ready' | 'error';

/**
 * FreshLine Password Recovery Screen
 *
 * Route: /auth-reset-password
 *
 * Handles:
 * 1. Extraction of PKCE authorization code from Expo Router query parameters.
 * 2. Exchange of code for a Supabase session via supabase.auth.exchangeCodeForSession(code).
 * 3. Graceful handling of missing, expired, and invalid reset codes.
 * 4. Password validation (min 6 characters, matching confirmation).
 * 5. Password update via updatePassword (supabase.auth.updateUser).
 * 6. Success confirmation and return to Login navigation.
 */
export default function AuthResetPasswordRoute() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>();

  // Extract raw query values safely across array/string representations
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const rawError = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description || (Array.isArray(params.error) ? params.error[0] : params.error);

  // Fallback for Web window.location search in case cold-start arrives before router hydration
  const getWebParam = (key: string): string | undefined => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get(key) || undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const code = rawCode || getWebParam('code');
  const urlError = rawError || getWebParam('error_description') || getWebParam('error');

  // Verification state machine
  const exchangeAttemptedRef = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [formServerError, setFormServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Exchange PKCE authorization code for session on mount
  useEffect(() => {
    let isMounted = true;

    async function verifyAndExchangeCode() {
      if (exchangeAttemptedRef.current) return;
      exchangeAttemptedRef.current = true;

      // Handle errors sent in URL query parameters (e.g. otp_expired)
      if (urlError) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            'This password reset link is invalid or has expired. Please request a new reset email.'
          );
        }
        return;
      }

      // Handle missing code
      if (!code) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            'No authorization code found in the reset link. Please open the complete link sent to your email.'
          );
        }
        return;
      }

      // Perform PKCE code exchange with the existing shared Supabase client
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(
              'This password reset link is expired or has already been used. Please request a new one.'
            );
          }
          return;
        }

        if (isMounted) {
          setStatus('ready');
          setErrorMessage(null);
        }
      } catch {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            'Unable to verify your reset link. Please check your connection and try again.'
          );
        }
      }
    }

    verifyAndExchangeCode();

    return () => {
      isMounted = false;
    };
  }, [code, urlError]);

  // Handle Return to Login
  const handleReturnToLogin = async () => {
    try {
      await signOut();
    } catch {
      // Ignored: proceed with navigation regardless
    }
    router.replace('/auth-preview');
  };

  // Handle Password Update submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate inputs
    const pwdErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(newPassword, confirmPassword);

    setNewPasswordError(pwdErr);
    setConfirmPasswordError(confirmErr);
    setFormServerError(null);

    if (pwdErr || confirmErr) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err?.message || 'Failed to update your password. Please try again.';
      setFormServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            {/* Brand Header */}
            <View style={styles.brandHeader}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>🌱</Text>
              </View>
              <Text style={styles.brandTitle}>FreshLine</Text>
              <Text style={styles.brandTagline}>Track Freshness. Reduce Waste.</Text>
            </View>

            {/* STATE 1: Code Verifying / Exchanging */}
            {status === 'verifying' && (
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <ActivityIndicator size="large" color={FreshTheme.colors.primary} />
                </View>
                <Text style={styles.cardTitle}>Verifying Reset Link</Text>
                <Text style={styles.cardSubtitle}>
                  Please wait while we verify your authorization link with Supabase...
                </Text>
              </View>
            )}

            {/* STATE 2: Error (Missing, Expired, or Invalid Code) */}
            {status === 'error' && (
              <View style={styles.card}>
                <View style={[styles.iconCircle, styles.iconCircleWarning]}>
                  <Text style={styles.iconEmoji}>⚠️</Text>
                </View>
                <Text style={styles.cardTitle}>Reset Link Invalid</Text>
                <Text style={styles.cardSubtitle}>
                  {errorMessage ||
                    'This password reset link is invalid or has expired. Please request a new one.'}
                </Text>

                <AuthButton
                  title="Return to Login"
                  onPress={handleReturnToLogin}
                  style={styles.actionButton}
                />
              </View>
            )}

            {/* STATE 3: Success Screen */}
            {status === 'ready' && isSuccess && (
              <View style={styles.card}>
                <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                  <Text style={styles.iconEmoji}>🎉</Text>
                </View>
                <Text style={styles.cardTitle}>Password Updated!</Text>
                <Text style={styles.cardSubtitle}>
                  Your password has been changed successfully. You can now sign in to FreshLine with your new password.
                </Text>

                <AuthButton
                  title="Return to Login"
                  onPress={handleReturnToLogin}
                  style={styles.actionButton}
                />
              </View>
            )}

            {/* STATE 4: Ready - Show Password Reset Form */}
            {status === 'ready' && !isSuccess && (
              <View style={styles.card}>
                <View style={[styles.iconCircle, styles.iconCircleActive]}>
                  <Text style={styles.iconEmoji}>🔑</Text>
                </View>
                <Text style={styles.cardTitle}>Create New Password</Text>
                <Text style={styles.cardSubtitle}>
                  Enter and confirm your new password below. It must be at least 6 characters long.
                </Text>

                {/* Server Error Banner */}
                {formServerError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{formServerError}</Text>
                  </View>
                ) : null}

                {/* New Password Input */}
                <AuthInput
                  label="New Password"
                  placeholder="At least 6 characters"
                  isPassword
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) {
                      setNewPasswordError(validatePassword(text));
                    }
                    if (confirmPasswordError && confirmPassword) {
                      setConfirmPasswordError(validateConfirmPassword(text, confirmPassword));
                    }
                  }}
                  error={newPasswordError}
                  editable={!isSubmitting}
                />

                {/* Confirm Password Input */}
                <AuthInput
                  label="Confirm Password"
                  placeholder="Re-enter your new password"
                  isPassword
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) {
                      setConfirmPasswordError(validateConfirmPassword(newPassword, text));
                    }
                  }}
                  error={confirmPasswordError}
                  editable={!isSubmitting}
                />

                {/* Submit Button */}
                <AuthButton
                  title="Update Password"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.actionButton}
                />

                {/* Cancel Link */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel and return to Login"
                  onPress={handleReturnToLogin}
                  disabled={isSubmitting}
                  style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>Back to Sign In</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: FreshTheme.spacing.xl,
    paddingHorizontal: FreshTheme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: FreshTheme.borderRadius.xl,
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FreshTheme.spacing.xs,
    ...FreshTheme.shadows.soft,
  },
  logoIcon: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    ...FreshTheme.shadows.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FreshTheme.spacing.md,
  },
  iconCircleActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  iconCircleWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  iconCircleSuccess: {
    backgroundColor: FreshTheme.colors.fresh.badgeBg,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  iconEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: FreshTheme.spacing.xs,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: FreshTheme.spacing.lg,
    paddingHorizontal: FreshTheme.spacing.xs,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    borderRadius: FreshTheme.borderRadius.md,
    paddingVertical: FreshTheme.spacing.sm,
    paddingHorizontal: FreshTheme.spacing.md,
    marginBottom: FreshTheme.spacing.md,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.useToday.text,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    marginTop: FreshTheme.spacing.sm,
  },
  cancelLink: {
    marginTop: FreshTheme.spacing.lg,
    paddingVertical: FreshTheme.spacing.xs,
  },
  cancelLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
});

