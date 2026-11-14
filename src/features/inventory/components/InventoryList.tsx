import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodItem } from '@/types/food';
import { StorageFilter } from '../types/inventory.types';
import { FoodItemCard } from './FoodItemCard';

interface InventoryListProps {
  items: FoodItem[];
  activeFilter: StorageFilter;
  onPressItem: (item: FoodItem) => void;
}

export function InventoryList({
  items,
  activeFilter,
  onPressItem,
}: InventoryListProps) {
  if (items.length === 0) {
    const filterLabel =
      activeFilter === 'all'
        ? 'kitchen inventory'
        : `${activeFilter} storage`;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>🥗</Text>
        </View>
        <Text style={styles.emptyTitle}>No food items found</Text>
        <Text style={styles.emptySubtitle}>
          Your {filterLabel} has no tracked food items yet. Tap "+ Add Food" to
          start tracking freshness!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {items.map((item) => (
        <FoodItemCard
          key={item.id}
          item={item}
          onPress={onPressItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: FreshTheme.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginTop: 8,
    ...FreshTheme.shadows.soft,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
