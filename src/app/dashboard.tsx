import type { User } from '@supabase/supabase-js';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddFoodModal } from '@/components/dashboard/AddFoodModal';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ExpiringSoonList } from '@/components/dashboard/ExpiringSoonList';
import { Header } from '@/components/dashboard/Header';
import { ManageOptionsModal } from '@/components/dashboard/ManageOptionsModal';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecipeDetailModal } from '@/components/dashboard/RecipeDetailModal';
import { SummaryCards } from '@/components/dashboard/SummaryCards';

import { PREDEFINED_RECIPES, Recipe } from '@/features/recipes/data/recipes';
import {
  calculateRecipeRecommendations,
  RecipeRecommendation,
} from '@/features/recipes/services/recipe.service';

import { FreshTheme } from '@/constants/freshline-theme';
import {
  INITIAL_SUMMARY_STATS,
  INITIAL_USER_PROFILE,
} from '@/data/mock-food-data';
import {
  getCurrentSession,
  signOut,
  subscribeToAuthChanges,
} from '@/features/auth/services/auth.service';
import {
  InventoryOption,
  getInventoryOptions,
} from '@/features/inventory/services/inventory-options.service';
import {
  addFoodItem,
  deleteFoodItem,
  getFoodItems,
  markItemAsUsed,
  markItemAsWasted,
  updateFoodItem,
} from '@/features/inventory/services/inventory.service';
import {
  cancelAllExpiryNotifications,
  cancelProductNotifications,
  requestNotificationPermission,
  scheduleExpiryNotifications,
  sendTestNotification,
  syncExpiryNotifications,
  testAllExpiryNotifications,
} from '@/features/notifications/services/notification.service';
import {
  DietaryPreference,
  getProfile,
  updateDisplayName,
  updateProfile,
  uploadAvatar,
} from '@/features/profile/services/profile.service';
import { supabase } from '@/lib/supabase';
import {
  DashboardTab,
  FoodItem,
  FoodSummaryStats,
  StorageLocation,
  calculateExpiryStatus,
  getDaysRemaining,
} from '@/types/food';

const DIETARY_OPTIONS: { label: string; value: DietaryPreference }[] = [
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Non-Vegetarian', value: 'non_vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Not Set', value: 'not_set' },
];
const ALLERGY_OPTIONS = ['Peanuts', 'Milk', 'Eggs', 'Gluten', 'Soy', 'Shellfish'];
const CUISINE_OPTIONS = ['Sri Lankan', 'Indian', 'Chinese', 'Italian'];

export interface WeeklyWasteSummary {
  itemsUsed: number;
  itemsWasted: number;
  foodSavedPct: number;
}

export function calculateWeeklyWasteSummary(items: FoodItem[]): WeeklyWasteSummary {
  const now = new Date();

  let itemsUsed = 0;
  let itemsWasted = 0;

  for (const item of items) {
    // Existing items without action timestamps must not be counted as recent activity
    if (!item.actionDate) continue;

    const actionTime = new Date(item.actionDate).getTime();
    if (isNaN(actionTime)) continue;

    const diffDays = (now.getTime() - actionTime) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 7) {
      if (item.isUsed) {
        itemsUsed += 1;
      } else if (item.isWasted) {
        itemsWasted += 1;
      }
    }
  }

  const total = itemsUsed + itemsWasted;
  const foodSavedPct = total > 0 ? Math.round((itemsUsed / total) * 100) : 0;

  return {
    itemsUsed,
    itemsWasted,
    foodSavedPct,
  };
}

