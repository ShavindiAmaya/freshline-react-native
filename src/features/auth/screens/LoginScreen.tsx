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

  // Input change handler
  const handleChange = (field: keyof LoginFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Field blur validation
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

  // Form submit handler
  const handleSubmit = () => {
    const validation = validateLoginForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ email: true, password: true });
      return;
    }
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
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Log in to keep track of your food and reduce household waste.
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
                placeholder="Enter your password"
                isPassword
                textContentType="password"
                value={form.password}
                onChangeText={(val) => handleChange('password', val)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* Forgot password */}
              {onForgotPassword && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onForgotPassword}
                  style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              )}

              {/* Submit button */}
              <AuthButton
                title="Log In"
                onPress={handleSubmit}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable
                accessibilityRole="button"
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: fontStack,
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
  registerLinkButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: fontStack,
  },
  linkPressed: {
    opacity: 0.65,
  },
});
