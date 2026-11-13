import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodItem, FreshnessStatus } from '@/types/food';

interface ExpiringSoonListProps {
  items: FoodItem[];
  onToggleUsed?: (id: string) => void;
  onPressItem?: (item: FoodItem) => void;
  onPressViewAll?: () => void;
}

export function ExpiringSoonList({
  items,
  onToggleUsed,
  onPressItem,
  onPressViewAll,
}: ExpiringSoonListProps) {
  const getBadgeStyle = (status: FreshnessStatus) => {
    switch (status) {
      case 'use_today':
        return {
          container: styles.badgeUseToday,
          text: styles.badgeTextUseToday,
          dot: styles.badgeDotUseToday,
          bar: styles.progressBarUseToday,
          cardHighlight: styles.cardHighlightUseToday,
        };
      case 'use_soon':
        return {
          container: styles.badgeUseSoon,
          text: styles.badgeTextUseSoon,
          dot: styles.badgeDotUseSoon,
          bar: styles.progressBarUseSoon,
          cardHighlight: styles.cardHighlightUseSoon,
        };
      case 'fresh':
      default:
        return {
          container: styles.badgeFresh,
          text: styles.badgeTextFresh,
          dot: styles.badgeDotFresh,
          bar: styles.progressBarFresh,
          cardHighlight: styles.cardHighlightFresh,
        };
    }
  };

  const getProgressWidth = (days: number) => {
    if (days === 0) return '100%';
    if (days === 1) return '80%';
    if (days === 2) return '60%';
    if (days <= 5) return '40%';
    return '15%';
  };

  const formatDaysLeft = (days: number) => {
    if (days === 0) return '0 days (Today)';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length} items</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all food inventory"
          onPress={onPressViewAll}
          style={({ pressed }) => [
            styles.viewAllButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.viewAllText}>View All</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </Pressable>
      </View>

      {/* Items List */}
      <View style={styles.list}>
        {items.map((item) => {
          const badgeStyle = getBadgeStyle(item.status);
          const isDone = item.is_used;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.days_left} days left, status: ${item.status_label}`}
              onPress={() => onPressItem?.(item)}
              style={({ pressed }) => [
                styles.itemCard,
                badgeStyle.cardHighlight,
                isDone && styles.itemCardUsed,
                pressed && styles.itemCardPressed,
              ]}>
              <View style={styles.cardMainRow}>
                {/* Food Icon Badge */}
                <View
                  style={[
                    styles.itemIconBadge,
                    isDone && styles.itemIconBadgeUsed,
                  ]}>
                  <Text style={styles.itemIconText}>{item.icon}</Text>
                </View>

                {/* Details */}
                <View style={styles.detailsCol}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.itemName, isDone && styles.itemNameUsed]}>
                      {item.name}
                    </Text>
                    {/* Status Badge */}
                    <View
                      style={[styles.statusBadgeBase, badgeStyle.container]}>
                      <View style={[styles.badgeDot, badgeStyle.dot]} />
                      <Text style={[styles.statusBadgeText, badgeStyle.text]}>
                        {item.status_label}
                      </Text>
                    </View>
                  </View>

                  {/* Meta: Days left & Storage */}
                  <View style={styles.metaRow}>
                    <Text style={styles.daysLeftText}>
                      ⏱️ {formatDaysLeft(item.days_left)}
                    </Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.storageLocationText}>
                      {item.storage_location.charAt(0).toUpperCase() +
                        item.storage_location.slice(1)}
                    </Text>
                    {item.notes ? (
                      <>
                        <Text style={styles.metaDivider}>•</Text>
                        <Text
                          style={styles.notesText}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.notes}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  {/* Urgency Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        badgeStyle.bar,
                        { width: getProgressWidth(item.days_left) },
                      ]}
                    />
                  </View>
                </View>

                {/* Mark Used / Save Checkbox */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${item.name} as used or saved`}
                  onPress={() => onToggleUsed?.(item.id)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.checkButton,
                    isDone && styles.checkButtonActive,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text
                    style={[
                      styles.checkIcon,
                      isDone && styles.checkIconActive,
                    ]}>
                    {isDone ? '✓' : '○'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: FreshTheme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: FreshTheme.spacing.sm + 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: FreshTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.primary,
  },
  arrowIcon: {
    fontSize: 14,
    color: FreshTheme.colors.primary,
    fontWeight: '700',
  },
  list: {
    gap: FreshTheme.spacing.sm + 2,
  },
  itemCard: {
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    ...FreshTheme.shadows.card,
  },
  itemCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  itemCardUsed: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardHighlightUseToday: {
    borderLeftWidth: 4,
    borderLeftColor: FreshTheme.colors.useToday.text,
  },
  cardHighlightUseSoon: {
    borderLeftWidth: 4,
    borderLeftColor: FreshTheme.colors.useSoon.text,
  },
  cardHighlightFresh: {
    borderLeftWidth: 4,
    borderLeftColor: FreshTheme.colors.fresh.text,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconBadge: {
    width: 46,
    height: 46,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderGreenSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: FreshTheme.spacing.md - 2,
  },
  itemIconBadgeUsed: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  itemIconText: {
    fontSize: 24,
  },
  detailsCol: {
    flex: 1,
    marginRight: FreshTheme.spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  itemNameUsed: {
    textDecorationLine: 'line-through',
    color: FreshTheme.colors.textMuted,
  },
  statusBadgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeUseToday: {
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderColor: FreshTheme.colors.useToday.badgeBorder,
  },
  badgeTextUseToday: {
    color: FreshTheme.colors.useToday.text,
  },
  badgeDotUseToday: {
    backgroundColor: FreshTheme.colors.useToday.dot,
  },
  progressBarUseToday: {
    backgroundColor: FreshTheme.colors.useToday.barColor,
  },
  badgeUseSoon: {
    backgroundColor: FreshTheme.colors.useSoon.badgeBg,
    borderColor: FreshTheme.colors.useSoon.badgeBorder,
  },
  badgeTextUseSoon: {
    color: FreshTheme.colors.useSoon.text,
  },
  badgeDotUseSoon: {
    backgroundColor: FreshTheme.colors.useSoon.dot,
  },
  progressBarUseSoon: {
    backgroundColor: FreshTheme.colors.useSoon.barColor,
  },
  badgeFresh: {
    backgroundColor: FreshTheme.colors.fresh.badgeBg,
    borderColor: FreshTheme.colors.fresh.badgeBorder,
  },
  badgeTextFresh: {
    color: FreshTheme.colors.fresh.text,
  },
  badgeDotFresh: {
    backgroundColor: FreshTheme.colors.fresh.dot,
  },
  progressBarFresh: {
    backgroundColor: FreshTheme.colors.fresh.barColor,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  metaDivider: {
    fontSize: 12,
    color: FreshTheme.colors.textMuted,
  },
  storageLocationText: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.primaryDark,
  },
  notesText: {
    fontSize: 11,
    fontWeight: '400',
    color: FreshTheme.colors.textMuted,
    maxWidth: 120,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  checkButton: {
    width: 34,
    height: 34,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkButtonActive: {
    backgroundColor: FreshTheme.colors.primary,
    borderColor: FreshTheme.colors.primaryDark,
  },
  checkIcon: {
    fontSize: 16,
    color: FreshTheme.colors.textMuted,
    fontWeight: '700',
  },
  checkIconActive: {
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.75,
  },
});

