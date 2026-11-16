import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { usePathname } from 'expo-router';
import { FreshTheme } from '@/constants/freshline-theme';
import { AddFoodModal } from '../components/AddFoodModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { EditFoodModal } from '../components/EditFoodModal';
import { ExpiryFilterChips } from '../components/ExpiryFilterChips';
import { FoodDetailsModal } from '../components/FoodDetailsModal';
import { InventoryList } from '../components/InventoryList';
import { StorageFilterTabs } from '../components/StorageFilterTabs';
import { inventoryService } from '../services/inventoryService';
import {
  CreateFoodItemInput,
  ExpiryFilter,
  InventoryFoodItem,
  StorageFilter,
  UpdateFoodItemInput,
} from '../types/inventory.types';

export function InventoryScreen() {
  const pathname = usePathname();
  /**
   * Screen-focus reload using usePathname from expo-router.
   *
   * NOTE: usePathname is NOT a true navigation focus listener — it fires on
   * every route change in the app, including navigating *away* from this screen.
   * We therefore track the inventory's own route (captured once on mount) and
   * the previous pathname so we reload only when transitioning *back* to this
   * screen from a different route.  This gives one reload per return, with no
   * load on departure and no duplicate on the initial mount.
   *
   * Limitation: If expo-router or @react-navigation/native ever exposes
   * useFocusEffect in this SDK version, replace this block with that hook.
   */
  const inventoryRouteRef = useRef<string | null>(null); // set once on mount
  const prevPathnameRef = useRef<string | null>(null);   // tracks last seen pathname

  const [items, setItems] = useState<InventoryFoodItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<StorageFilter>('all');
  const [activeExpiryFilter, setActiveExpiryFilter] = useState<ExpiryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // True only during the very first fetch; prevents the empty state from
  // flashing before data arrives. Subsequent refreshes use isRefreshing.
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryFoodItem | null>(null);

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
      // After the first fetch (success or error), stop blocking the list view.
      setIsInitialLoad(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInventory();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (inventoryRouteRef.current === null) {
      // First mount: capture this screen's pathname and load once.
      inventoryRouteRef.current = pathname;
      prevPathnameRef.current = pathname;
      loadInventory();
      return;
    }
    // Only reload when we are transitioning BACK to the inventory route,
    // i.e. the new pathname is ours and the previous one was different.
    // This prevents a spurious load when navigating *away* from this screen.
    if (
      pathname === inventoryRouteRef.current &&
      prevPathnameRef.current !== inventoryRouteRef.current
    ) {
      loadInventory();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, loadInventory]);

  // Compute live counts for each storage location tab
  const counts = {
    all: items.length,
    Fridge: items.filter((i) => i.storageLocation === 'Fridge').length,
    Pantry: items.filter((i) => i.storageLocation === 'Pantry').length,
    Freezer: items.filter((i) => i.storageLocation === 'Freezer').length,
  };

  // Compute live counts for each expiry status chip (across all storage locations)
  const expiryCounts = {
    all: items.length,
    'Use Today': items.filter((i) => i.status === 'Use Today').length,
    'Use Soon': items.filter((i) => i.status === 'Use Soon').length,
    Fresh: items.filter((i) => i.status === 'Fresh').length,
    Expired: items.filter((i) => i.status === 'Expired').length,
  };

  // Filter items by storage location, expiry status, and search query.
  // All three filters are AND-ed together.
  const filteredItems = items.filter((item) => {
    const matchesStorage =
      activeFilter === 'all' || item.storageLocation === activeFilter;
    const matchesExpiry =
      activeExpiryFilter === 'all' || item.status === activeExpiryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesStorage && matchesExpiry && matchesSearch;
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
  const handlePressItem = (item: InventoryFoodItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  // Trigger Edit from Details Modal
  const handleTriggerEdit = (item: InventoryFoodItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  // Trigger Delete from Details Modal
  const handleTriggerDelete = (item: InventoryFoodItem) => {
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

      {/* Expiry Status Filter Chips */}
      <ExpiryFilterChips
        activeFilter={activeExpiryFilter}
        onSelectFilter={setActiveExpiryFilter}
        counts={expiryCounts}
      />

      {/* Main List — show spinner during initial fetch, list afterwards */}
      {isInitialLoad ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={FreshTheme.colors.primary}
            accessibilityLabel="Loading inventory"
          />
          <Text style={styles.loadingText}>Loading your inventory…</Text>
        </View>
      ) : (
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
            activeExpiryFilter={activeExpiryFilter}
            onPressItem={handlePressItem}
          />
        </ScrollView>
      )}

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
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
