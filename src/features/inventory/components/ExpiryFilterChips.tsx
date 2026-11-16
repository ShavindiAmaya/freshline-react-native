import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { ExpiryFilter } from '../types/inventory.types';

interface ExpiryFilterChipsProps {
  activeFilter: ExpiryFilter;
  onSelectFilter: (filter: ExpiryFilter) => void;
  counts: {
    all: number;
    'Use Today': number;
    'Use Soon': number;
    Fresh: number;
    Expired: number;
  };
}

interface ChipOption {
  key: ExpiryFilter;
  label: string;
  icon: string;
  activeStyle: {
    chip: object;
    label: object;
    badge: object;
    badgeText: object;
  };
}

const CHIP_OPTIONS: ChipOption[] = [
  {
    key: 'all',
    label: 'All',
    icon: '📋',
    activeStyle: {
      chip: { backgroundColor: FreshTheme.colors.primaryLight, borderColor: FreshTheme.colors.primary },
      label: { color: FreshTheme.colors.primaryDark, fontWeight: '800' },
      badge: { backgroundColor: FreshTheme.colors.primary },
      badgeText: { color: '#FFFFFF' },
    },
  },
  {
    key: 'Expired',
    label: 'Expired',
    icon: '🚨',
    activeStyle: {
      chip: { backgroundColor: FreshTheme.colors.useToday.badgeBg, borderColor: FreshTheme.colors.useToday.badgeBorder },
      label: { color: FreshTheme.colors.useToday.text, fontWeight: '800' },
      badge: { backgroundColor: FreshTheme.colors.useToday.text },
      badgeText: { color: '#FFFFFF' },
    },
  },
  {
    key: 'Use Today',
    label: 'Use Today',
    icon: '⚡',
    activeStyle: {
      chip: { backgroundColor: FreshTheme.colors.useToday.badgeBg, borderColor: FreshTheme.colors.useToday.badgeBorder },
      label: { color: FreshTheme.colors.useToday.text, fontWeight: '800' },
      badge: { backgroundColor: FreshTheme.colors.useToday.text },
      badgeText: { color: '#FFFFFF' },
    },
  },
  {
    key: 'Use Soon',
    label: 'Use Soon',
    icon: '⏳',
    activeStyle: {
      chip: { backgroundColor: FreshTheme.colors.useSoon.badgeBg, borderColor: FreshTheme.colors.useSoon.badgeBorder },
      label: { color: FreshTheme.colors.useSoon.text, fontWeight: '800' },
      badge: { backgroundColor: FreshTheme.colors.useSoon.text },
      badgeText: { color: '#FFFFFF' },
    },
  },
  {
    key: 'Fresh',
    label: 'Fresh',
    icon: '✅',
    activeStyle: {
      chip: { backgroundColor: FreshTheme.colors.fresh.badgeBg, borderColor: FreshTheme.colors.fresh.badgeBorder },
      label: { color: FreshTheme.colors.fresh.text, fontWeight: '800' },
      badge: { backgroundColor: FreshTheme.colors.fresh.text },
      badgeText: { color: '#FFFFFF' },
    },
  },
];

export function ExpiryFilterChips({
  activeFilter,
  onSelectFilter,
  counts,
}: ExpiryFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {CHIP_OPTIONS.map((opt) => {
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
              styles.chip,
              isActive && opt.activeStyle.chip,
              pressed && styles.chipPressed,
            ]}>
            <Text style={styles.chipIcon}>{opt.icon}</Text>
            <Text style={[styles.chipLabel, isActive && opt.activeStyle.label]}>
              {opt.label}
            </Text>
            <View style={[styles.countBadge, isActive && opt.activeStyle.badge]}>
              <Text style={[styles.countBadgeText, isActive && opt.activeStyle.badgeText]}>
                {count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: FreshTheme.borderRadius.full,
    gap: 5,
    ...FreshTheme.shadows.soft,
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  chipIcon: {
    fontSize: 12,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: FreshTheme.borderRadius.full,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
  },
});
