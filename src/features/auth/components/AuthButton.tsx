import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';

export interface AuthButtonProps {
  /**
   * Button title text.
   */
  title: string;

  /**
   * Action callback triggered on press.
   */
  onPress: () => void | Promise<void>;

  /**
   * Shows a loading spinner and prevents repeated presses.
   */
  loading?: boolean;

  /**
   * Disables user interaction.
   */
  disabled?: boolean;

  /**
   * Visual variant: primary green (default) or secondary outline.
   */
  variant?: 'primary' | 'outline' | 'subtle';

  /**
   * Custom container style.
   */
  style?: ViewStyle;

  /**
   * Custom text style.
   */
  textStyle?: TextStyle;

  /**
   * Accessibility label for screen readers.
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint explaining what tapping the button does.
   */
  accessibilityHint?: string;

  /**
   * Optional icon rendered before the title.
   */
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
          loaderColor: FreshTheme.colors.primary,
        };
      case 'subtle':
        return {
          container: styles.subtleContainer,
          text: styles.subtleText,
          loaderColor: FreshTheme.colors.primaryDark,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          loaderColor: FreshTheme.colors.textOnPrimary,
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

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: FreshTheme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: FreshTheme.spacing.lg,
    width: '100%',
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: FreshTheme.colors.primary,
    ...FreshTheme.shadows.card,
  },
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primary,
  },
  subtleContainer: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressedButton: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  baseText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  primaryText: {
    color: FreshTheme.colors.textOnPrimary,
  },
  outlineText: {
    color: FreshTheme.colors.primary,
  },
  subtleText: {
    color: FreshTheme.colors.primaryDark,
  },
  indicator: {
    paddingVertical: 2,
  },
});

