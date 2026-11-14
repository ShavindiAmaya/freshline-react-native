import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';

interface IngredientMatchListProps {
  availableIngredients: string[];
  missingIngredients: string[];
}

/**
 * IngredientMatchList clearly shows the user which ingredients they already have
 * in their inventory versus which items they are missing.
 *
 * Handles empty states gracefully for both sections.
 */
export function IngredientMatchList({
  availableIngredients,
  missingIngredients,
}: IngredientMatchListProps) {
  const hasAvailable = availableIngredients.length > 0;
  const hasMissing = missingIngredients.length > 0;

  return (
    <View style={styles.container}>
      {/* 1. Available Ingredients Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.availableSectionTitle}>
            ✓ Available in Kitchen ({availableIngredients.length})
          </Text>
          <View style={styles.availableBadge}>
            <Text style={styles.availableBadgeText}>In Stock</Text>
          </View>
        </View>

        {hasAvailable ? (
          <View style={styles.itemsList}>
            {availableIngredients.map((ingredient) => (
              <View key={ingredient} style={styles.ingredientRow}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={styles.availableItemName}>{ingredient}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateText}>
              No matching ingredients found in your kitchen inventory.
            </Text>
          </View>
        )}
      </View>

      {/* 2. Missing Ingredients Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.missingSectionTitle}>
            ✕ Needed from Store ({missingIngredients.length})
          </Text>
          <View
            style={[
              styles.missingBadge,
              !hasMissing && styles.missingBadgeComplete,
            ]}>
            <Text
              style={[
                styles.missingBadgeText,
                !hasMissing && styles.missingBadgeTextComplete,
              ]}>
              {hasMissing ? 'Missing' : 'All Ready!'}
            </Text>
          </View>
        </View>

        {hasMissing ? (
          <View style={styles.itemsList}>
            {missingIngredients.map((ingredient) => (
              <View key={ingredient} style={styles.ingredientRow}>
                <View style={styles.crossCircle}>
                  <Text style={styles.crossIconText}>✕</Text>
                </View>
                <Text style={styles.missingItemName}>{ingredient}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.allCompleteBox}>
            <Text style={styles.allCompleteText}>
              🎉 You have all required ingredients! You're ready to cook this meal.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: FreshTheme.spacing.md,
    marginVertical: FreshTheme.spacing.sm,
  },
  sectionCard: {
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    ...FreshTheme.shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.sm,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  availableSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  availableBadge: {
    backgroundColor: FreshTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  availableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  missingSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  missingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  missingBadgeComplete: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  missingBadgeTextComplete: {
    color: FreshTheme.colors.primaryDark,
  },
  itemsList: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: FreshTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FreshTheme.colors.primary,
  },
  checkIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    lineHeight: 12,
  },
  availableItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: FreshTheme.colors.textPrimary,
  },
  crossCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  crossIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    lineHeight: 12,
  },
  missingItemName: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
  },
  emptyStateBox: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    color: FreshTheme.colors.textMuted,
    textAlign: 'center',
  },
  allCompleteBox: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    borderRadius: FreshTheme.borderRadius.md,
    padding: 10,
    alignItems: 'center',
  },
  allCompleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
    textAlign: 'center',
  },
});
