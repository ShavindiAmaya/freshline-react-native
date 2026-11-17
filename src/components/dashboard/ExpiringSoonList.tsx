import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodItem, calculateExpiryStatus, getDaysRemaining } from '@/types/food';

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
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Expired':
        return {
          container: styles.badgeExpired,
          text: styles.badgeTextExpired,
        };
      case 'Use Today':
        return {
          container: styles.badgeUseToday,
          text: styles.badgeTextUseToday,
        };
      case 'Use Soon':
        return {
          container: styles.badgeUseSoon,
          text: styles.badgeTextUseSoon,
        };
      case 'Fresh':
      default:
        return {
          container: styles.badgeFresh,
          text: styles.badgeTextFresh,
        };
    }
  };

  const formatDaysText = (days: number) => {
    if (days < 0) return `Expired (${Math.abs(days)}d ago)`;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        </View>

        {onPressViewAll ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPressViewAll}
            style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All →</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Items List */}
      <View style={styles.list}>
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>All Fresh!</Text>
            <Text style={styles.emptySubtitle}>
              No items expiring today or tomorrow.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const days = getDaysRemaining(item.expiryDate);
            const status = calculateExpiryStatus(item.expiryDate);
            const badge = getBadgeStyle(status);
            const isDone = item.isUsed;

            return (
              <View
                key={item.id}
                style={[styles.itemCard, isDone && styles.itemCardUsed]}>
                {/* Main Content Area */}
                <Pressable
                  onPress={() => onPressItem?.(item)}
                  style={styles.cardContent}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.itemName, isDone && styles.itemNameUsed]}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    {/* Natural Badge */}
                    <View style={[styles.statusBadge, badge.container]}>
                      <Text style={[styles.statusBadgeText, badge.text]}>
                        {status}
                      </Text>
                    </View>
                  </View>

                  {/* Subtitle details */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {item.quantity} {item.unit}
                    </Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.metaText}>{item.storageLocation}</Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text
                      style={[
                        styles.daysText,
                        days <= 2 && styles.daysTextUrgent,
                      ]}>
                      {formatDaysText(days)}
                    </Text>
                  </View>
                </Pressable>

                {/* Sibling Check Button (No Nested Pressable) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark used"
                  onPress={() => onToggleUsed?.(item.id)}
                  hitSlop={8}
                  style={[
                    styles.checkButton,
                    isDone && styles.checkButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.checkButtonText,
                      isDone && styles.checkButtonTextActive,
                    ]}>
                    {isDone ? '✓' : '○'}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  list: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemCardUsed: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  cardContent: {
    flex: 1,
    paddingRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  itemNameUsed: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeExpired: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  badgeTextExpired: {
    color: '#DC2626',
  },
  badgeUseToday: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  badgeTextUseToday: {
    color: '#EA580C',
  },
  badgeUseSoon: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  badgeTextUseSoon: {
    color: '#D97706',
  },
  badgeFresh: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  badgeTextFresh: {
    color: '#16A34A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaDivider: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  daysTextUrgent: {
    color: '#D97706',
    fontWeight: '600',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkButtonText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  checkButtonTextActive: {
    color: '#FFFFFF',
  },
});
