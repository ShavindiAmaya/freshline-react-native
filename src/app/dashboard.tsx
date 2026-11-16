import type { User } from '@supabase/supabase-js';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddFoodModal } from '@/components/dashboard/AddFoodModal';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ExpiringSoonList } from '@/components/dashboard/ExpiringSoonList';
import { Header } from '@/components/dashboard/Header';
import { MotivationalCard } from '@/components/dashboard/MotivationalCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SummaryCards } from '@/components/dashboard/SummaryCards';

import { FreshTheme } from '@/constants/freshline-theme';
import {
  INITIAL_FOOD_ITEMS,
  INITIAL_SUMMARY_STATS,
  INITIAL_USER_PROFILE,
} from '@/data/mock-food-data';
import {
  getCurrentSession,
  signOut,
  subscribeToAuthChanges,
} from '@/features/auth/services/auth.service';
import {
  getProfile,
  updateDisplayName,
  updateProfile,
  uploadAvatar,
} from '@/features/profile/services/profile.service';
import { supabase } from '@/lib/supabase';
import { DashboardFoodItem, DashboardTab, FoodSummaryStats } from '@/types/food';

const DIETARY_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Not Set'];
const ALLERGY_OPTIONS = ['Peanuts', 'Milk', 'Eggs', 'Gluten', 'Soy', 'Shellfish'];
const CUISINE_OPTIONS = ['Sri Lankan', 'Indian', 'Chinese', 'Italian'];

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
  const [foodItems, setFoodItems] = useState<DashboardFoodItem[]>(INITIAL_FOOD_ITEMS);
  const [stats, setStats] = useState<FoodSummaryStats>(INITIAL_SUMMARY_STATS);

  // Modals & Feedback State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Settings State
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Food Preferences State
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [dislikedText, setDislikedText] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [hasPreferenceChanges, setHasPreferenceChanges] = useState(false);

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
  useEffect(() => {
    let isActive = true;

    if (!authUser?.id) {
      setDatabaseDisplayName(null);
      setIsProfileLoading(false);
      setProfileLoadError(null);

      return () => {
        isActive = false;
      };
    }

    const loadDatabaseProfile = async () => {
      setIsProfileLoading(true);
      setProfileLoadError(null);

      try {
        const data = await getProfile();

        if (!isActive) return;

        if (data) {
          const name =
            typeof data.display_name === 'string'
              ? data.display_name.trim()
              : '';

          setDatabaseDisplayName(name || null);

          if (data.avatar_url) {
            setProfileAvatar(data.avatar_url);
          }

          const loadedDietary = data.dietary_preference || '';
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

        if (isActive) {
          setDatabaseDisplayName(null);
          setProfileLoadError(
            'Could not load profile details. Showing account name instead.'
          );
        }
      } finally {
        if (isActive) {
          setIsProfileLoading(false);
        }
      }
    };

    void loadDatabaseProfile();

    return () => {
      isActive = false;
    };
  }, [authUser?.id]);

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
      Alert.alert('Username Required', 'Please enter a valid username.');
      return;
    }
    setIsSavingUsername(true);
    try {
      await updateDisplayName(trimmed);
      setDatabaseDisplayName(trimmed);
      setNewUsername('');
      triggerToast('Username updated!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Toggle dietary preference selection
  const toggleDietaryPreference = (option: string) => {
    setDietaryPreference((prev) => (prev === option ? '' : option));
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
      triggerToast('Food preferences saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Change password
  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword('');
      triggerToast('Password updated!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Show transient in-app toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Mark food item as used/saved
  const handleToggleUsed = (id: string) => {
    setFoodItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const willBeUsed = !item.is_used;
          if (willBeUsed) {
            triggerToast(`🎉 Marked "${item.name}" as saved!`);
            setStats((prevStats) => ({
              ...prevStats,
              food_saved: prevStats.food_saved + 1,
              expiring_soon: Math.max(0, prevStats.expiring_soon - 1),
              co2_saved_kg: +(prevStats.co2_saved_kg + 0.4).toFixed(1),
              money_saved_usd: +(prevStats.money_saved_usd + 3.5).toFixed(1),
            }));
          } else {
            setStats((prevStats) => ({
              ...prevStats,
              food_saved: Math.max(0, prevStats.food_saved - 1),
              expiring_soon: prevStats.expiring_soon + 1,
            }));
          }
          return { ...item, is_used: willBeUsed };
        }
        return item;
      })
    );
  };

  // Add new food item (Supabase INSERT simulation)
  const handleAddFood = (newItem: Omit<DashboardFoodItem, 'id' | 'created_at'>) => {
    const createdItem: DashboardFoodItem = {
      ...newItem,
      id: `food_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setFoodItems((prev) => [createdItem, ...prev]);
    setStats((prev) => ({
      ...prev,
      total_items: prev.total_items + 1,
      expiring_soon:
        createdItem.days_left <= 2
          ? prev.expiring_soon + 1
          : prev.expiring_soon,
    }));

    triggerToast(`🥗 Added "${createdItem.name}" to inventory!`);
  };

  // Action Handlers
  const handleViewInventory = () => {
    setActiveTab('inventory');
  };

  const handleExploreRecipes = () => {
    setActiveTab('recipes');
  };

  const handlePressFoodItem = (item: DashboardFoodItem) => {
    Alert.alert(
      `${item.icon} ${item.name}`,
      `Days Remaining: ${item.days_left} (${item.status_label})\nStorage: ${item.storage_location}\nCategory: ${item.category}\n\nStatus: Demo Data - Connection Pending`,
      [
        {
          text: item.is_used ? 'Mark Unused' : '✓ Mark Saved/Used',
          onPress: () => handleToggleUsed(item.id),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  // Tab switching handler
  const handleSelectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (tab === 'recipes') {
      triggerToast('🍳 Matching recipes for expiring items');
    } else if (tab === 'inventory') {
      triggerToast('📦 Viewing tracked food inventory');
    } else if (tab === 'insights') {
      triggerToast('📊 Food waste impact analytics');
    }
  };

  // Sign out through the shared Supabase authentication service.
  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
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

  // Render tab specific view
  const renderTabContent = () => {
    if (activeTab === 'inventory') {
      return (
        <View style={styles.tabSectionWrapper}>
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>Kitchen Inventory</Text>
              <Text style={styles.tabSubtitle}>
                {foodItems.length} items logged • Demo Data - Connection Pending
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add Item"
              onPress={() => setIsAddModalOpen(true)}
              style={styles.addMiniBtn}>
              <Text style={styles.addMiniBtnText}>＋ Add Item</Text>
            </Pressable>
          </View>

          {/* Location Filters */}
          <View style={styles.filterRow}>
            {['All', 'Fridge (3)', 'Pantry (1)', 'Freezer (0)'].map(
              (f, idx) => (
                <View
                  key={f}
                  style={[
                    styles.filterChip,
                    idx === 0 && styles.filterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      idx === 0 && styles.filterChipTextActive,
                    ]}>
                    {f}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Full List */}
          <ExpiringSoonList
            items={foodItems}
            onToggleUsed={handleToggleUsed}
            onPressItem={handlePressFoodItem}
            onPressViewAll={() => triggerToast('All inventory items loaded')}
          />

          <Pressable
            onPress={() => setActiveTab('home')}
            style={styles.backHomeBtn}>
            <Text style={styles.backHomeBtnText}>← Return to Dashboard</Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === 'recipes') {
      return (
        <View style={styles.tabSectionWrapper}>
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>Smart Waste-Free Recipes</Text>
              <Text style={styles.tabSubtitle}>
                Cook with your expiring Milk, Chicken & Tomatoes
              </Text>
            </View>
          </View>

          <View style={styles.recipesList}>
            {[
              {
                title: 'Creamy Tomato & Chicken Skillet',
                time: '25 mins',
                rescues: 'Chicken (1d), Tomatoes (2d)',
                tag: 'Save 2 items',
                icon: '🥘',
              },
              {
                title: 'Golden Milk Custard French Toast',
                time: '15 mins',
                rescues: 'Milk (0d), Eggs (10d)',
                tag: 'Use Today priority',
                icon: '🍞',
              },
              {
                title: 'Farmhouse Garden Omelette',
                time: '10 mins',
                rescues: 'Eggs, Tomatoes',
                tag: 'High protein',
                icon: '🍳',
              },
            ].map((rec) => (
              <View key={rec.title} style={styles.recipeCard}>
                <View style={styles.recipeIconBox}>
                  <Text style={styles.recipeIconText}>{rec.icon}</Text>
                </View>
                <View style={styles.recipeDetails}>
                  <View style={styles.recipeTagPill}>
                    <Text style={styles.recipeTagText}>{rec.tag}</Text>
                  </View>
                  <Text style={styles.recipeCardTitle}>{rec.title}</Text>
                  <Text style={styles.recipeRescues}>
                    🥬 Rescues: {rec.rescues}
                  </Text>
                  <Text style={styles.recipeTime}>⏱️ Ready in {rec.time}</Text>
                </View>
              </View>
            ))}
          </View>

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

          <Pressable
            onPress={() => setActiveTab('home')}
            style={styles.backHomeBtn}>
            <Text style={styles.backHomeBtnText}>← Return to Dashboard</Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === 'insights') {
      return (
        <View style={styles.tabSectionWrapper}>
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>Waste Prevention Insights</Text>
              <Text style={styles.tabSubtitle}>
                Sample household statistics • Demo Data - Connection Pending
              </Text>
            </View>
          </View>

          <MotivationalCard
            foodSavedCount={stats.food_saved}
            co2SavedKg={stats.co2_saved_kg}
            moneySavedUsd={stats.money_saved_usd}
            onPressLearnMore={() =>
              triggerToast('Detailed weekly reports available once backend is connected')
            }
          />

          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>💡 Food Saving Tip</Text>
            <Text style={styles.insightBody}>
              Store tomatoes stem-side down at room temperature to preserve
              flavor and extend freshness by up to 4 days!
            </Text>
          </View>

          <Pressable
            onPress={() => setActiveTab('home')}
            style={styles.backHomeBtn}>
            <Text style={styles.backHomeBtnText}>← Return to Dashboard</Text>
          </Pressable>
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
                const isSelected = dietaryPreference === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleDietaryPreference(option)}
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
                      {option}
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
              disabled={isSavingUsername}
              style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>
                {isSavingUsername ? 'Saving...' : 'Save Username'}
              </Text>
            </Pressable>
          </View>

          {/* Change Password */}
          <View style={styles.settingsSectionCard}>
            <Text style={styles.sectionHeaderTitle}>Change Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 6 characters)"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.settingsInput}
            />
            <Pressable
              onPress={handleSavePassword}
              disabled={isSavingPassword}
              style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </Text>
            </Pressable>
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

          {/* Return to Dashboard */}
          <Pressable onPress={() => setActiveTab('home')} style={styles.backHomeBtn}>
            <Text style={styles.backHomeBtnText}>← Return to Dashboard</Text>
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
          onAddFood={() => setIsAddModalOpen(true)}
          onViewInventory={handleViewInventory}
          onExploreRecipes={handleExploreRecipes}
        />

        {/* 3. Expiring Soon List */}
        <ExpiringSoonList
          items={foodItems}
          onToggleUsed={handleToggleUsed}
          onPressItem={handlePressFoodItem}
          onPressViewAll={handleViewInventory}
        />

        {/* 4. Motivational Card */}
        <MotivationalCard
          foodSavedCount={stats.food_saved}
          co2SavedKg={stats.co2_saved_kg}
          moneySavedUsd={stats.money_saved_usd}
          onPressLearnMore={() => setActiveTab('insights')}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header with FreshLine branding, greeting, avatar & notification */}
        <Header
          user={userProfile}
          unreadCount={stats.expiring_soon}
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
        unreadCount={stats.expiring_soon}
      />

      {/* Add Food Modal Sheet */}
      <AddFoodModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddFood}
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
                🔔 Freshness Alerts ({stats.expiring_soon})
              </Text>
              <Pressable onPress={() => setIsNotificationOpen(false)}>
                <Text style={styles.closeNotificationText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.notificationItemUrgent}>
              <Text style={styles.notifIcon}>🥛</Text>
              <View style={styles.notifContent}>
                <Text style={styles.notifItemName}>Milk expires today!</Text>
                <Text style={styles.notifSub}>
                  Use today in coffee, cereal or custard
                </Text>
              </View>
            </View>

            <View style={styles.notificationItemSoon}>
              <Text style={styles.notifIcon}>🍗</Text>
              <View style={styles.notifContent}>
                <Text style={styles.notifItemName}>Chicken expires tomorrow</Text>
                <Text style={styles.notifSub}>Marinate or freeze to preserve</Text>
              </View>
            </View>

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

      {/* In-app Toast Banner */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
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
  recipesList: {
    gap: 10,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    alignItems: 'center',
    ...FreshTheme.shadows.card,
  },
  recipeIconBox: {
    width: 48,
    height: 48,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipeIconText: {
    fontSize: 24,
  },
  recipeDetails: {
    flex: 1,
  },
  recipeTagPill: {
    backgroundColor: FreshTheme.colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  recipeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  recipeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  recipeRescues: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.primaryDark,
    marginTop: 2,
  },
  recipeTime: {
    fontSize: 10,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
    marginTop: 2,
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
  toast: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 36 : 54,
    alignSelf: 'center',
    backgroundColor: FreshTheme.colors.primaryDeep,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: FreshTheme.borderRadius.full,
    zIndex: 9999,
    ...FreshTheme.shadows.floating,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
