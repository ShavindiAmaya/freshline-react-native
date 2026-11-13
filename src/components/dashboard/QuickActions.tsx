import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';

interface QuickActionsProps {
  onAddFood: () => void;
  onViewInventory: () => void;
  onExploreRecipes: () => void;
}

export function QuickActions({
  onAddFood,
  onViewInventory,
  onExploreRecipes,
}: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsRow}>
        {/* Add Food (Primary highlighted action) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add Food"
          onPress={onAddFood}
          style={({ pressed }) => [
            styles.actionCard,
            styles.actionCardPrimary,
            pressed && styles.actionCardPressed,
          ]}>
          <View style={styles.primaryIconWrapper}>
            <Text style={styles.primaryIconText}>＋</Text>
          </View>
          <Text style={styles.primaryTitle}>Add Food</Text>
          <Text style={styles.primarySubtitle}>Scan or log item</Text>
        </Pressable>

        {/* View Inventory */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View Inventory"
          onPress={onViewInventory}
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
          <View style={[styles.iconWrapper, styles.inventoryIconBg]}>
            <Text style={styles.actionIconGlyph}>📦</Text>
          </View>
          <Text style={styles.actionTitle}>View Inventory</Text>
          <Text style={styles.actionSubtitle}>Fridge & pantry</Text>
        </Pressable>

        {/* Explore Recipes */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore Recipes"
          onPress={onExploreRecipes}
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
          <View style={[styles.iconWrapper, styles.recipesIconBg]}>
            <Text style={styles.actionIconGlyph}>🍳</Text>
          </View>
          <Text style={styles.actionTitle}>Explore Recipes</Text>
          <Text style={styles.actionSubtitle}>Cook from leftovers</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: FreshTheme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: FreshTheme.spacing.sm + 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: FreshTheme.spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.lg,
    paddingVertical: FreshTheme.spacing.md,
    paddingHorizontal: FreshTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    ...FreshTheme.shadows.card,
  },
  actionCardPrimary: {
    backgroundColor: FreshTheme.colors.primary,
    borderColor: FreshTheme.colors.primaryDark,
  },
  actionCardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  primaryIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryIconText: {
    fontSize: 22,
    color: FreshTheme.colors.primaryDark,
    fontWeight: '800',
    lineHeight: 24,
  },
  primaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  primarySubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: FreshTheme.colors.primaryLight,
    textAlign: 'center',
    marginTop: 2,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: FreshTheme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  inventoryIconBg: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  recipesIconBg: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionIconGlyph: {
    fontSize: 18,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});

