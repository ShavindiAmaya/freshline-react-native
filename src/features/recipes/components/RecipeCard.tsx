import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RecipeMatchResult } from '../types/recipe.types';
import { FreshTheme } from '@/constants/freshline-theme';

interface RecipeCardProps {
  matchResult: RecipeMatchResult;
  onPress: () => void;
}

/**
 * RecipeCard displays a single recipe with live ingredient match calculations:
 * - Recipe name and category
 * - Cooking time in minutes
 * - Exact calculated match percentage and visual progress bar
 * - Urgent ingredients rescued banner (items with status 'use_today' or 'use_soon')
 * - Visual indication when all ingredients are available (Ready to Cook)
 */
export function RecipeCard({ matchResult, onPress }: RecipeCardProps) {
  const {
    recipe,
    matchPercent,
    availableIngredients,
    missingIngredients,
    urgentIngredientsUsed,
    canCook,
  } = matchResult;

  const urgentCount = urgentIngredientsUsed.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}, ${recipe.minutes} minutes, ${matchPercent}% match`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        canCook && styles.cardReady,
        pressed && styles.cardPressed,
      ]}>
      {/* Top Meta Row: Category & Cooking Time */}
      <View style={styles.metaRow}>
        {recipe.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{recipe.category}</Text>
          </View>
        ) : (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Recipe</Text>
          </View>
        )}

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>⏱️ {recipe.minutes} mins</Text>
        </View>
      </View>

      {/* Recipe Title & Description */}
      <Text style={styles.recipeName}>{recipe.name}</Text>
      {recipe.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>
      ) : null}

      {/* Match Status & Progress */}
      <View style={styles.matchSection}>
        <View style={styles.matchHeaderRow}>
          {canCook ? (
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>✓ Ready to Cook ({matchPercent}% Match)</Text>
            </View>
          ) : (
            <View style={styles.partialBadge}>
              <Text style={styles.partialBadgeText}>{matchPercent}% Match</Text>
            </View>
          )}

          <Text style={styles.ingredientSummary}>
            {availableIngredients.length}/{recipe.ingredients.length} ingredients
          </Text>
        </View>

        {/* Visual Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              canCook ? styles.progressFillReady : styles.progressFillPartial,
              { width: `${Math.min(100, Math.max(0, matchPercent))}%` },
            ]}
          />
        </View>
      </View>

      {/* Urgent Ingredients Rescued Banner */}
      {urgentCount > 0 ? (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentIcon}>🔥</Text>
          <View style={styles.urgentTextWrapper}>
            <Text style={styles.urgentTitle}>
              Uses {urgentCount} urgent ingredient{urgentCount > 1 ? 's' : ''}!
            </Text>
            <Text style={styles.urgentList} numberOfLines={1}>
              Rescues: {urgentIngredientsUsed.join(', ')}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Bottom Action Hint */}
      <View style={styles.actionRow}>
        <Text style={styles.ingredientBreakdown}>
          <Text style={styles.availableText}>✓ {availableIngredients.length} available</Text>
          {missingIngredients.length > 0 ? (
            <Text style={styles.missingText}> • ✕ {missingIngredients.length} missing</Text>
          ) : null}
        </Text>
        <Text style={styles.viewDetailsText}>View Details →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md + 2,
    marginBottom: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    ...FreshTheme.shadows.card,
  },
  cardReady: {
    borderColor: FreshTheme.colors.primaryBorder,
    borderWidth: 1.5,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.xs + 2,
  },
  categoryBadge: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  timeBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  recipeName: {
    fontSize: 17,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: FreshTheme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: FreshTheme.spacing.sm,
  },
  matchSection: {
    marginVertical: FreshTheme.spacing.xs,
  },
  matchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  readyBadge: {
    backgroundColor: FreshTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primary,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  partialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  partialBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  ingredientSummary: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textMuted,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFillReady: {
    backgroundColor: FreshTheme.colors.primary,
  },
  progressFillPartial: {
    backgroundColor: '#F59E0B',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.useSoon.badgeBg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.useSoon.badgeBorder,
    borderRadius: FreshTheme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 8,
  },
  urgentIcon: {
    fontSize: 16,
  },
  urgentTextWrapper: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.useSoon.text,
  },
  urgentList: {
    fontSize: 10,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ingredientBreakdown: {
    fontSize: 11,
  },
  availableText: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  missingText: {
    color: '#D97706',
    fontWeight: '600',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
});
