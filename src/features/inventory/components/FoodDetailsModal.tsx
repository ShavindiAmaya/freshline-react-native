import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodItem, FreshnessStatus } from '@/types/food';

interface FoodDetailsModalProps {
  visible: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onEdit: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
}

export function FoodDetailsModal({
  visible,
  item,
  onClose,
  onEdit,
  onDelete,
}: FoodDetailsModalProps) {
  if (!item) return null;

  const getBadgeStyle = (status: FreshnessStatus) => {
    switch (status) {
      case 'use_today':
        return {
          container: styles.badgeUseToday,
          text: styles.badgeTextUseToday,
          dot: styles.badgeDotUseToday,
        };
      case 'use_soon':
        return {
          container: styles.badgeUseSoon,
          text: styles.badgeTextUseSoon,
          dot: styles.badgeDotUseSoon,
        };
      case 'fresh':
      default:
        return {
          container: styles.badgeFresh,
          text: styles.badgeTextFresh,
          dot: styles.badgeDotFresh,
        };
    }
  };

  const badgeStyle = getBadgeStyle(item.status);

  const formattedExpiryDate = (() => {
    try {
      const d = new Date(item.expiry_date);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return item.expiry_date;
    }
  })();

  const formatDaysLeft = (days: number) => {
    if (days === 0) return 'Expires Today (0 days)';
    if (days === 1) return 'Expires in 1 day';
    return `Expires in ${days} days`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header handle / close */}
          <View style={styles.headerRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.sheetHeaderLabel}>Food Details</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Hero Food Box */}
          <View style={styles.heroBox}>
            <View style={styles.heroIconCircle}>
              <Text style={styles.heroIcon}>{item.icon || '🥗'}</Text>
            </View>
            <Text style={styles.heroName}>{item.name}</Text>

            {/* Status Badge */}
            <View style={[styles.statusBadge, badgeStyle.container]}>
              <View style={[styles.statusDot, badgeStyle.dot]} />
              <Text style={[styles.statusBadgeText, badgeStyle.text]}>
                {item.status_label}
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Storage Location */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>STORAGE</Text>
              <Text style={styles.detailCardValue}>
                {item.storage_location === 'fridge'
                  ? '🧊 Fridge'
                  : item.storage_location === 'freezer'
                  ? '❄️ Freezer'
                  : '🍞 Pantry'}
              </Text>
            </View>

            {/* Category */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>CATEGORY</Text>
              <Text style={styles.detailCardValue}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </View>

            {/* Quantity */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>QUANTITY</Text>
              <Text style={styles.detailCardValue}>
                {item.quantity} {item.unit}
              </Text>
            </View>

            {/* Days Left */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>TIME REMAINING</Text>
              <Text style={styles.detailCardValue}>
                ⏱️ {formatDaysLeft(item.days_left)}
              </Text>
            </View>
          </View>

          {/* Expiry Date Row */}
          <View style={styles.expiryRow}>
            <Text style={styles.expiryLabel}>Target Expiry Date:</Text>
            <Text style={styles.expiryValue}>{formattedExpiryDate}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsCol}>
            {/* Edit Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
              onPress={() => {
                onClose();
                onEdit(item);
              }}
              style={({ pressed }) => [
                styles.editBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.editBtnText}>✏️ Edit Food Details</Text>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              onPress={() => {
                onClose();
                onDelete(item);
              }}
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.deleteBtnText}>🗑️ Delete from Inventory</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: FreshTheme.borderRadius.xl,
    borderTopRightRadius: FreshTheme.borderRadius.xl,
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...FreshTheme.shadows.floating,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleInfo: {
    flex: 1,
  },
  sheetHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
  },
  heroBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 2,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroIcon: {
    fontSize: 32,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
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
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  detailCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: FreshTheme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: FreshTheme.colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  expiryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: FreshTheme.borderRadius.md,
    marginBottom: 16,
  },
  expiryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  expiryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  actionButtonsCol: {
    gap: 10,
  },
  editBtn: {
    backgroundColor: FreshTheme.colors.primary,
    paddingVertical: 13,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...FreshTheme.shadows.card,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.useToday.text,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
