import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';

interface MotivationalCardProps {
  foodSavedCount?: number;
  co2SavedKg?: number;
  moneySavedUsd?: number;
  onPressLearnMore?: () => void;
}

export function MotivationalCard({
  foodSavedCount = 8,
  co2SavedKg = 3.4,
  moneySavedUsd = 42.5,
  onPressLearnMore,
}: MotivationalCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Background decorative tint */}
        <View style={styles.decorativeLeafBadge}>
          <Text style={styles.leafIcon}>🌿</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <View style={styles.impactDot} />
              <Text style={styles.badgeLabel}>DEMO IMPACT PREVIEW</Text>
            </View>
            <View style={styles.starPill}>
              <Text style={styles.starText}>⭐ Demo Preview</Text>
            </View>
          </View>

          {/* Motivational Slogan */}
          <Text style={styles.headline}>
            Every meal saved makes a difference!
          </Text>

          <Text style={styles.subtext}>
            Sample metrics illustrating waste prevented and money saved. Real-time
            statistics will update automatically once backend is connected.
          </Text>

          {/* Impact Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{foodSavedCount}</Text>
              <Text style={styles.statLabel}>Meals Rescued</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNum}>{co2SavedKg} kg</Text>
              <Text style={styles.statLabel}>CO₂e Prevented</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNum}>${moneySavedUsd.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Money Saved</Text>
            </View>
          </View>

          {/* Action button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View your sustainability impact report"
            onPress={onPressLearnMore}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.actionButtonText}>View Waste Reduction Insights</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: FreshTheme.spacing.md,
  },
  card: {
    backgroundColor: '#F0FDF4',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primaryBorder,
    position: 'relative',
    overflow: 'hidden',
    ...FreshTheme.shadows.card,
  },
  decorativeLeafBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  leafIcon: {
    fontSize: 42,
  },
  content: {
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  impactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FreshTheme.colors.primary,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: 0.8,
  },
  starPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
  },
  starText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  headline: {
    fontSize: 17,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDeep,
    letterSpacing: -0.3,
    marginBottom: 6,
    lineHeight: 22,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: FreshTheme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.md,
    paddingVertical: FreshTheme.spacing.sm + 2,
    paddingHorizontal: FreshTheme.spacing.sm,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    marginBottom: FreshTheme.spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: FreshTheme.colors.primaryLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FreshTheme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: FreshTheme.spacing.md,
    borderRadius: FreshTheme.borderRadius.md,
    gap: 6,
    ...FreshTheme.shadows.soft,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

