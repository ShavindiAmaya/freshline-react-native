import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodItem, FreshnessStatus } from '@/types/food';

interface FoodItemCardProps {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
}

export function FoodItemCard({ item, onPress }: FoodItemCardProps) {
  const getBadgeStyle = (status: FreshnessStatus) => {
    switch (status) {
      case 'use_today':
        return {
          container: styles.badgeUseToday,
          text: styles.badgeTextUseToday,
          dot: styles.badgeDotUseToday,
          highlight: styles.cardHighlightUseToday,
        };
      case 'use_soon':
        return {
          container: styles.badgeUseSoon,
          text: styles.badgeTextUseSoon,
          dot: styles.badgeDotUseSoon,
          highlight: styles.cardHighlightUseSoon,
        };
      case 'fresh':
      default:
        return {
          container: styles.badgeFresh,
          text: styles.badgeTextFresh,
          dot: styles.badgeDotFresh,
          highlight: styles.cardHighlightFresh,
        };
    }
  };

  const formatDaysLeft = (days: number) => {
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const badgeStyle = getBadgeStyle(item.status);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}, ${item.storage_location}, ${formatDaysLeft(item.days_left)}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        badgeStyle.highlight,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.contentRow}>
        {/* Food Icon Badge */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{item.icon || '🥗'}</Text>
        </View>

        {/* Details Column */}
        <View style={styles.detailsContainer}>
          {/* Header line: Title & Status Badge */}
          <View style={styles.headerLine}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.statusBadge, badgeStyle.container]}>
              <View style={[styles.statusDot, badgeStyle.dot]} />
              <Text style={[styles.statusBadgeText, badgeStyle.text]}>
                {item.status_label}
              </Text>
            </View>
          </View>

          {/* Quantity & Category Row */}
          <View style={styles.metaRow}>
            <Text style={styles.quantityText}>
              📦 {item.quantity} {item.unit}
            </Text>
            <Text style={styles.metaDivider}>•</Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.locationTag}>
              {item.storage_location === 'fridge'
                ? '🧊 Fridge'
                : item.storage_location === 'freezer'
                ? '❄️ Freezer'
                : '🍞 Pantry'}
            </Text>
          </View>

          {/* Expiry timing */}
          <View style={styles.timingRow}>
            <Text style={styles.timingText}>
              ⏱️ {formatDaysLeft(item.days_left)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.sm + 2,
    ...FreshTheme.shadows.card,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderGreenSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: FreshTheme.spacing.md - 2,
  },
  iconText: {
    fontSize: 24,
  },
  detailsContainer: {
    flex: 1,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  metaDivider: {
    fontSize: 11,
    color: FreshTheme.colors.textMuted,
  },
  categoryPill: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  locationTag: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
});
