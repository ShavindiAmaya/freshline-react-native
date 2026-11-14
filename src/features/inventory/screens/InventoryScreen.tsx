import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodItem } from '@/types/food';
import { AddFoodModal } from '../components/AddFoodModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { EditFoodModal } from '../components/EditFoodModal';
import { FoodDetailsModal } from '../components/FoodDetailsModal';
import { InventoryList } from '../components/InventoryList';
import { StorageFilterTabs } from '../components/StorageFilterTabs';
import { inventoryService } from '../services/inventoryService';
import {
  CreateFoodItemInput,
  StorageFilter,
  UpdateFoodItemInput,
} from '../types/inventory.types';

export function InventoryScreen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<StorageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // In-app transient notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 2600);
  };

  // Load items from isolated inventory service
  const loadInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getAll();
      setItems(data);
    } catch {
      showToast('⚠️ Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInventory();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Compute live counts for each storage location tab
  const counts = {
    all: items.length,
    fridge: items.filter((i) => i.storage_location === 'fridge').length,
    pantry: items.filter((i) => i.storage_location === 'pantry').length,
    freezer: items.filter((i) => i.storage_location === 'freezer').length,
  };

  // Filter items by storage location and search query
  const filteredItems = items.filter((item) => {
    const matchesFilter =
      activeFilter === 'all' || item.storage_location === activeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Action: Add Food
  const handleAddFood = async (newFood: CreateFoodItemInput) => {
    const created = await inventoryService.create(newFood);
    await loadInventory();
    showToast(`✅ Added "${created.name}" to inventory`);
  };

  // Action: Edit Food
  const handleUpdateFood = async (id: string, update: UpdateFoodItemInput) => {
    const updated = await inventoryService.update(id, update);
    await loadInventory();
    setSelectedItem(updated);
    showToast(`✏️ Updated "${updated.name}"`);
  };

  // Action: Delete Food
  const handleDeleteFood = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await inventoryService.delete(selectedItem.id);
      await loadInventory();
      showToast(`🗑️ Removed "${selectedItem.name}"`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch {
      showToast('⚠️ Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Details Modal when card is tapped
  const handlePressItem = (item: FoodItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  // Trigger Edit from Details Modal
  const handleTriggerEdit = (item: FoodItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  // Trigger Delete from Details Modal
  const handleTriggerDelete = (item: FoodItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.title}>Kitchen Inventory</Text>
          <Text style={styles.subtitle}>
            {items.length} items logged • Member B Module
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add New Food"
          onPress={() => setIsAddModalOpen(true)}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.addButtonText}>＋ Add Food</Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search food by name or category..."
          placeholderTextColor={FreshTheme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearchQuery('')}
            hitSlop={8}>
            <Text style={styles.clearSearchIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Storage Location Filter Tabs */}
      <StorageFilterTabs
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        counts={counts}
      />

      {/* Main List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[FreshTheme.colors.primary]}
          />
        }>
        <InventoryList
          items={filteredItems}
          activeFilter={activeFilter}
          onPressItem={handlePressItem}
        />
      </ScrollView>

      {/* In-app Toast Banner */}
      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      {/* Add Food Modal */}
      <AddFoodModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddFood}
      />

      {/* Food Details Modal */}
      <FoodDetailsModal
        visible={isDetailsModalOpen}
        item={selectedItem}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleTriggerEdit}
        onDelete={handleTriggerDelete}
      />

      {/* Edit Food Modal */}
      <EditFoodModal
        visible={isEditModalOpen}
        item={selectedItem}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateFood}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        visible={isDeleteDialogOpen}
        item={selectedItem}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteFood}
        isDeleting={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: FreshTheme.spacing.md,
  },
  headerTitleCol: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: FreshTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: FreshTheme.borderRadius.full,
    ...FreshTheme.shadows.soft,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    borderRadius: FreshTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
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
  clearSearchIcon: {
    fontSize: 13,
    color: FreshTheme.colors.textMuted,
    paddingHorizontal: 4,
  },
  scrollListContent: {
    paddingBottom: 40,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: FreshTheme.colors.primaryDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: FreshTheme.borderRadius.full,
    ...FreshTheme.shadows.floating,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
