import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { RecipeMatchResult } from '../types/recipe.types';
import { IngredientMatchList } from '../components/IngredientMatchList';
import { FreshTheme } from '@/constants/freshline-theme';

export interface RecipeDetailsScreenProps {
  matchResult: RecipeMatchResult;
  onBack: () => void;
}

/**
 * RecipeDetailsScreen displays full cooking instructions and ingredients for a selected recipe:
 * - Recipe name, category, and cooking duration
 * - Actual live calculated match percentage
 * - Visual "Ready to Cook" vs "Missing Ingredients" indicator
 * - Urgent ingredients rescued banner
 * - Complete breakdown of available vs. missing ingredients (via IngredientMatchList)
 * - Clear numbered step-by-step cooking instructions
 * - Top back navigation button
 *
 * Runs 100% offline from local recipe data.
 */
export function RecipeDetailsScreen({
  matchResult,
  onBack,
}: RecipeDetailsScreenProps) {
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Top Navigation Back Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to recipe list"
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.buttonPressed,
        ]}>
        <Text style={styles.backButtonText}>← Back to Recipes</Text>
      </Pressable>

      {/* Header Info Card */}
      <View style={[styles.headerCard, canCook && styles.headerCardReady]}>
        <View style={styles.headerMetaRow}>
          {recipe.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{recipe.category}</Text>
            </View>
          ) : null}
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>⏱️ {recipe.minutes} mins prep</Text>
          </View>
        </View>

        <Text style={styles.recipeTitle}>{recipe.name}</Text>

        {recipe.description ? (
          <Text style={styles.recipeDescription}>{recipe.description}</Text>
        ) : null}

        {/* Readiness Status Banner */}
        {canCook ? (
          <View style={styles.readyStatusBox}>
            <Text style={styles.readyStatusIcon}>🎉</Text>
            <View style={styles.statusTextCol}>
              <Text style={styles.readyStatusTitle}>
                Ready to Cook! ({matchPercent}% Match)
              </Text>
              <Text style={styles.readyStatusSub}>
                You have all {recipe.ingredients.length} required ingredients in your kitchen.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.missingStatusBox}>
            <Text style={styles.missingStatusIcon}>🛒</Text>
            <View style={styles.statusTextCol}>
              <Text style={styles.missingStatusTitle}>
                {matchPercent}% Match ({availableIngredients.length}/{recipe.ingredients.length} In Stock)
              </Text>
              <Text style={styles.missingStatusSub}>
                You need {missingIngredients.length} more ingredient{missingIngredients.length > 1 ? 's' : ''} to make this.
              </Text>
            </View>
          </View>
        )}

        {/* Urgent Rescued Items Callout */}
        {urgentCount > 0 ? (
          <View style={styles.urgentCalloutBox}>
            <Text style={styles.urgentCalloutIcon}>🔥</Text>
            <View style={styles.urgentCalloutContent}>
              <Text style={styles.urgentCalloutTitle}>
                Helps Prevent Food Waste!
              </Text>
              <Text style={styles.urgentCalloutSub}>
                This recipe cooks {urgentCount} item{urgentCount > 1 ? 's' : ''} expiring soon: {urgentIngredientsUsed.join(', ')}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Ingredients Breakdown Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ingredients Breakdown</Text>
      </View>
      <IngredientMatchList
        availableIngredients={availableIngredients}
        missingIngredients={missingIngredients}
      />

      {/* Step-by-Step Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionsHeaderRow}>
          <Text style={styles.sectionTitle}>Preparation Instructions</Text>
          <Text style={styles.stepsCountText}>{recipe.steps.length} Steps</Text>
        </View>

        <View style={styles.stepsList}>
          {recipe.steps.map((stepText, index) => (
            <View key={index} style={styles.stepItemRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{stepText}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Back Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return to recipes list"
        onPress={onBack}
        style={({ pressed }) => [
          styles.bottomBackBtn,
          pressed && styles.buttonPressed,
        ]}>
        <Text style={styles.bottomBackBtnText}>← Return to Recipe Catalogue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
  },
  contentContainer: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: FreshTheme.spacing.xxxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.md,
    ...FreshTheme.shadows.soft,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  headerCard: {
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.md,
    ...FreshTheme.shadows.card,
  },
  headerCardReady: {
    borderLeftWidth: 4,
    borderLeftColor: FreshTheme.colors.primary,
  },
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: FreshTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  categoryBadgeText: {
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
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 13,
    color: FreshTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: FreshTheme.spacing.md,
  },
  readyStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    borderRadius: FreshTheme.borderRadius.md,
    padding: FreshTheme.spacing.md,
    gap: 10,
    marginTop: 4,
  },
  readyStatusIcon: {
    fontSize: 24,
  },
  statusTextCol: {
    flex: 1,
  },
  readyStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  readyStatusSub: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  missingStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: FreshTheme.borderRadius.md,
    padding: FreshTheme.spacing.md,
    gap: 10,
    marginTop: 4,
  },
  missingStatusIcon: {
    fontSize: 24,
  },
  missingStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  missingStatusSub: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  urgentCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.useSoon.badgeBg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.useSoon.badgeBorder,
    borderRadius: FreshTheme.borderRadius.md,
    padding: FreshTheme.spacing.sm + 2,
    marginTop: 10,
    gap: 8,
  },
  urgentCalloutIcon: {
    fontSize: 18,
  },
  urgentCalloutContent: {
    flex: 1,
  },
  urgentCalloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.useSoon.text,
  },
  urgentCalloutSub: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 1,
  },
  sectionHeader: {
    marginTop: FreshTheme.spacing.xs,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  instructionsCard: {
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginTop: FreshTheme.spacing.md,
    ...FreshTheme.shadows.card,
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textMuted,
  },
  stepsList: {
    gap: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FreshTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FreshTheme.colors.primary,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: FreshTheme.colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomBackBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingVertical: 13,
    borderRadius: FreshTheme.borderRadius.lg,
    alignItems: 'center',
    marginTop: FreshTheme.spacing.lg,
    ...FreshTheme.shadows.soft,
  },
  bottomBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
});
