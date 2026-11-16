import { FreshTheme } from '@/constants/freshline-theme';
import { StyleSheet, Text, View } from 'react-native';
import { ExpiryFilter, InventoryFoodItem, StorageFilter } from '../types/inventory.types';
import { FoodItemCard } from './FoodItemCard';

interface InventoryListProps {
  items: InventoryFoodItem[];
  activeFilter: StorageFilter;
  activeExpiryFilter: ExpiryFilter;
  onPressItem: (item: InventoryFoodItem) => void;
}

export function InventoryList({
  items,
  activeFilter,
  activeExpiryFilter,
  onPressItem,
}: InventoryListProps) {
  if (items.length === 0) {
    // Creates a readable description of the selected filters.
    const storageLabel =
      activeFilter === 'all' ? null : `${activeFilter} storage`;
    const expiryLabel =
      activeExpiryFilter === 'all' ? null : `"${activeExpiryFilter}"`;

    let filterDescription = 'your kitchen inventory';
    if (storageLabel && expiryLabel) {
      filterDescription = `${storageLabel} with status ${expiryLabel}`;
    } else if (storageLabel) {
      filterDescription = storageLabel;
    } else if (expiryLabel) {
      filterDescription = `items with status ${expiryLabel}`;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>🥗</Text>
        </View>
        <Text style={styles.emptyTitle}>No food items found</Text>
        <Text style={styles.emptySubtitle}>
          {activeExpiryFilter === 'all' && activeFilter === 'all'
            ? 'Your kitchen inventory has no tracked food items yet. Tap "+ Add Food" to start tracking freshness!'
            : `No items match ${filterDescription}. Try a different filter or add new food.`}
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
