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
  RegisterFormErrors,
  RegisterFormValues,
  RegisterScreenProps,
} from '../types/auth.types';
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validateRegisterForm,
} from '../validation/auth.validation';

export function RegisterScreen({
  onRegister,
  onNavigateToLogin,
  isLoading = false,
  serverError,
  onPressTerms,
  onPressPrivacy,
}: RegisterScreenProps) {
  const [form, setForm] = useState<RegisterFormValues>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof RegisterFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Real-time error clearing when user fixes input
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof RegisterFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    switch (field) {
      case 'fullName': {
        const nameErr = validateFullName(form.fullName);
        if (nameErr) setErrors((prev) => ({ ...prev, fullName: nameErr }));
        break;
      }
      case 'email': {
        const emailErr = validateEmail(form.email);
        if (emailErr) setErrors((prev) => ({ ...prev, email: emailErr }));
        break;
      }
      case 'password': {
        const passwordErr = validatePassword(form.password);
        if (passwordErr) setErrors((prev) => ({ ...prev, password: passwordErr }));
        // Also re-validate confirm password if it has been typed
        if (form.confirmPassword) {
          const confirmErr = validateConfirmPassword(form.password, form.confirmPassword);
          setErrors((prev) => ({ ...prev, confirmPassword: confirmErr || undefined }));
        }
        break;
      }
      case 'confirmPassword': {
        const confirmErr = validateConfirmPassword(form.password, form.confirmPassword);
        if (confirmErr) setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
        break;
      }
    }
  };

  const handleSubmit = () => {
    const validation = validateRegisterForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({
        fullName: true,
        email: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    onRegister?.(form);
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

            {/* Create Account Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Create an account</Text>
              <Text style={styles.subtitle}>
                Start keeping food fresh, organizing inventory, and saving meals today.
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
                label="Full Name"
                placeholder="Jane Doe"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                value={form.fullName}
                onChangeText={(val) => handleChange('fullName', val)}
                onBlur={() => handleBlur('fullName')}
                error={touched.fullName ? errors.fullName : undefined}
                accessibilityLabel="Full Name"
                accessibilityHint="Enter your first and last name"
                returnKeyType="next"
              />

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
                accessibilityHint="Enter your email address"
                returnKeyType="next"
              />

              <AuthInput
                label="Password"
                placeholder="At least 6 characters"
                isPassword
                textContentType="newPassword"
                helperText="Must be at least 6 characters long"
                value={form.password}
                onChangeText={(val) => handleChange('password', val)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                accessibilityLabel="Password"
                accessibilityHint="Create a password with at least 6 characters"
                returnKeyType="next"
              />

              <AuthInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                isPassword
                textContentType="newPassword"
                value={form.confirmPassword}
                onChangeText={(val) => handleChange('confirmPassword', val)}
                onBlur={() => handleBlur('confirmPassword')}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                accessibilityLabel="Confirm Password"
                accessibilityHint="Re-type your password to confirm it matches"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* Terms and Privacy Acknowledgement */}
              <View style={styles.termsBox}>
                <Text style={styles.termsText}>
                  By creating an account, you acknowledge that you agree to FreshLine's{' '}
                  <Text
                    onPress={onPressTerms}
                    style={styles.termsLinkText}
                    accessibilityRole="link">
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    onPress={onPressPrivacy}
                    style={styles.termsLinkText}
                    accessibilityRole="link">
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              {/* Register Button */}
              <AuthButton
                title="Create Account"
                onPress={handleSubmit}
                loading={isLoading}
                accessibilityLabel="Create your FreshLine account"
                accessibilityHint="Submits registration form"
                style={styles.submitButton}
              />
            </View>

            {/* Navigate to Login Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log in to existing account"
                accessibilityHint="Navigates to the login screen"
                onPress={onNavigateToLogin}
                style={({ pressed }) => [
                  styles.loginLinkButton,
                  pressed && styles.linkPressed,
                ]}>
                <Text style={styles.loginLinkText}>Log in</Text>
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
    marginBottom: FreshTheme.spacing.md,
  },
  logoBadge: {
    width: 58,
    height: 58,
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
  brandName: {
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
    letterSpacing: 0.2,
  },
  headingContainer: {
    marginBottom: FreshTheme.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 19,
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
  termsBox: {
    marginVertical: FreshTheme.spacing.sm,
    paddingHorizontal: 2,
  },
  termsText: {
    fontSize: 12,
    fontWeight: '400',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 18,
  },
  termsLinkText: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginTop: FreshTheme.spacing.md,
    marginBottom: FreshTheme.spacing.md,
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
  loginLinkButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: FreshTheme.colors.primary,
  },
  linkPressed: {
    opacity: 0.65,
  },
});

