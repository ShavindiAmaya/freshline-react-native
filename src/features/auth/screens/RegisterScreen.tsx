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

  // Input change handler
  const handleChange = (field: keyof RegisterFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Field blur validation
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

  // Form submit handler
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
            {/* Header logo & brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>🌱</Text>
              </View>
              <Text style={styles.brandName}>FreshLine</Text>
              <Text style={styles.brandTagline}>Track Freshness. Reduce Waste.</Text>
            </View>

            {/* Title & subtitle */}
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Create an account</Text>
              <Text style={styles.subtitle}>
                Start keeping food fresh, organizing inventory, and saving meals today.
              </Text>
            </View>

            {/* Server error banner */}
            {serverError && (
              <View style={styles.serverErrorBox} accessibilityRole="alert">
                <Text style={styles.serverErrorIcon}>⚠️</Text>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            {/* Form inputs */}
            <View style={styles.formContainer}>
              <AuthInput
                label="Full Name"
                placeholder="Your name"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                value={form.fullName}
                onChangeText={(val) => handleChange('fullName', val)}
                onBlur={() => handleBlur('fullName')}
                error={touched.fullName ? errors.fullName : undefined}
                returnKeyType="next"
              />

              <AuthInput
                label="Email Address"
                placeholder="your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                value={form.email}
                onChangeText={(val) => handleChange('email', val)}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : undefined}
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
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* Terms text */}
              <View style={styles.termsBox}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to FreshLine's{' '}
                  <Text onPress={onPressTerms} style={styles.termsLinkText}>
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text onPress={onPressPrivacy} style={styles.termsLinkText}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              {/* Submit button */}
              <AuthButton
                title="Create Account"
                onPress={handleSubmit}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable
                accessibilityRole="button"
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

const fontStack = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoIcon: {
    fontSize: 24,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    fontFamily: fontStack,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
    fontFamily: fontStack,
  },
  headingContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
    fontFamily: fontStack,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
    fontFamily: fontStack,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  serverErrorIcon: {
    fontSize: 14,
  },
  serverErrorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
    flex: 1,
    fontFamily: fontStack,
  },
  formContainer: {
    width: '100%',
  },
  termsBox: {
    marginVertical: 12,
    paddingHorizontal: 2,
  },
  termsText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontFamily: fontStack,
  },
  termsLinkText: {
    color: '#16A34A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginTop: 4,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: fontStack,
  },
  loginLinkButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: fontStack,
  },
  linkPressed: {
    opacity: 0.65,
  },
});
