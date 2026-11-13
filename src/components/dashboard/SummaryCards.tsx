import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodSummaryStats } from '@/types/food';

interface SummaryCardsProps {
  stats: FoodSummaryStats;
  onPressTotal?: () => void;
  onPressExpiring?: () => void;
  onPressSaved?: () => void;
}

export function SummaryCards({
  stats,
  onPressTotal,
  onPressExpiring,
  onPressSaved,
}: SummaryCardsProps) {
  return (
    <View style={styles.container}>
      {/* Total Food Items Card */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Total Food Items: ${stats.total_items}`}
        onPress={onPressTotal}
        style={({ pressed }) => [
          styles.card,
          styles.cardTotal,
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, styles.iconTotal]}>
            <Text style={styles.iconGlyph}>🍱</Text>
          </View>
          <View style={styles.badgeTotal}>
            <Text style={styles.badgeTotalText}>Tracked</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.statValue}>{stats.total_items}</Text>
          <Text style={styles.statLabel}>Total Food Items</Text>
          <Text style={styles.statSub}>Sample inventory • Demo</Text>
        </View>
      </Pressable>

      {/* Expiring Soon Card */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Expiring Soon: ${stats.expiring_soon}`}
        onPress={onPressExpiring}
        style={({ pressed }) => [
          styles.card,
          styles.cardExpiring,
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, styles.iconExpiring]}>
            <Text style={styles.iconGlyph}>⏳</Text>
          </View>
          <View style={styles.badgeExpiring}>
            <Text style={styles.badgeExpiringText}>Priority</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.statValue, styles.statValueExpiring]}>
            {stats.expiring_soon}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
          <Text style={styles.statSubExpiring}>Within 2 days • Demo</Text>
        </View>
      </Pressable>

      {/* Food Saved Card */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Food Saved: ${stats.food_saved}`}
        onPress={onPressSaved}
        style={({ pressed }) => [
          styles.card,
          styles.cardSaved,
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, styles.iconSaved]}>
            <Text style={styles.iconGlyph}>🌱</Text>
          </View>
          <View style={styles.badgeSaved}>
            <Text style={styles.badgeSavedText}>Rescued</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.statValue, styles.statValueSaved]}>
            {stats.food_saved}
          </Text>
          <Text style={styles.statLabel}>Food Saved</Text>
          <Text style={styles.statSubSaved}>This month • Demo</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingVertical: FreshTheme.spacing.sm,
    gap: FreshTheme.spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md - 2,
    borderWidth: 1.5,
    backgroundColor: FreshTheme.colors.cardBg,
    ...FreshTheme.shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  cardTotal: {
    borderColor: FreshTheme.colors.summaryTotal.border,
    backgroundColor: '#FFFFFF',
  },
  cardExpiring: {
    borderColor: FreshTheme.colors.summaryExpiring.border,
    backgroundColor: '#FFFFFF',
  },
  cardSaved: {
    borderColor: FreshTheme.colors.summarySaved.border,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: FreshTheme.spacing.xs + 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTotal: {
    backgroundColor: FreshTheme.colors.summaryTotal.iconBg,
  },
  iconExpiring: {
    backgroundColor: FreshTheme.colors.summaryExpiring.iconBg,
  },
  iconSaved: {
    backgroundColor: FreshTheme.colors.summarySaved.iconBg,
  },
  iconGlyph: {
    fontSize: 16,
  },
  badgeTotal: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: FreshTheme.colors.summaryTotal.iconBg,
  },
  badgeTotalText: {
    fontSize: 9,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  badgeExpiring: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: FreshTheme.colors.summaryExpiring.iconBg,
  },
  badgeExpiringText: {
    fontSize: 9,
    fontWeight: '700',
    color: FreshTheme.colors.summaryExpiring.text,
  },
  badgeSaved: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: FreshTheme.colors.summarySaved.iconBg,
  },
  badgeSavedText: {
    fontSize: 9,
    fontWeight: '700',
    color: FreshTheme.colors.summarySaved.text,
  },
  cardContent: {
    marginTop: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  statValueExpiring: {
    color: FreshTheme.colors.summaryExpiring.text,
  },
  statValueSaved: {
    color: FreshTheme.colors.summarySaved.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    marginTop: 2,
    lineHeight: 15,
  },
  statSub: {
    fontSize: 10,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
    marginTop: 2,
  },
  statSubExpiring: {
    fontSize: 10,
    fontWeight: '600',
    color: FreshTheme.colors.summaryExpiring.text,
    marginTop: 2,
  },
  statSubSaved: {
    fontSize: 10,
    fontWeight: '600',
    color: FreshTheme.colors.summarySaved.text,
    marginTop: 2,
  },
});

