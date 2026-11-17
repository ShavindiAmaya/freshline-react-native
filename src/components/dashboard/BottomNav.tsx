// Dashboard bottom navigation
import React, { type ComponentProps } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { DashboardTab } from '@/types/food';

interface BottomNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  unreadCount?: number;
}

interface NavItem {
  key: DashboardTab;
  label: string;
  icon: ComponentProps<typeof SymbolView>['name'];
}

// Navigation items with clean vector symbols
const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: { ios: 'house', android: 'home', web: 'home' } },
  { key: 'inventory', label: 'Inventory', icon: { ios: 'archivebox', android: 'inventory_2', web: 'inventory_2' } },
  { key: 'recipes', label: 'Recipes', icon: { ios: 'fork.knife', android: 'restaurant_menu', web: 'restaurant_menu' } },
  { key: 'insights', label: 'Insights', icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' } },
  { key: 'profile', label: 'Profile', icon: { ios: 'person', android: 'person', web: 'person' } },
];

export function BottomNav({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();
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
              {/* Icon with active highlight */}
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}>
                <SymbolView
                  name={item.icon}
                  size={20}
                  tintColor={isActive ? '#15803D' : '#64748B'}
                />
                {showBadge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Tab label */}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}>
                {item.label}
              </Text>

              {/* Active dot indicator */}
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
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: '#DCFCE7',
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#15803D',
    marginTop: 3,
  },
});
