import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FoodItem } from '@/types/food';
import { RecipeMatchResult } from '../types/recipe.types';
import { recipes } from '../data/recipes';
import { matchRecipes } from '../services/recipe-matcher';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeDetailsScreen } from './RecipeDetailsScreen';
import { FreshTheme } from '@/constants/freshline-theme';

export interface RecipesScreenProps {
  foodItems?: FoodItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onSelectRecipe?: (matchResult: RecipeMatchResult) => void;
  onReturnToDashboard?: () => void;
}

const CATEGORY_FILTERS = ['All', 'Quick', 'Vegetarian', 'Main'] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

/**
 * RecipesScreen ("Cook What I Have")
 *
 * Ranks recipes according to the user's available food inventory:
 * - Prioritizes recipes that rescue food expiring today or soon
 * - Calculates accurate live match percentages
 * - Supports simple search and category filtering
 * - Handles real loading, error, and empty inventory states
 * - Can present recipe details internally or via parent callback
 */
export function RecipesScreen({
  foodItems = [],
  isLoading = false,
  errorMessage = null,
  onSelectRecipe,
  onReturnToDashboard,
}: RecipesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [selectedMatch, setSelectedMatch] = useState<RecipeMatchResult | null>(null);

  // 1. Calculate live matches and rank recipes using pure recipe matcher
  const rankedResults = useMemo(() => {
    return matchRecipes(foodItems, recipes);
  }, [foodItems]);

  // 2. Filter recipes by category and search text
  const filteredResults = useMemo(() => {
    return rankedResults.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All') {
        if (item.recipe.category !== selectedCategory) {
          return false;
        }
      }

      // Search query filter (matches recipe name or ingredient names)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = item.recipe.name.toLowerCase().includes(query);
        const matchesIngredient = item.recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(query)
        );
        return matchesName || matchesIngredient;
      }

      return true;
    });
  }, [rankedResults, selectedCategory, searchQuery]);

  // Handle card click: notify parent if callback exists, and set internal state
  const handleCardPress = (matchResult: RecipeMatchResult) => {
    if (onSelectRecipe) {
      onSelectRecipe(matchResult);
      return;
    }

    setSelectedMatch(matchResult);
  };

  // If a recipe is selected and no external navigator took over, render details screen
  if (selectedMatch) {
    return (
      <RecipeDetailsScreen
        matchResult={selectedMatch}
        onBack={() => setSelectedMatch(null)}
      />
    );
  }

  // Count ready to cook recipes
  const readyToCookCount = rankedResults.filter((r) => r.canCook).length;
  const isInventoryEmpty = foodItems.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cook What I Have</Text>
        <Text style={styles.headerSubtitle}>
          Meals ranked by your kitchen inventory and expiring ingredients.
        </Text>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color={FreshTheme.colors.primary} />
          <Text style={styles.stateTitle}>Matching Recipes...</Text>
          <Text style={styles.stateSubtitle}>
            Checking your kitchen ingredients and expiration dates.
          </Text>
        </View>
      ) : null}

      {/* Error State */}
      {!isLoading && errorMessage ? (
        <View style={[styles.stateCard, styles.errorStateCard]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Inventory</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Content when ready */}
      {!isLoading && !errorMessage ? (
        <>
          {/* Inventory Status Banner */}
          {isInventoryEmpty ? (
            <View style={styles.emptyNoticeBox}>
              <Text style={styles.emptyNoticeIcon}>📦</Text>
              <View style={styles.emptyNoticeContent}>
                <Text style={styles.emptyNoticeTitle}>Kitchen Inventory is Empty</Text>
                <Text style={styles.emptyNoticeText}>
                  Showing the full recipe catalogue with shopping needs. Add food in the Inventory tab to match meals automatically!
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsBar}>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeNum}>{readyToCookCount}</Text>
                <Text style={styles.statBadgeLabel}>Ready to Cook</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeNum}>{foodItems.length}</Text>
                <Text style={styles.statBadgeLabel}>Items in Kitchen</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeNum}>{rankedResults.length}</Text>
                <Text style={styles.statBadgeLabel}>Matched Meals</Text>
              </View>
            </View>
          )}

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes or ingredients..."
              placeholderTextColor={FreshTheme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Category Filter Chips */}
          <View style={styles.categoryRow}>
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Recipe Cards List */}
          {filteredResults.length > 0 ? (
            <View style={styles.cardsList}>
              {filteredResults.map((result) => (
                <RecipeCard
                  key={result.recipe.id}
                  matchResult={result}
                  onPress={() => handleCardPress(result)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noFilterResultsBox}>
              <Text style={styles.noFilterIcon}>🍳</Text>
              <Text style={styles.noFilterTitle}>No Matching Recipes</Text>
              <Text style={styles.noFilterSubtitle}>
                No recipes matched your search for "{searchQuery}".
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={styles.resetFilterBtn}>
                <Text style={styles.resetFilterBtnText}>Reset Filters</Text>
              </Pressable>
            </View>
          )}

          {/* Optional Return to Dashboard Button */}
          {onReturnToDashboard ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to Dashboard"
              onPress={onReturnToDashboard}
              style={styles.returnHomeBtn}>
              <Text style={styles.returnHomeBtnText}>← Return to Dashboard</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: FreshTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginTop: 20,
    ...FreshTheme.shadows.card,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginTop: 12,
  },
  stateSubtitle: {
    fontSize: 12,
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  errorStateCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    marginBottom: FreshTheme.spacing.md,
    gap: 10,
  },
  emptyNoticeIcon: {
    fontSize: 24,
  },
  emptyNoticeContent: {
    flex: 1,
  },
  emptyNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  emptyNoticeText: {
    fontSize: 11,
    color: '#0C4A6E',
    marginTop: 2,
    lineHeight: 16,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.md,
    ...FreshTheme.shadows.soft,
  },
  statBadge: {
    alignItems: 'center',
    flex: 1,
  },
  statBadgeNum: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  statBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: FreshTheme.colors.textMuted,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: FreshTheme.spacing.sm,
    ...FreshTheme.shadows.soft,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: FreshTheme.colors.textPrimary,
    padding: 0,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textMuted,
    paddingHorizontal: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: FreshTheme.spacing.md,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: FreshTheme.borderRadius.full,
  },
  categoryChipActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '800',
  },
  cardsList: {
    gap: 2,
  },
  noFilterResultsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
  },
  noFilterIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noFilterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
  },
  noFilterSubtitle: {
    fontSize: 12,
    color: FreshTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  resetFilterBtn: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: FreshTheme.borderRadius.full,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  returnHomeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingVertical: 12,
    borderRadius: FreshTheme.borderRadius.lg,
    alignItems: 'center',
    marginTop: FreshTheme.spacing.md,
    ...FreshTheme.shadows.soft,
  },
  returnHomeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
});
