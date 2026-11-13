import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExpiringSoonList } from '@/components/dashboard/ExpiringSoonList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MotivationalCard } from '@/components/dashboard/MotivationalCard';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { AddFoodModal } from '@/components/dashboard/AddFoodModal';

import { FreshTheme } from '@/constants/freshline-theme';
import {
  INITIAL_FOOD_ITEMS,
  INITIAL_SUMMARY_STATS,
  INITIAL_USER_PROFILE,
} from '@/data/mock-food-data';
import { DashboardTab, FoodItem, FoodSummaryStats } from '@/types/food';

export default function FreshLineHomeScreen() {
  const router = useRouter();

  // State Management (Ready to be wired to Supabase PostgreSQL)
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [userProfile] = useState(INITIAL_USER_PROFILE);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(INITIAL_FOOD_ITEMS);
  const [stats, setStats] = useState<FoodSummaryStats>(INITIAL_SUMMARY_STATS);

  // Modals & Feedback State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const handleAddFood = (newItem: Omit<FoodItem, 'id' | 'created_at'>) => {
    const createdItem: FoodItem = {
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

  const handlePressFoodItem = (item: FoodItem) => {
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
          <View style={styles.tabHeaderRow}>
            <View>
              <Text style={styles.tabTitle}>FreshLine Account</Text>
              <Text style={styles.tabSubtitle}>
                Sample Profile (Mock Data) • Demo Mode
              </Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileAvatarLarge}>
              <Text style={styles.profileAvatarLargeText}>AJ</Text>
            </View>
            <Text style={styles.profileNameLarge}>{userProfile.full_name}</Text>
            <Text style={styles.profileEmail}>alex.johnson@freshline.app</Text>

            <View style={styles.profileBadgeRow}>
              <View style={styles.profilePill}>
                <Text style={styles.profilePillText}>🌱 Eco Tier (Demo)</Text>
              </View>
              <View style={styles.profilePill}>
                <Text style={styles.profilePillText}>
                  🔥 {userProfile.streak_days} Day Streak (Demo)
                </Text>
              </View>
            </View>

            <View style={styles.dbStatusBox}>
              <View style={styles.dbStatusDot} />
              <Text style={styles.dbStatusText}>
                Demo Data - Connection Pending
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setActiveTab('home')}
            style={styles.backHomeBtn}>
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
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    ...FreshTheme.shadows.card,
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 3,
    borderColor: FreshTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileAvatarLargeText: {
    fontSize: 24,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  profileNameLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
    marginTop: 2,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  profilePill: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: FreshTheme.borderRadius.full,
  },
  profilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  dbStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: FreshTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
    justifyContent: 'center',
  },
  dbStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  dbStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
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
