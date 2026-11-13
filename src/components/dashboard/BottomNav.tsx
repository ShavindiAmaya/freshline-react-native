import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FreshTheme } from '@/constants/freshline-theme';
import { DashboardTab } from '@/types/food';

interface BottomNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  unreadCount?: number;
}

interface NavItem {
  key: DashboardTab;
  label: string;
  icon: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'recipes', label: 'Recipes', icon: '🍳' },
  { key: 'insights', label: 'Insights', icon: '📊' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

export function BottomNav({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();

  // Ensure adequate bottom padding on both Android and iOS
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <View style={styles.container}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const showBadge = item.key === 'inventory' && unreadCount > 0;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label} tab`}
              onPress={() => onSelectTab(item.key)}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && styles.tabButtonPressed,
              ]}>
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}>
                <Text style={styles.tabIcon}>{item.icon}</Text>
                {showBadge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}>
                {item.label}
              </Text>

              {/* Active Indicator Dot */}
              {isActive && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...FreshTheme.shadows.floating,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 8,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  iconContainer: {
    width: 38,
    height: 32,
    borderRadius: FreshTheme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: FreshTheme.colors.useToday.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textMuted,
    marginTop: 1,
  },
  tabLabelActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: FreshTheme.colors.primary,
    marginTop: 3,
  },
});

