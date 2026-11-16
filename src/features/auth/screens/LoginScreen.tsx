import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FreshTheme } from '@/constants/freshline-theme';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import {
  LoginFormErrors,
  LoginFormValues,
  LoginScreenProps,
} from '../types/auth.types';
import {
  validateEmail,
  validateLoginForm,
  validatePassword,
} from '../validation/auth.validation';

export function LoginScreen({
  onLogin,
  onNavigateToRegister,
  isLoading = false,
  serverError,
  onForgotPassword,
}: LoginScreenProps) {
  const [form, setForm] = useState<LoginFormValues>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Real-time error clearing when user fixes input
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof LoginFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === 'email') {
      const emailErr = validateEmail(form.email);
      if (emailErr) setErrors((prev) => ({ ...prev, email: emailErr }));
    } else if (field === 'password') {
      const passwordErr = validatePassword(form.password);
      if (passwordErr) setErrors((prev) => ({ ...prev, password: passwordErr }));
    }
  };

  const handleSubmit = () => {
    // Validate all fields
    const validation = validateLoginForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ email: true, password: true });
      return;
    }

    // Pass valid form values to consumer callback
    onLogin?.(form);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            {/* Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>🌱</Text>
              </View>
              <Text style={styles.brandName}>FreshLine</Text>
              <Text style={styles.brandTagline}>
                Track Freshness. Reduce Waste.
              </Text>
            </View>

            {/* Welcome Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Log in to keep track of your food and reduce household waste.
              </Text>
            </View>

            {/* Server Error Alert (if present) */}
            {serverError && (
              <View
                style={styles.serverErrorBox}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive">
                <Text style={styles.serverErrorIcon}>⚠️</Text>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <AuthInput
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                value={form.email}
                onChangeText={(val) => handleChange('email', val)}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : undefined}
                accessibilityLabel="Email Address"
                accessibilityHint="Enter your account email"
                returnKeyType="next"
              />

              <AuthInput
                label="Password"
                placeholder="Enter your password"
                isPassword
                textContentType="password"
                value={form.password}
                onChangeText={(val) => handleChange('password', val)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                accessibilityLabel="Password"
                accessibilityHint="Enter your account password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* Forgot Password Link */}
              {onForgotPassword && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forgot Password"
                  onPress={onForgotPassword}
                  style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot password?
                  </Text>
                </Pressable>
              )}

              {/* Login Button */}
              <AuthButton
                title="Log In"
                onPress={handleSubmit}
                loading={isLoading}
                accessibilityLabel="Log in to FreshLine"
                accessibilityHint="Submits login credentials"
                style={styles.submitButton}
              />
            </View>

            {/* Navigate to Register Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign up for FreshLine"
                accessibilityHint="Navigates to the registration screen"
                onPress={onNavigateToRegister}
                style={({ pressed }) => [
                  styles.registerLinkButton,
                  pressed && styles.linkPressed,
                ]}>
                <Text style={styles.registerLinkText}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingVertical: FreshTheme.spacing.xl,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: FreshTheme.borderRadius.xl,
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FreshTheme.spacing.sm,
    ...FreshTheme.shadows.soft,
  },
  logoIcon: {
    fontSize: 32,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headingContainer: {
    marginBottom: FreshTheme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 20,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    borderWidth: 1.5,
    padding: FreshTheme.spacing.md,
    borderRadius: FreshTheme.borderRadius.md,
    marginBottom: FreshTheme.spacing.md,
    gap: 8,
  },
  serverErrorIcon: {
    fontSize: 16,
  },
  serverErrorText: {
    fontSize: 13,
    fontWeight: '600',
    color: FreshTheme.colors.useToday.text,
    flex: 1,
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: FreshTheme.spacing.md,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primary,
  },
  submitButton: {
    marginTop: FreshTheme.spacing.xs,
    marginBottom: FreshTheme.spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: FreshTheme.spacing.sm,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
  },
  registerLinkButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: FreshTheme.colors.primary,
  },
  linkPressed: {
    opacity: 0.65,
  },
});

