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
import { SymbolView } from 'expo-symbols';
import { FreshTheme } from '@/constants/freshline-theme';

export interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  isPassword?: boolean;
  helperText?: string;
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

    // Focus & blur handlers
    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Toggle password view
    const togglePasswordVisibility = () => {
      setIsPasswordVisible((prev) => !prev);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Label */}
        <Text style={[styles.label, isFocused && styles.labelFocused, hasError && styles.labelError]}>
          {label}
        </Text>

        {/* Input box */}
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
            placeholderTextColor="#94A3B8"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            secureTextEntry={secureText}
            editable={editable}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={accessibilityLabel || label}
            accessibilityHint={accessibilityHint}
            style={styles.input}
            {...restProps}
          />

          {/* Eye toggle button */}
          {isPassword && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              onPress={togglePasswordVisibility}
              hitSlop={10}
              style={({ pressed }) => [styles.eyeButton, pressed && styles.eyeButtonPressed]}>
              <SymbolView
                name={{
                  ios: isPasswordVisible ? 'eye' : 'eye.slash',
                  android: isPasswordVisible ? 'visibility' : 'visibility_off',
                  web: isPasswordVisible ? 'visibility' : 'visibility_off',
                }}
                size={20}
                tintColor={isFocused ? FreshTheme.colors.primaryDark : '#64748B'}
              />
            </Pressable>
          )}
        </View>

        {/* Error message */}
        {hasError ? (
          <View style={styles.errorRow}>
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

const fontStack = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    fontFamily: fontStack,
  },
  labelFocused: {
    color: '#15803D',
  },
  labelError: {
    color: '#DC2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: '#16A34A',
  },
  inputWrapperError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
    fontFamily: fontStack,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButtonPressed: {
    opacity: 0.5,
  },
  errorRow: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
    fontFamily: fontStack,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontFamily: fontStack,
  },
});
