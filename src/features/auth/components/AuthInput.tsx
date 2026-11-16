import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
  Platform,
} from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';

export interface AuthInputProps extends TextInputProps {
  /**
   * Label displayed above the input field.
   */
  label: string;

  /**
   * Validation error message displayed below the input field.
   */
  error?: string | null;

  /**
   * Whether this field is a password input with show/hide toggle.
   */
  isPassword?: boolean;

  /**
   * Optional helper or instruction text shown when there is no error.
   */
  helperText?: string;

  /**
   * Custom container style.
   */
  containerStyle?: object;
}

export const AuthInput = forwardRef<any, AuthInputProps>(
  (
    {
      label,
      error,
      isPassword = false,
      helperText,
      containerStyle,
      placeholder,
      keyboardType = 'default',
      autoCapitalize = 'none',
      autoCorrect = false,
      value,
      onChangeText,
      onFocus,
      onBlur,
      editable = true,
      accessibilityLabel,
      accessibilityHint,
      ...restProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const hasError = Boolean(error);
    const secureText = isPassword && !isPasswordVisible;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const togglePasswordVisibility = () => {
      setIsPasswordVisible((prev) => !prev);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Input Label */}
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            hasError && styles.labelError,
          ]}
          accessibilityRole="text">
          {label}
        </Text>

        {/* Input Field Container */}
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            hasError && styles.inputWrapperError,
            !editable && styles.inputWrapperDisabled,
          ]}>
          <TextInput
            ref={ref as any}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={FreshTheme.colors.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            secureTextEntry={secureText}
            editable={editable}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={accessibilityLabel || label}
            accessibilityHint={accessibilityHint}
            aria-invalid={hasError}
            style={[styles.input, isPassword && styles.inputWithToggle]}
            {...restProps}
          />

          {/* Show / Hide Password Toggle */}
          {isPassword && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? 'Hide password' : 'Show password'
              }
              accessibilityHint="Toggles password visibility"
              onPress={togglePasswordVisibility}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.toggleButton,
                pressed && styles.toggleButtonPressed,
              ]}>
              <Text style={styles.toggleIcon}>
                {isPasswordVisible ? '👁️' : '🔒'}
              </Text>
              <Text style={styles.toggleText}>
                {isPasswordVisible ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Error or Helper Display */}
        {hasError ? (
          <View
            style={styles.errorRow}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: FreshTheme.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: FreshTheme.colors.primaryDark,
  },
  labelError: {
    color: FreshTheme.colors.useToday.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.borderLight,
    paddingHorizontal: FreshTheme.spacing.md,
    minHeight: 52,
    ...FreshTheme.shadows.soft,
  },
  inputWrapperFocused: {
    borderColor: FreshTheme.colors.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  inputWrapperError: {
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderWidth: 1.5,
  },
  inputWrapperDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: FreshTheme.colors.borderLight,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: FreshTheme.colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 0,
  },
  inputWithToggle: {
    paddingRight: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: FreshTheme.borderRadius.sm,
    backgroundColor: FreshTheme.colors.primarySubtle,
    gap: 4,
  },
  toggleButtonPressed: {
    opacity: 0.7,
  },
  toggleIcon: {
    fontSize: 14,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  errorIcon: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.useToday.text,
    flex: 1,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
    marginTop: 5,
    paddingHorizontal: 2,
  },
});
