import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { StorageFilter } from '../types/inventory.types';

interface StorageFilterTabsProps {
  activeFilter: StorageFilter;
  onSelectFilter: (filter: StorageFilter) => void;
  counts: {
    all: number;
    fridge: number;
    pantry: number;
    freezer: number;
  };
}

interface FilterTabOption {
  key: StorageFilter;
  label: string;
  icon: string;
}

const FILTER_OPTIONS: FilterTabOption[] = [
  { key: 'all', label: 'All', icon: '🧺' },
  { key: 'fridge', label: 'Fridge', icon: '🧊' },
  { key: 'pantry', label: 'Pantry', icon: '🍞' },
  { key: 'freezer', label: 'Freezer', icon: '❄️' },
];

export function StorageFilterTabs({
  activeFilter,
  onSelectFilter,
  counts,
}: StorageFilterTabsProps) {
  return (
    <View style={styles.container}>
      {FILTER_OPTIONS.map((opt) => {
        const isActive = activeFilter === opt.key;
        const count = counts[opt.key] ?? 0;

        return (
          <Pressable
            key={opt.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter by ${opt.label}, ${count} items`}
            onPress={() => onSelectFilter(opt.key)}
            style={({ pressed }) => [
              styles.tabChip,
              isActive && styles.tabChipActive,
              pressed && styles.tabChipPressed,
            ]}>
            <Text style={styles.tabIcon}>{opt.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
              ]}>
              {opt.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                isActive && styles.countBadgeActive,
              ]}>
              <Text
                style={[
                  styles.countBadgeText,
                  isActive && styles.countBadgeTextActive,
                ]}>
                {count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: FreshTheme.spacing.sm,
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: FreshTheme.borderRadius.lg,
    gap: 5,
    ...FreshTheme.shadows.soft,
  },
  tabChipActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  tabChipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  tabLabelActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: FreshTheme.borderRadius.full,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: FreshTheme.colors.primary,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
});
