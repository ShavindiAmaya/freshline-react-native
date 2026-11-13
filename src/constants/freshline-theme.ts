/**
 * FreshLine Design System & Theme Tokens
 *
 * Modern professional UI with Fresh Green primary, white and light-green
 * backgrounds, rounded cards, soft shadows, and clean spacing.
 */

import { Platform } from 'react-native';

export const FreshTheme = {
  colors: {
    // Brand primary green palette
    primary: '#16A34A', // Vibrant Fresh Leaf Green (Tailwind green-600)
    primaryDark: '#15803D', // Forest Green (green-700)
    primaryDeep: '#064E3B', // Deep Pine (green-900)
    primaryLight: '#DCFCE7', // Fresh Mint Tint (green-100)
    primarySubtle: '#F0FDF4', // Light-green background (green-50)
    primaryBorder: '#BBF7D0', // Green border (green-200)

    // Neutral & Backgrounds
    screenBg: '#F8FAF8', // Ultra-light fresh green tinted canvas
    cardBg: '#FFFFFF', // Clean crisp white card
    surfaceElevated: '#FFFFFF',
    borderLight: '#E5E7EB', // Subtle separator
    borderGreenSubtle: '#DCFCE7',

    // Typography
    textPrimary: '#0F172A', // Slate 900 for crisp readability
    textSecondary: '#475569', // Slate 600 for body / subtitles
    textMuted: '#94A3B8', // Slate 400 for hints
    textGreen: '#15803D', // Green callout
    textOnPrimary: '#FFFFFF',

    // Status Badges
    useToday: {
      badgeBg: '#FEF2F2',
      badgeBorder: '#FECACA',
      text: '#DC2626',
      dot: '#EF4444',
      barColor: '#EF4444',
    },
    useSoon: {
      badgeBg: '#FFF7ED',
      badgeBorder: '#FFEDD5',
      text: '#EA580C',
      dot: '#F97316',
      barColor: '#F97316',
    },
    fresh: {
      badgeBg: '#F0FDF4',
      badgeBorder: '#BBF7D0',
      text: '#16A34A',
      dot: '#22C55E',
      barColor: '#22C55E',
    },

    // Summary Card Accents
    summaryTotal: {
      bg: '#F0FDF4',
      border: '#DCFCE7',
      iconBg: '#DCFCE7',
      text: '#15803D',
      numColor: '#0F172A',
    },
    summaryExpiring: {
      bg: '#FFF7ED',
      border: '#FFEDD5',
      iconBg: '#FFEDD5',
      text: '#C2410C',
      numColor: '#C2410C',
    },
    summarySaved: {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      iconBg: '#D1FAE5',
      text: '#047857',
      numColor: '#047857',
    },
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  shadows: {
    soft: Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
      },
      default: {
        elevation: 2,
      },
    }),
    card: Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.07)',
      },
      default: {
        elevation: 3,
      },
    }),
    floating: Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 6px 18px rgba(22, 163, 74, 0.14)',
      },
      default: {
        elevation: 6,
      },
    }),
  },
} as const;

