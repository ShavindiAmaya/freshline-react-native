import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

export interface AuthButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'subtle';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: React.ReactNode;
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  icon,
}: AuthButtonProps) {
  const isInteractionDisabled = disabled || loading;

  const handlePress = () => {
    if (isInteractionDisabled) return;
    onPress();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
          loaderColor: '#16A34A',
        };
      case 'subtle':
        return {
          container: styles.subtleContainer,
          text: styles.subtleText,
          loaderColor: '#15803D',
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          loaderColor: '#FFFFFF',
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isInteractionDisabled,
        busy: loading,
      }}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      disabled={isInteractionDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.baseButton,
        variantStyle.container,
        isInteractionDisabled && styles.disabledButton,
        pressed && !isInteractionDisabled && styles.pressedButton,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.loaderColor}
          style={styles.indicator}
          accessibilityLabel="Loading..."
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, variantStyle.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const fontStack = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

const styles = StyleSheet.create({
  baseButton: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: '#16A34A',
  },
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subtleContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressedButton: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: fontStack,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#16A34A',
  },
  subtleText: {
    color: '#15803D',
  },
  indicator: {
    paddingVertical: 2,
  },
});