export default function FreshLineHomeScreen() {
  const router = useRouter();

  // Authentication state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Database-backed profile state
  const [databaseDisplayName, setDatabaseDisplayName] = useState<string | null>(
    null
  );
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [inventoryLoadError, setInventoryLoadError] = useState<string | null>(null);
  const [isSavingFoodItem, setIsSavingFoodItem] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<{
    categories: InventoryOption[];
    storageLocations: InventoryOption[];
  }>({ categories: [], storageLocations: [] });
  const [isManageOptionsOpen, setIsManageOptionsOpen] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState<'All' | StorageLocation>('All');
  const [inventoryStatusTab, setInventoryStatusTab] = useState<'unused' | 'used' | 'wasted'>('unused');
  const [itemToEdit, setItemToEdit] = useState<FoodItem | null>(null);
  const [stats, setStats] = useState<FoodSummaryStats>(INITIAL_SUMMARY_STATS);

  // Modals & Feedback State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Recipes State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAllRecipes, setShowAllRecipes] = useState(false);
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<
    'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Vegetarian'
  >('All');

  // Profile Settings State
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Food Preferences State
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('not_set');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [dislikedText, setDislikedText] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [hasPreferenceChanges, setHasPreferenceChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User profile preferences object for recipe recommendations
  const userPreferences = useMemo(
    () => ({
      dietary_preference: dietaryPreference,
      allergies: selectedAllergies,
      disliked_ingredients: dislikedText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      favorite_cuisines: selectedCuisines,
    }),
    [dietaryPreference, selectedAllergies, dislikedText, selectedCuisines]
  );

  // Dynamically calculate recommended recipes based on real inventory and preferences
  const recommendedRecipes = useMemo(() => {
    return calculateRecipeRecommendations(foodItems, userPreferences);
  }, [foodItems, userPreferences]);

  const activeRecommendation = useMemo(() => {
    if (!selectedRecipe) return null;
    return (
      recommendedRecipes.find((r) => r.recipe.id === selectedRecipe.id) || null
    );
  }, [selectedRecipe, recommendedRecipes]);

  // Restore the saved session and listen for authentication changes.
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToAuthChanges((_event, session) => {
      if (isMounted) {
        setAuthUser(session?.user ?? null);
      }
    });

    const restoreSession = async () => {
      try {
        const session = await getCurrentSession();
        if (isMounted) {
          setAuthUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to restore FreshLine session:', error);
        if (isMounted) {
          setAuthUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Load the signed-in user's profile from the shared Supabase profiles table.
  const loadDatabaseProfile = async () => {
    if (!authUser?.id) {
      setDatabaseDisplayName(null);
      setIsProfileLoading(false);
      setProfileLoadError(null);
      return;
    }

    setIsProfileLoading(true);
    setProfileLoadError(null);

    try {
      const data = await getProfile();

      if (data) {
        const name =
          typeof data.display_name === 'string'
            ? data.display_name.trim()
            : '';

        setDatabaseDisplayName(name || null);

        if (data.avatar_url) {
          setProfileAvatar(data.avatar_url);
        }

        const rawDietary = data.dietary_preference?.toLowerCase().trim();
        const loadedDietary: DietaryPreference =
          rawDietary === 'vegetarian' ||
          rawDietary === 'non_vegetarian' ||
          rawDietary === 'vegan' ||
          rawDietary === 'not_set'
            ? rawDietary
            : 'not_set';
        const loadedAllergies = Array.isArray(data.allergies) ? data.allergies : [];
        const loadedDisliked = Array.isArray(data.disliked_ingredients)
          ? data.disliked_ingredients.join(', ')
          : '';
        const loadedCuisines = Array.isArray(data.favorite_cuisines)
          ? data.favorite_cuisines
          : [];

        setDietaryPreference(loadedDietary);
        setSelectedAllergies(loadedAllergies);
        setDislikedText(loadedDisliked);
        setSelectedCuisines(loadedCuisines);
        setHasPreferenceChanges(false);
      }
    } catch (error) {
      console.error('Failed to load database profile:', error);
      setDatabaseDisplayName(null);
      setProfileLoadError(
        'Could not load profile details. Showing account name instead.'
      );
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    void loadDatabaseProfile();
  }, [authUser?.id]);

  // Load food items and options from Supabase for the current user
  const loadInventoryData = async () => {
    if (!authUser?.id) return;
    setIsInventoryLoading(true);
    setInventoryLoadError(null);

    try {
      const [items, options] = await Promise.all([
        getFoodItems(),
        getInventoryOptions(),
      ]);
      setFoodItems(items);
      setInventoryOptions(options);

      // Sync upcoming expiry local notifications on device for current user
      if (Platform.OS !== 'web' && authUser?.id) {
        void syncExpiryNotifications(items, authUser.id);
      }

      const activeItems = items.filter((i) => !i.isUsed && !i.isWasted);
      const expiringItems = items.filter(
        (i) =>
          !i.isUsed &&
          !i.isWasted &&
          (calculateExpiryStatus(i.expiryDate) === 'Use Today' ||
            calculateExpiryStatus(i.expiryDate) === 'Use Soon')
      );
      const usedItems = items.filter((i) => i.isUsed);

      setStats({
        total_items: activeItems.length,
        expiring_soon: expiringItems.length,
        food_saved: usedItems.length,
        co2_saved_kg: +(usedItems.length * 0.4).toFixed(1),
        money_saved_usd: +(usedItems.length * 3.5).toFixed(1),
      });
    } catch (err: any) {
      console.error('Failed to load inventory data from Supabase:', err);
      setInventoryLoadError(
        err?.message || 'Could not load your inventory. Please check your connection.'
      );
    } finally {
      setIsInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      void loadInventoryData();
    } else {
      setFoodItems([]);
      setInventoryOptions({ categories: [], storageLocations: [] });
      setIsInventoryLoading(false);
    }
  }, [authUser?.id]);

  // Check notification permission on mount without repeatedly prompting
  useEffect(() => {
    if (Platform.OS !== 'web') {
      void requestNotificationPermission(false).then((granted) => {
        setHasNotificationPermission(granted);
      });
    }
    void AsyncStorage.getItem('@freshline_notifications_enabled').then((val) => {
      if (val === 'false') {
        setIsNotificationsEnabled(false);
      }
    });
  }, []);

  // Toggle notifications ON / OFF
  const handleToggleNotifications = async (value: boolean) => {
    setIsNotificationsEnabled(value);
    await AsyncStorage.setItem('@freshline_notifications_enabled', String(value));

    if (value) {
      if (Platform.OS !== 'web') {
        const granted = await requestNotificationPermission(true);
        setHasNotificationPermission(granted);
        if (granted) {
          triggerToast('🔔 Expiry notifications enabled!');
          if (authUser?.id && foodItems.length > 0) {
            void syncExpiryNotifications(foodItems, authUser.id);
          }
        } else {
          setIsNotificationsEnabled(false);
          await AsyncStorage.setItem('@freshline_notifications_enabled', 'false');
          triggerToast('Notification permission denied in device settings.', 'error');
        }
      } else {
        triggerToast('🔔 Expiry notifications enabled!');
      }
    } else {
      if (Platform.OS !== 'web' && authUser?.id) {
        await cancelAllExpiryNotifications(authUser.id);
      }
      triggerToast('🔕 Expiry notifications paused');
    }
  };

  // Send a test notification in 10 seconds
  const handleTestNotification = async () => {
    if (isSendingTestNotif) return;
    setIsSendingTestNotif(true);
    try {
      await sendTestNotification();
      setHasNotificationPermission(true);
      triggerToast('🔔 Test reminder scheduled in 10s! Close or lock device to test.');
    } catch (err: any) {
      console.error('Test notification failed:', err);
      triggerToast(err?.message || 'Failed to schedule test notification.', 'error');
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  // Enable notifications prompt
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission(true);
    setHasNotificationPermission(granted);
    if (granted) {
      triggerToast('🔔 Expiry notifications enabled!');
      if (authUser?.id && foodItems.length > 0) {
        void syncExpiryNotifications(foodItems, authUser.id);
      }
    } else {
      triggerToast('Notification permission was not granted.', 'error');
    }
  };

  // Prefer the database name, then fall back to Supabase Auth metadata.
  const metadataDisplayName =
    typeof authUser?.user_metadata?.display_name === 'string'
      ? authUser.user_metadata.display_name.trim()
      : '';

  const legacyFullName =
    typeof authUser?.user_metadata?.full_name === 'string'
      ? authUser.user_metadata.full_name.trim()
      : '';

  const rawDisplayName =
    databaseDisplayName ||
    metadataDisplayName ||
    legacyFullName ||
    authUser?.email?.split('@')[0] ||
    'Member';

  // Capitalize first letter of name
  const displayName =
    rawDisplayName.trim().charAt(0).toUpperCase() + rawDisplayName.trim().slice(1);

  const userProfile = {
    ...INITIAL_USER_PROFILE,
    id: authUser?.id ?? INITIAL_USER_PROFILE.id,
    full_name: displayName,
    avatar_url: profileAvatar || '',
  };

  const memberSince = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const lastSignIn = authUser?.last_sign_in_at
    ? new Date(authUser.last_sign_in_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Today';

  // Pick profile photo from device/web
  const handlePickImage = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const ext = file.name?.split('.').pop() || 'png';
            const url = await uploadAvatar(file, ext);
            setProfileAvatar(url);
            triggerToast('Profile photo updated!');
          } catch (storageErr) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              if (event.target?.result) {
                const dataUrl = event.target.result as string;
                try {
                  await uploadAvatar(dataUrl);
                  setProfileAvatar(dataUrl);
                  triggerToast('Profile photo updated!');
                } catch {
                  setProfileAvatar(dataUrl);
                  triggerToast('Profile photo updated!');
                }
              }
            };
            reader.readAsDataURL(file);
          }
        }
      };
      input.click();
    }
  };

  // Change username
  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed) {
      triggerToast('Please enter a valid username', 'error');
      return;
    }
    setIsSavingUsername(true);
    try {
      await updateDisplayName(trimmed);
      setDatabaseDisplayName(trimmed);
      setNewUsername('');
      triggerToast('Username updated successfully!', 'success');
    } catch (err: any) {
      triggerToast(err?.message || 'Could not update username', 'error');
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Toggle dietary preference selection
  const toggleDietaryPreference = (value: DietaryPreference) => {
    setDietaryPreference((prev) => (prev === value ? 'not_set' : value));
    setHasPreferenceChanges(true);
  };

  // Toggle allergy selection
  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((item) => item !== allergy)
        : [...prev, allergy]
    );
    setHasPreferenceChanges(true);
  };

  // Toggle cuisine selection
  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((item) => item !== cuisine)
        : [...prev, cuisine]
    );
    setHasPreferenceChanges(true);
  };

  // Save food preferences
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const dislikedList = dislikedText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateProfile({
        dietary_preference: dietaryPreference,
        allergies: selectedAllergies,
        disliked_ingredients: dislikedList,
        favorite_cuisines: selectedCuisines,
      });

      // Saved successfully -> disable button until next change
      setHasPreferenceChanges(false);
      triggerToast('Food preferences saved successfully!', 'success');
    } catch (err: any) {
      triggerToast(err?.message || 'Could not save preferences', 'error');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Change password
  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      triggerToast('Password must be at least 6 characters', 'error');
      return;
    }

    const performPasswordUpdate = async () => {
      setIsSavingPassword(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
        setNewPassword('');
        triggerToast('Password changed successfully!', 'success');
      } catch (err: any) {
        triggerToast(err?.message || 'Could not update password', 'error');
      } finally {
        setIsSavingPassword(false);
      }
    };

    // Ask for confirmation before changing password
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Are you sure you want to change your password?'
      );
      if (confirmed) {
        void performPasswordUpdate();
      }
    } else {
      Alert.alert(
        'Change Password',
        'Are you sure you want to change your password?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Change', onPress: () => void performPasswordUpdate() },
        ]
      );
    }
  };

  // Show transient in-app toast notification
  const triggerToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3200);
  };

  // Mark food item as used/saved (connected to Supabase)
  const handleToggleUsed = async (id: string) => {
    const targetItem = foodItems.find((i) => i.id === id);
    if (!targetItem) return;
    const willBeUsed = !targetItem.isUsed;
    const nowIso = new Date().toISOString();

    // Optimistic update
    setFoodItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isUsed: willBeUsed,
              isWasted: false,
              actionDate: willBeUsed ? nowIso : null,
            }
          : item
      )
    );

    try {
      await markItemAsUsed(id, willBeUsed);

      // Notification update
      if (Platform.OS !== 'web') {
        if (willBeUsed) {
          void cancelProductNotifications(id, authUser?.id);
        } else if (authUser?.id) {
          void scheduleExpiryNotifications(
            { ...targetItem, isUsed: false, isWasted: false },
            authUser.id
          );
        }
      }

      triggerToast(
        willBeUsed
          ? `🎉 Marked "${targetItem.name}" as used!`
          : `Restored "${targetItem.name}" to active stock!`
      );
      setStats((prevStats) => ({
        ...prevStats,
        food_saved: willBeUsed
          ? prevStats.food_saved + 1
          : Math.max(0, prevStats.food_saved - 1),
        expiring_soon: willBeUsed
          ? Math.max(0, prevStats.expiring_soon - 1)
          : prevStats.expiring_soon + 1,
        co2_saved_kg: willBeUsed
          ? +(prevStats.co2_saved_kg + 0.4).toFixed(1)
          : Math.max(0, +(prevStats.co2_saved_kg - 0.4).toFixed(1)),
        money_saved_usd: willBeUsed
          ? +(prevStats.money_saved_usd + 3.5).toFixed(1)
          : Math.max(0, +(prevStats.money_saved_usd - 3.5).toFixed(1)),
      }));
    } catch (err: any) {
      console.error('Failed to update item status in Supabase:', err);
      // Revert optimistic update
      setFoodItems((prev) =>
        prev.map((item) => (item.id === id ? targetItem : item))
      );
      triggerToast(err?.message || 'Failed to update item status.', 'error');
    }
  };

  // Mark food item as wasted/discarded (connected to Supabase)
  const handleToggleWasted = async (id: string) => {
    const targetItem = foodItems.find((i) => i.id === id);
    if (!targetItem) return;
    const willBeWasted = !targetItem.isWasted;
    const nowIso = new Date().toISOString();

    // Optimistic update: an item cannot be both used and wasted
    setFoodItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isWasted: willBeWasted,
              isUsed: false,
              actionDate: willBeWasted ? nowIso : null,
            }
          : item
      )
    );

    try {
      await markItemAsWasted(id, willBeWasted);

      // Notification update: cancel when marked as wasted, reschedule if restored
      if (Platform.OS !== 'web') {
        if (willBeWasted) {
          void cancelProductNotifications(id, authUser?.id);
        } else if (authUser?.id) {
          void scheduleExpiryNotifications(
            { ...targetItem, isUsed: false, isWasted: false },
            authUser.id
          );
        }
      }

      triggerToast(
        willBeWasted
          ? `Marked "${targetItem.name}" as wasted.`
          : `Restored "${targetItem.name}" to active stock!`
      );
    } catch (err: any) {
      console.error('Failed to update wasted status in Supabase:', err);
      // Revert optimistic update
      setFoodItems((prev) =>
        prev.map((item) => (item.id === id ? targetItem : item))
      );
      triggerToast(err?.message || 'Failed to update item status.', 'error');
    }
  };

  // Add or Edit food item (connected to Supabase)
  const handleSaveFoodItem = async (itemData: {
    id?: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    purchaseDate: string;
    expiryDate: string;
    storageLocation: StorageLocation;
  }) => {
    setIsSavingFoodItem(true);
    try {
      if (itemData.id) {
        // Edit existing item
        const updatedItem = await updateFoodItem(itemData.id, itemData);
        setFoodItems((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );

        // Cancel old notifications and reschedule with updated expiry date
        if (Platform.OS !== 'web' && authUser?.id) {
          void cancelProductNotifications(updatedItem.id, authUser.id).then(() => {
            void scheduleExpiryNotifications(updatedItem, authUser.id);
          });
        }

        triggerToast(`Updated "${updatedItem.name}"`);
      } else {
        // Add new item
        const createdItem = await addFoodItem({
          name: itemData.name,
          category: itemData.category,
          quantity: itemData.quantity,
          unit: itemData.unit,
          purchaseDate: itemData.purchaseDate,
          expiryDate: itemData.expiryDate,
          storageLocation: itemData.storageLocation,
        });

        setFoodItems((prev) => [createdItem, ...prev]);

        // Schedule upcoming notifications for newly added item
        if (Platform.OS !== 'web' && authUser?.id) {
          void scheduleExpiryNotifications(createdItem, authUser.id);
        }

        setStats((prev) => ({
          ...prev,
          total_items: prev.total_items + 1,
          expiring_soon:
            createdItem.status === 'Use Today' || createdItem.status === 'Use Soon'
              ? prev.expiring_soon + 1
              : prev.expiring_soon,
        }));

        triggerToast(`Added "${createdItem.name}" to ${createdItem.storageLocation}!`);
      }

      setIsAddModalOpen(false);
      setItemToEdit(null);
    } catch (err: any) {
      console.error('Failed to save food item in Supabase:', err);
      triggerToast(err?.message || 'Failed to save food item.', 'error');
    } finally {
      setIsSavingFoodItem(false);
    }
  };

  // Delete food item with confirmation (connected to Supabase)
  const handleDeleteItem = (item: FoodItem) => {
    const confirmDelete = async () => {
      try {
        await deleteFoodItem(item.id);
        setFoodItems((prev) => prev.filter((i) => i.id !== item.id));

        // Cancel scheduled notifications for deleted item
        if (Platform.OS !== 'web') {
          void cancelProductNotifications(item.id, authUser?.id);
        }

        setStats((prev) => ({
          ...prev,
          total_items: Math.max(0, prev.total_items - 1),
          expiring_soon:
            item.status === 'Use Today' || item.status === 'Use Soon'
              ? Math.max(0, prev.expiring_soon - 1)
              : prev.expiring_soon,
        }));
        triggerToast(`Deleted "${item.name}"`);
      } catch (err: any) {
        console.error('Failed to delete food item from Supabase:', err);
        triggerToast(err?.message || 'Failed to delete food item.', 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const ok = window.confirm(`Are you sure you want to delete "${item.name}"?`);
        if (ok) void confirmDelete();
      } else {
        void confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Item',
        `Are you sure you want to remove "${item.name}" from your inventory?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void confirmDelete() },
        ]
      );
    }
  };

  // Action Handlers
  const handleViewInventory = () => {
    setActiveTab('inventory');
  };

  const handleExploreRecipes = () => {
    setActiveTab('recipes');
  };

  const handlePressFoodItem = (item: FoodItem) => {
    const days = getDaysRemaining(item.expiryDate);
    const status = calculateExpiryStatus(item.expiryDate);

    const actions: {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[] = [];

    if (item.isUsed) {
      actions.push({
        text: '↺ Restore to Active Stock',
        onPress: () => handleToggleUsed(item.id),
      });
    } else if (item.isWasted) {
      actions.push({
        text: '↺ Restore to Active Stock',
        onPress: () => handleToggleWasted(item.id),
      });
    } else {
      actions.push({
        text: '✓ Mark Used',
        onPress: () => handleToggleUsed(item.id),
      });
      actions.push({
        text: '🗑️ Mark as Wasted',
        onPress: () => handleToggleWasted(item.id),
      });
    }

    actions.push({
      text: 'Edit',
      onPress: () => {
        setItemToEdit(item);
        setIsAddModalOpen(true);
      },
    });

    actions.push({ text: 'Close', style: 'cancel' });

    Alert.alert(
      item.name,
      `Days Remaining: ${days} (${item.isWasted ? 'Wasted' : item.isUsed ? 'Used' : status})\nStorage: ${item.storageLocation}\nCategory: ${item.category}\nQuantity: ${item.quantity} ${item.unit}`,
      actions
    );
  };

  // Tab switching handler
  const handleSelectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (tab === 'recipes') {
      void loadInventoryData();
      triggerToast('🍳 Matching recipes for expiring items');
    } else if (tab === 'inventory') {
      triggerToast('📦 Viewing tracked food inventory');
    } else if (tab === 'insights') {
      void loadInventoryData();
      triggerToast('📊 Food waste impact analytics');
    }
  };

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadInventoryData(), loadDatabaseProfile()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sign out through the shared Supabase authentication service.
  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      if (Platform.OS !== 'web' && authUser?.id) {
        await cancelAllExpiryNotifications(authUser.id);
      }
      await signOut();
      router.replace('/auth-preview');
    } catch (error: any) {
      Alert.alert(
        'Sign Out Failed',
        error?.message || 'Unable to sign out. Please try again.'
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  // Protect dashboard content while session is checked and when signed out.
  if (authLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.authLoadingContainer]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <ActivityIndicator size="large" color={FreshTheme.colors.primary} />
        <Text style={styles.authLoadingText}>Checking your session...</Text>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return <Redirect href="/auth-preview" />;
  }

  // Only items expiring today (days === 0) or tomorrow (days === 1), excluding used and wasted items
  const expiringSoonItems = foodItems
    .filter((item) => {
      if (item.isUsed || item.isWasted || !item.expiryDate) return false;
      const days = getDaysRemaining(item.expiryDate);
      return days === 0 || days === 1;
    })
    .sort((a, b) => {
      return getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate);
    });

  // Render tab specific view
  const renderTabContent = () => {
    if (activeTab === 'inventory') {
      const unusedItems = foodItems.filter((i) => !i.isUsed && !i.isWasted);
      const usedItems = foodItems.filter((i) => i.isUsed);
      const wastedItems = foodItems.filter((i) => i.isWasted);

      const currentStatusItems =
        inventoryStatusTab === 'unused'
          ? unusedItems
          : inventoryStatusTab === 'used'
          ? usedItems
          : wastedItems;

      const userLocations =
        inventoryOptions.storageLocations.length > 0
          ? inventoryOptions.storageLocations.map((l) => l.name)
          : ['Fridge', 'Pantry', 'Freezer'];

      const displayedItems = currentStatusItems
        .filter((item) => {
          if (inventoryFilter === 'All') return true;
          return item.storageLocation === inventoryFilter;
        })
        .sort((a, b) => {
          if (inventoryStatusTab === 'unused') {
            return (
              new Date(a.expiryDate).getTime() -
              new Date(b.expiryDate).getTime()
            );
          }
          return (
            new Date(b.actionDate || b.createdAt || b.expiryDate).getTime() -
            new Date(a.actionDate || a.createdAt || a.expiryDate).getTime()
          );
        });

      return (
        <View style={styles.tabSectionWrapper}>
          {/* Header */}
          <View style={styles.inventoryHeaderRow}>
            <View>
              <Text style={styles.inventoryTitle}>Kitchen Inventory</Text>
              <Text style={styles.inventorySubtitle}>
                {inventoryStatusTab === 'unused'
                  ? `${unusedItems.length} active item${unusedItems.length === 1 ? '' : 's'} in stock`
                  : inventoryStatusTab === 'used'
                  ? `${usedItems.length} item${usedItems.length === 1 ? '' : 's'} marked as used`
                  : `${wastedItems.length} item${wastedItems.length === 1 ? '' : 's'} marked as wasted`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add Item"
              onPress={() => {
                setItemToEdit(null);
                setIsAddModalOpen(true);
              }}
              style={styles.addInventoryBtn}>
              <Text style={styles.addInventoryBtnText}>＋ Add Item</Text>
            </Pressable>
          </View>

          {/* Three-part Segment: Active vs Used vs Wasted */}
          <View style={styles.statusSegmentWrapper}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: inventoryStatusTab === 'unused' }}
              onPress={() => setInventoryStatusTab('unused')}
              style={[
                styles.statusSegmentBtn,
                inventoryStatusTab === 'unused' && styles.statusSegmentBtnActive,
              ]}>
              <Text
                style={[
                  styles.statusSegmentText,
                  inventoryStatusTab === 'unused' && styles.statusSegmentTextActive,
                ]}>
                Active ({unusedItems.length})
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: inventoryStatusTab === 'used' }}
              onPress={() => setInventoryStatusTab('used')}
              style={[
                styles.statusSegmentBtn,
                inventoryStatusTab === 'used' && styles.statusSegmentBtnActive,
              ]}>
              <Text
                style={[
                  styles.statusSegmentText,
                  inventoryStatusTab === 'used' && styles.statusSegmentTextActive,
                ]}>
                Used ({usedItems.length})
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: inventoryStatusTab === 'wasted' }}
              onPress={() => setInventoryStatusTab('wasted')}
              style={[
                styles.statusSegmentBtn,
                inventoryStatusTab === 'wasted' && styles.statusSegmentBtnActive,
              ]}>
              <Text
                style={[
                  styles.statusSegmentText,
                  inventoryStatusTab === 'wasted' && styles.statusSegmentTextActive,
                ]}>
                Wasted ({wastedItems.length})
              </Text>
            </Pressable>
          </View>

          {/* Location Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inventoryFilterContainer}
            style={styles.inventoryFilterScroll}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setInventoryFilter('All')}
              style={[
                styles.inventoryFilterChip,
                inventoryFilter === 'All' && styles.inventoryFilterChipActive,
              ]}>
              <Text
                style={[
                  styles.inventoryFilterChipText,
                  inventoryFilter === 'All' && styles.inventoryFilterChipTextActive,
                ]}>
                All ({currentStatusItems.length})
              </Text>
            </Pressable>

            {userLocations.map((locName) => {
              const count = currentStatusItems.filter(
                (i) => i.storageLocation === locName
              ).length;
              const isSelected = inventoryFilter === locName;
              return (
                <Pressable
                  key={locName}
                  accessibilityRole="button"
                  onPress={() => setInventoryFilter(locName)}
                  style={[
                    styles.inventoryFilterChip,
                    isSelected && styles.inventoryFilterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.inventoryFilterChipText,
                      isSelected && styles.inventoryFilterChipTextActive,
                    ]}>
                    {locName} ({count})
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage Custom Options"
              onPress={() => setIsManageOptionsOpen(true)}
              style={styles.manageOptionsChip}>
              <Text style={styles.manageOptionsChipText}>⚙ Options</Text>
            </Pressable>
          </ScrollView>

          {/* Loading or Error or Product Items List */}
          {isInventoryLoading ? (
            <View style={styles.inventoryLoadingBox}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.inventoryLoadingText}>
                Loading your inventory from Supabase...
              </Text>
            </View>
          ) : inventoryLoadError ? (
            <View style={styles.inventoryErrorBox}>
              <Text style={styles.inventoryErrorText}>⚠️ {inventoryLoadError}</Text>
              <Pressable
                onPress={() => void loadInventoryData()}
                style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : displayedItems.length === 0 ? (
            <View style={styles.emptyInventoryCard}>
              <View style={styles.emptyIconCircle}>
                <SymbolView
                  name={{
                    ios: inventoryStatusTab === 'unused' ? 'tray' : 'checkmark.circle',
                    android: inventoryStatusTab === 'unused' ? 'inbox' : 'check_circle',
                    web: inventoryStatusTab === 'unused' ? 'inbox' : 'check_circle',
                  }}
                  size={28}
                  tintColor="#94A3B8"
                />
              </View>
              <Text style={styles.emptyInventoryTitle}>
                {inventoryStatusTab === 'unused'
                  ? inventoryFilter === 'All'
                    ? 'No unused items in stock'
                    : `No unused items in ${inventoryFilter}`
                  : inventoryFilter === 'All'
                  ? 'No used items yet'
                  : `No used items in ${inventoryFilter}`}
              </Text>
              <Text style={styles.emptyInventorySubtitle}>
                {inventoryStatusTab === 'unused'
                  ? 'Add food items to monitor freshness, reduce waste, and plan meals.'
                  : 'Items you mark as used or saved will appear here.'}
              </Text>
              {inventoryStatusTab === 'unused' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setItemToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  style={styles.emptyAddBtn}>
                  <Text style={styles.emptyAddBtnText}>＋ Add Item</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setInventoryStatusTab('unused')}
                  style={styles.emptyAddBtn}>
                  <Text style={styles.emptyAddBtnText}>← View Active Stock</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.inventoryList}>
              {displayedItems.map((item) => {
                const days = getDaysRemaining(item.expiryDate);
                const status = calculateExpiryStatus(item.expiryDate);

                let badgeBg = '#ECFDF5';
                let badgeColor = '#15803D';
                let badgeBorder = '#BBF7D0';

                if (status === 'Expired') {
                  badgeBg = '#FEF2F2';
                  badgeColor = '#DC2626';
                  badgeBorder = '#FECACA';
                } else if (status === 'Use Today') {
                  badgeBg = '#FFF7ED';
                  badgeColor = '#EA580C';
                  badgeBorder = '#FFEDD5';
                } else if (status === 'Use Soon') {
                  badgeBg = '#FEFCE8';
                  badgeColor = '#CA8A04';
                  badgeBorder = '#FEF08A';
                }

                const daysRemainingText =
                  days < 0
                    ? `Expired ${Math.abs(days)}d ago`
                    : days === 0
                    ? 'Expires today'
                    : days === 1
                    ? '1 day left'
                    : `${days} days left`;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.inventoryCard,
                      (item.isUsed || item.isWasted) && styles.inventoryCardUsed,
                    ]}>
                    {/* Header Row: Product Name & Status Badge */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardTitleCol}>
                        <Text
                          style={[
                            styles.inventoryItemName,
                            (item.isUsed || item.isWasted) &&
                              styles.inventoryItemNameUsed,
                          ]}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.inventoryItemCategory}>
                          {item.category} • {item.storageLocation}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.naturalBadge,
                          {
                            backgroundColor: item.isWasted
                              ? '#FEE2E2'
                              : item.isUsed
                              ? '#F1F5F9'
                              : badgeBg,
                            borderColor: item.isWasted
                              ? '#FECACA'
                              : item.isUsed
                              ? '#E2E8F0'
                              : badgeBorder,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.naturalBadgeText,
                            {
                              color: item.isWasted
                                ? '#DC2626'
                                : item.isUsed
                                ? '#64748B'
                                : badgeColor,
                            },
                          ]}>
                          {item.isWasted
                            ? 'Wasted'
                            : item.isUsed
                            ? 'Used'
                            : status}
                        </Text>
                      </View>
                    </View>

                    {/* Metadata Row: Quantity, Expiry, Days */}
                    <View style={styles.cardMetaRow}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>Quantity</Text>
                        <Text style={styles.metaValue}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>

                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>Expiry Date</Text>
                        <Text style={styles.metaValue}>{item.expiryDate}</Text>
                      </View>

                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>Remaining</Text>
                        <Text
                          style={[
                            styles.metaValue,
                            {
                              color:
                                days <= 0
                                  ? '#DC2626'
                                  : days <= 2
                                  ? '#EA580C'
                                  : '#15803D',
                            },
                          ]}>
                          {daysRemainingText}
                        </Text>
                      </View>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.cardActionsRow}>
                      {item.isUsed ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleToggleUsed(item.id)}
                          style={[styles.actionPillBtn, styles.actionPillReopen]}>
                          <Text
                            style={[
                              styles.actionPillText,
                              styles.actionTextReopen,
                            ]}>
                            ↺ Restore to Stock
                          </Text>
                        </Pressable>
                      ) : item.isWasted ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleToggleWasted(item.id)}
                          style={[styles.actionPillBtn, styles.actionPillReopen]}>
                          <Text
                            style={[
                              styles.actionPillText,
                              styles.actionTextReopen,
                            ]}>
                            ↺ Restore to Stock
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handleToggleUsed(item.id)}
                            style={[styles.actionPillBtn, styles.actionPillUsed]}>
                            <Text
                              style={[
                                styles.actionPillText,
                                styles.actionTextUsed,
                              ]}>
                              ✓ Used
                            </Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handleToggleWasted(item.id)}
                            style={[
                              styles.actionPillBtn,
                              styles.actionPillWasted,
                            ]}>
                            <Text
                              style={[
                                styles.actionPillText,
                                styles.actionTextWasted,
                              ]}>
                              🗑️ Wasted
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      <View style={styles.cardSecondaryActions}>
                        {!item.isUsed && !item.isWasted && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setItemToEdit(item);
                              setIsAddModalOpen(true);
                            }}
                            style={styles.editPillBtn}>
                            <Text style={styles.editPillText}>Edit</Text>
                          </Pressable>
                        )}

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleDeleteItem(item)}
                          style={styles.deletePillBtn}>
                          <Text style={styles.deletePillText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    }

    if (activeTab === 'recipes') {
      const filteredRecommendations = recommendedRecipes.filter((item) => {
        const r = item.recipe;
        if (recipeCategoryFilter === 'All') return true;
        if (recipeCategoryFilter === 'Vegetarian') {
          return r.dietaryType === 'Vegetarian' || r.dietaryType === 'Vegan';
        }
        return r.category === recipeCategoryFilter;
      });

      const displayedRecommendations = showAllRecipes
        ? filteredRecommendations
        : filteredRecommendations.slice(0, 4);

      return (
        <View style={styles.tabSectionWrapper}>
          {/* Header */}
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>Smart Waste-Free Recipes</Text>
              <Text style={styles.tabSubtitle}>
                {filteredRecommendations.length} recipes matched to your kitchen inventory
              </Text>
            </View>
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recipeFilterScroll}
            contentContainerStyle={styles.recipeFilterContainer}>
            {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Vegetarian'] as const).map(
              (cat) => {
                const isActive = recipeCategoryFilter === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setRecipeCategoryFilter(cat)}
                    style={[
                      styles.recipeFilterChip,
                      isActive && styles.recipeFilterChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.recipeFilterText,
                        isActive && styles.recipeFilterTextActive,
                      ]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          {/* Recipes List */}
          {displayedRecommendations.length === 0 ? (
            <View style={styles.emptyRecCard}>
              <Text style={styles.emptyRecText}>
                No recipes matched your dietary preferences or allergies.
              </Text>
            </View>
          ) : (
            <View style={styles.recipesList}>
              {displayedRecommendations.map((item) => {
                const rec = item.recipe;
                const totalIngs = rec.keyIngredients.length;
                const availCount = item.availableIngredients.length;
                const hasExpiring = item.expiringIngredients.length > 0;

                return (
                  <Pressable
                    key={rec.id}
                    onPress={() => setSelectedRecipe(rec)}
                    style={({ pressed }) => [
                      styles.recipeCardModern,
                      pressed && styles.recipeCardPressed,
                    ]}>
                    {/* Thumbnail Image */}
                    <View style={styles.recipeImageWrapper}>
                      <Image
                        source={{ uri: rec.image }}
                        style={styles.recipeThumbImage}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.recipeIconTag}>
                        <Text style={styles.recipeIconSmall}>{rec.icon}</Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.recipeInfoBox}>
                      <View style={styles.recipeBadgeRow}>
                        <View
                          style={[
                            styles.scoreBadgePill,
                            {
                              backgroundColor:
                                item.matchScore >= 70
                                  ? '#DCFCE7'
                                  : item.matchScore >= 40
                                  ? '#FEF3C7'
                                  : '#F1F5F9',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.scoreBadgeText,
                              {
                                color:
                                  item.matchScore >= 70
                                    ? '#15803D'
                                    : item.matchScore >= 40
                                    ? '#B45309'
                                    : '#64748B',
                              },
                            ]}>
                            {item.matchScore}% Match
                          </Text>
                        </View>
                        <View style={styles.recipeBadgePill}>
                          <Text style={styles.recipeBadgeText}>{rec.badge}</Text>
                        </View>
                        <Text style={styles.recipeCategoryText}>{rec.category}</Text>
                      </View>

                      <Text style={styles.recipeTitleModern} numberOfLines={1}>
                        {rec.name}
                      </Text>

                      {/* Stock availability */}
                      <View style={styles.recipeStockRow}>
                        <Text style={styles.recipeStockAvailable}>
                          ✓ {availCount}/{totalIngs} in kitchen
                        </Text>
                        {item.missingIngredients.length > 0 && (
                          <Text style={styles.recipeStockMissing}>
                            • {item.missingIngredients.length} to buy
                          </Text>
                        )}
                      </View>

                      {availCount > 0 && (
                        <Text style={styles.recipeMatchedText} numberOfLines={1}>
                          In stock: {item.availableIngredients.join(', ')}
                        </Text>
                      )}

                      {item.missingIngredients.length > 0 && (
                        <Text style={styles.recipeMissingText} numberOfLines={1}>
                          Missing: {item.missingIngredients.join(', ')}
                        </Text>
                      )}

                      {hasExpiring && (
                        <View style={styles.expiringRescueTag}>
                          <Text style={styles.expiringRescueText} numberOfLines={1}>
                            ⚡ Rescues: {item.expiringIngredients.join(', ')}
                          </Text>
                        </View>
                      )}

                      <View style={styles.recipeFooterRow}>
                        <View style={styles.recipeTimeChip}>
                          <Text style={styles.recipeTimeIcon}>⏱️</Text>
                          <Text style={styles.recipeTimeText}>{rec.cookingTime}</Text>
                        </View>
                        <Text style={styles.viewRecipeLink}>View Recipe →</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* View All Recipes Button */}
          {!showAllRecipes && filteredRecommendations.length > 4 && (
            <Pressable
              onPress={() => setShowAllRecipes(true)}
              style={styles.viewAllRecipesBtn}>
              <Text style={styles.viewAllRecipesBtnText}>
                View All {filteredRecommendations.length} Recipes ↓
              </Text>
            </Pressable>
          )}

          {showAllRecipes && filteredRecommendations.length > 4 && (
            <Pressable
              onPress={() => setShowAllRecipes(false)}
              style={styles.collapseRecipesBtn}>
              <Text style={styles.collapseRecipesBtnText}>
                Show Fewer Recipes ↑
              </Text>
            </Pressable>
          )}

          {/* Existing Explore Screen Integration */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore more Expo features"
            onPress={() => router.push('/explore')}
            style={styles.exploreLinkBtn}>
            <Text style={styles.exploreLinkText}>
              Explore More FreshLine Features →
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === 'insights') {
      const summary = calculateWeeklyWasteSummary(foodItems);

      return (
        <View style={styles.tabSectionWrapper}>
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>Waste Prevention Insights</Text>
              <Text style={styles.tabSubtitle}>
                Household waste reduction and sustainability impact
              </Text>
            </View>
          </View>

          {/* Weekly Waste Summary Section (Above Tip Card) */}
          <View style={styles.weeklySummarySection}>
            <View style={styles.weeklySummaryHeaderRow}>
              <View>
                <Text style={styles.weeklySummaryTitle}>Weekly Waste Summary</Text>
                <Text style={styles.weeklySummarySubtitle}>
                  Recorded in the last 7 days
                </Text>
              </View>
              <View style={styles.weeklyBadge}>
                <Text style={styles.weeklyBadgeText}>Last 7 Days</Text>
              </View>
            </View>

            <View style={styles.weeklyCardsRow}>
              {/* Card 1: Items Used */}
              <View style={styles.weeklyCard}>
                <View style={[styles.weeklyCardIconWrap, styles.weeklyCardIconUsed]}>
                  <Text style={styles.weeklyCardIcon}>✓</Text>
                </View>
                <Text style={styles.weeklyCardValue}>{summary.itemsUsed}</Text>
                <Text style={styles.weeklyCardLabel}>Items Used</Text>
                <Text style={styles.weeklyCardSub}>Consumed</Text>
              </View>

              {/* Card 2: Items Wasted */}
              <View style={styles.weeklyCard}>
                <View style={[styles.weeklyCardIconWrap, styles.weeklyCardIconWasted]}>
                  <Text style={styles.weeklyCardIcon}>🗑️</Text>
                </View>
                <Text
                  style={[
                    styles.weeklyCardValue,
                    summary.itemsWasted > 0 && styles.weeklyCardValueWasted,
                  ]}>
                  {summary.itemsWasted}
                </Text>
                <Text style={styles.weeklyCardLabel}>Items Wasted</Text>
                <Text style={styles.weeklyCardSub}>Discarded</Text>
              </View>

              {/* Card 3: Food Saved (%) */}
              <View style={styles.weeklyCard}>
                <View style={[styles.weeklyCardIconWrap, styles.weeklyCardIconSaved]}>
                  <Text style={styles.weeklyCardIcon}>🌱</Text>
                </View>
                <Text style={[styles.weeklyCardValue, styles.weeklyCardValueSaved]}>
                  {summary.foodSavedPct}%
                </Text>
                <Text style={styles.weeklyCardLabel}>Food Saved</Text>
                <Text style={styles.weeklyCardSub}>Saved ratio</Text>
              </View>
            </View>
          </View>

          {/* Existing Food Saving Tip */}
          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>💡 Food Saving Tip</Text>
            <Text style={styles.insightBody}>
              Store tomatoes stem-side down at room temperature to preserve
              flavor and extend freshness by up to 4 days!
            </Text>
          </View>
        </View>
      );
    }

    if (activeTab === 'profile') {
      return (
        <View style={styles.tabSectionWrapper}>
          {/* Header */}
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>Account Settings</Text>
              <Text style={styles.tabSubtitle}>Manage your profile and security</Text>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  profileAvatar
                    ? { uri: profileAvatar }
                    : require('@/assets/images/default-avatar.png')
                }
                style={styles.profileAvatarImg}
                contentFit="cover"
              />
              <Pressable onPress={handlePickImage} style={styles.changePhotoBtn}>
                <Text style={styles.changePhotoBtnText}>📷 Change Photo</Text>
              </Pressable>
            </View>

            <Text style={styles.profileNameLarge}>{displayName}</Text>
            <Text style={styles.profileEmail}>{authUser.email || 'No email registered'}</Text>
          </View>

          {/* Account Summary */}
          <View style={styles.settingsSectionCard}>
            <Text style={styles.sectionHeaderTitle}>Account Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Login Email</Text>
              <Text style={styles.summaryValue}>{authUser.email || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Member Since</Text>
              <Text style={styles.summaryValue}>{memberSince}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Last Sign In</Text>
              <Text style={styles.summaryValue}>{lastSignIn}</Text>
            </View>
          </View>

          {/* Food Preferences */}
          <View style={styles.settingsSectionCard}>
            <Text style={styles.sectionHeaderTitle}>Food Preferences</Text>

            {/* Dietary Preference */}
            <Text style={styles.preferenceLabel}>Dietary Preference</Text>
            <View style={styles.checkboxGrid}>
              {DIETARY_OPTIONS.map((option) => {
                const isSelected = dietaryPreference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleDietaryPreference(option.value)}
                    style={styles.checkboxItem}>
                    <View
                      style={[
                        styles.checkboxBox,
                        isSelected && styles.checkboxBoxActive,
                      ]}>
                      {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.checkboxLabel,
                        isSelected && styles.checkboxLabelActive,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Allergies */}
            <Text style={styles.preferenceLabel}>Allergies</Text>
            <View style={styles.checkboxGrid}>
              {ALLERGY_OPTIONS.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy);
                return (
                  <Pressable
                    key={allergy}
                    onPress={() => toggleAllergy(allergy)}
                    style={styles.checkboxItem}>
                    <View
                      style={[
                        styles.checkboxBox,
                        isSelected && styles.checkboxBoxActive,
                      ]}>
                      {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.checkboxLabel,
                        isSelected && styles.checkboxLabelActive,
                      ]}>
                      {allergy}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Disliked Ingredients */}
            <Text style={styles.preferenceLabel}>Disliked Ingredients</Text>
            <TextInput
              value={dislikedText}
              onChangeText={(text) => {
                setDislikedText(text);
                setHasPreferenceChanges(true);
              }}
              placeholder="e.g. mushrooms, onions, cilantro"
              placeholderTextColor="#94A3B8"
              style={styles.settingsInput}
            />

            {/* Favorite Food Types */}
            <Text style={styles.preferenceLabel}>Favorite Food Types</Text>
            <View style={styles.checkboxGrid}>
              {CUISINE_OPTIONS.map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine);
                return (
                  <Pressable
                    key={cuisine}
                    onPress={() => toggleCuisine(cuisine)}
                    style={styles.checkboxItem}>
                    <View
                      style={[
                        styles.checkboxBox,
                        isSelected && styles.checkboxBoxActive,
                      ]}>
                      {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.checkboxLabel,
                        isSelected && styles.checkboxLabelActive,
                      ]}>
                      {cuisine}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Save Preferences Button */}
            <Pressable
              onPress={handleSavePreferences}
              disabled={!hasPreferenceChanges || isSavingPreferences}
              style={[
                styles.saveBtn,
                { marginTop: 10 },
                (!hasPreferenceChanges || isSavingPreferences) && styles.saveBtnDisabled,
              ]}>
              <Text style={styles.saveBtnText}>
                {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
              </Text>
            </Pressable>
          </View>

          {/* Change Username */}
          <View style={styles.settingsSectionCard}>
            <Text style={styles.sectionHeaderTitle}>Change Username</Text>
            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              placeholderTextColor="#94A3B8"
              style={styles.settingsInput}
            />
            <Pressable
              onPress={handleSaveUsername}
              disabled={!newUsername.trim() || isSavingUsername}
              style={[
                styles.saveBtn,
                (!newUsername.trim() || isSavingUsername) && styles.saveBtnDisabled,
              ]}>
              <Text style={styles.saveBtnText}>
                {isSavingUsername ? 'Saving...' : 'Save Username'}
              </Text>
            </Pressable>
          </View>

          {/* Change Password */}
          <View style={styles.settingsSectionCard}>
            <Text style={styles.sectionHeaderTitle}>Change Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                style={styles.passwordTextInput}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={10}
                style={styles.eyeBtn}>
                <SymbolView
                  name={{
                    ios: showPassword ? 'eye' : 'eye.slash',
                    android: showPassword ? 'visibility' : 'visibility_off',
                    web: showPassword ? 'visibility' : 'visibility_off',
                  }}
                  size={20}
                  tintColor="#64748B"
                />
              </Pressable>
            </View>
            <Pressable
              onPress={handleSavePassword}
              disabled={!newPassword.trim() || isSavingPassword}
              style={[
                styles.saveBtn,
                (!newPassword.trim() || isSavingPassword) && styles.saveBtnDisabled,
              ]}>
              <Text style={styles.saveBtnText}>
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </Text>
            </Pressable>
          </View>

          {/* Food Expiry Notifications */}
          <View style={styles.settingsSectionCard}>
            <Text style={styles.sectionHeaderTitle}>Food Expiry Notifications</Text>
            <Text style={styles.sectionSubtitle}>
              FreshLine sends automatic reminders 3 days before, 1 day before, and at 9:00 AM on expiry day.
            </Text>

            {Platform.OS === 'web' ? (
              <View style={styles.notifWebNotice}>
                <Text style={styles.notifWebNoticeText}>
                  ℹ️ Local push notifications are supported on Android and iOS mobile devices.
                </Text>
              </View>
            ) : (
              <>
                {!hasNotificationPermission && (
                  <View style={styles.notifDisabledBanner}>
                    <Text style={styles.notifDisabledText}>
                      ⚠️ Notification permissions are currently disabled.
                    </Text>
                    <Pressable
                      onPress={handleEnableNotifications}
                      style={styles.notifEnableBtn}>
                      <Text style={styles.notifEnableBtnText}>Enable</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.notifToggleContainer}>
                  <View style={styles.notifToggleTextWrapper}>
                    <Text style={styles.notifToggleTitle}>Expiry Notifications</Text>
                    <Text style={styles.notifToggleSubtitle}>
                      {isNotificationsEnabled
                        ? 'Active • Alerts for expiring food'
                        : 'Disabled • Alerts paused'}
                    </Text>
                  </View>
                  <Switch
                    value={isNotificationsEnabled}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                    thumbColor={isNotificationsEnabled ? '#16A34A' : '#F8FAFC'}
                  />
                </View>

                <Pressable
                  onPress={testAllExpiryNotifications}
                  style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>
                    🔔 Send Test Notifications
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Sign Out Button */}
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              isSigningOut && styles.signOutButtonDisabled,
              pressed && !isSigningOut && styles.signOutButtonPressed,
            ]}>
            <Text style={styles.signOutButtonText}>
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      );
    }

    // Default: Home Dashboard
    return (
      <>
        {/* 1. Summary Cards */}
        <SummaryCards
          stats={stats}
          onPressTotal={handleViewInventory}
          onPressExpiring={() => {
            triggerToast('Viewing items expiring within 2 days');
          }}
          onPressSaved={() => {
            triggerToast('8 meals prevented from going to waste!');
          }}
        />

        {/* 2. Quick Actions */}
        <QuickActions
          onAddFood={() => {
            setItemToEdit(null);
            setIsAddModalOpen(true);
          }}
          onViewInventory={handleViewInventory}
          onExploreRecipes={handleExploreRecipes}
        />

        {/* 3. Expiring Soon List (Only items expiring today or tomorrow) */}
        <ExpiringSoonList
          items={expiringSoonItems}
          onToggleUsed={handleToggleUsed}
          onPressItem={handlePressFoodItem}
          onPressViewAll={handleViewInventory}
        />

        {/* 4. Smart Recipe Recommendations (Top 3) */}
        <View style={styles.homeRecommendationsSection}>
          <View style={styles.homeRecHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.homeRecSectionTitle}>
                Smart Waste-Free Recipes
              </Text>
              <Text style={styles.homeRecSectionSubtitle}>
                Matched from your inventory & expiring items
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab('recipes')}
              style={styles.viewAllRecipesLink}>
              <Text style={styles.viewAllRecipesLinkText}>View All →</Text>
            </Pressable>
          </View>

          {recommendedRecipes.length === 0 ? (
            <View style={styles.emptyRecCard}>
              <Text style={styles.emptyRecText}>
                No recipes matched your dietary preferences or allergies.
              </Text>
            </View>
          ) : (
            <View style={styles.homeRecList}>
              {recommendedRecipes.slice(0, 3).map((item) => {
                const rec = item.recipe;
                const totalIngs = rec.keyIngredients.length;
                const availCount = item.availableIngredients.length;
                const hasExpiring = item.expiringIngredients.length > 0;

                return (
                  <Pressable
                    key={rec.id}
                    onPress={() => setSelectedRecipe(rec)}
                    style={({ pressed }) => [
                      styles.homeRecCard,
                      pressed && styles.recipeCardPressed,
                    ]}>
                    <View style={styles.homeRecImageWrapper}>
                      <Image
                        source={{ uri: rec.image }}
                        style={styles.homeRecThumbImage}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.homeRecIconTag}>
                        <Text style={styles.recipeIconSmall}>{rec.icon}</Text>
                      </View>
                    </View>

                    <View style={styles.homeRecInfo}>
                      <View style={styles.homeRecBadgeRow}>
                        <View
                          style={[
                            styles.scoreBadgePill,
                            {
                              backgroundColor:
                                item.matchScore >= 70
                                  ? '#DCFCE7'
                                  : item.matchScore >= 40
                                  ? '#FEF3C7'
                                  : '#F1F5F9',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.scoreBadgeText,
                              {
                                color:
                                  item.matchScore >= 70
                                    ? '#15803D'
                                    : item.matchScore >= 40
                                    ? '#B45309'
                                    : '#64748B',
                              },
                            ]}>
                            {item.matchScore}% Match
                          </Text>
                        </View>
                        <Text style={styles.homeRecTimeText}>⏱️ {rec.cookingTime}</Text>
                      </View>

                      <Text style={styles.homeRecTitle} numberOfLines={1}>
                        {rec.name}
                      </Text>

                      {/* Available ingredients count */}
                      <View style={styles.homeRecIngStatusRow}>
                        <Text style={styles.homeRecAvailCount}>
                          ✓ {availCount}/{totalIngs} ingredients ready
                        </Text>
                      </View>

                      {/* Matching ingredients names */}
                      {availCount > 0 ? (
                        <Text style={styles.homeRecAvailNames} numberOfLines={1}>
                          In stock: {item.availableIngredients.join(', ')}
                        </Text>
                      ) : (
                        <Text style={styles.homeRecMissingNames} numberOfLines={1}>
                          Need: {item.missingIngredients.slice(0, 3).join(', ')}
                        </Text>
                      )}

                      {/* Expiring callout */}
                      {hasExpiring && (
                        <View style={styles.expiringRescueTag}>
                          <Text style={styles.expiringRescueText} numberOfLines={1}>
                            ⚡ Uses expiring: {item.expiringIngredients.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </>
    );
  };

  const todayExpiringItems = foodItems.filter(
    (i) => !i.isUsed && !i.isWasted && getDaysRemaining(i.expiryDate) === 0
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[FreshTheme.colors.primary]}
          />
        }>
        {/* Header with FreshLine branding, greeting, avatar & notification */}
        <Header
          user={userProfile}
          unreadCount={todayExpiringItems.length}
          onPressNotification={() => setIsNotificationOpen(true)}
          onPressAvatar={() => setActiveTab('profile')}
        />

        {/* Active Tab Screen */}
        {renderTabContent()}

        {/* Bottom spacer for comfortable scroll above navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        unreadCount={todayExpiringItems.length}
      />

      {/* Add / Edit Food Modal Sheet */}
      <AddFoodModal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveFoodItem}
        itemToEdit={itemToEdit}
        categories={inventoryOptions.categories.map((c) => c.name)}
        storageLocations={inventoryOptions.storageLocations.map((l) => l.name)}
        onManageOptions={() => setIsManageOptionsOpen(true)}
        isSaving={isSavingFoodItem}
      />

      {/* Custom Options (Locations & Categories) Modal */}
      <ManageOptionsModal
        visible={isManageOptionsOpen}
        onClose={() => setIsManageOptionsOpen(false)}
        categories={inventoryOptions.categories}
        storageLocations={inventoryOptions.storageLocations}
        onOptionsUpdated={() => void loadInventoryData()}
      />

      {/* Notification Drawer Modal */}
      <Modal
        visible={isNotificationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNotificationOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsNotificationOpen(false)}>
          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>
                🔔 Freshness Alerts ({todayExpiringItems.length})
              </Text>
              <Pressable onPress={() => setIsNotificationOpen(false)}>
                <Text style={styles.closeNotificationText}>✕</Text>
              </Pressable>
            </View>

            {/* Notification Enable / Disable Toggle Switch */}
            <View style={styles.notifToggleContainer}>
              <View style={styles.notifToggleTextWrapper}>
                <Text style={styles.notifToggleTitle}>Expiry Notifications</Text>
                <Text style={styles.notifToggleSubtitle}>
                  {isNotificationsEnabled
                    ? 'Active • Alerts for expiring food'
                    : 'Disabled • Alerts paused'}
                </Text>
              </View>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={isNotificationsEnabled ? '#16A34A' : '#F8FAFC'}
              />
            </View>

            {Platform.OS !== 'web' && !hasNotificationPermission && isNotificationsEnabled && (
              <View style={styles.notifDisabledBanner}>
                <Text style={styles.notifDisabledText}>
                  ⚠️ Push notifications disabled on this device.
                </Text>
                <Pressable
                  onPress={handleEnableNotifications}
                  style={styles.notifEnableBtn}>
                  <Text style={styles.notifEnableBtnText}>Enable</Text>
                </Pressable>
              </View>
            )}

            {todayExpiringItems.length > 0 ? (
              <ScrollView
                style={{ maxHeight: 250, marginBottom: 12 }}
                showsVerticalScrollIndicator={false}>
                {todayExpiringItems.map((item) => (
                  <View key={item.id} style={styles.notificationItemUrgent}>
                    <Text style={styles.notifIcon}>⚠️</Text>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifItemName}>
                        {item.name} expires today!
                      </Text>
                      <Text style={styles.notifSub}>
                        {item.quantity} {item.unit} in {item.storageLocation}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.notifEmptyBox}>
                <Text style={styles.notifEmptyIcon}>🎉</Text>
                <Text style={styles.notifEmptyTitle}>All Fresh Today!</Text>
                <Text style={styles.notifEmptySub}>
                  No items are expiring today in your kitchen.
                </Text>
              </View>
            )}

            {Platform.OS !== 'web' && (
              <Pressable
                style={styles.notifTestBtn}
                onPress={testAllExpiryNotifications}>
                <Text style={styles.notifTestBtnText}>
                  🔔 Send Test Notifications
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.notifDoneBtn}
              onPress={() => {
                setIsNotificationOpen(false);
                setActiveTab('recipes');
              }}>
              <Text style={styles.notifDoneBtnText}>
                See Recipe Ideas for These Items →
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        visible={Boolean(selectedRecipe)}
        recipe={selectedRecipe}
        matchScore={activeRecommendation?.matchScore}
        availableIngredients={activeRecommendation?.availableIngredients}
        missingIngredients={activeRecommendation?.missingIngredients}
        expiringIngredients={activeRecommendation?.expiringIngredients}
        onClose={() => setSelectedRecipe(null)}
        onCookRecipe={(rec) => {
          setSelectedRecipe(null);
          triggerToast(`🍳 Started cooking "${rec.name}"!`);
        }}
      />

      {/* Professional In-App Toast Notification */}
      {toast && (
        <View
          style={[
            styles.toastContainer,
            toast.type === 'error' && styles.toastContainerError,
          ]}>
          <View
            style={[
              styles.toastIconBox,
              toast.type === 'error'
                ? styles.toastIconBoxError
                : styles.toastIconBoxSuccess,
            ]}>
            <Text style={styles.toastIconText}>
              {toast.type === 'error' ? '✕' : '✓'}
            </Text>
          </View>
          <Text style={styles.toastMessageText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
  },
  scrollContent: {
    paddingBottom: 24,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 16,
  },
  tabSectionWrapper: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.sm,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: FreshTheme.spacing.md,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  tabSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  addMiniBtn: {
    backgroundColor: FreshTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: FreshTheme.borderRadius.full,
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: FreshTheme.spacing.md,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: FreshTheme.borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  backHomeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingVertical: 12,
    borderRadius: FreshTheme.borderRadius.lg,
    alignItems: 'center',
    marginTop: 16,
    ...FreshTheme.shadows.soft,
  },
  backHomeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  recipeFilterScroll: {
    marginBottom: 14,
  },
  recipeFilterContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  recipeFilterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipeFilterChipActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  recipeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  recipeFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recipesList: {
    gap: 12,
  },
  recipeCardModern: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recipeCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  recipeImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  recipeThumbImage: {
    width: '100%',
    height: '100%',
  },
  recipeIconTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  recipeIconSmall: {
    fontSize: 12,
  },
  recipeInfoBox: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipeBadgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recipeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  recipeCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  recipeTitleModern: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  recipeIngredientsPreview: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  recipeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeTimeIcon: {
    fontSize: 11,
  },
  recipeTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  viewRecipeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  viewAllRecipesBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  viewAllRecipesBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  collapseRecipesBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  collapseRecipesBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scoreBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recipeStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  recipeStockAvailable: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  recipeStockMissing: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  recipeMatchedText: {
    fontSize: 11,
    color: '#166534',
    marginBottom: 2,
  },
  recipeMissingText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  expiringRescueTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  expiringRescueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  homeRecommendationsSection: {
    marginTop: 22,
    marginBottom: 10,
  },
  homeRecHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  homeRecSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  homeRecSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllRecipesLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllRecipesLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  homeRecList: {
    gap: 10,
  },
  homeRecCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  homeRecImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  homeRecThumbImage: {
    width: '100%',
    height: '100%',
  },
  homeRecIconTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  homeRecInfo: {
    flex: 1,
  },
  homeRecBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  homeRecTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  homeRecTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  homeRecIngStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  homeRecAvailCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  homeRecAvailNames: {
    fontSize: 11,
    color: '#166534',
    marginBottom: 3,
  },
  homeRecMissingNames: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
  },
  emptyRecCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyRecText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  exploreLinkBtn: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    borderRadius: FreshTheme.borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  exploreLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  insightBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginTop: 8,
    ...FreshTheme.shadows.soft,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 4,
  },
  insightBody: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 18,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileAvatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  changePhotoBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  profileNameLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  settingsSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  settingsInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  passwordInputWrapper: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 8,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
    paddingVertical: 5,
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  checkboxLabelActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  signOutButton: {
    width: '100%',
    minHeight: 48,
    marginTop: FreshTheme.spacing.lg,
    borderRadius: FreshTheme.borderRadius.lg,
    backgroundColor: FreshTheme.colors.useToday.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingVertical: 12,
  },
  signOutButtonDisabled: {
    opacity: 0.65,
  },
  signOutButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  signOutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  authLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authLoadingText: {
    marginTop: 12,
    color: FreshTheme.colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    ...FreshTheme.shadows.floating,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
  },
  closeNotificationText: {
    fontSize: 16,
    fontWeight: '700',
    color: FreshTheme.colors.textMuted,
    padding: 4,
  },
  notificationItemUrgent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    padding: 10,
    borderRadius: FreshTheme.borderRadius.md,
    marginBottom: 8,
    gap: 10,
  },
  notificationItemSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.useSoon.badgeBg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.useSoon.badgeBorder,
    padding: 10,
    borderRadius: FreshTheme.borderRadius.md,
    marginBottom: 14,
    gap: 10,
  },
  notifIcon: {
    fontSize: 22,
  },
  notifContent: {
    flex: 1,
  },
  notifItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  notifSub: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 1,
  },
  notifDoneBtn: {
    backgroundColor: FreshTheme.colors.primary,
    borderRadius: FreshTheme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  notifDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  notifToggleTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  notifToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifToggleSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  notifDisabledBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifDisabledText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  notifEnableBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  notifEnableBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notifEmptyBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  notifEmptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  notifEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifEmptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  notifTestBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: FreshTheme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  notifTestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  notifWebNotice: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  notifWebNoticeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  // Kitchen Inventory Screen Styles
  inventoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  inventoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  inventorySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  addInventoryBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInventoryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusSegmentWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  statusSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statusSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statusSegmentTextActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  inventoryFilterScroll: {
    marginBottom: 16,
  },
  inventoryFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  inventoryFilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  inventoryFilterChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
  },
  inventoryFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  inventoryFilterChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  manageOptionsChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageOptionsChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  inventoryLoadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inventoryLoadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  inventoryErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  inventoryErrorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inventoryList: {
    gap: 12,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inventoryCardUsed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.75,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  inventoryItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  inventoryItemNameUsed: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  inventoryItemCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  naturalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  naturalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  actionPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionPillUsed: {
    backgroundColor: '#DCFCE7',
  },
  actionPillWasted: {
    backgroundColor: '#FEE2E2',
  },
  actionPillReopen: {
    backgroundColor: '#F1F5F9',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionTextUsed: {
    color: '#15803D',
  },
  actionTextWasted: {
    color: '#DC2626',
  },
  actionTextReopen: {
    color: '#64748B',
  },
  weeklySummarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    ...FreshTheme.shadows.soft,
  },
  weeklySummaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  weeklySummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  weeklySummarySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  weeklyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weeklyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  weeklyCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weeklyCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  weeklyCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  weeklyCardIconUsed: {
    backgroundColor: '#DCFCE7',
  },
  weeklyCardIconWasted: {
    backgroundColor: '#FEE2E2',
  },
  weeklyCardIconSaved: {
    backgroundColor: '#ECFDF5',
  },
  weeklyCardIcon: {
    fontSize: 14,
  },
  weeklyCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  weeklyCardValueWasted: {
    color: '#DC2626',
  },
  weeklyCardValueSaved: {
    color: '#15803D',
  },
  weeklyCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 2,
  },
  weeklyCardSub: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  cardSecondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  deletePillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  deletePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyInventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyInventoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyInventorySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchTabHintCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  switchTabHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 56,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    zIndex: 9999,
    gap: 10,
    maxWidth: '92%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toastContainerError: {
    borderColor: '#EF4444',
  },
  toastIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconBoxSuccess: {
    backgroundColor: '#16A34A',
  },
  toastIconBoxError: {
    backgroundColor: '#EF4444',
  },
  toastIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  toastMessageText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
