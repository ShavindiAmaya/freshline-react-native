import { FreshTheme } from '@/constants/freshline-theme';
import { ExpiryStatus } from '@/types/food';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_DEFAULT_ICONS } from '../services/inventoryService';
import { InventoryFoodItem } from '../types/inventory.types';

interface FoodDetailsModalProps {
  visible: boolean;
  item: InventoryFoodItem | null;
  onClose: () => void;
  onEdit: (item: InventoryFoodItem) => void;
  onDelete: (item: InventoryFoodItem) => void;
  /** Called when the finish food functionality is integrated. */
  onFinish?: (id: string, outcome: 'Consumed' | 'Wasted') => void;
}

// Calculates the number of days left until expiry.
function getDaysLeft(expiryDate: string): number {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const parts = expiryDate.substring(0, 10).split('-').map(Number);
  const expiryStart = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  return Math.round((expiryStart - todayStart) / (1000 * 60 * 60 * 24));
}

export function FoodDetailsModal({
  visible,
  item,
  onClose,
  onEdit,
  onDelete,
  onFinish,
}: FoodDetailsModalProps) {
  if (!item) return null;

  const getBadgeStyle = (status: ExpiryStatus) => {
    switch (status) {
      case 'Use Today':
      case 'Expired':
        return {
          container: styles.badgeUseToday,
          text: styles.badgeTextUseToday,
          dot: styles.badgeDotUseToday,
        };
      case 'Use Soon':
        return {
          container: styles.badgeUseSoon,
          text: styles.badgeTextUseSoon,
          dot: styles.badgeDotUseSoon,
        };
      case 'Fresh':
      default:
        return {
          container: styles.badgeFresh,
          text: styles.badgeTextFresh,
          dot: styles.badgeDotFresh,
        };
    }
  };

  const badgeStyle = getBadgeStyle(item.status);
  const daysLeft = getDaysLeft(item.expiryDate);
  // Derive icon from category — not stored in DB
  const icon =
    CATEGORY_DEFAULT_ICONS[item.category as keyof typeof CATEGORY_DEFAULT_ICONS] ?? '🥗';

  const formattedExpiryDate = (() => {
    try {
      const d = new Date(item.expiryDate);
      return isNaN(d.getTime())
        ? item.expiryDate
        : d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
    } catch {
      return item.expiryDate;
    }
  })();

  const formattedPurchaseDate = (() => {
    const raw = item.purchaseDate || item.createdAt?.split('T')[0] || null;
    if (!raw) return 'Not recorded';
    try {
      const d = new Date(raw);
      return isNaN(d.getTime())
        ? raw
        : d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
    } catch {
      return raw;
    }
  })();

  const formatDaysLeft = (days: number) => {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires Today (0 days)';
    if (days === 1) return 'Expires in 1 day';
    return `Expires in ${days} days`;
  };

  const storageLabel =
    item.storageLocation === 'Fridge'
      ? '🧊 Fridge'
      : item.storageLocation === 'Freezer'
        ? '❄️ Freezer'
        : '🍞 Pantry';

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
              <Text style={styles.heroIcon}>{icon}</Text>
            </View>
            <Text style={styles.heroName}>{item.name}</Text>

            {/* Status Badge */}
            <View style={[styles.statusBadge, badgeStyle.container]}>
              <View style={[styles.statusDot, badgeStyle.dot]} />
              <Text style={[styles.statusBadgeText, badgeStyle.text]}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Storage Location */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>STORAGE</Text>
              <Text style={styles.detailCardValue}>{storageLabel}</Text>
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
                ⏱️ {formatDaysLeft(daysLeft)}
              </Text>
            </View>
          </View>

          {/* Displays the purchase date and expiry date. */}
          <View style={styles.datesBox}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateBlockLabel}>PURCHASE DATE</Text>
              <Text style={styles.dateBlockValue}>📅 {formattedPurchaseDate}</Text>
            </View>
            <View style={styles.dateBlockDivider} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateBlockLabel}>TARGET EXPIRY</Text>
              <Text style={styles.dateBlockValue}>⏱️ {formattedExpiryDate}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsCol}>
            {/* Finish food actions, pending Member E integration. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                onFinish
                  ? `Mark ${item.name} as consumed`
                  : 'Finish as Consumed — pending Member E integration'
              }
              disabled={!onFinish}
              onPress={() => { onClose(); onFinish!(item.id, 'Consumed'); }}
              style={({ pressed }) => [
                styles.finishConsumedBtn,
                !onFinish && styles.btnPending,
                pressed && !!onFinish && styles.buttonPressed,
              ]}>
              <Text style={[styles.finishConsumedBtnText, !onFinish && styles.btnPendingText]}>
                ✅ Finish as Consumed
              </Text>
              {!onFinish && (
                <Text style={styles.btnPendingNote}>⏳ Pending Member E integration</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                onFinish
                  ? `Mark ${item.name} as wasted`
                  : 'Finish as Wasted — pending Member E integration'
              }
              disabled={!onFinish}
              onPress={() => { onClose(); onFinish!(item.id, 'Wasted'); }}
              style={({ pressed }) => [
                styles.finishWastedBtn,
                !onFinish && styles.btnPending,
                pressed && !!onFinish && styles.buttonPressed,
              ]}>
              <Text style={[styles.finishWastedBtnText, !onFinish && styles.btnPendingText]}>
                🗑️ Finish as Wasted
              </Text>
              {!onFinish && (
                <Text style={styles.btnPendingNote}>⏳ Pending Member E integration</Text>
              )}
            </Pressable>

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
    marginTop: 8,
    marginBottom: 12,
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
  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: FreshTheme.borderRadius.md,
    marginBottom: 16,
  },
  dateBlock: {
    flex: 1,
  },
  dateBlockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  dateBlockValue: {
    fontSize: 12,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  dateBlockDivider: {
    width: 1,
    height: 28,
    backgroundColor: FreshTheme.colors.primaryBorder,
    marginHorizontal: 10,
  },
  actionButtonsCol: {
    gap: 10,
  },
  finishConsumedBtn: {
    backgroundColor: FreshTheme.colors.primary,
    paddingVertical: 13,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...FreshTheme.shadows.card,
  },
  finishConsumedBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  finishWastedBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FreshTheme.colors.useSoon.badgeBorder,
    paddingVertical: 13,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishWastedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.useSoon.text,
  },
  // Styles for disabled Finish buttons.
  btnPending: {
    opacity: 0.45,
  },
  btnPendingText: {
    color: FreshTheme.colors.textMuted,
  },
  btnPendingNote: {
    fontSize: 10,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
    marginTop: 3,
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
